import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { toast } from 'react-toastify';
import './MyBooks.css';

const MyBooks = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyBooks = async () => {
    try {
      const res = await API.get('/borrow/my');
      setRecords(res.data);
    } catch (err) {
      toast.error('Failed to load borrow history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyBooks(); }, []);

  const handleReturn = async (recordId) => {
    try {
      const res = await API.put(`/borrow/return/${recordId}`);
      if (res.data.fine > 0) {
        toast.warning(`Book returned. Fine: ₹${res.data.fine} (overdue)`);
      } else {
        toast.success('Book returned successfully!');
      }
      fetchMyBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to return book');
    }
  };

  const getStatusBadge = (status) => {
    const map = { borrowed: 'badge-blue', returned: 'badge-green', overdue: 'badge-red' };
    return <span className={`badge ${map[status]}`}>{status.toUpperCase()}</span>;
  };

  if (loading) return <div className="loading">Loading your books...</div>;

  return (
    <div className="my-books-container">
      <h1>📖 My Borrowed Books</h1>
      {records.length === 0 ? (
        <div className="no-records">You haven't borrowed any books yet.</div>
      ) : (
        <div className="table-wrapper">
          <table className="borrow-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Author</th>
                <th>Borrow Date</th>
                <th>Due Date</th>
                <th>Return Date</th>
                <th>Fine</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.title}</strong></td>
                  <td>{r.author}</td>
                  <td>{new Date(r.borrow_date).toLocaleDateString()}</td>
                  <td>{new Date(r.due_date).toLocaleDateString()}</td>
                  <td>{r.return_date ? new Date(r.return_date).toLocaleDateString() : '—'}</td>
                  <td>{r.fine > 0 ? `₹${r.fine}` : '—'}</td>
                  <td>{getStatusBadge(r.status)}</td>
                  <td>
                    {r.status !== 'returned' && (
                      <button className="btn-return" onClick={() => handleReturn(r.id)}>
                        Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MyBooks;
