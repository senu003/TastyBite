// db.js
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Create a connection pool using environment variables
const sslConfig =
  process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('aivencloud.com')
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true' }
    : undefined;

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tastybite',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  ssl: sslConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

console.log('✅ MySQL pool created');

export default pool;

