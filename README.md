# Library Management System

A full-stack web application for managing a library — built with **React**, **Node.js (Express)**, and **MySQL**.

## Features

### Member (User)
- Register & Login with JWT authentication
- Browse and search books by title, author, or genre
- Borrow books (limited to available copies)
- Return books and view overdue fine
- View personal borrow history

### Admin
- Dashboard with live statistics (total books, users, borrows, overdue)
- Add, edit, and delete books
- View and manage all registered users
- View all borrow records and update overdue status

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Axios, React Toastify |
| Backend | Node.js, Express.js |
| Database | MySQL |
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

> **Library Management System** | React, Node.js, Express.js, MySQL | [GitHub Link]
>
> - Developed a full-stack web application enabling library members to browse, search, and borrow books with real-time availability tracking
> - Implemented role-based authentication (Admin/Member) using JWT and bcrypt for secure login and protected route access
> - Built RESTful API with 15+ endpoints for book management, borrow/return workflow, and automatic overdue fine calculation (₹5/day)
> - Designed normalized MySQL database schema with relational tables, foreign key constraints, and ENUM-based status tracking
> - Admin dashboard with live statistics (total books, active borrows, overdue records) and full CRUD operations for books and users

---

## License
MIT
