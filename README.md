# 🍴 TastyBite — Interactive Full-Stack Food Recipe Web Application

![React 19](https://img.shields.io/badge/React-19.1-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.1-646CFF?logo=vite)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=nodedotjs)
![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql)
![Supabase](https://img.shields.io/badge/Supabase-Storage-3ECF8E?logo=supabase)

**TastyBite** is a modern, responsive full-stack web application designed for food enthusiasts to discover, create, and organize culinary recipes. Built with a fast **React 19 + Vite** frontend, styled with **Tailwind CSS v4** and **Framer Motion**, and backed by a robust **Express 5** REST API connected to **MySQL** and backend-driven **Supabase Storage**.

---

## ✨ Key Features

- 🍽️ **Interactive Recipe Discovery**: Search recipes by title or category with smooth-scrolling filters and category cards.
- 🎠 **Dynamic Hero Carousel**: Visual showcase highlighting featured global cuisines.
- 📖 **Full Recipe Detail View**: Modal overlay featuring step-by-step cooking instructions, ingredient quantities, and community comments.
- ➕ **Recipe Creator & Category Manager**: Add custom recipes, specify ingredients dynamically, upload cover images, and auto-create new categories.
- ☁️ **Backend-Driven Supabase Storage**: Secure server-side image uploads directly to **Supabase Storage** with fallback to local disk uploads.
- ❤️ **Personal Favorites**: Save favorite recipes to a dedicated personal collection tied to your user account.
- 🥗 **Interactive Grocery Checklist**: Track ingredients needed for your favorite recipes with instant status toggling.
- 🔒 **Dynamic Authentication & Persistence**: Full user signup and login powered by **bcrypt** password hashing and persistent local session state.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Styling**: Tailwind CSS v4, React Icons, Framer Motion
- **State Management**: React AuthContext (localStorage persistence)
- **HTTP Client**: Axios

### Backend & Storage
- **Runtime & API**: Node.js, Express 5 REST API
- **Database**: MySQL 8.0 (Relational Pool with `mysql2/promise`)
- **Cloud Storage**: Supabase Storage (`@supabase/supabase-js`)
- **File Uploads**: Multer & File Stream Processing
- **Security**: bcrypt password hashing, CORS, Environment Variables

---

## 📁 Repository Structure

```
myProject/
├── backend/                  # Node.js Express 5 REST Server
│   ├── db.js                 # MySQL database pool configuration
│   ├── index.js              # REST endpoints & file upload routes
│   ├── supabaseService.js    # Backend-driven Supabase Storage helper
│   ├── .env.example          # Environment variable template
│   └── package.json          # Server dependencies
│
└── my-frontend/              # React 19 Frontend Application
    ├── src/
    │   ├── components/       # UI Components (Header, RecipeCard, RecipeModal, HighRatedRecipes)
    │   ├── context/          # AuthContext state management
    │   ├── utils/            # Image URL parser & fallback utilities
    │   ├── pages/            # Application Pages (Home, Recipes, Categories, Favorites, AddRecipe)
    │   ├── App.jsx           # Routing & layout configuration
    │   └── main.jsx          # React entrypoint
    ├── vite.config.js        # Vite build & API proxy setup
    └── package.json          # Frontend dependencies
```

---

---

## 🔑 Environment Variables Reference

### Backend Environment Variables (`backend/.env`)
| Variable | Description | Example / Default | Required |
| --- | --- | --- | --- |
| `PORT` | HTTP server port | `3000` | Optional (default 3000) |
| `DB_HOST` | MySQL hostname | `localhost` | **Required** |
| `DB_USER` | MySQL username | `root` | **Required** |
| `DB_PASSWORD` | MySQL password | `your_mysql_password` | **Required** |
| `DB_NAME` | MySQL database name | `tastybite` | **Required** |
| `DB_PORT` | MySQL database port | `3306` | Optional (default 3306) |
| `SUPABASE_URL` | Supabase project HTTPS URL | `https://your-project.supabase.co` | **Required** for Cloud Images |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (backend only) | `your-service-role-key` | **Required** for Cloud Images |
| `SUPABASE_BUCKET` | Supabase Storage bucket name | `recipe-images` | Optional (default `recipe-images`) |
| `JWT_SECRET` | Secret string used for signing JWT tokens | `your-jwt-secret-key` | **Required** |
| `CORS_ORIGIN` | Allowed origin URL(s) (comma-separated for multiple) | `http://localhost:5173` | Optional (default allows all origins) |

> [!CAUTION]
> Never commit `backend/.env` or share `SUPABASE_SERVICE_ROLE_KEY` or `JWT_SECRET`. `SUPABASE_SERVICE_ROLE_KEY` must **only** reside on the backend server and never be exposed to the frontend.

### Frontend Environment Variables (`my-frontend/.env`)
| Variable | Description | Example / Default | Required |
| --- | --- | --- | --- |
| `VITE_API_URL` | Deployed Backend API Base URL | `http://localhost:3000` | Optional in dev (uses Vite proxy); **Required** for separated production deployment |
| `VITE_SUPABASE_URL` | Supabase project URL (optional client fallback) | `https://your-project.supabase.co` | Optional |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key (public) | `your-anon-key` | Optional |

---

## 🗄️ Database Setup & Schema Requirements

### 1. Database Creation
```sql
CREATE DATABASE tastybite CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tastybite;
```

### 2. Required Schema & Constraints

The application relies on the following MySQL tables and constraints:

- `users`: `user_id` (PK, AUTO_INCREMENT), `username` (UNIQUE), `email` (UNIQUE), `password` (hashed)
- `categories`: `category_id` (PK, AUTO_INCREMENT), `category_name` (UNIQUE)
- `recipes`: `recipe_id` (PK, AUTO_INCREMENT), `user_id` (FK -> users), `category_id` (FK -> categories), `title`, `description`, `cooking_time`, `image_url`, `created_at`
- `favorites`: `favorite_id` (PK, AUTO_INCREMENT), `user_id` (FK -> users), `recipe_id` (FK -> recipes), UNIQUE index on `(user_id, recipe_id)`
- `ratings`: `rating_id` (PK, AUTO_INCREMENT), `user_id` (FK -> users), `recipe_id` (FK -> recipes), `rating` (1-5), UNIQUE index on `(user_id, recipe_id)`
- `comments`: `comment_id` (PK, AUTO_INCREMENT), `recipe_id` (FK -> recipes), `user_id` (FK -> users), `comment`, `created_at`
- `ingredients`: `ingredient_id` (PK, AUTO_INCREMENT), `ingredient_name` (UNIQUE)
- `recipe_ingredients`: `recipe_id` (FK -> recipes), `ingredient_id` (FK -> ingredients), `quantity`, Primary / Unique key on `(recipe_id, ingredient_id)`
- `step`: `step_id` (PK, AUTO_INCREMENT), `instruction`
- `recipe_steps`: `recipe_id` (FK -> recipes), `step_id` (FK -> step), `step_number`
- `ingredient_status`: `status_id` (PK, AUTO_INCREMENT), `user_id` (FK -> users), `ingredient_id` (FK -> ingredients), `have` (BOOLEAN), UNIQUE index on `(user_id, ingredient_id)`

---

## ☁️ Supabase Storage Setup Guide

To enable cloud image hosting for recipe uploads:
1. Log into [Supabase Dashboard](https://supabase.com/) and create a project.
2. Under **Storage**, create a **Public** bucket named `recipe-images`.
3. Under **Project Settings -> API**, obtain:
   - **Project URL** -> `SUPABASE_URL`
   - **service_role key** (secret) -> `SUPABASE_SERVICE_ROLE_KEY`
4. Add these credentials to `backend/.env`. The backend Express API automatically uploads incoming recipe images directly to Supabase Storage and saves public HTTPS URLs into MySQL. (If omitted, the server gracefully uses local disk storage under `backend/uploads/`).

---

## 🚀 Development & Production Commands

### Local Development Setup

1. **Backend Server**:
   ```bash
   cd backend
   npm install
   cp .env.example .env # Configure your DB & JWT credentials
   npm run dev
   ```

2. **Frontend Development Server**:
   ```bash
   cd my-frontend
   npm install
   npm run dev
   ```

3. **Backend Test Suite**:
   ```bash
   cd backend
   npm test
   ```

### Production Build & Deployment Commands

1. **Frontend Production Build**:
   ```bash
   cd my-frontend
   npm run build
   ```
   *Outputs optimized production static bundle in `my-frontend/dist/`.*

2. **Backend Production Start**:
   ```bash
   cd backend
   npm start
   ```
   *Binds server to `process.env.PORT` or default port 3000.*

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).