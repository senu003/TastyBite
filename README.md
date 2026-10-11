# 🍴 TastyBite - Recipe Sharing & Culinary Platform

TastyBite is a modern, responsive web application for discovering, sharing, and bookmarking delicious recipes. Built with a React + Vite frontend and an Express + Supabase backend.

---

## 🌟 Key Features

* **Recipe Discovery & Search**: Fast text matching across recipe titles, ingredients, and categories with multi-attribute filtering.
* **Smart Image Handling**: Automatic format validation (JPEG/PNG/WebP, max 5MB) and category-tailored fallback placeholders.
* **Interactive Cooking Modes**: Clean step-by-step instructions and ingredient checklist tracking.
* **User Authentication**: Secure JWT-based user authentication and user profile management.
* **Favorites & Bookmarks**: Save recipes to your personal collection.

---

## 🛠️ Tech Stack

* **Frontend**: React 18, Vite, TailwindCSS / Vanilla CSS, Lucide Icons.
* **Backend**: Node.js, Express, Supabase (PostgreSQL), JWT authentication.
* **Deployment**: Vercel (Production Frontend & Serverless Functions).

---

## 🚀 Quickstart Guide

### 1. Clone the repository
```bash
git clone https://github.com/senu003/TastyBite.git
cd TastyBite
```

### 2. Frontend Setup
```bash
cd my-frontend
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd ../backend
npm install
npm run dev
```

---

## 📁 Project Structure

```text
TastyBite/
├── backend/
│   ├── index.js                     # Express server & API routes
│   ├── authMiddleware.js            # JWT verification middleware
│   ├── db.js                        # Database connection pool
│   ├── schema.sql                   # Supabase SQL schema definitions
│   └── supabaseService.js           # Supabase client service
└── my-frontend/
    ├── src/
    │   ├── components/              # Reusable UI components
    │   ├── pages/                   # Application route pages
    │   ├── context/                 # Auth & Recipe State Contexts
    │   └── utils/
    │       ├── imageHelper.js       # Image URL sanitization & upload validation
    │       └── searchHelper.js      # Multi-criteria recipe search & filter
    └── vite.config.js               # Vite bundler configuration
```

---

## 📄 License

This project is licensed under the MIT License.
