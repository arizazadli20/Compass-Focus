import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

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
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' })); // Increase limit for base64 images

  // API Routes
  app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    try {
      const defaultPassport = {
        surname: 'Traveler',
        givenNames: username,
        nationality: 'Earth',
        dob: '01 JAN 2024',
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
