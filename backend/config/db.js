const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

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

      // Ensure default admin user exists and credentials are correct ('admin@library.com' / 'admin123')
      try {
        const [adminCheck] = await conn.query('SELECT * FROM users WHERE email = ?', ['admin@library.com']);
        const adminHash = await bcrypt.hash('admin123', 10);
        if (adminCheck.length === 0) {
          console.log('Inserting default admin user...');
          await conn.query(
            "INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@library.com', ?, 'admin')",
            [adminHash]
          );
          console.log('Default admin user inserted successfully.');
        } else {
          console.log('Updating/resetting admin password and role...');
          await conn.query(
            "UPDATE users SET password = ?, role = 'admin' WHERE email = ?",
            [adminHash, 'admin@library.com']
          );
          console.log('Default admin user credentials verified/updated.');
        }
      } catch (adminErr) {
        console.error('Failed to configure default admin user:', adminErr.message);
      }

    } finally {
      conn.release();
    }

    // 4. Seed initial books (inserts only if they don't already exist by ISBN)
    console.log('Syncing initial book catalog...');
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
      },
      // 15 Additional Books:
      {
        title: "Introduction to Algorithms",
        author: "Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein",
        isbn: "9780262033848",
        genre: "Programming",
        published_year: 2009,
        total_copies: 3,
        available_copies: 3,
        description: "A comprehensive guide to the analysis and design of computer algorithms.",
        cover_image: "https://covers.openlibrary.org/b/id/8315545-L.jpg"
      },
      {
        title: "You Don't Know JS: Up & Going",
        author: "Kyle Simpson",
        isbn: "9781491924464",
        genre: "Programming",
        published_year: 2015,
        total_copies: 5,
        available_copies: 5,
        description: "An introduction to the JavaScript language, focusing on core concepts and language features.",
        cover_image: "https://covers.openlibrary.org/b/id/8291583-L.jpg"
      },
      {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        isbn: "9780446310789",
        genre: "Fiction",
        published_year: 1960,
        total_copies: 4,
        available_copies: 4,
        description: "The Pulitzer Prize-winning masterpiece about honor, injustice, and racism in the Deep South.",
        cover_image: "https://covers.openlibrary.org/b/id/8226191-L.jpg"
      },
      {
        title: "1984",
        author: "George Orwell",
        isbn: "9780451524935",
        genre: "Fiction",
        published_year: 1949,
        total_copies: 6,
        available_copies: 6,
        description: "Orwell's haunting dystopian vision of a totalitarian future ruled by Big Brother.",
        cover_image: "https://covers.openlibrary.org/b/id/11181515-L.jpg"
      },
      {
        title: "The Alchemist",
        author: "Paulo Coelho",
        isbn: "9780061122415",
        genre: "Fiction",
        published_year: 1993,
        total_copies: 5,
        available_copies: 5,
        description: "An international bestseller about a shepherd boy named Santiago who travels in search of worldly treasure.",
        cover_image: "https://covers.openlibrary.org/b/id/10543666-L.jpg"
      },
      {
        title: "Cosmos",
        author: "Carl Sagan",
        isbn: "9780345331359",
        genre: "Science & Technology",
        published_year: 1980,
        total_copies: 4,
        available_copies: 4,
        description: "Sagan's magnificent journey into the science and history of the universe.",
        cover_image: "https://covers.openlibrary.org/b/id/8230752-L.jpg"
      },
      {
        title: "The Selfish Gene",
        author: "Richard Dawkins",
        isbn: "9780199291151",
        genre: "Science & Technology",
        published_year: 2006,
        total_copies: 3,
        available_copies: 3,
        description: "A landmark work on evolutionary theory, describing genes as the unit of selection.",
        cover_image: "https://covers.openlibrary.org/b/id/8296384-L.jpg"
      },
      {
        title: "Rich Dad Poor Dad",
        author: "Robert T. Kiyosaki",
        isbn: "9781612680194",
        genre: "Business & Finance",
        published_year: 2011,
        total_copies: 8,
        available_copies: 8,
        description: "Explodes the myth that you need to earn a high income to become rich and defines assets versus liabilities.",
        cover_image: "https://covers.openlibrary.org/b/id/12836262-L.jpg"
      },
      {
        title: "Think and Grow Rich",
        author: "Napoleon Hill",
        isbn: "9781593302009",
        genre: "Business & Finance",
        published_year: 2004,
        total_copies: 5,
        available_copies: 5,
        description: "The classic guide on personal achievement and financial wealth creation.",
        cover_image: "https://covers.openlibrary.org/b/id/8240417-L.jpg"
      },
      {
        title: "The 7 Habits of Highly Effective People",
        author: "Stephen R. Covey",
        isbn: "9780743269513",
        genre: "Self-Help",
        published_year: 2004,
        total_copies: 6,
        available_copies: 6,
        description: "Covey presents a holistic, integrated, principle-centered approach for solving personal and professional problems.",
        cover_image: "https://covers.openlibrary.org/b/id/10543603-L.jpg"
      },
      {
        title: "The Power of Now",
        author: "Eckhart Tolle",
        isbn: "9781577314806",
        genre: "Self-Help",
        published_year: 2004,
        total_copies: 4,
        available_copies: 4,
        description: "A guide to spiritual enlightenment and living in the present moment.",
        cover_image: "https://covers.openlibrary.org/b/id/8314157-L.jpg"
      },
      {
        title: "Sapiens: A Brief History of Humankind",
        author: "Yuval Noah Harari",
        isbn: "9780062316097",
        genre: "History & Biography",
        published_year: 2015,
        total_copies: 5,
        available_copies: 5,
        description: "Harari surveys the history of humankind from the evolutionary origins of Homo sapiens to the present.",
        cover_image: "https://covers.openlibrary.org/b/id/12608468-L.jpg"
      },
      {
        title: "Steve Jobs",
        author: "Walter Isaacson",
        isbn: "9781451648539",
        genre: "History & Biography",
        published_year: 2011,
        total_copies: 3,
        available_copies: 3,
        description: "The exclusive biography of Apple co-founder Steve Jobs, based on more than forty interviews.",
        cover_image: "https://covers.openlibrary.org/b/id/8409490-L.jpg"
      },
      {
        title: "Harry Potter and the Sorcerer's Stone",
        author: "J.K. Rowling",
        isbn: "9780590353427",
        genre: "Mystery & Fantasy",
        published_year: 1998,
        total_copies: 7,
        available_copies: 7,
        description: "The first novel in the Harry Potter series, introducing Harry Potter as a young wizard.",
        cover_image: "https://covers.openlibrary.org/b/id/10521270-L.jpg"
      },
      {
        title: "The Da Vinci Code",
        author: "Dan Brown",
        isbn: "9780307474278",
        genre: "Mystery & Fantasy",
        published_year: 2009,
        total_copies: 4,
        available_copies: 4,
        description: "A thriller novel following symbologist Robert Langdon as he investigates a murder in the Louvre Museum.",
        cover_image: "https://covers.openlibrary.org/b/id/12845899-L.jpg"
      }
    ];

    for (const book of initialBooks) {
      await activePool.query(
        `INSERT IGNORE INTO books (title, author, isbn, genre, published_year, total_copies, available_copies, description, cover_image)
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
    console.log('Book catalog synchronization complete.');
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
