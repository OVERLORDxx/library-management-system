const express = require('express');
const pool = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get dashboard stats (admin only)
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [[totalBooks]] = await pool.query('SELECT COUNT(*) AS count FROM books');
    const [[totalUsers]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role IN ('member', 'user')");
    const [[activeBorrows]] = await pool.query("SELECT COUNT(*) AS count FROM borrow_records WHERE status='borrowed'");
    const [[overdueBooks]] = await pool.query("SELECT COUNT(*) AS count FROM borrow_records WHERE status='overdue'");

    res.json({
      totalBooks: totalBooks.count,
      totalUsers: totalUsers.count,
      activeBorrows: activeBorrows.count,
      overdueBooks: overdueBooks.count,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete user (admin only)
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0)
      return res.status(404).json({ message: 'User not found' });
    await pool.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
