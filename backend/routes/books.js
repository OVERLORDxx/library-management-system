const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all books (public)
router.get('/', async (req, res) => {
  try {
    const { search, genre } = req.query;
    let query = 'SELECT * FROM books';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` WHERE (title ILIKE $${params.length} OR author ILIKE $${params.length})`;
    }
    if (genre) {
      params.push(genre);
      query += search ? ` AND genre = $${params.length}` : ` WHERE genre = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Book not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Add book (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, author, isbn, genre, published_year, total_copies, description, cover_image } = req.body;
  if (!title || !author || !isbn)
    return res.status(400).json({ message: 'Title, author, and ISBN are required' });

  try {
    const result = await pool.query(
      `INSERT INTO books (title, author, isbn, genre, published_year, total_copies, available_copies, description, cover_image)
       VALUES ($1,$2,$3,$4,$5,$6,$6,$7,$8) RETURNING *`,
      [title, author, isbn, genre, published_year, total_copies || 1, description, cover_image]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ message: 'ISBN already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update book (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, author, isbn, genre, published_year, total_copies, description, cover_image } = req.body;
  try {
    const result = await pool.query(
      `UPDATE books SET title=$1, author=$2, isbn=$3, genre=$4, published_year=$5,
       total_copies=$6, description=$7, cover_image=$8 WHERE id=$9 RETURNING *`,
      [title, author, isbn, genre, published_year, total_copies, description, cover_image, req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Book not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete book (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Book not found' });
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
