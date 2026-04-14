const {closeDatabase, pool, waitForDatabase} = require('../db_config');

function mapUser(row) {
    if (!row) {
        return null;
    }

    return {
        userId: row.userId,
        userName: row.userName,
        password: row.password,
        displayName: row.displayName,
        phone: row.phone,
        tenant: row.tenant,
        status: row.status,
        isActive: row.isActive,
    };
}

async function getUserById(user_id) {
    const result = await pool.query(
        `SELECT user_id,
                user_name    AS "userName",
                password,
                display_name AS "displayName",
                phone,
                tenant,
                status,
                is_active    AS "isActive"
         FROM users
         WHERE user_id = $1`,
        [user_id]
    );

    return mapUser(result.rows[0]);
}

async function listUsers() {
    const result = await pool.query(
        `SELECT user_id,
                user_name    AS "userName",
                password,
                display_name AS "displayName",
                phone,
                tenant,
                status,
                is_active    AS "isActive"
         FROM users
         ORDER BY user_id ASC`
    );

    return result.rows.map(mapUser);
}

async function listUsersByTenant(tenant) {
    const result = await pool.query(
        `SELECT user_id      AS "userId",
                user_name    AS "userName",
                password,
                display_name AS "displayName",
                phone,
                tenant,
                status,
                is_active    AS "isActive"
         FROM users
         WHERE tenant = $1
         ORDER BY user_id ASC`,
        [tenant]
    );
    return result.rows.map(mapUser);
}

async function getUserByUserName(userName) {
    const result = await pool.query(
        `SELECT user_id,
                user_name    AS "userName",
                password,
                display_name AS "displayName",
                phone,
                tenant,
                status,
                is_active    AS "isActive"
         FROM users
         WHERE user_name = $1`,
        [userName]
    );

    return mapUser(result.rows[0]);
}

async function createUser(user) {
    const result = await pool.query(
        `INSERT INTO users (user_name,
                            password,
                            display_name,
                            phone,
                            tenant,
                            status,
                            is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING
      user_id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"`,
        [
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
         SET user_name    = $2,
             password     = $3,
             display_name = $4,
             phone        = $5,
             tenant       = $6,
             status       = $7,
             is_active    = $8,
             updated_at   = NOW()
         WHERE user_id = $1 RETURNING
      user_id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"`,
        [
            user_id,
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
        `DELETE
         FROM users
         WHERE user_id = $1 RETURNING
      user_id,
      user_name AS "userName",
      password,
      display_name AS "displayName",
      phone,
      tenant,
      status,
      is_active AS "isActive"`,
        [user_id]
    );

    return mapUser(result.rows[0]);
}

async function deleteUsersByTenant(tenantId) {
    const result = await pool.query(
        `DELETE
         FROM users
         WHERE tenant = $1`,
        [tenantId]
    );
    return result.rowCount;
}

module.exports = {
    closeDatabase,
    createUser,
    deleteUser,
    deleteUsersByTenant,
    getUserById,
    getUserByUserName,
    listUsers,
    listUsersByTenant,
    mapUser,
    updateUser,
    waitForDatabase,
};
