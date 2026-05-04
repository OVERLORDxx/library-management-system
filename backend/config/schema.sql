-- Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'member') DEFAULT 'member',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Books Table
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(150) NOT NULL,
  isbn VARCHAR(20) UNIQUE NOT NULL,
  genre VARCHAR(100),
  published_year INT,
  total_copies INT DEFAULT 1,
  available_copies INT DEFAULT 1,
  description TEXT,
  cover_image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Borrow Records Table
CREATE TABLE IF NOT EXISTS borrow_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  book_id INT,
  borrow_date DATE,
  due_date DATE,
  return_date DATE,
  status ENUM('borrowed', 'returned', 'overdue') DEFAULT 'borrowed',
  fine DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role)
VALUES ('Admin', 'admin@library.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');

