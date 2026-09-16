// index.js
import express from 'express';
import cors from 'cors';
import pool from './db.js';
import bcrypt from 'bcrypt';
import multer from "multer";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import net from "net";
import dns from "dns";
import { uploadRecipeImageToSupabase, deleteRecipeImageFromSupabase } from "./supabaseService.js";
import mysql from 'mysql2/promise';


import jwt from 'jsonwebtoken';
import { authenticateToken } from './authMiddleware.js';

dotenv.config();


const app = express();
const corsOrigin = process.env.CORS_ORIGIN;
const corsOptions = corsOrigin
  ? {
      origin: corsOrigin.includes(',')
        ? corsOrigin.split(',').map((o) => o.trim())
        : corsOrigin,
    }
  : {};
app.use(cors(corsOptions));
app.use(express.json());




// -----------------------------
// Image upload setup
const uploadDir = path.join(process.cwd(), 'uploads');

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      return cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.'));
    }
    cb(null, true);
  },
});

// Serve uploaded images
app.use("/images", express.static(uploadDir));

// -----------------------------
// Get high-rated recipes (>=3 ratings, avg >=3)
app.get('/api/high-rated-recipes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.recipe_id, r.user_id, r.category_id, r.title, r.description,
        r.cooking_time, r.image_url, r.created_at,
        COUNT(rt.rating_id) AS total_ratings,
        AVG(rt.rating) AS avg_rating
      FROM recipes r
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id
      GROUP BY r.recipe_id
      HAVING total_ratings >= 3 AND avg_rating >= 3
      ORDER BY avg_rating DESC, r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('SQL error (high-rated):', err);
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------
// Get all recipes
app.get('/api/all-recipes', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        r.*, 
        COUNT(rt.rating_id) AS total_ratings,
        AVG(rt.rating) AS avg_rating
      FROM recipes r
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id
      GROUP BY r.recipe_id
      ORDER BY r.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('SQL error (all-recipes):', err);
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------
// Get categories
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT *
      FROM categories 
      ORDER BY category_name
    `);
    res.json(rows);
  } catch (err) {
    console.error("SQL error (categories):", err);
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------
// Favorites routes
app.post('/api/favorites', authenticateToken, async (req, res) => {
  const user_id = req.user.user_id;
  const { recipe_id } = req.body;
  if (!recipe_id || isNaN(Number(recipe_id))) {
    return res.status(400).json({ message: 'Valid recipe_id is required' });
  }
  try {
    await pool.query(
      `INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)`,
      [Number(user_id), Number(recipe_id)]
    );
    res.json({ message: 'Added to favorites' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.json({ message: 'Already favorited' });
    }
    console.error('SQL error (add favorite):', err);
    res.status(500).json({ message: 'Failed to add favorite' });
  }
});

app.delete(['/api/favorites/:user_id/:recipe_id', '/api/favorites/:recipe_id'], authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const recipe_id = req.params.recipe_id || req.params.user_id;
    if (!recipe_id || isNaN(Number(recipe_id))) {
      return res.status(400).json({ message: 'Valid recipe_id is required' });
    }
    await pool.query(
      `DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?`,
      [Number(user_id), Number(recipe_id)]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    console.error('SQL error (remove favorite):', err);
    res.status(500).json({ message: 'Failed to remove favorite' });
  }
});

app.get(['/api/favorites', '/api/favorites/:user_id'], authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.query(`
      SELECT 
        r.*, 
        COUNT(rt.rating_id) AS total_ratings,
        AVG(rt.rating) AS avg_rating
      FROM favorites f
      JOIN recipes r ON f.recipe_id = r.recipe_id
      LEFT JOIN ratings rt ON r.recipe_id = rt.recipe_id
      WHERE f.user_id = ?
      GROUP BY r.recipe_id
      ORDER BY r.created_at DESC
    `, [user_id]);
    res.json(rows);
  } catch (err) {
    console.error('SQL error (user favorites):', err);
    res.status(500).json({ message: err.message });
  }
});


// -----------------------------
// Ingredient status
app.post('/api/ingredient-status', authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { ingredient_id, have } = req.body;
    if (!ingredient_id || isNaN(Number(ingredient_id))) {
      return res.status(400).json({ message: 'Valid ingredient_id is required' });
    }
    const haveVal = Boolean(have);
    await pool.query(`
      INSERT INTO ingredient_status (user_id, ingredient_id, have)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE have = ?
    `, [Number(user_id), Number(ingredient_id), haveVal, haveVal]);
    res.json({ message: 'Ingredient status updated' });
  } catch (err) {
    console.error('SQL error (update ingredient status):', err);
    res.status(500).json({ message: err.message });
  }
});

const UNIT_MAP = {
  // Weight -> base unit 'g'
  'kg': { base: 'g', factor: 1000 },
  'kilogram': { base: 'g', factor: 1000 },
  'kilograms': { base: 'g', factor: 1000 },
  'g': { base: 'g', factor: 1 },
  'gram': { base: 'g', factor: 1 },
  'grams': { base: 'g', factor: 1 },
  'mg': { base: 'g', factor: 0.001 },
  'milligram': { base: 'g', factor: 0.001 },
  'milligrams': { base: 'g', factor: 0.001 },

  // Volume -> base unit 'ml'
  'l': { base: 'ml', factor: 1000 },
  'liter': { base: 'ml', factor: 1000 },
  'liters': { base: 'ml', factor: 1000 },
  'litre': { base: 'ml', factor: 1000 },
  'litres': { base: 'ml', factor: 1000 },
  'ml': { base: 'ml', factor: 1 },
  'milliliter': { base: 'ml', factor: 1 },
  'milliliters': { base: 'ml', factor: 1 },
  'millilitre': { base: 'ml', factor: 1 },
  'millilitres': { base: 'ml', factor: 1 },

  // Spoon measurements -> base unit 'tsp'
  'tbsp': { base: 'tsp', factor: 3 },
  'tablespoon': { base: 'tsp', factor: 3 },
  'tablespoons': { base: 'tsp', factor: 3 },
  'tsp': { base: 'tsp', factor: 1 },
  'teaspoon': { base: 'tsp', factor: 1 },
  'teaspoons': { base: 'tsp', factor: 1 },
};

function combineQuantities(quantities) {
  if (!quantities || quantities.length === 0) return '1 unit';

  const baseSums = new Map();
  const otherUnitSums = new Map();
  const nonNumeric = [];

  for (const qStr of quantities) {
    if (!qStr || typeof qStr !== 'string') continue;
    const trimmed = qStr.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^([\d.]+)\s*(.*)$/);
    if (match) {
      const num = parseFloat(match[1]);
      const unit = match[2] ? match[2].trim() : '';
      if (!isNaN(num)) {
        const unitKey = unit.toLowerCase();
        const mapInfo = UNIT_MAP[unitKey];

        if (mapInfo) {
          const { base, factor } = mapInfo;
          const current = baseSums.get(base) || 0;
          baseSums.set(base, current + num * factor);
        } else {
          const current = otherUnitSums.get(unitKey) || { sum: 0, displayUnit: unit, hasSpace: trimmed.includes(' ') };
          current.sum += num;
          otherUnitSums.set(unitKey, current);
        }
        continue;
      }
    }
    nonNumeric.push(trimmed);
  }

  const parts = [];

  // Format base units (g, ml, tsp)
  for (const [base, sum] of baseSums) {
    if (base === 'g') {
      if (sum >= 1000) {
        const val = sum / 1000;
        const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
        parts.push(`${formatted}kg`);
      } else {
        const formatted = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
        parts.push(`${formatted}g`);
      }
    } else if (base === 'ml') {
      if (sum >= 1000) {
        const val = sum / 1000;
        const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
        parts.push(`${formatted}l`);
      } else {
        const formatted = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
        parts.push(`${formatted}ml`);
      }
    } else if (base === 'tsp') {
      if (sum >= 3) {
        const val = sum / 3;
        const formatted = Number.isInteger(val) ? val.toString() : parseFloat(val.toFixed(2)).toString();
        parts.push(`${formatted} tbsp`);
      } else {
        const formatted = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
        parts.push(`${formatted} tsp`);
      }
    }
  }

  // Format other units (cups, pcs, etc.)
  for (const [_, { sum, displayUnit, hasSpace }] of otherUnitSums) {
    const formattedNum = Number.isInteger(sum) ? sum.toString() : parseFloat(sum.toFixed(2)).toString();
    if (!displayUnit) {
      parts.push(formattedNum);
    } else if (hasSpace || displayUnit.length > 2) {
      parts.push(`${formattedNum} ${displayUnit}`);
    } else {
      parts.push(`${formattedNum}${displayUnit}`);
    }
  }

  for (const item of nonNumeric) {
    if (!parts.includes(item)) parts.push(item);
  }

  return parts.length > 0 ? parts.join(' + ') : '1 unit';
}

app.get(['/api/favorite-ingredients', '/api/favorite-ingredients/:user_id'], authenticateToken, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const [rows] = await pool.query(`
      SELECT 
        i.ingredient_id,
        i.ingredient_name,
        GROUP_CONCAT(DISTINCT r.title SEPARATOR ', ') AS used_in_recipes,
        GROUP_CONCAT(ri.quantity SEPARATOR '|||') AS raw_quantities,
        COALESCE(s.have, FALSE) AS have
      FROM favorites f
      JOIN recipes r ON f.recipe_id = r.recipe_id
      JOIN recipe_ingredients ri ON ri.recipe_id = r.recipe_id
      JOIN ingredients i ON i.ingredient_id = ri.ingredient_id
      LEFT JOIN ingredient_status s 
        ON s.ingredient_id = i.ingredient_id AND s.user_id = f.user_id
      WHERE f.user_id = ?
      GROUP BY i.ingredient_id, i.ingredient_name, s.have
      ORDER BY i.ingredient_name
    `, [user_id]);

    const formatted = rows.map((row) => {
      const qList = row.raw_quantities ? row.raw_quantities.split('|||') : [];
      return {
        ingredient_id: row.ingredient_id,
        ingredient_name: row.ingredient_name,
        used_in_recipes: row.used_in_recipes,
        total_quantity: combineQuantities(qList),
        have: Boolean(row.have),
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error('SQL error (favorite ingredients):', err);
    res.status(500).json({ message: err.message });
  }
});

// -----------------------------
// Recipe details
app.get("/api/recipes/:id", async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId || isNaN(Number(recipeId))) {
    return res.status(400).json({ message: 'Invalid recipe ID' });
  }
  try {
    const [recipeRows] = await pool.query(
      `SELECT * FROM recipes WHERE recipe_id = ?`,
      [recipeId]
    );

    if (!recipeRows.length) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    const [ingredients] = await pool.query(
      `SELECT i.ingredient_name, ri.quantity
       FROM recipe_ingredients ri
       JOIN ingredients i ON ri.ingredient_id = i.ingredient_id
       WHERE ri.recipe_id = ?`,
      [recipeId]
    );

    const [steps] = await pool.query(
      `SELECT s.step_number, st.instruction
       FROM recipe_steps s
       JOIN step st ON s.step_id = st.step_id
       WHERE s.recipe_id = ?
       ORDER BY s.step_number ASC`,
      [recipeId]
    );

    const [comments] = await pool.query(
      `SELECT c.comment_id, c.comment, c.user_id, c.created_at
       FROM comments c
       WHERE c.recipe_id = ?
       ORDER BY c.created_at DESC`,
      [recipeId]
    );

    res.json({
      recipe: recipeRows[0],
      ingredients,
      steps,
      comments
    });
  } catch (err) {
    console.error("SQL error (recipe details):", err);
    res.status(500).json({ message: 'Failed to fetch recipe details' });
  }
});

// Add comment
app.post("/api/recipes/:id/comments", authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  const user_id = req.user.user_id;
  const { comment } = req.body;
  if (!recipeId || isNaN(Number(recipeId))) {
    return res.status(400).json({ message: 'Invalid recipe ID' });
  }
  if (!comment || !comment.trim()) {
    return res.status(400).json({ message: 'Valid comment is required' });
  }
  if (comment.trim().length > 1000) {
    return res.status(400).json({ message: 'Comment must be 1000 characters or fewer' });
  }
  try {
    const [result] = await pool.query(
      `INSERT INTO comments (recipe_id, user_id, comment, created_at) VALUES (?, ?, ?, NOW())`,
      [Number(recipeId), Number(user_id), comment.trim()]
    );
    res.status(201).json({ success: true, comment_id: result.insertId });
  } catch (err) {
    console.error("SQL error (add comment):", err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// -----------------------------
// Signup
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ success: false, message: "Invalid email address" });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
  }
  try {
    const [existing] = await pool.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email already exists" });
    }
    const [existingUsername] = await pool.query("SELECT user_id FROM users WHERE username = ?", [username.trim()]);
    if (existingUsername.length > 0) {
      return res.status(409).json({ success: false, message: "Username already taken" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username.trim(), email.trim(), hashedPassword]
    );
    const user = { user_id: result.insertId, username: username.trim(), email: email.trim() };
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    console.error("SQL error (signup):", err);
    // Handle any residual duplicate entry errors from race conditions
    if (err.code === 'ER_DUP_ENTRY') {
      const msg = err.message.toLowerCase().includes('email') ? 'Email already exists' : 'Username already taken';
      return res.status(409).json({ success: false, message: msg });
    }
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

// -------------------- LOGIN --------------------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "All fields required" });
  }
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    // Use a generic message to avoid user enumeration
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }
    const token = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, token, user: { user_id: user.user_id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("SQL error (login):", err);
    res.status(500).json({ success: false, message: "Login failed" });
  }
});

// -----------------------------
// Multer error handler middleware (must be defined before routes that use it)
function handleMulterError(err, req, res, next) {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ success: false, message: 'Image file too large. Maximum size is 10 MB.' });
  }
  if (err && err.message) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
}

// Add new recipe (with image upload)
app.post("/api/add-recipe", authenticateToken, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  const user_id = req.user.user_id;
  const { title, description, cooking_time, category_id, newCategory, ingredients, steps, image_url } = req.body;

  // Validate required fields
  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Recipe title is required' });
  }
  if (!cooking_time || isNaN(Number(cooking_time))) {
    return res.status(400).json({ success: false, message: 'Valid cooking time is required' });
  }


  let finalImageUrl = image_url || null;

  // Try uploading file to Supabase Storage if file is provided
  if (req.file) {
    try {
      const fileBuffer = req.file.buffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
      const supabasePublicUrl = await uploadRecipeImageToSupabase(
        fileBuffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (supabasePublicUrl) {
        finalImageUrl = supabasePublicUrl;
      } else {
        const filename = `${Date.now()}${path.extname(req.file.originalname || '')}`;
        try {
          if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
          fs.writeFileSync(path.join(uploadDir, filename), fileBuffer);
          finalImageUrl = `/images/${filename}`;
        } catch (localErr) {
          console.error("Local upload fallback failed:", localErr);
          if (req.file.filename) finalImageUrl = `/images/${req.file.filename}`;
        }
      }
    } catch (err) {
      console.error("Error processing file for upload:", err);
    }
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();
    let finalCategoryId = category_id;
    if (!category_id && newCategory) {
      const [catResult] = await conn.query("INSERT INTO categories (category_name) VALUES (?)", [newCategory]);
      finalCategoryId = catResult.insertId;
    }

    const [recipeResult] = await conn.query(
      `INSERT INTO recipes (user_id, category_id, title, description, cooking_time, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, finalCategoryId, title, description, cooking_time, finalImageUrl]
    );

    const recipeId = recipeResult.insertId;

    let parsedIngredients = [];
    let parsedSteps = [];
    try { parsedIngredients = JSON.parse(ingredients); } catch (err) { return res.status(400).json({ success: false, message: "Invalid ingredients format" }); }
    try { parsedSteps = JSON.parse(steps); } catch (err) { return res.status(400).json({ success: false, message: "Invalid steps format" }); }

    const insertedIngredients = new Set();
    for (const ing of parsedIngredients) {
      if (!ing.name || !ing.name.trim()) continue;
      const cleanName = ing.name.trim();

      const [existing] = await conn.query("SELECT ingredient_id FROM ingredients WHERE LOWER(ingredient_name) = LOWER(?)", [cleanName]);
      let ingredientId;
      if (existing.length > 0) {
        ingredientId = existing[0].ingredient_id;
      } else {
        const [newIng] = await conn.query("INSERT INTO ingredients (ingredient_name) VALUES (?)", [cleanName]);
        ingredientId = newIng.insertId;
      }

      if (!insertedIngredients.has(ingredientId)) {
        insertedIngredients.add(ingredientId);
        await conn.query(
          "INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)",
          [recipeId, ingredientId, ing.quantity || "1 unit"]
        );
      }
    }

    for (let i = 0; i < parsedSteps.length; i++) {
      const st = parsedSteps[i];
      const [stepInsert] = await conn.query("INSERT INTO step (instruction) VALUES (?)", [st.instruction]);
      const stepId = stepInsert.insertId;
      await conn.query("INSERT INTO recipe_steps (recipe_id, step_id, step_number) VALUES (?, ?, ?)", [recipeId, stepId, i + 1]);
    }

    await conn.commit();
    res.status(201).json({ success: true, message: "Recipe added successfully" });
  } catch (err) {
    await conn.rollback();
    console.error("SQL error (add recipe):", err);
    res.status(500).json({ success: false, message: 'Failed to add recipe' });
  } finally {
    conn.release();
    // Clean up temp file from disk after upload to Supabase
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.warn('Warning: could not delete temp file:', unlinkErr.message);
      });
    }
  }
});

// -----------------------------
// GET user's existing rating for a recipe
app.get('/api/recipes/:id/my-rating', authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  const user_id = req.user.user_id;

  if (!recipeId || isNaN(Number(recipeId))) {
    return res.status(400).json({ message: 'Invalid recipe ID' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT rating FROM ratings WHERE user_id = ? AND recipe_id = ?`,
      [Number(user_id), Number(recipeId)]
    );
    res.json({ rating: rows.length > 0 ? rows[0].rating : null });
  } catch (err) {
    console.error('SQL error (my-rating):', err);
    res.status(500).json({ message: 'Failed to fetch rating' });
  }
});

// -----------------------------
// POST rate (or update existing rating) for a recipe
app.post('/api/recipes/:id/rate', authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  const user_id = req.user.user_id;
  const { rating } = req.body;

  if (!recipeId || isNaN(Number(recipeId))) {
    return res.status(400).json({ message: 'Invalid recipe ID' });
  }
  const ratingNum = Number(rating);
  if (!rating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    // Verify recipe exists
    const [recipeRows] = await pool.query(
      `SELECT recipe_id FROM recipes WHERE recipe_id = ?`,
      [Number(recipeId)]
    );
    if (!recipeRows.length) {
      return res.status(404).json({ message: 'Recipe not found' });
    }

    // Upsert rating: one row per (user_id, recipe_id)
    await pool.query(
      `INSERT INTO ratings (user_id, recipe_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
      [Number(user_id), Number(recipeId), Math.round(ratingNum)]
    );

    // Return updated avg and count
    const [stats] = await pool.query(
      `SELECT COUNT(rating_id) AS total_ratings, AVG(rating) AS avg_rating
       FROM ratings WHERE recipe_id = ?`,
      [Number(recipeId)]
    );
    res.json({
      success: true,
      avg_rating: stats[0].avg_rating,
      total_ratings: stats[0].total_ratings,
    });
  } catch (err) {
    console.error('SQL error (rate):', err);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
});

// -----------------------------
// PUT update recipe (owner only)
app.put('/api/recipes/:id', authenticateToken, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) return handleMulterError(err, req, res, next);
    next();
  });
}, async (req, res) => {
  const recipeId = req.params.id;
  if (!recipeId || isNaN(Number(recipeId))) {
    return res.status(400).json({ success: false, message: 'Invalid recipe ID' });
  }

  const user_id = req.user.user_id;
  const { title, description, cooking_time, category_id, newCategory, ingredients, steps } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: 'Recipe title is required' });
  }
  if (!cooking_time || isNaN(Number(cooking_time))) {
    return res.status(400).json({ success: false, message: 'Valid cooking time is required' });
  }

  const conn = await pool.getConnection();
  try {
    // Ownership check — backend determines owner, never trust frontend claim alone
    const [recipeRows] = await conn.query(
      `SELECT user_id, image_url FROM recipes WHERE recipe_id = ?`,
      [Number(recipeId)]
    );
    if (!recipeRows.length) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }
    if (Number(recipeRows[0].user_id) !== Number(user_id)) {
      return res.status(403).json({ success: false, message: 'You do not own this recipe' });
    }


    // Handle image upload
    let finalImageUrl = recipeRows[0].image_url; // keep existing by default
    if (req.file) {
      try {
        const fileBuffer = req.file.buffer || (req.file.path ? fs.readFileSync(req.file.path) : null);
        const supabaseUrl = await uploadRecipeImageToSupabase(
          fileBuffer, req.file.originalname, req.file.mimetype
        );
        if (supabaseUrl) {
          finalImageUrl = supabaseUrl;
        } else {
          const filename = `${Date.now()}${path.extname(req.file.originalname || '')}`;
          try {
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
            fs.writeFileSync(path.join(uploadDir, filename), fileBuffer);
            finalImageUrl = `/images/${filename}`;
          } catch (localErr) {
            console.error("Local upload fallback failed:", localErr);
            if (req.file.filename) finalImageUrl = `/images/${req.file.filename}`;
          }
        }
      } catch (err) {
        console.error('Image upload error during edit:', err);
      }
    }

    await conn.beginTransaction();

    // Resolve category
    let finalCategoryId = category_id || null;
    if (!category_id && newCategory && newCategory.trim()) {
      const [catResult] = await conn.query(
        `INSERT INTO categories (category_name) VALUES (?)`, [newCategory.trim()]
      );
      finalCategoryId = catResult.insertId;
    }

    // Update recipe row
    await conn.query(
      `UPDATE recipes SET title=?, description=?, cooking_time=?, category_id=?, image_url=?
       WHERE recipe_id=?`,
      [title.trim(), description || '', Number(cooking_time), finalCategoryId, finalImageUrl, Number(recipeId)]
    );

    // Replace ingredients
    await conn.query(`DELETE FROM recipe_ingredients WHERE recipe_id = ?`, [Number(recipeId)]);

    let parsedIngredients = [];
    try { parsedIngredients = JSON.parse(ingredients); } catch (_) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Invalid ingredients format' });
    }

    const insertedIngredients = new Set();
    for (const ing of parsedIngredients) {
      if (!ing.name || !ing.name.trim()) continue;
      const cleanName = ing.name.trim();
      const [existing] = await conn.query(
        `SELECT ingredient_id FROM ingredients WHERE LOWER(ingredient_name) = LOWER(?)`, [cleanName]
      );
      let ingredientId;
      if (existing.length > 0) {
        ingredientId = existing[0].ingredient_id;
      } else {
        const [newIng] = await conn.query(
          `INSERT INTO ingredients (ingredient_name) VALUES (?)`, [cleanName]
        );
        ingredientId = newIng.insertId;
      }
      if (!insertedIngredients.has(ingredientId)) {
        insertedIngredients.add(ingredientId);
        await conn.query(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)`,
          [Number(recipeId), ingredientId, ing.quantity || '1 unit']
        );
      }
    }

    // Replace steps: delete old recipe_steps rows and their orphaned step rows
    const [oldStepLinks] = await conn.query(
      `SELECT step_id FROM recipe_steps WHERE recipe_id = ?`, [Number(recipeId)]
    );
    await conn.query(`DELETE FROM recipe_steps WHERE recipe_id = ?`, [Number(recipeId)]);
    for (const { step_id } of oldStepLinks) {
      await conn.query(`DELETE FROM step WHERE step_id = ?`, [step_id]);
    }

    let parsedSteps = [];
    try { parsedSteps = JSON.parse(steps); } catch (_) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Invalid steps format' });
    }

    for (let i = 0; i < parsedSteps.length; i++) {
      const st = parsedSteps[i];
      if (!st.instruction || !st.instruction.trim()) continue;
      const [stepInsert] = await conn.query(
        `INSERT INTO step (instruction) VALUES (?)`, [st.instruction.trim()]
      );
      await conn.query(
        `INSERT INTO recipe_steps (recipe_id, step_id, step_number) VALUES (?, ?, ?)`,
        [Number(recipeId), stepInsert.insertId, i + 1]
      );
    }

    await conn.commit();
    res.json({ success: true, message: 'Recipe updated successfully', image_url: finalImageUrl });
  } catch (err) {
    await conn.rollback();
    console.error('SQL error (update recipe):', err);
    res.status(500).json({ success: false, message: 'Failed to update recipe' });
  } finally {
    conn.release();
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.warn('Warning: could not delete temp file:', unlinkErr.message);
      });
    }
  }
});

// -----------------------------
// DELETE recipe (owner only)
app.delete('/api/recipes/:id', authenticateToken, async (req, res) => {
  const recipeId = req.params.id;
  const user_id = req.user.user_id;

  if (!recipeId || isNaN(Number(recipeId))) {
    return res.status(400).json({ success: false, message: 'Invalid recipe ID' });
  }

  const conn = await pool.getConnection();
  try {
    // Ownership check — backend determines owner using verified JWT identity
    const [recipeRows] = await conn.query(
      `SELECT user_id, image_url FROM recipes WHERE recipe_id = ?`,
      [Number(recipeId)]
    );

    if (!recipeRows.length) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }
    if (Number(recipeRows[0].user_id) !== Number(user_id)) {
      return res.status(403).json({ success: false, message: 'You do not own this recipe' });
    }

    const imageUrl = recipeRows[0].image_url;

    await conn.beginTransaction();

    // Delete step rows linked to this recipe, then recipe_steps links
    const [stepLinks] = await conn.query(
      `SELECT step_id FROM recipe_steps WHERE recipe_id = ?`, [Number(recipeId)]
    );
    await conn.query(`DELETE FROM recipe_steps WHERE recipe_id = ?`, [Number(recipeId)]);
    for (const { step_id } of stepLinks) {
      await conn.query(`DELETE FROM step WHERE step_id = ?`, [step_id]);
    }

    // Delete related rows
    await conn.query(`DELETE FROM recipe_ingredients WHERE recipe_id = ?`, [Number(recipeId)]);
    await conn.query(`DELETE FROM ratings WHERE recipe_id = ?`, [Number(recipeId)]);
    await conn.query(`DELETE FROM favorites WHERE recipe_id = ?`, [Number(recipeId)]);
    await conn.query(`DELETE FROM comments WHERE recipe_id = ?`, [Number(recipeId)]);

    // Delete the recipe itself
    await conn.query(`DELETE FROM recipes WHERE recipe_id = ?`, [Number(recipeId)]);

    await conn.commit();

    // Best-effort Supabase image cleanup (outside transaction, non-fatal)
    if (imageUrl) {
      deleteRecipeImageFromSupabase(imageUrl).catch((err) =>
        console.warn('Non-fatal: could not delete Supabase image:', err?.message)
      );
    }

    res.json({ success: true, message: 'Recipe deleted successfully' });
  } catch (err) {
    await conn.rollback();
    console.error('SQL error (delete recipe):', err);
    res.status(500).json({ success: false, message: 'Failed to delete recipe' });
  } finally {
    conn.release();
  }
});

// -----------------------------
// Server Export / Startup
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  console.log('✅ Express server started');
}

export default app;


