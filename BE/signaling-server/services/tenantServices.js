const {
    createTenant,
    deleteTenant,
    getTenantById,
    listTenants,
    updateTenant,
} = require('../repository/tenantRepository');

const {
    deleteUsersByTenant,
} = require('../repository/usersRepository');

function normalizeTenantPayload(payload, {requireTenantId = false} = {}) {
    const normalized = {
        tenantId: payload.tenantId ? String(payload.tenantId).trim() : '',
        tenantName: payload.tenantName ? String(payload.tenantName).trim() : '',
        hostName: payload.hostName ? String(payload.hostName).trim() : '',
        port: payload.port ? String(payload.port).trim() : '',
    };

    const requiredFields = ['tenantName', 'hostName', 'port'];
    if (requireTenantId) {
        requiredFields.unshift('tenantId');
    }

    const missingField = requiredFields.find((field) => !normalized[field]);
    if (missingField) {
        const error = new Error(`${missingField} is required`);
        error.statusCode = 400;
        throw error;
    }

    return normalized;
}

async function getAllTenants() {
    return listTenants();
}

async function getTenantDetail(tenantId) {
    const normalizedTenantId = String(tenantId || '').trim();
    if (!normalizedTenantId) {
        const error = new Error('tenantId is required');
        error.statusCode = 400;
        throw error;
    }

    const tenant = await getTenantById(normalizedTenantId);
    if (!tenant) {
        const error = new Error(`Tenant ${normalizedTenantId} not found`);
        error.statusCode = 404;
        throw error;
    }

    return tenant;
}

async function createNewTenant(payload) {
    const tenant = normalizeTenantPayload(payload);

    return createTenant(tenant);
}

async function updateExistingTenant(tenantId, payload) {
    const existingTenant = await getTenantById(tenantId);
    if (!existingTenant) {
        const error = new Error(`Tenant ${tenantId} not found`);
        error.statusCode = 404;
        throw error;
    }

    const tenant = normalizeTenantPayload({...payload, tenantId}, {requireTenantId: true});
    return updateTenant(tenantId, tenant);
}

async function deleteExistingTenant(tenantId) {
    // delete users by tenant
    const deletedTenantUsers = await deleteUsersByTenant(tenantId);


    const deletedTenant = await deleteTenant(tenantId);
    if (!deletedTenant) {
        const error = new Error(`Tenant ${tenantId} not found`);
        error.statusCode = 404;
        throw error;
    }

    return deletedTenantUsers;
}

module.exports = {
    createNewTenant,
    deleteExistingTenant,
    getAllTenants,
    getTenantDetail,
    updateExistingTenant,
};
