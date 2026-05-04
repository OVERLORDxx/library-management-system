import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Books from './pages/Books';
import MyBooks from './pages/MyBooks';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageBooks from './pages/admin/ManageBooks';
import ManageUsers from './pages/admin/ManageUsers';
import ManageBorrows from './pages/admin/ManageBorrows';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (!isAdmin) return <Navigate to="/books" />;
  return children;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Navigate to="/books" />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/books" element={<Books />} />
      <Route path="/my-books" element={<PrivateRoute><MyBooks /></PrivateRoute>} />
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/books" element={<AdminRoute><ManageBooks /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
      <Route path="/admin/borrows" element={<AdminRoute><ManageBorrows /></AdminRoute>} />
    </Routes>
  </>
);

const App = () => (
  <AuthProvider>
    <Router>
      <AppRoutes />
      <ToastContainer position="top-right" autoClose={3000} />
    </Router>
  </AuthProvider>
);

export default App;
