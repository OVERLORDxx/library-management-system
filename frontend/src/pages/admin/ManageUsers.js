import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import '../MyBooks.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await API.delete(`/users/${id}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  if (loading) return <div className="loading">Loading users...</div>;

  return (
    <div className="my-books-container">
      <h1>👥 Manage Users</h1>
      <div className="table-wrapper" style={{ marginTop: '1.5rem' }}>
        <table className="borrow-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Action</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.name}</strong></td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-green'}`}>{u.role.toUpperCase()}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.role !== 'admin' && (
                    <button className="btn-return" style={{ background: '#ef5350' }} onClick={() => handleDelete(u.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
