const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'signaling_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function waitForDatabase(maxAttempts = 10, delayMs = 3000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await pool.query('SELECT 1');
      return;
    } catch (error) {
      if (attempt === maxAttempts) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  closeDatabase,
  pool,
  waitForDatabase,
};
