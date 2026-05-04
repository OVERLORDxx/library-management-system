import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import '../MyBooks.css';

const ManageBorrows = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      const res = await API.get('/borrow/all');
      setRecords(res.data);
    } catch { toast.error('Failed to load borrow records'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const updateOverdue = async () => {
    await API.put('/borrow/update-overdue');
    toast.success('Overdue records updated');
    fetchRecords();
  };

  const getStatusBadge = (status) => {
    const map = { borrowed: 'badge-blue', returned: 'badge-green', overdue: 'badge-red' };
    return <span className={`badge ${map[status]}`}>{status.toUpperCase()}</span>;
  };

  if (loading) return <div className="loading">Loading borrow records...</div>;

  return (
    <div className="my-books-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>📋 All Borrow Records</h1>
        <button onClick={updateOverdue} style={{ background: '#e65100', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
          Update Overdue
        </button>
      </div>
      {records.length === 0 ? (
        <div className="no-records">No borrow records found.</div>
      ) : (
        <div className="table-wrapper">
          <table className="borrow-table">
            <thead>
              <tr><th>User</th><th>Email</th><th>Book</th><th>Borrow Date</th><th>Due Date</th><th>Return Date</th><th>Fine</th><th>Status</th></tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td>{r.user_name}</td>
                  <td>{r.user_email}</td>
                  <td><strong>{r.title}</strong></td>
                  <td>{new Date(r.borrow_date).toLocaleDateString()}</td>
                  <td>{new Date(r.due_date).toLocaleDateString()}</td>
                  <td>{r.return_date ? new Date(r.return_date).toLocaleDateString() : '—'}</td>
                  <td>{r.fine > 0 ? `₹${r.fine}` : '—'}</td>
                  <td>{getStatusBadge(r.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ManageBorrows;
