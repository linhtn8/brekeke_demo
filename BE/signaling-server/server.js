const fs = require('fs');
const http = require('http');
const path = require('path');
const WebSocket = require('ws');
const {
  closeDatabase,
  createNewUser,
  deleteExistingUser,
  getAllUsers,
  getTenantUsers,
  loginUserByCredentials,
  markUserOffline,
  updateExistingUser,
  validateRegisterUser,
  waitForDatabase,
} = require('./services/usersServices');

const PORT = process.env.PORT || 8080;
const ADMIN_PAGE_PATH = path.join(__dirname, 'public', 'admin.html');
const users = new Map();

function sendToUser(userId, message) {
  const ws = users.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

/**
 * Broadcast to all users except sender
 * @param {string} senderId - Sender user ID
 * @param {object} message - Message object
 */
function broadcastExcept(senderId, message) {
  users.forEach((ws, userId) => {
    if (userId !== senderId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

/**
 * Get list of online users
 * @returns {string[]} - Array of user IDs
 */
function getOnlineUsers() {
  return Array.from(users.keys());
}

/**
 * Log with timestamp
 * @param {string} message - Log message
 */
function log(message) {
  const timestamp = new Date().toISOString().substr(11, 8);
  console.log(`[${timestamp}] ${message}`);
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, html) {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
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

async function handleApiRequest(req, res, pathname) {
  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const payload = await readRequestBody(req);
    const authenticatedUser = await loginUserByCredentials(
      payload.userName,
      payload.password,
    );
    sendJson(res, 200, authenticatedUser);
    return true;
  }

  if (req.method === 'GET' && pathname === '/api/users') {
    const allUsers = await getAllUsers();
    sendJson(res, 200, allUsers);
    return true;
  }

  const tenantUsersMatch = pathname.match(/^\/api\/tenants\/([^/]+)\/users$/);
  if (req.method === 'GET' && tenantUsersMatch) {
    const tenant = decodeURIComponent(tenantUsersMatch[1]);
    const tenantUsers = await getTenantUsers(tenant);
    sendJson(res, 200, tenantUsers);
    return true;
  }

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

  if (req.method === 'PUT') {
    const payload = await readRequestBody(req);
    const updatedUser = await updateExistingUser(userId, payload);
    sendJson(res, 200, updatedUser);
    return true;
  }

  if (req.method === 'DELETE') {
    const deletedUser = await deleteExistingUser(userId);
    users.delete(userId);
    sendJson(res, 200, deletedUser);
    return true;
  }

  return false;
}

async function handleRegister(ws, message) {
  if (!message.userId) {
    ws.send(JSON.stringify({
      type: 'error',
      code: 'MISSING_USER_ID',
      message: 'userId is required',
      timestamp: Date.now(),
    }));
    return null;
  }

  let dbUser;
  try {
    dbUser = await validateRegisterUser(message);
  } catch (error) {
    ws.send(JSON.stringify({
      type: 'error',
      code: error.code || 'INVALID_MESSAGE',
      message: error.message,
      timestamp: Date.now(),
    }));
    return null;
  }

  const { password, ...safeUser } = dbUser;
  users.set(dbUser.id, ws);

  log(`✅ User registered: ${dbUser.userName} (${dbUser.displayName})`);
  log(`📊 Online users (${users.size}): ${getOnlineUsers().join(', ') || 'none'}`);

  ws.send(JSON.stringify({
    type: 'register-success',
    userId: dbUser.id,
    user: safeUser,
    onlineUsers: getOnlineUsers().filter((id) => id !== dbUser.id),
    timestamp: Date.now(),
  }));

  broadcastExcept(dbUser.id, {
    type: 'user-online',
    userId: dbUser.id,
    userName: dbUser.userName,
    displayName: dbUser.displayName,
    timestamp: Date.now(),
  });

  return dbUser.id;
}

function handleWebSocketConnection(wss) {
  // ============================================
  // WebSocket Server Event Handlers
  // ============================================
  wss.on('connection', (ws) => {
    log('New client connected');

    let currentUserId = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        log(`Received: ${message.type} from ${currentUserId || 'unknown'}`);

        switch (message.type) {
          // ============================================
          // USER REGISTRATION
          // ============================================
          case 'register': {
            const registeredUserId = await handleRegister(ws, message);
            if (registeredUserId) {
              currentUserId = registeredUserId;
            }
            break;
          }

          // ============================================
          // CALL OFFER
          // ============================================
          case 'call-offer': {
            const { to: receiver, offer, callerName } = message;

            log(`📞 Call offer: ${currentUserId} → ${receiver}`);

            if (!users.has(receiver)) {
              log(`❌ Receiver offline: ${receiver}`);
              ws.send(JSON.stringify({
                type: 'user-offline',
                userId: receiver,
                timestamp: Date.now(),
              }));
              return;
            }

            const sent = sendToUser(receiver, {
              type: 'incoming-call',
              from: currentUserId,
              fromName: callerName,
              offer,
              timestamp: Date.now(),
            });

            if (!sent) {
              log(`❌ Failed to send offer to ${receiver}`);
              ws.send(JSON.stringify({
                type: 'error',
                code: 'SEND_FAILED',
                message: 'Failed to send call offer',
                timestamp: Date.now(),
              }));
            } else {
              log(`✅ Offer forwarded to ${receiver}`);
            }
            break;
          }

          // ============================================
          // CALL ANSWER
          // ============================================
          case 'call-answer': {
            log(`✅ Call answered: ${currentUserId} → ${message.to}`);

            const answerSent = sendToUser(message.to, {
              type: 'call-answer',
              from: currentUserId,
              answer: message.answer,
              timestamp: Date.now(),
            });

            if (answerSent) {
              log(`✅ Answer forwarded to ${message.to}`);
            } else {
              log(`❌ Failed to forward answer to ${message.to}`);
            }
            break;
          }

          // ============================================
          // ICE CANDIDATE
          // ============================================
          case 'ice-candidate':
            log(`🧊 ICE candidate: ${currentUserId} → ${message.to}`);
            sendToUser(message.to, {
              type: 'ice-candidate',
              from: currentUserId,
              candidate: message.candidate,
              timestamp: Date.now(),
            });
            break;

          // ============================================
          // CALL REJECTED
          // ============================================
          case 'call-rejected':
            log(`❌ Call rejected: ${currentUserId} → ${message.to} (${message.reason || 'no reason'})`);
            sendToUser(message.to, {
              type: 'call-rejected',
              from: currentUserId,
              reason: message.reason,
              timestamp: Date.now(),
            });
            break;

          // ============================================
          // CALL ENDED
          // ============================================
          case 'call-ended':
            log(`📴 Call ended: ${currentUserId} → ${message.to}`);
            sendToUser(message.to, {
              type: 'call-ended',
              from: currentUserId,
              timestamp: Date.now(),
            });
            break;

          // ============================================
          // UNKNOWN MESSAGE TYPE
          // ============================================
          default:
            log(`⚠️  Unknown message type: ${message.type}`);
            ws.send(JSON.stringify({
              type: 'error',
              code: 'UNKNOWN_MESSAGE_TYPE',
              message: `Unknown message type: ${message.type}`,
              timestamp: Date.now(),
            }));
        }
      } catch (error) {
        log(`❌ Error processing message: ${error.message}`);
        ws.send(JSON.stringify({
          type: 'error',
          code: 'INVALID_MESSAGE',
          message: error.message,
          timestamp: Date.now(),
        }));
      }
    });

    ws.on('close', async () => {
      if (currentUserId) {
        log(`👋 User disconnected: ${currentUserId}`);
        users.delete(currentUserId);

        try {
          await markUserOffline(currentUserId);
        } catch (error) {
          log(`❌ Failed to update user offline status: ${error.message}`);
        }

        broadcastExcept(currentUserId, {
          type: 'user-offline',
          userId: currentUserId,
          timestamp: Date.now(),
        });

        log(`📊 Online users (${users.size}): ${getOnlineUsers().join(', ') || 'none'}`);
      } else {
        log('👋 Unregistered client disconnected');
      }
    });

    ws.on('error', (error) => {
      log(`❌ WebSocket error: ${error.message}`);
    });
  });
}

async function startServer() {
  await waitForDatabase();

  const adminPage = fs.readFileSync(ADMIN_PAGE_PATH, 'utf8');
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = new URL(req.url, `http://${req.headers.host}`);
      const pathname = requestUrl.pathname;

      setCorsHeaders(res);

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      if (pathname.startsWith('/api/')) {
        const handled = await handleApiRequest(req, res, pathname);
        if (!handled) {
          sendJson(res, 404, { message: 'API route not found' });
        }
        return;
      }

      if ((req.method === 'GET' || req.method === 'HEAD') && (pathname === '/' || pathname === '/admin')) {
        if (req.method === 'HEAD') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end();
          return;
        }

        sendHtml(res, adminPage);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (error) {
      handleDatabaseError(res, error);
    }
  });

  const wss = new WebSocket.Server({ server });
  handleWebSocketConnection(wss);

  server.listen(PORT, () => {
    console.log(`🚀 BAP Signaling Server started on port ${PORT}`);
    console.log(`🌐 Admin page: http://localhost:${PORT}/admin`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log('─'.repeat(50));
  });

  // ============================================
  // Server Error Handler
  // ============================================
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
  });
}

async function shutdown() {
  console.log('\n🛑 Shutting down server...');

  // Notify all connected users
  users.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'server-shutdown',
        message: 'Server is shutting down',
        timestamp: Date.now(),
      }));
      ws.close();
    }
  });

  // Close WebSocket server
  await new Promise(resolve => wss.close(resolve));

  // Close database
  await closeDatabase();

  console.log('✅ Shutdown complete');
  process.exit(0);
}

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

startServer().catch(async (error) => {
  console.error('❌ Failed to start server:', error.message);
  await closeDatabase();
  process.exit(1);
});

// ============================================
// Status Logging (every 30 seconds)
// ============================================

setInterval(() => {
  log(`📊 Status: ${users.size} users online - ${getOnlineUsers().join(', ') || 'none'}`);
}, 30000);

log('📡 Signaling server is ready for connections');
