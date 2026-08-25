# Business-Incubator-Platform-DBMS

> *Where raw ideas meet structured growth.*

An open-source incubator management system built on **Express.js + PostgreSQL + EJS + React (Vite)** — unifying project tracking, mentorship, workshops, resources, and funding into one platform.

---

## 📁 Repository Directory Structure

The project has been cleaned up and reorganized into clear, distinct folders:

```
Business-Incubator-Platform-DBMS/
├── backend/                  # Express.js API, EJS Public Views, Controllers, Models, Routes
│   ├── admin-backend/        # Admin API logic & services
│   ├── config/               # Database and upload configurations
│   ├── controllers/          # Express route controllers
│   ├── middleware/           # Auth and setup middlewares
│   ├── models/               # Data access models
│   ├── public/               # Static assets & built React admin UI (`public/admin`)
│   ├── routes/               # API & EJS routes
│   ├── subscribers/          # Event bus subscribers
│   ├── utils/                # Helpers, mailer, event bus
│   ├── views/                # Public website EJS view templates
│   ├── app.js                # Express app setup
│   ├── server.js             # HTTP server entry point
│   └── package.json          # Backend dependencies
│
├── frontend/                 # React + Vite Admin & Portal UI
│   ├── src/                  # React components, features, & pages
│   │   ├── components/       # Shared UI components
│   │   ├── features/         # Admin, Entrepreneur, & Mentor portals
│   │   ├── services/         # API integration services
│   │   └── electronApiShim.js# API shim for browser / IPC calls
│   ├── index.html            # Vite HTML template
│   ├── vite.config.js        # Configured to build into `backend/public/admin`
│   └── package.json          # Frontend dependencies
│
├── database/                 # PostgreSQL schema and SQL migrations
│   ├── db.sql                # Complete database creation script
│   ├── migrations/           # SQL migration scripts (001–018)
│   └── seeders/              # Seed data scripts
│
└── package.json              # Root workspace package script wrapper
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies
Run the command below from the root folder to install all dependencies for both `backend` and `frontend`:
```bash
npm run install:all
```

### 2. Start Backend Server
Run the Express backend (runs on `http://localhost:3000`):
```bash
npm start
```

### 3. Build Frontend (React Admin UI)
To compile the React admin UI so that it is served automatically by the backend under `http://localhost:3000/admin`:
```bash
npm run build:frontend
```

For frontend active development with hot module reloading (Vite dev server):
```bash
npm run dev:frontend
```

---

## Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (`pg`), EJS
- **Frontend**: React, Vite, Tailwind CSS, Lucide React
- **Database**: PostgreSQL (Migrations & Seeders in `database/`)

---

## License

Open-source. Built to grow communities.
