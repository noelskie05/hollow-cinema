const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors()); // Allow frontend requests
app.use(bodyParser.json());

// API: Get movies (now showing or coming soon)
app.get('/movies', (req, res) => {
  const status = req.query.status || 'now'; // 'now' or 'soon'
  db.all(`SELECT * FROM movies WHERE status = ?`, [status], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Get showtimes for a movie and date
app.get('/showtimes', (req, res) => {
  const { movie, date } = req.query;
  db.all(`
    SELECT s.*, m.title FROM showtimes s
    JOIN movies m ON s.movie_id = m.id
    WHERE m.title = ? AND s.date = ?
  `, [movie, date], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Get seats for a showtime
app.get('/seats', (req, res) => {
  const { showtime_id } = req.query;
  db.all(`SELECT * FROM seats WHERE showtime_id = ?`, [showtime_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// API: Handle booking (update seats and create booking record)
app.post('/book', (req, res) => {
  const { movieTitle, date, time, seats, quantity, totalPrice, paymentMethod, userEmail } = req.body;

  // Find showtime
  db.get(`
    SELECT s.id, s.available_seats FROM showtimes s
    JOIN movies m ON s.movie_id = m.id
    WHERE m.title = ? AND s.date = ? AND s.time = ?
  `, [movieTitle, date, time], (err, showtime) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!showtime) return res.status(404).json({ error: 'Showtime not found' });
    if (showtime.available_seats < quantity) return res.status(400).json({ error: 'Not enough seats available' });

    // Check if selected seats are available
    const seatIds = JSON.parse(seats);
    db.all(`SELECT seat_id FROM seats WHERE showtime_id = ? AND seat_id IN (${seatIds.map(() => '?').join(',')}) AND status = 'available'`,
      [showtime.id, ...seatIds], (err, availableSeats) => {
        if (err) return res.status(500).json({ error: err.message });
        if (availableSeats.length !== quantity) return res.status(400).json({ error: 'Some seats are already booked' });

        // Update seats to booked
        seatIds.forEach(seat => {
          db.run(`UPDATE seats SET status = 'booked' WHERE showtime_id = ? AND seat_id = ?`, [showtime.id, seat]);
        });

        // Update available seats
        db.run(`UPDATE showtimes SET available_seats = available_seats - ? WHERE id = ?`, [quantity, showtime.id]);

        // Insert booking
        db.run(`
          INSERT INTO bookings (movie_title, date, time, seats, quantity, total_price, payment_method, user_email)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [movieTitle, date, time, seats, quantity, totalPrice, paymentMethod, userEmail || null], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, bookingId: this.lastID });
        });
      });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});