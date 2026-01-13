const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./cinema.db'); // File-based DB

// Create tables
db.serialize(() => {
  // Movies table
  db.run(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      poster TEXT,
      hero_image TEXT,
      synopsis TEXT,
      status TEXT DEFAULT 'now' -- 'now' or 'soon'
    )
  `);

  // Showtimes table (one per movie-date-time combo)
  db.run(`
    CREATE TABLE IF NOT EXISTS showtimes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER,
      date TEXT NOT NULL, -- YYYY-MM-DD
      time TEXT NOT NULL, -- e.g., '12:00 PM'
      total_seats INTEGER DEFAULT 30, -- Total seats per showtime
      available_seats INTEGER DEFAULT 30,
      FOREIGN KEY (movie_id) REFERENCES movies(id)
    )
  `);

  // Seats table (per showtime, tracks individual seats)
  db.run(`
    CREATE TABLE IF NOT EXISTS seats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      showtime_id INTEGER,
      seat_id TEXT NOT NULL, -- e.g., 'A1'
      status TEXT DEFAULT 'available', -- 'available', 'booked'
      FOREIGN KEY (showtime_id) REFERENCES showtimes(id)
    )
  `);

  // Bookings table
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_title TEXT,
      date TEXT,
      time TEXT,
      seats TEXT, -- JSON array of seat_ids, e.g., '["A1","A2"]'
      quantity INTEGER,
      total_price REAL,
      payment_method TEXT,
      user_email TEXT, -- Optional: Add if you collect email
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert sample data (your movies)
  const nowShowing = [
    { title: "JUJUTSU KAISEN: Shibuya Incident × The Culling Game", poster: "/assets/img/jjk-shibuya.jpg", hero_image: "/assets/img/jjk-shibuya-HERO.jpg", synopsis: "The Shibuya Incident and Culling Game collide in a deadly chain of curses, battles, and fate-defying confrontations.", status: 'now' },
    { title: "Demon Slayer: The Infinity Castle", poster: "/assets/img/ds.jpg", hero_image: "/assets/img/ds-HERO.jpg", synopsis: "Tanjiro Kamado and other members of the Demon Slayer Corps find themselves in an epic battle at Infinity Castle.", status: 'now' },
    // Add the rest from your list...
  ];
  const comingSoon = [
    { title: "Avengers: Doomsday", poster: "/assets/img/avengers.jpg", hero_image: "/assets/img/avengers-HERO.jpg", synopsis: "The film will bring together a vast ensemble of heroes...", status: 'soon' },
    // Add the rest...
  ];

  const allMovies = [...nowShowing, ...comingSoon];
  allMovies.forEach(movie => {
    db.run(`INSERT OR IGNORE INTO movies (title, poster, hero_image, synopsis, status) VALUES (?, ?, ?, ?, ?)`,
      [movie.title, movie.poster, movie.hero_image, movie.synopsis, movie.status]);
  });

  // Sample showtimes (one per movie, with dates/times)
  db.all(`SELECT id, title FROM movies`, [], (err, movies) => {
    if (err) console.error(err);
    movies.forEach(movie => {
      const times = ["12:00 PM", "02:30 PM", "05:00 PM", "07:30 PM", "10:00 PM"];
      const today = new Date().toISOString().split('T')[0]; // Today's date
      times.forEach(time => {
        db.run(`INSERT OR IGNORE INTO showtimes (movie_id, date, time) VALUES (?, ?, ?)`, [movie.id, today, time], function(err) {
          if (!err && this.lastID) {
            // Populate seats for this showtime (A1-A6, B1-B6, etc.)
            const rows = ['A', 'B', 'C', 'D', 'E'];
            rows.forEach(row => {
              for (let i = 1; i <= 6; i++) {
                db.run(`INSERT OR IGNORE INTO seats (showtime_id, seat_id) VALUES (?, ?)`, [this.lastID, `${row}${i}`]);
              }
            });
          }
        });
      });
    });
  });
});

module.exports = db;