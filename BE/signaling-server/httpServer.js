const fs = require('fs');
const path = require('path');

const ADMIN_PAGE_PATH = path.join(__dirname, 'public', 'admin.html');
const TENANT_DETAIL_PAGE_PATH = path.join(__dirname, 'public', 'tenant_detail.html');

const {
    createNewUser,
    deleteExistingUser,
    getAllUsers,
    getTenantUsers,
    loginUserByCredentials,
    updateExistingUser,
} = require('./services/usersServices');
const {
    createNewTenant,
    deleteExistingTenant,
    getAllTenants,
    getTenantDetail,
    updateExistingTenant,
} = require('./services/tenantServices');

function sendJson(res, statusCode, payload) {
    res.writeHead(statusCode, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(payload));
}

function sendHtml(res, html) {
    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
    res.end(html);
}

function setCorsHeaders(res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function readRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk) => {
            body += chunk.toString();
            if (body.length > 1_000_000) {
                const error = new Error('Payload too large');
                error.statusCode = 413;
                reject(error);
                req.destroy();
            }
        });

        req.on('end', () => {
            if (!body) {
                resolve({});
                return;
            }

            try {
                resolve(JSON.parse(body));
            } catch (error) {
                error.statusCode = 400;
                reject(error);
            }
        });

        req.on('error', reject);
    });
}

async function handleApiRequest(req, res, pathname) {
    // User login
    if (req.method === 'POST' && pathname === '/api/auth/login') {
        const payload = await readRequestBody(req);
        const authenticatedUser = await loginUserByCredentials(
            payload.userName,
            payload.password,
        );
        sendJson(res, 200, authenticatedUser);
        return true;
    }

    // List users
    if (req.method === 'GET' && pathname === '/api/users') {
        const users = await getAllUsers();
        sendJson(res, 200, users);
        return true;
    }

    // List tenants
    if (req.method === 'GET' && pathname === '/api/tenants') {
        const tenants = await getAllTenants();
        sendJson(res, 200, tenants);
        return true;
    }

    // Create tenant
    if (req.method === 'POST' && pathname === '/api/tenants') {
        const payload = await readRequestBody(req);
        const createdTenant = await createNewTenant(payload);
        sendJson(res, 201, createdTenant);
        return true;
    }

    const tenantIdMatch = pathname.match(/^\/api\/tenants\/([^/]+)$/);
    if (tenantIdMatch) {
        const tenantId = decodeURIComponent(tenantIdMatch[1]);

        // Get tenant detail
        if (req.method === 'GET') {
            const tenant = await getTenantDetail(tenantId);
            sendJson(res, 200, tenant);
            return true;
        }

        // Edit tenant
        if (req.method === 'PUT') {
            const payload = await readRequestBody(req);
            const updatedTenant = await updateExistingTenant(tenantId, payload);
            sendJson(res, 200, updatedTenant);
            return true;
        }

        // Delete tenant
        if (req.method === 'DELETE') {
            const deletedTenant = await deleteExistingTenant(tenantId);
            sendJson(res, 200, deletedTenant);
            return true;
        }
    }

    const tenantUsersMatch = pathname.match(/^\/api\/tenants\/([^/]+)\/users$/);
    // Get users in a tenant
    if (req.method === 'GET' && tenantUsersMatch) {
        const tenantId = decodeURIComponent(tenantUsersMatch[1]);
        const tenantUsers = await getTenantUsers(tenantId);
        sendJson(res, 200, tenantUsers);
        return true;
    }

    // Create user
    if (req.method === 'POST' && pathname === '/api/users') {
        const payload = await readRequestBody(req);
        const createdUser = await createNewUser(payload);
        sendJson(res, 201, createdUser);
        return true;
    }

    const userIdMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
    if (!userIdMatch) {
        return false;
    }

    const userId = decodeURIComponent(userIdMatch[1]);
    // Edit user
    if (req.method === 'PUT') {
        const payload = await readRequestBody(req);
        const updatedUser = await updateExistingUser(userId, payload);
        sendJson(res, 200, updatedUser);
        return true;
    }

    // Delete user
    if (req.method === 'DELETE') {
        const deletedUser = await deleteExistingUser(userId);
        users.delete(userId);
        sendJson(res, 200, deletedUser);
        return true;
    }

    return false;
}

function createHttpServer(http) {
    return http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const pathname = url.pathname;

            setCorsHeaders(res);

            if (req.method === 'OPTIONS') {
                res.writeHead(204);
                res.end();
                return;
            }

            if (pathname.startsWith('/api/')) {
                const handled = await handleApiRequest(req, res, pathname);
                if (!handled) {
                    sendJson(res, 404, {message: 'API route not found'});
                }
                return;
            }


            if ((req.method === 'GET' || req.method === 'HEAD') && (pathname === '/' || pathname === '/admin' || pathname === '/admin.html')) {
                if (req.method === 'HEAD') {
                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end();
                    return;
                }

                const adminPage = fs.readFileSync(ADMIN_PAGE_PATH, 'utf8');
                sendHtml(res, adminPage);
                return;
            }

            if ((req.method === 'GET' || req.method === 'HEAD') && (pathname === '/tenant_detail' || pathname === '/tenant_detail.html')) {
                if (req.method === 'HEAD') {
                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end();
                    return;
                }

                const tenantDetailPage = fs.readFileSync(TENANT_DETAIL_PAGE_PATH, 'utf8');
                sendHtml(res, tenantDetailPage);
                return;
            }

            res.writeHead(404);
            res.end('Not found');
        } catch (error) {
            handleDatabaseError(res, error);
        }
    });
}

function handleDatabaseError(res, error) {
    if (error.code === '23505') {
        sendJson(res, 409, {
            message: 'User ID or phone already exists',
        });
        return;
    }

    const statusCode = error.statusCode || 500;
    sendJson(res, statusCode, {
        message: error.message || 'Internal server error',
    });
}

module.exports = {
    createHttpServer,
};