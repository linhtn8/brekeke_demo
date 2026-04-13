const {pool} = require('../db_config');

function mapTenant(row) {
    if (!row) {
        return null;
    }

    return {
        tenantId: row.tenantId,
        tenantName: row.tenantName,
        hostName: row.hostName,
        port: row.port,
    };
}

async function getTenantById(tenantId) {
    const result = await pool.query(
        `SELECT tenant_id   AS "tenantId",
                tenant_name AS "tenantName",
                host_name   AS "hostName",
                port
         FROM tenants
         WHERE tenant_id = $1`,
        [tenantId]
    );

    return mapTenant(result.rows[0]);
}

async function listTenants() {
    const result = await pool.query(
        `SELECT tenant_id   AS "tenantId",
                tenant_name AS "tenantName",
                host_name   AS "hostName",
                port
         FROM tenants
         ORDER BY tenant_id ASC`
    );

    return result.rows.map(mapTenant);
}

async function createTenant(tenant) {
    const result = await pool.query(
        `INSERT INTO tenants (tenant_name,
                              host_name,
                              port)
         VALUES ($1, $2, $3) RETURNING
      tenant_id AS "tenantId",
      tenant_name AS "tenantName",
      host_name AS "hostName",
      port`,
        [tenant.tenantName, tenant.hostName, tenant.port]
    );

    return mapTenant(result.rows[0]);
}

async function updateTenant(tenantId, tenant) {
    const result = await pool.query(
        `UPDATE tenants
         SET tenant_name = $2,
             host_name   = $3,
             port        = $4,
             updated_at  = NOW()
         WHERE tenant_id = $1 RETURNING
      tenant_id AS "tenantId",
      tenant_name AS "tenantName",
      host_name AS "hostName",
      port`,
        [tenantId, tenant.tenantName, tenant.hostName, tenant.port]
    );

    return mapTenant(result.rows[0]);
}

async function deleteTenant(tenantId) {
    const result = await pool.query(
        `DELETE
         FROM tenants
         WHERE tenant_id = $1 RETURNING
      tenant_id AS "tenantId",
      tenant_name AS "tenantName",
      host_name AS "hostName",
      port`,
        [tenantId]
    );

    return mapTenant(result.rows[0]);
}

module.exports = {
    createTenant,
    deleteTenant,
    getTenantById,
    listTenants,
    mapTenant,
    updateTenant,
};
