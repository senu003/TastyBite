-- TastyBite Database Schema
-- Database: tastybite_db

CREATE DATABASE IF NOT EXISTS tastybite_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tastybite_db;

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Categories table
CREATE TABLE IF NOT EXISTS categories (
  category_id INT AUTO_INCREMENT PRIMARY KEY,
  category_name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Recipes table
CREATE TABLE IF NOT EXISTS recipes (
  recipe_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  category_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  cooking_time INT NOT NULL,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  favorite_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  UNIQUE KEY unique_user_recipe_fav (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Ratings table
CREATE TABLE IF NOT EXISTS ratings (
  rating_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  recipe_id INT NOT NULL,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  UNIQUE KEY unique_user_recipe_rating (user_id, recipe_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Comments table
CREATE TABLE IF NOT EXISTS comments (
  comment_id INT AUTO_INCREMENT PRIMARY KEY,
  recipe_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Ingredients table
CREATE TABLE IF NOT EXISTS ingredients (
  ingredient_id INT AUTO_INCREMENT PRIMARY KEY,
  ingredient_name VARCHAR(255) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Recipe Ingredients table
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  recipe_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  quantity VARCHAR(255) DEFAULT '1 unit',
  PRIMARY KEY (recipe_id, ingredient_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Step table
CREATE TABLE IF NOT EXISTS step (
  step_id INT AUTO_INCREMENT PRIMARY KEY,
  instruction TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Recipe Steps table
CREATE TABLE IF NOT EXISTS recipe_steps (
  recipe_id INT NOT NULL,
  step_id INT NOT NULL,
  step_number INT NOT NULL,
  PRIMARY KEY (recipe_id, step_id),
  FOREIGN KEY (recipe_id) REFERENCES recipes(recipe_id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES step(step_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. Ingredient Status table
CREATE TABLE IF NOT EXISTS ingredient_status (
  status_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  ingredient_id INT NOT NULL,
  have BOOLEAN DEFAULT FALSE,
  UNIQUE KEY unique_user_ingredient (user_id, ingredient_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (ingredient_id) REFERENCES ingredients(ingredient_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
