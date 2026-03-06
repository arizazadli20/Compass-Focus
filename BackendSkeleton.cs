using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CompassApp.Backend
{
    // 1. Entity Model
    public class TripSession
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();
        
        [Required]
        public string UserId { get; set; } = string.Empty;
        
        [Required]
        public double StartLat { get; set; }
        
        [Required]
        public double StartLng { get; set; }
        
        [Required]
        public double EndLat { get; set; }
        
        [Required]
        public double EndLng { get; set; }
        
        [Required]
        public int TotalDurationSeconds { get; set; }
        
        [Required]
        public double TotalDistanceKm { get; set; }
        
        public bool IsCompleted { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }

    // 2. Database Context
    public class CompassDbContext : DbContext
    {
        public CompassDbContext(DbContextOptions<CompassDbContext> options) : base(options) { }
        
        public DbSet<TripSession> TripSessions { get; set; }
    }

    // 3. API Controller
    [ApiController]
    [Route("api/[controller]")]
    public class TripSessionsController : ControllerBase
    {
        private readonly CompassDbContext _context;

        public TripSessionsController(CompassDbContext context)
        {
            _context = context;
        }

        // POST: api/TripSessions
        [HttpPost]
        public async Task<ActionResult<TripSession>> CreateSession(TripSession session)
        {
            _context.TripSessions.Add(session);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetSession), new { id = session.Id }, session);
        }

        // GET: api/TripSessions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<TripSession>> GetSession(Guid id)
        {
            var session = await _context.TripSessions.FindAsync(id);

            if (session == null)
            {
                return NotFound();
            }

            return session;
        }

        // PUT: api/TripSessions/5/complete
        [HttpPut("{id}/complete")]
        public async Task<IActionResult> CompleteSession(Guid id)
        {
            var session = await _context.TripSessions.FindAsync(id);
            if (session == null)
            {
                return NotFound();
            }

            session.IsCompleted = true;
            session.CompletedAt = DateTime.UtcNow;

            _context.Entry(session).State = EntityState.Modified;
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
