const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'signaling_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    userName: row.userName,
    password: row.password,
    displayName: row.displayName,
    phone: row.phone,
    tenant: row.tenant,
    status: row.status,
    isActive: row.isActive,
  };
}

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

async function getUserById(id) {
  const result = await pool.query(
    `SELECT
      id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"
    FROM users
    WHERE id = $1`,
    [id]
  );

  return mapUser(result.rows[0]);
}

async function listUsers() {
  const result = await pool.query(
    `SELECT
      id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"
    FROM users
    ORDER BY id ASC`
  );

  return result.rows.map(mapUser);
}

async function listUsersByTenant(tenant) {
  const result = await pool.query(
    `SELECT
      id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"
    FROM users
    WHERE tenant = $1
    ORDER BY id ASC`,
    [tenant]
  );

  return result.rows.map(mapUser);
}

async function getUserByUserName(userName) {
  const result = await pool.query(
    `SELECT
      id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"
    FROM users
    WHERE user_name = $1`,
    [userName]
  );

  return mapUser(result.rows[0]);
}

async function getNextUserId() {
  const result = await pool.query(
    `SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) + 1 AS next_id
    FROM users
    WHERE id ~ '^[0-9]+$'`
  );

  return String(result.rows[0].next_id);
}

async function createUser(user) {
  const result = await pool.query(
    `INSERT INTO users (
      id,
      user_name,
      password,
      display_name,
      phone,
      tenant,
      status,
      is_active
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"`,
    [
      user.id,
      user.userName,
      user.password,
      user.displayName,
      user.phone,
      user.tenant,
      user.status,
      user.isActive,
    ]
  );

  return mapUser(result.rows[0]);
}

async function updateUser(id, user) {
  const result = await pool.query(
    `UPDATE users
    SET
      user_name = $2,
      password = $3,
      display_name = $4,
      phone = $5,
      tenant = $6,
      status = $7,
      is_active = $8,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"`,
    [
      id,
      user.userName,
      user.password,
      user.displayName,
      user.phone,
      user.tenant,
      user.status,
      user.isActive,
    ]
  );

  return mapUser(result.rows[0]);
}

async function deleteUser(id) {
  const result = await pool.query(
    `DELETE FROM users
    WHERE id = $1
    RETURNING
      id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"`,
    [id]
  );

  return mapUser(result.rows[0]);
}

async function closeDatabase() {
  await pool.end();
}

module.exports = {
  closeDatabase,
  createUser,
  deleteUser,
  getNextUserId,
  getUserById,
  getUserByUserName,
  listUsers,
  listUsersByTenant,
  mapUser,
  updateUser,
  waitForDatabase,
};
