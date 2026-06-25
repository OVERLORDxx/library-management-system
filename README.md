# Library Management System

A full-stack web application for managing a library — built with **React**, **Node.js (Express)**, and **MySQL**.

## Features

### Member (User)
- Register & Login with JWT authentication
- Browse and search books by title, author, or genre (synchronized dropdowns)
- Borrow books (limited to available copies)
- Return books and view **real-time accrued overdue fines** calculated dynamically on-the-fly
- View personal borrow history

### Admin
- Dashboard with live statistics (total books, users, borrows, overdue)
- Add, edit, and delete books with **ISBN-based Auto-Fill** querying Open Library API
- View and manage all registered users
- View all borrow records and update overdue status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, React Toastify |
| Backend | Node.js, Express.js |
| Database | MySQL, Aiven MySQL (SSL Enabled configuration) |
| APIs | Open Library Books API (ISBN Metadata lookup) |
| Auth | JWT (JSON Web Tokens), bcryptjs |

---

## Project Structure

```
library-management-system/
├── backend/
│   ├── config/
│   │   ├── db.js           # MySQL connection
│   │   └── schema.sql      # Database schema
│   ├── middleware/
│   │   └── auth.js         # JWT + role middleware
│   ├── routes/
│   │   ├── auth.js         # Register, Login
│   │   ├── books.js        # CRUD books
│   │   ├── borrow.js       # Borrow/return logic
│   │   └── users.js        # User management + stats
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    └── src/
        ├── api/            # Axios instance
        ├── components/     # Navbar
        ├── context/        # AuthContext
        ├── pages/
        │   ├── admin/      # Admin pages
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Books.js
        │   └── MyBooks.js
        └── App.js
```

---

## Getting Started

### Prerequisites
- Node.js (v16+)
- MySQL (v8+)

### 1. Clone the repository
```bash
git clone https://github.com/your-username/library-management-system.git
cd library-management-system
```

### 2. Setup Database
```sql
-- In MySQL, create a database
CREATE DATABASE library_db;

-- Then run the schema (in MySQL CLI or MySQL Workbench)
SOURCE backend/config/schema.sql;
```

### 3. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm run dev
```

### 4. Setup Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env if needed (default: http://localhost:5000/api)
npm start
```

### 5. Open the app
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

---

## Default Admin Account

| Field | Value |
|---|---|
| Email | admin@library.com |
| Password | admin123 |

---

## API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |

### Books
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/books | Get all books (with search/filter) |
| GET | /api/books/:id | Get single book |
| POST | /api/books | Add book (admin) |
| PUT | /api/books/:id | Update book (admin) |
| DELETE | /api/books/:id | Delete book (admin) |

### Borrow
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/borrow/borrow | Borrow a book |
| PUT | /api/borrow/return/:id | Return a book |
| GET | /api/borrow/my | My borrow history |
| GET | /api/borrow/all | All records (admin) |

### Users
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/users | All users (admin) |
| GET | /api/users/stats | Dashboard stats (admin) |
| DELETE | /api/users/:id | Delete user (admin) |

---

## Resume Summary

> **Library Management System** | React, Node.js, Express.js, MySQL, Aiven | https://github.com/OVERLORDxx/library-management-system
>
> - Developed a full-stack library management system featuring a responsive React frontend, Express.js backend, and Aiven MySQL database.
> - Integrated the Open Library Books API using ISBN lookups to auto-fetch title, author, description, and cover images for catalog items.
> - Built real-time overdue fine tracking by computing active fines dynamically on-the-fly using database-level SQL queries (DATEDIFF).
> - Implemented role-based session authentication (Admin/Member) using secure JSON Web Tokens (JWT) and bcrypt password hashing.
> - Admin dashboard featuring live statistics (total books, active borrows, overdue counts) and complete CRUD operations for catalog management.

---

## License
MIT
