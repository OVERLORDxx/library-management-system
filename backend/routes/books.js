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
    const conditions = [];

    if (search) {
      conditions.push('(title LIKE ? OR author LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (genre) {
      conditions.push('genre = ?');
      params.push(genre);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get single book
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0)
      return res.status(404).json({ message: 'Book not found' });
    res.json(rows[0]);
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
    const copies = total_copies || 1;
    const [result] = await pool.query(
      `INSERT INTO books (title, author, isbn, genre, published_year, total_copies, available_copies, description, cover_image)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [title, author, isbn, genre, published_year, copies, copies, description, cover_image]
    );
    const [newBook] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
    res.status(201).json(newBook[0]);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'ISBN already exists' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update book (admin only)
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  const { title, author, isbn, genre, published_year, total_copies, description, cover_image } = req.body;
  try {
    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (existing.length === 0)
      return res.status(404).json({ message: 'Book not found' });

    await pool.query(
      `UPDATE books SET title=?, author=?, isbn=?, genre=?, published_year=?,
       total_copies=?, description=?, cover_image=? WHERE id=?`,
      [title, author, isbn, genre, published_year, total_copies, description, cover_image, req.params.id]
    );
    const [updated] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete book (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (existing.length === 0)
      return res.status(404).json({ message: 'Book not found' });
    await pool.query('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
