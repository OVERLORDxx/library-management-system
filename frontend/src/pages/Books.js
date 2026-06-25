import React, { useEffect, useState } from 'react';
import API from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './Books.css';

const Books = () => {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [loading, setLoading] = useState(true);

  const { user } = useAuth();

  const fetchBooks = async () => {
    try {
      setLoading(true);

      const params = {};
      if (search) params.search = search;
      if (genre) params.genre = genre;

      const res = await API.get('/books', { params });
      setBooks(res.data);
    } catch (err) {
      toast.error('Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBooks();
  };

  const handleBorrow = async (bookId) => {
    try {
      await API.post('/borrow/borrow', {
        book_id: bookId,
      });

      toast.success('Book borrowed successfully!');
      fetchBooks();
    } catch (err) {
      toast.error(
        err.response?.data?.message || 'Failed to borrow book'
      );
    }
  };

  return (
    <div className="books-container">
      <div className="books-header">
        <h1>📚 Book Catalog</h1>

        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by title or author..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
          >
            <option value="">All Genres</option>
            {[
              'Fiction',
              'Non-Fiction',
              'Science & Technology',
              'Programming',
              'Business & Finance',
              'History & Biography',
              'Self-Help',
              'Mystery & Fantasy'
            ].map(g => <option key={g} value={g}>{g}</option>)}
          </select>

          <button type="submit">Search</button>
        </form>
      </div>

      {loading ? (
        <div className="loading">Loading books...</div>
      ) : books.length === 0 ? (
        <div className="no-books">No books found.</div>
      ) : (
        <div className="books-grid">
          {books.map((book) => (
            <div className="book-card" key={book.id}>
              <div className="book-cover">
                {book.cover_image ? (
                  <img src={book.cover_image} alt={book.title} />
                ) : (
                  <div className="book-placeholder">📖</div>
                )}
              </div>

              <div className="book-info">
                <h3>{book.title}</h3>

                <p className="author">
                  by {book.author}
                </p>

                {book.genre && (
                  <span className="genre-tag">
                    {book.genre}
                  </span>
                )}

                <p className="isbn">
                  ISBN: {book.isbn}
                </p>

                <div className="availability">
                  <span
                    className={
                      book.available_copies > 0
                        ? 'available'
                        : 'unavailable'
                    }
                  >
                    {book.available_copies > 0
                      ? `✓ ${book.available_copies} available`
                      : '✗ Not available'}
                  </span>
                </div>

                {user && user.role === 'user' && (
                  <button
                    className="btn-borrow"
                    onClick={() => handleBorrow(book.id)}
                    disabled={book.available_copies === 0}
                  >
                    {book.available_copies > 0
                      ? 'Borrow Book'
                      : 'Unavailable'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Books;
