const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

let activePool = null;

// Proxy object that mimics the mysql pool, delegating to activePool once initialized
const poolProxy = {
  query: async (...args) => {
    if (!activePool) {
      throw new Error('Database pool not initialized. Call initializeDatabase() first.');
    }
    return activePool.query(...args);
  },
  getConnection: async (...args) => {
    if (!activePool) {
      throw new Error('Database pool not initialized. Call initializeDatabase() first.');
    }
    return activePool.getConnection(...args);
  },
  end: async (...args) => {
    if (activePool) {
      return activePool.end(...args);
    }
  }
};

async function initializeDatabase() {
  try {
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbPort = process.env.DB_PORT || 3306;
    const dbName = process.env.DB_NAME || 'library_db';

    // Auto-enable SSL for remote/hosted MySQL (e.g. Aiven) but disable for localhost
    const isLocalhost = dbHost.includes('localhost') || dbHost.includes('127.0.0.1');
    const sslConfig = (process.env.DB_SSL === 'true' || (!isLocalhost && process.env.DB_SSL !== 'false'))
      ? { rejectUnauthorized: false }
      : undefined;

    const dbConfig = {
      host: dbHost,
      user: dbUser,
      password: dbPassword,
      port: dbPort,
      ssl: sslConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    };

    // 1. Connect to MySQL server without database first to ensure database exists
    console.log(`Connecting to MySQL server at ${dbConfig.host}:${dbConfig.port}...`);
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port,
      ssl: dbConfig.ssl
    });

    console.log(`Creating database \`${dbName}\` if it does not exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
    await connection.end();

    // 2. Initialize the connection pool targeting the specific database
    activePool = mysql.createPool({
      ...dbConfig,
      database: dbName
    });

    // 3. Create tables if they don't exist by executing schema.sql
    console.log('Verifying database schema...');
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Clean up comments and split schema file into individual queries
    const cleanSql = schemaSql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && !line.trim().startsWith('#'))
      .join('\n');

    const statements = cleanSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    const conn = await activePool.getConnection();
    try {
      for (const statement of statements) {
        await conn.query(statement);
      }
      console.log('Database tables successfully verified/created.');
      
      // Ensure 'user' role is allowed in the ENUM if the database was previously initialized with only ('admin', 'member')
      try {
        await conn.query("ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'member', 'user') DEFAULT 'user';");
        console.log('Successfully updated users role column ENUM.');
      } catch (alterErr) {
        console.warn('Could not alter users table (might be fine if already modified):', alterErr.message);
      }
    } finally {
      conn.release();
    }

    // 4. Seed initial books if books table is empty
    const [books] = await activePool.query('SELECT COUNT(*) AS count FROM books');
    if (books[0].count === 0) {
      console.log('Seeding initial books...');
      const initialBooks = [
        {
          title: "Clean Code: A Handbook of Agile Software Craftsmanship",
          author: "Robert C. Martin",
          isbn: "9780132350884",
          genre: "Programming",
          published_year: 2008,
          total_copies: 5,
          available_copies: 5,
          description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees.",
          cover_image: "https://covers.openlibrary.org/b/id/8082006-L.jpg"
        },
        {
          title: "The Pragmatic Programmer",
          author: "Andrew Hunt, David Thomas",
          isbn: "9780201616224",
          genre: "Programming",
          published_year: 1999,
          total_copies: 4,
          available_copies: 4,
          description: "One of the most significant books in software development, providing pragmatic advice for developers.",
          cover_image: "https://covers.openlibrary.org/b/id/10411210-L.jpg"
        },
        {
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          isbn: "9780743273565",
          genre: "Fiction",
          published_year: 1925,
          total_copies: 3,
          available_copies: 3,
          description: "The story of the mysteriously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.",
          cover_image: "https://covers.openlibrary.org/b/id/9681313-L.jpg"
        },
        {
          title: "A Brief History of Time",
          author: "Stephen Hawking",
          isbn: "9780553380163",
          genre: "Science & Technology",
          published_year: 1998,
          total_copies: 3,
          available_copies: 3,
          description: "A landmark volume in science writing by one of the great minds of our time.",
          cover_image: "https://covers.openlibrary.org/b/id/8231856-L.jpg"
        },
        {
          title: "The Intelligent Investor",
          author: "Benjamin Graham",
          isbn: "9780060555665",
          genre: "Business & Finance",
          published_year: 2003,
          total_copies: 4,
          available_copies: 4,
          description: "The greatest investment advisor of the twentieth century, Benjamin Graham, taught and inspired people worldwide.",
          cover_image: "https://covers.openlibrary.org/b/id/8315187-L.jpg"
        },
        {
          title: "Atomic Habits",
          author: "James Clear",
          isbn: "9780735211292",
          genre: "Self-Help",
          published_year: 2018,
          total_copies: 6,
          available_copies: 6,
          description: "No matter your goals, Atomic Habits offers a proven framework for improving--every day.",
          cover_image: "https://covers.openlibrary.org/b/id/10901511-L.jpg"
        },
        {
          title: "The Hobbit",
          author: "J.R.R. Tolkien",
          isbn: "9780261102217",
          genre: "Mystery & Fantasy",
          published_year: 1937,
          total_copies: 5,
          available_copies: 5,
          description: "A great modern classic and the prelude to The Lord of the Rings.",
          cover_image: "https://covers.openlibrary.org/b/id/8406782-L.jpg"
        }
      ];

      for (const book of initialBooks) {
        await activePool.query(
          `INSERT INTO books (title, author, isbn, genre, published_year, total_copies, available_copies, description, cover_image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            book.title,
            book.author,
            book.isbn,
            book.genre,
            book.published_year,
            book.total_copies,
            book.available_copies,
            book.description,
            book.cover_image
          ]
        );
      }
      console.log('Books seeded successfully.');
    }
  } catch (err) {
    console.error('Database initialization failed:', err);
    throw err;
  }
}

// Export the proxy pool and the initializer function
module.exports = {
  ...poolProxy,
  query: poolProxy.query,
  getConnection: poolProxy.getConnection,
  end: poolProxy.end,
  initializeDatabase
};
