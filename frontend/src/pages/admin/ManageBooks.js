import React, { useEffect, useState } from 'react';
import API from '../../api/axios';
import { toast } from 'react-toastify';
import './ManageBooks.css';

const emptyForm = { title: '', author: '', isbn: '', genre: '', published_year: '', total_copies: 1, description: '', cover_image: '' };

const genres = [
  'Fiction',
  'Non-Fiction',
  'Science & Technology',
  'Programming',
  'Business & Finance',
  'History & Biography',
  'Self-Help',
  'Mystery & Fantasy'
];

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchBooks = async () => {
    try {
      const res = await API.get('/books');
      setBooks(res.data);
    } catch { toast.error('Failed to load books'); }
  };

  useEffect(() => { fetchBooks(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const fetchBookMetadata = async () => {
    if (!form.isbn) {
      toast.warning('Please enter an ISBN first');
      return;
    }
    const cleanIsbn = form.isbn.trim().replace(/[-\s]/g, '');
    toast.info('Fetching book metadata...');
    try {
      const res = await fetch(`https://openlibrary.org/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`);
      const data = await res.json();
      const bookKey = `ISBN:${cleanIsbn}`;
      
      if (data && data[bookKey]) {
        const bookData = data[bookKey];
        const title = bookData.title || '';
        const author = bookData.authors ? bookData.authors.map(a => a.name).join(', ') : '';
        const published_year = bookData.publish_date ? (bookData.publish_date.match(/\d{4}/)?.[0] || '') : '';
        const description = bookData.notes || (bookData.excerpts ? bookData.excerpts[0]?.text : '') || '';
        const cover_image = bookData.cover ? (bookData.cover.large || bookData.cover.medium || bookData.cover.small || '') : '';
        
        let detectedGenre = '';
        if (bookData.subjects && bookData.subjects.length > 0) {
          const subjects = bookData.subjects.map(s => s.name.toLowerCase());
          for (const g of genres) {
            const parts = g.split('&').map(p => p.trim().toLowerCase());
            if (subjects.some(s => parts.some(p => s.includes(p)))) {
              detectedGenre = g;
              break;
            }
          }
        }

        setForm(prev => ({
          ...prev,
          title: title || prev.title,
          author: author || prev.author,
          published_year: published_year || prev.published_year,
          description: description || prev.description,
          cover_image: cover_image || prev.cover_image,
          genre: detectedGenre || prev.genre
        }));
        toast.success('Book metadata auto-filled!');
      } else {
        toast.warn('No metadata found for this ISBN on Open Library.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch metadata.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await API.put(`/books/${editId}`, form);
        toast.success('Book updated!');
      } else {
        await API.post('/books', form);
        toast.success('Book added!');
      }
      setForm(emptyForm);
      setEditId(null);
      setShowForm(false);
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (book) => {
    setForm({ title: book.title, author: book.author, isbn: book.isbn, genre: book.genre || '', published_year: book.published_year || '', total_copies: book.total_copies, description: book.description || '', cover_image: book.cover_image || '' });
    setEditId(book.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this book?')) return;
    try {
      await API.delete(`/books/${id}`);
      toast.success('Book deleted');
      fetchBooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  return (
    <div className="manage-books-container">
      <div className="manage-header">
        <h1>📚 Manage Books</h1>
        <button className="btn-add" onClick={() => { setShowForm(!showForm); setForm(emptyForm); setEditId(null); }}>
          {showForm ? 'Cancel' : '+ Add Book'}
        </button>
      </div>

      {showForm && (
        <form className="book-form" onSubmit={handleSubmit}>
          <h3>{editId ? 'Edit Book' : 'Add New Book'}</h3>
          <div className="form-row">
            <div className="form-group"><label>Title *</label><input name="title" value={form.title} onChange={handleChange} required /></div>
            <div className="form-group"><label>Author *</label><input name="author" value={form.author} onChange={handleChange} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>ISBN *</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input name="isbn" value={form.isbn} onChange={handleChange} required />
                <button type="button" className="btn-autofill" onClick={fetchBookMetadata}>Auto-Fill</button>
              </div>
            </div>
            <div className="form-group">
              <label>Genre</label>
              <select name="genre" value={form.genre} onChange={handleChange}>
                <option value="">Select Genre</option>
                {genres.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Published Year</label><input type="number" name="published_year" value={form.published_year} onChange={handleChange} /></div>
            <div className="form-group"><label>Total Copies</label><input type="number" name="total_copies" value={form.total_copies} onChange={handleChange} min="1" /></div>
          </div>
          <div className="form-group"><label>Cover Image URL</label><input name="cover_image" value={form.cover_image} onChange={handleChange} placeholder="https://..." /></div>
          <div className="form-group"><label>Description</label><textarea name="description" value={form.description} onChange={handleChange} rows="3" /></div>
          <button type="submit" className="btn-submit">{editId ? 'Update Book' : 'Add Book'}</button>
        </form>
      )}

      <div className="table-wrapper">
        <table className="books-table">
          <thead>
            <tr><th>Title</th><th>Author</th><th>ISBN</th><th>Genre</th><th>Copies</th><th>Available</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td><strong>{book.title}</strong></td>
                <td>{book.author}</td>
                <td>{book.isbn}</td>
                <td>{book.genre || '—'}</td>
                <td>{book.total_copies}</td>
                <td><span className={book.available_copies > 0 ? 'avail-yes' : 'avail-no'}>{book.available_copies}</span></td>
                <td>
                  <button className="btn-edit" onClick={() => handleEdit(book)}>Edit</button>
                  <button className="btn-delete" onClick={() => handleDelete(book.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageBooks;
