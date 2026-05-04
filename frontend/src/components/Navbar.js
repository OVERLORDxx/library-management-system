import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">📚 Library MS</Link>
      </div>
      <div className="navbar-links">
        <Link to="/books">Books</Link>
        {user ? (
          <>
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard">Dashboard</Link>
                <Link to="/admin/books">Manage Books</Link>
                <Link to="/admin/users">Users</Link>
                <Link to="/admin/borrows">Borrows</Link>
              </>
            ) : (
              <Link to="/my-books">My Books</Link>
            )}
            <button className="btn-logout" onClick={handleLogout}>
              Logout ({user.name})
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
