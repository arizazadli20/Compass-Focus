import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const db = new Database('database.sqlite');

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    balance INTEGER DEFAULT 2500,
    owned_visas TEXT DEFAULT '["Schengen"]',
    travel_history TEXT DEFAULT '[{"city":"Tokyo","country":"Japan","date":"2023-10-15","duration":"25m","type":"plane"},{"city":"Paris","country":"France","date":"2023-11-02","duration":"50m","type":"car"},{"city":"New York","country":"USA","date":"2023-12-10","duration":"1h 30m","type":"plane"}]',
    passport_data TEXT DEFAULT '{"surname":"Traveler","givenNames":"Focus","nationality":"Earth","dob":"01 JAN 2024","sex":"U","pob":"Internet","photo":""}'
  );

  CREATE TABLE IF NOT EXISTS rooms (
    id TEXT PRIMARY KEY,
    host_id INTEGER,
    destination TEXT,
    transport_mode TEXT,
    start_time INTEGER,
    focus_time INTEGER,
    status TEXT DEFAULT 'waiting',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS room_participants (
    room_id TEXT,
    user_id INTEGER,
    username TEXT,
    status TEXT DEFAULT 'active',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS friendships (
    user_id INTEGER,
    friend_id INTEGER,
    status TEXT DEFAULT 'pending', -- pending, accepted, blocked
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, friend_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS coop_trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT,
    destination TEXT,
    transport_mode TEXT,
    start_time DATETIME,
    end_time DATETIME,
    duration_minutes INTEGER,
    participants TEXT
  );

  CREATE TABLE IF NOT EXISTS user_coop_history (
    user_id INTEGER,
    trip_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (trip_id) REFERENCES coop_trips(id)
  );

  CREATE TABLE IF NOT EXISTS visited_countries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    country_code TEXT,
    country_name TEXT,
    visit_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// Try to add columns if they don't exist (migration)
try {
  db.prepare('ALTER TABLE rooms ADD COLUMN transport_mode TEXT').run();
} catch (e) {}
try {
  db.prepare('ALTER TABLE rooms ADD COLUMN start_time INTEGER').run();
} catch (e) {}

// In-memory room state for real-time updates
const activeRooms = new Map<string, {
  id: string;
  hostId: number;
  participants: Map<WebSocket, { username: string, lat?: number, lng?: number, progress?: number }>;
  destination?: string;
  transportMode?: string;
  state: {
    status: 'waiting' | 'active' | 'paused' | 'finished';
    startTime: number | null;
    elapsedTime: number;
    speed: number;
    penalty: boolean;
    penaltyUser: string | null;
  };
}>();

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

  // Restore active rooms from DB
  try {
    const savedRooms = db.prepare("SELECT * FROM rooms WHERE status IN ('waiting', 'active')").all() as any[];
    savedRooms.forEach(room => {
      activeRooms.set(room.id, {
        id: room.id,
        hostId: room.host_id,
        participants: new Map(), // Users must rejoin
        destination: room.destination,
        transportMode: room.transport_mode || 'plane',
        state: {
          status: room.status as any,
          startTime: room.start_time,
          elapsedTime: room.start_time ? Date.now() - room.start_time : 0,
          speed: 1.0,
          penalty: false,
          penaltyUser: null
        }
      });
      console.log(`Restored room ${room.id} from DB`);
    });
  } catch (e) {
    console.error('Failed to restore rooms:', e);
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Search Users
  app.get('/api/users/search', (req, res) => {
    const { query, excludeId } = req.query;
    if (!query || typeof query !== 'string') return res.json([]);
    
    // Simple search by username
    let sql = 'SELECT id, username FROM users WHERE username LIKE ?';
    const params: any[] = [`%${query}%`];

    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }

    sql += ' LIMIT 20';

    const stmt = db.prepare(sql);
    const users = stmt.all(...params);
    res.json(users);
  });

  // Get Passport Preview (Public - Limited Data)
  app.get('/api/passport/preview/:targetUserId', (req, res) => {
    const { targetUserId } = req.params;

    const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
    const user = userStmt.get(targetUserId) as any;

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate stats
    const visitsStmt = db.prepare('SELECT * FROM visited_countries WHERE user_id = ? ORDER BY visit_date DESC');
    const visits = visitsStmt.all(targetUserId) as any[];

    const totalCountries = new Set(visits.map(v => v.country_code)).size;
    const totalFocusMinutes = visits.reduce((acc, v) => acc + (v.duration_minutes || 0), 0);
    const totalFocusHours = Math.round(totalFocusMinutes / 60 * 10) / 10;

    // Get top 3 recent stamps
    const recentStamps = visits.slice(0, 3).map(v => ({
      countryCode: v.country_code,
      countryName: v.country_name,
      date: v.visit_date
    }));

    // Check friendship status if requester provided
    let isFriend = false;
    const requesterId = req.headers['x-user-id'];
    if (requesterId) {
       const friendCheck = db.prepare(`
        SELECT 1 FROM friendships 
        WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) 
        AND status = 'accepted'
      `).get(requesterId, targetUserId, targetUserId, requesterId);
      isFriend = !!friendCheck;
    }

    res.json({
      username: user.username,
      stats: {
        totalCountries,
        totalFocusHours,
        recentStamps
      },
      isFriend
    });
  });

  // Get Friends & Requests
  app.get('/api/friends/:userId', (req, res) => {
    const { userId } = req.params;
    
    // Get confirmed friends
    const friendsStmt = db.prepare(`
      SELECT u.id, u.username, f.status, 'friend' as type
      FROM friendships f
      JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
      WHERE (f.user_id = ? OR f.friend_id = ?) AND f.status = 'accepted' AND u.id != ?
    `);
    const friends = friendsStmt.all(userId, userId, userId);

    // Get incoming requests (where I am the friend_id and status is pending)
    const requestsStmt = db.prepare(`
      SELECT u.id, u.username, f.status, 'request' as type
      FROM friendships f
      JOIN users u ON f.user_id = u.id
      WHERE f.friend_id = ? AND f.status = 'pending'
    `);
    const requests = requestsStmt.all(userId);

    // Get outgoing pending requests (where I am the user_id)
    const pendingStmt = db.prepare(`
      SELECT u.id, u.username, f.status, 'pending_outgoing' as type
      FROM friendships f
      JOIN users u ON f.friend_id = u.id
      WHERE f.user_id = ? AND f.status = 'pending'
    `);
    const pending = pendingStmt.all(userId);

    res.json([...friends, ...requests, ...pending]);
  });

  // Send Friend Request
  app.post('/api/friends/request', (req, res) => {
    const { senderId, receiverId } = req.body;
    
    // Check if already friends or requested
    const checkStmt = db.prepare('SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)');
    const existing = checkStmt.get(senderId, receiverId, receiverId, senderId);
    
    if (existing) {
      return res.status(400).json({ error: 'Relationship already exists' });
    }

    const stmt = db.prepare('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, \'pending\')');
    stmt.run(senderId, receiverId);
    res.json({ success: true });
  });

  // Accept Friend Request
  app.post('/api/friends/accept', (req, res) => {
    const { userId, friendId } = req.body; // userId is the one accepting (the receiver of the request)
    
    const stmt = db.prepare('UPDATE friendships SET status = \'accepted\' WHERE user_id = ? AND friend_id = ?');
    const result = stmt.run(friendId, userId); // friendId was the original sender
    
    if (result.changes > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Request not found' });
    }
  });

  // Get Passport Data (Protected)
  app.get('/api/passport/:targetUserId', (req, res) => {
    const { targetUserId } = req.params;
    const requesterId = req.headers['x-user-id']; // Simple auth for demo

    if (!requesterId) return res.status(401).json({ error: 'Unauthorized' });

    // 1. Security Check: Are they friends? (Or is it self-view?)
    if (targetUserId !== requesterId) {
      const friendCheck = db.prepare(`
        SELECT 1 FROM friendships 
        WHERE ((user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)) 
        AND status = 'accepted'
      `).get(requesterId, targetUserId, targetUserId, requesterId);

      if (!friendCheck) {
        return res.status(403).json({ error: 'You must be friends to view this passport.' });
      }
    }

    // 2. Fetch Passport Data
    const userStmt = db.prepare('SELECT username, passport_data FROM users WHERE id = ?');
    const user = userStmt.get(targetUserId) as any;

    if (!user) return res.status(404).json({ error: 'User not found' });

    // Calculate stats from visited_countries (or fallback to travel_history JSON for legacy data)
    // For this implementation, we'll query the new table
    const visitsStmt = db.prepare('SELECT * FROM visited_countries WHERE user_id = ? ORDER BY visit_date DESC');
    const visits = visitsStmt.all(targetUserId) as any[];

    // Calculate totals
    const totalCountries = new Set(visits.map(v => v.country_code)).size;
    const totalFocusMinutes = visits.reduce((acc, v) => acc + (v.duration_minutes || 0), 0);
    const totalFocusHours = Math.round(totalFocusMinutes / 60 * 10) / 10;

    let passportData = {};
    try {
      passportData = JSON.parse(user.passport_data);
    } catch (e) {}

    res.json({
      username: user.username,
      passportData,
      stats: {
        totalCountries,
        totalFocusHours,
        stamps: visits.map(v => ({
          countryCode: v.country_code,
          countryName: v.country_name,
          date: v.visit_date
        }))
      }
    });
  });

  // Record a Visit (Internal helper for when trips finish)
  app.post('/api/trips/finish', (req, res) => {
    const { userId, countryCode, countryName, duration } = req.body;
    const stmt = db.prepare('INSERT INTO visited_countries (user_id, country_code, country_name, duration_minutes) VALUES (?, ?, ?, ?)');
    stmt.run(userId, countryCode, countryName, duration);
    res.json({ success: true });
  });
  
  // Get Co-op History
  app.get('/api/coop/history/:userId', (req, res) => {
    const { userId } = req.params;
    const stmt = db.prepare(`
      SELECT t.* 
      FROM coop_trips t
      JOIN user_coop_history h ON t.id = h.trip_id
      WHERE h.user_id = ?
      ORDER BY t.end_time DESC
    `);
    const history = stmt.all(userId);
    res.json(history.map((h: any) => ({
      ...h,
      participants: JSON.parse(h.participants)
    })));
  });

  // Debug: Seed Example Friend
  app.post('/api/debug/seed-friend', (req, res) => {
    const { userId } = req.body;
    
    // 1. Ensure Example User exists
    let exampleUser = db.prepare('SELECT id FROM users WHERE username = ?').get('ExampleFriend') as any;
    
    if (!exampleUser) {
      const defaultPassport = {
        surname: 'Friend',
        givenNames: 'Example',
        nationality: 'Earth',
        dob: '01 JAN 2000',
        sex: 'U',
        pob: 'Internet',
        photo: ''
      };
      const stmt = db.prepare('INSERT INTO users (username, password, passport_data) VALUES (?, ?, ?)');
      const info = stmt.run('ExampleFriend', 'password123', JSON.stringify(defaultPassport));
      exampleUser = { id: info.lastInsertRowid };
    }

    // 2. Add Friendship
    const checkStmt = db.prepare('SELECT * FROM friendships WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)');
    const existing = checkStmt.get(userId, exampleUser.id, exampleUser.id, userId);

    if (!existing) {
      const stmt = db.prepare('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, \'accepted\')');
      stmt.run(userId, exampleUser.id);
      res.json({ success: true, message: 'Friend added!' });
    } else {
      // If pending, force accept
      const updateStmt = db.prepare('UPDATE friendships SET status = \'accepted\' WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)');
      updateStmt.run(userId, exampleUser.id, exampleUser.id, userId);
      res.json({ success: true, message: 'Friendship updated to accepted!' });
    }
  });

  // ... (Other API Routes) ...

  // WebSocket Logic
  wss.on('connection', (ws) => {
    let currentRoomId: string | null = null;
    let currentUserId: number | null = null;
    let currentUsername: string | null = null;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case 'CREATE_ROOM': {
            const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
            const { userId, username, destination, transportMode } = data.payload;
            
            const participants = new Map();
            participants.set(ws, { username });

            activeRooms.set(roomId, {
              id: roomId,
              hostId: userId,
              participants,
              destination,
              transportMode,
              state: {
                status: 'waiting',
                startTime: null,
                elapsedTime: 0,
                speed: 1.0,
                penalty: false,
                penaltyUser: null
              }
            });

            currentRoomId = roomId;
            currentUserId = userId;
            currentUsername = username;

            // Persist room creation
            try {
              const stmt = db.prepare('INSERT INTO rooms (id, host_id, destination, transport_mode, status) VALUES (?, ?, ?, ?, ?)');
              stmt.run(roomId, userId, destination, transportMode, 'waiting');
            } catch (e) {
              console.error('DB Error creating room:', e);
            }

            ws.send(JSON.stringify({ type: 'ROOM_CREATED', payload: { roomId, destination, transportMode, isHost: true } }));
            break;
          }

          case 'JOIN_ROOM': {
            const { roomId, userId, username } = data.payload;
            const room = activeRooms.get(roomId);
            
            if (room) {
              // Check Capacity (Max 4)
              if (room.participants.size >= 4) {
                ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Room is full (Max 4 players)' } }));
                return;
              }

              room.participants.set(ws, { username });
              currentRoomId = roomId;
              currentUserId = userId;
              currentUsername = username;

              // Persist participant
              try {
                const stmt = db.prepare('INSERT OR REPLACE INTO room_participants (room_id, user_id, username, status) VALUES (?, ?, ?, ?)');
                stmt.run(roomId, userId, username, 'active');
              } catch (e) {
                 console.error('DB Error joining room:', e);
              }

              // Send room info to the joiner
              const participantLocations: Record<string, any> = {};
              room.participants.forEach((p) => {
                if (p.lat !== undefined && p.lng !== undefined) {
                  participantLocations[p.username] = {
                    username: p.username,
                    lat: p.lat,
                    lng: p.lng,
                    progress: p.progress || 0
                  };
                }
              });

              ws.send(JSON.stringify({
                type: 'ROOM_JOINED',
                payload: {
                  roomId,
                  destination: room.destination,
                  transportMode: room.transportMode,
                  status: room.state.status,
                  participants: Array.from(room.participants.values()).map(p => p.username),
                  participantLocations,
                  isHost: room.hostId === userId
                }
              }));

              // Notify all participants
              const participantList = Array.from(room.participants.values()).map(p => p.username);
              room.participants.forEach((p, client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ 
                    type: 'PLAYER_JOINED', 
                    payload: { username, participants: participantList } 
                  }));
                }
              });
            } else {
              ws.send(JSON.stringify({ type: 'ERROR', payload: { message: 'Room not found' } }));
            }
            break;
          }

          case 'UPDATE_ROOM': {
            if (currentRoomId) {
              const room = activeRooms.get(currentRoomId);
              if (room && room.hostId === currentUserId) {
                const { destination, transportMode } = data.payload;
                room.destination = destination;
                room.transportMode = transportMode;

                // Update DB
                try {
                  const stmt = db.prepare('UPDATE rooms SET destination = ?, transport_mode = ? WHERE id = ?');
                  stmt.run(destination, transportMode, currentRoomId);
                } catch (e) {}

                room.participants.forEach((p, client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ 
                      type: 'ROOM_UPDATED', 
                      payload: { destination, transportMode } 
                    }));
                  }
                });
              }
            }
            break;
          }

          case 'REMOVE_ROOM': {
            // Allow passing roomId/userId in payload for robustness, or fallback to connection state
            const targetRoomId = data.payload?.roomId || currentRoomId;
            const targetUserId = data.payload?.userId || currentUserId;

            if (targetRoomId) {
              const room = activeRooms.get(targetRoomId);
              if (room && room.hostId === targetUserId) {
                
                // Save History if the trip was active
                if (room.state.status === 'active' || room.state.status === 'finished') {
                   const duration = room.state.startTime ? Math.floor((Date.now() - room.state.startTime) / 60000) : 0;
                   const participantNames = Array.from(room.participants.values()).map(p => p.username);
                   
                   try {
                     const stmt = db.prepare(`
                       INSERT INTO coop_trips (room_id, destination, transport_mode, start_time, end_time, duration_minutes, participants)
                       VALUES (?, ?, ?, ?, ?, ?, ?)
                     `);
                     const info = stmt.run(
                       targetRoomId, 
                       room.destination, 
                       room.transportMode, 
                       room.state.startTime, 
                       Date.now(), 
                       duration, 
                       JSON.stringify(participantNames)
                     );
                     const tripId = info.lastInsertRowid;

                     // Link users to history
                     // We don't have userIds for all participants in the Map, only the socket mapping.
                     // But we can try to look them up by username or just store for the host?
                     // Ideally we stored userIds in the map.
                     // Let's rely on room_participants table for userIds?
                     const usersStmt = db.prepare('SELECT user_id FROM room_participants WHERE room_id = ?');
                     const users = usersStmt.all(targetRoomId) as any[];
                     
                     const historyStmt = db.prepare('INSERT INTO user_coop_history (user_id, trip_id) VALUES (?, ?)');
                     users.forEach(u => {
                       historyStmt.run(u.user_id, tripId);
                     });

                   } catch (e) {
                     console.error('Error saving coop history:', e);
                   }
                }

                room.participants.forEach((p, client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'ROOM_REMOVED' }));
                  }
                });
                activeRooms.delete(targetRoomId);

                // Clean up DB
                try {
                  db.prepare('DELETE FROM rooms WHERE id = ?').run(targetRoomId);
                  db.prepare('DELETE FROM room_participants WHERE room_id = ?').run(targetRoomId);
                } catch (e) {}
              }
            }
            break;
          }

          case 'START_TRIP': {
            if (currentRoomId) {
              const room = activeRooms.get(currentRoomId);
              if (room && room.hostId === currentUserId) {
                room.state.status = 'active';
                room.state.startTime = Date.now();
                
                room.participants.forEach((p, client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'TRIP_STARTED' }));
                  }
                });
              }
            }
            break;
          }

          case 'UPDATE_LOCATION': {
            if (currentRoomId) {
              const room = activeRooms.get(currentRoomId);
              if (room) {
                const { lat, lng, progress } = data.payload;
                const participant = room.participants.get(ws);
                if (participant) {
                  participant.lat = lat;
                  participant.lng = lng;
                  participant.progress = progress;

                  // Broadcast to others
                  room.participants.forEach((p, client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({ 
                        type: 'LOCATION_UPDATED', 
                        payload: { username: currentUsername, lat, lng, progress } 
                      }));
                    }
                  });
                }
              }
            }
            break;
          }

          case 'UPDATE_FOCUS': {
            // Client sends heartbeat/focus status
            // If client loses focus, trigger penalty
            const { focused } = data.payload;
            if (currentRoomId && !focused) {
              const room = activeRooms.get(currentRoomId);
              if (room) {
                room.state.speed = 0.5;
                room.state.penalty = true;
                room.state.penaltyUser = currentUsername;

                room.participants.forEach((p, client) => {
                  if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ 
                      type: 'PENALTY_TRIGGERED', 
                      payload: { username: currentUsername, speed: 0.5 } 
                    }));
                  }
                });
              }
            } else if (currentRoomId && focused) {
               // Restore speed if everyone is focused (simplified logic for now)
               const room = activeRooms.get(currentRoomId);
               if (room && room.state.penalty && room.state.penaltyUser === currentUsername) {
                 room.state.speed = 1.0;
                 room.state.penalty = false;
                 room.state.penaltyUser = null;
                 
                 room.participants.forEach((p, client) => {
                    if (client.readyState === WebSocket.OPEN) {
                      client.send(JSON.stringify({ 
                        type: 'PENALTY_CLEARED', 
                        payload: { speed: 1.0 } 
                      }));
                    }
                 });
               }
            }
            break;
          }
        }
      } catch (e) {
        console.error('WebSocket error:', e);
      }
    });

    ws.on('close', () => {
      if (currentRoomId) {
        const room = activeRooms.get(currentRoomId);
        if (room) {
          room.participants.delete(ws);
          if (room.participants.size === 0) {
            activeRooms.delete(currentRoomId);
          } else {
            // Notify others
             room.participants.forEach((p, client) => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({ 
                    type: 'PLAYER_LEFT', 
                    payload: { username: currentUsername } 
                  }));
                }
              });
          }
        }
      }
    });
  });

  // API Routes
  app.post('/api/register', (req, res) => {
    const { username, password, firstName, lastName, dob } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
      // Format DOB if provided (YYYY-MM-DD -> DD MMM YYYY)
      let formattedDob = '01 JAN 2024';
      if (dob) {
        const date = new Date(dob);
        if (!isNaN(date.getTime())) {
          formattedDob = date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
        }
      }

      const defaultPassport = {
        surname: lastName || 'Traveler',
        givenNames: firstName || username,
        nationality: 'Earth',
        dob: formattedDob,
        sex: 'U',
        pob: 'Internet',
        photo: ''
      };

      const stmt = db.prepare('INSERT INTO users (username, password, passport_data) VALUES (?, ?, ?)');
      const info = stmt.run(username, password, JSON.stringify(defaultPassport));
      res.json({ 
        id: info.lastInsertRowid, 
        username, 
        balance: 2500, 
        ownedVisas: ['Schengen'], 
        travelHistory: [
          { city: 'Tokyo', country: 'Japan', date: '2023-10-15', duration: '25m', type: 'plane' },
          { city: 'Paris', country: 'France', date: '2023-11-02', duration: '50m', type: 'car' },
          { city: 'New York', country: 'USA', date: '2023-12-10', duration: '1h 30m', type: 'plane' }
        ],
        passportData: defaultPassport
      });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Username already exists' });
      } else {
        res.status(500).json({ error: 'Database error' });
      }
    }
  });

  app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
    const user = stmt.get(username, password) as any;
    
    if (user) {
      let passportData;
      try {
        passportData = user.passport_data ? JSON.parse(user.passport_data) : {
          surname: 'Traveler',
          givenNames: user.username,
          nationality: 'Earth',
          dob: '01 JAN 2024',
          sex: 'U',
          pob: 'Internet',
          photo: ''
        };
      } catch (e) {
        passportData = {
          surname: 'Traveler',
          givenNames: user.username,
          nationality: 'Earth',
          dob: '01 JAN 2024',
          sex: 'U',
          pob: 'Internet',
          photo: ''
        };
      }

      res.json({
        id: user.id,
        username: user.username,
        balance: user.balance,
        ownedVisas: JSON.parse(user.owned_visas),
        travelHistory: JSON.parse(user.travel_history),
        passportData
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.post('/api/save-progress', (req, res) => {
    const { id, balance, ownedVisas, travelHistory, passportData } = req.body;
    if (!id) return res.status(400).json({ error: 'User ID required' });

    const stmt = db.prepare('UPDATE users SET balance = ?, owned_visas = ?, travel_history = ?, passport_data = ? WHERE id = ?');
    stmt.run(balance, JSON.stringify(ownedVisas), JSON.stringify(travelHistory), JSON.stringify(passportData), id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
