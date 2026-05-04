const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get dashboard stats (admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const totalBooks = await pool.query('SELECT COUNT(*) FROM books');
    const totalUsers = await pool.query("SELECT COUNT(*) FROM users WHERE role='member'");
    const activeBorrows = await pool.query("SELECT COUNT(*) FROM borrow_records WHERE status='borrowed'");
    const overdueBooks = await pool.query("SELECT COUNT(*) FROM borrow_records WHERE status='overdue'");

    res.json({
      totalBooks: parseInt(totalBooks.rows[0].count),
      totalUsers: parseInt(totalUsers.rows[0].count),
      activeBorrows: parseInt(activeBorrows.rows[0].count),
      overdueBooks: parseInt(overdueBooks.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
