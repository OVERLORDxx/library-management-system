import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get('/users/stats')
      .then((res) => setStats(res.data))
      .catch(() => toast.error('Failed to load stats'));
  }, []);

  const cards = stats ? [
    { label: 'Total Books', value: stats.totalBooks, icon: '📚', color: '#1a237e' },
    { label: 'Registered Members', value: stats.totalUsers, icon: '👥', color: '#00695c' },
    { label: 'Active Borrows', value: stats.activeBorrows, icon: '📤', color: '#e65100' },
    { label: 'Overdue Books', value: stats.overdueBooks, icon: '⚠️', color: '#c62828' },
  ] : [];

  return (
    <div className="dashboard-container">
      <h1>Admin Dashboard</h1>
      <p className="dashboard-subtitle">Overview of library activity</p>
      {!stats ? (
        <div className="loading">Loading stats...</div>
      ) : (
        <div className="stats-grid">
          {cards.map((card) => (
            <div className="stat-card" key={card.label} style={{ borderTop: `4px solid ${card.color}` }}>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-info">
                <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
                <div className="stat-label">{card.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
