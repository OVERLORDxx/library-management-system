const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Borrow a book
router.post('/borrow', authMiddleware, async (req, res) => {
  const { book_id } = req.body;
  const user_id = req.user.id;

  try {
    // Check if book is available
    const book = await pool.query('SELECT * FROM books WHERE id = $1', [book_id]);
    if (book.rows.length === 0)
      return res.status(404).json({ message: 'Book not found' });
    if (book.rows[0].available_copies < 1)
      return res.status(400).json({ message: 'No copies available' });

    // Check if already borrowed
    const existing = await pool.query(
      "SELECT * FROM borrow_records WHERE user_id=$1 AND book_id=$2 AND status='borrowed'",
      [user_id, book_id]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ message: 'You already borrowed this book' });

    // Create borrow record
    const record = await pool.query(
      `INSERT INTO borrow_records (user_id, book_id) VALUES ($1, $2) RETURNING *`,
      [user_id, book_id]
    );

    // Decrease available copies
    await pool.query('UPDATE books SET available_copies = available_copies - 1 WHERE id = $1', [book_id]);

    res.status(201).json({ message: 'Book borrowed successfully', record: record.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Return a book
router.put('/return/:id', authMiddleware, async (req, res) => {
  const record_id = req.params.id;

  try {
    const record = await pool.query('SELECT * FROM borrow_records WHERE id = $1', [record_id]);
    if (record.rows.length === 0)
      return res.status(404).json({ message: 'Borrow record not found' });
    if (record.rows[0].status === 'returned')
      return res.status(400).json({ message: 'Book already returned' });

    // Calculate fine (₹5 per day overdue)
    const dueDate = new Date(record.rows[0].due_date);
    const today = new Date();
    let fine = 0;
    if (today > dueDate) {
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
      fine = daysOverdue * 5;
    }

    const updated = await pool.query(
      `UPDATE borrow_records SET status='returned', return_date=CURRENT_DATE, fine=$1 WHERE id=$2 RETURNING *`,
      [fine, record_id]
    );

    await pool.query('UPDATE books SET available_copies = available_copies + 1 WHERE id = $1', [record.rows[0].book_id]);

    res.json({ message: 'Book returned successfully', fine, record: updated.rows[0] });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get my borrow history (member)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, b.title, b.author, b.cover_image
       FROM borrow_records br
       JOIN books b ON br.book_id = b.id
       WHERE br.user_id = $1
       ORDER BY br.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all borrow records (admin only)
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, b.title, b.author, u.name AS user_name, u.email AS user_email
       FROM borrow_records br
       JOIN books b ON br.book_id = b.id
       JOIN users u ON br.user_id = u.id
       ORDER BY br.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update overdue records
router.put('/update-overdue', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query(
      `UPDATE borrow_records SET status='overdue'
       WHERE status='borrowed' AND due_date < CURRENT_DATE`
    );
    res.json({ message: 'Overdue records updated' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
