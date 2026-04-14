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
const {
  createNewTenant,
  deleteExistingTenant,
  getAllTenants,
  getTenantDetail,
  updateExistingTenant,
} = require('./services/tenantServices');

// FEATURE FLAG CHO PHASE 3
const ENABLE_PUSH_NOTIFICATIONS = true;

// Only require 'apn' if feature flag is true, to prevent errors if apn is not installed or configured
let apn = null;
if (ENABLE_PUSH_NOTIFICATIONS) {
  try {
    apn = require('apn');
  } catch (e) {
    console.error('⚠️ [Feature Flag] apn module not found. Push Notifications will be disabled.');
  }
}

// Configuration
const PORT = process.env.PORT || 8080;
const ADMIN_PAGE_PATH = path.join(__dirname, 'public', 'admin.html');
const TENANT_DETAIL_PAGE_PATH = path.join(__dirname, 'public', 'tenant_detail.html');
const users = new Map();
// Store user APNs tokens: { userId: apnsToken }
const userTokens = new Map();
// Store active calls to handle timeouts and cancelations: { receiverId: { uuid, callerId, timeout, offer, callerName } }
const activeCalls = new Map();

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 BAP Signaling Server started on port ${PORT}`);
console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
console.log('─'.repeat(50));

// ============================================
// APNs (Apple Push Notification) Setup
// ============================================
let apnProvider = null;

if (ENABLE_PUSH_NOTIFICATIONS && apn) {
  try {
    // TODO: Replace with actual Team ID, Key ID, and Auth Key path
    const options = {
      token: {
        key: './certs/AuthKey_L293HL7P3R.p8', // Path to .p8 file
        keyId: 'L293HL7P3R',     // 10-character Key ID
        teamId: 'SUG49M587C'    // 10-character Team ID
      },
      production: false // true for production, false for development
    };

    if (fs.existsSync(options.token.key)) {
      apnProvider = new apn.Provider(options);
      console.log('🍏 APNs Provider initialized successfully.');
    } else {
      console.log('⚠️ APNs Auth Key (.p8) not found. VoIP Push will be disabled.');
      console.log('   -> Please update the .p8 file path and IDs in server.js');
    }
  } catch (err) {
    console.error('❌ Failed to initialize APNs Provider:', err.message);
  }
} else {
  console.log('ℹ️ [Feature Flag] Push Notifications are DISABLED. Flow Phase 2 is unaffected.');
}

// ============================================
// Helper Functions
// ============================================

/**
 * Send VoIP Push Notification
 */
function sendVoIPPush(userId, callerId, callerName, isCancel = false, callUuid = null) {
  if (!ENABLE_PUSH_NOTIFICATIONS) return false;

  if (!apnProvider) {
    log(`⚠️ Cannot send VoIP push to ${userId}: APNs Provider not configured.`);
    return false;
  }

  const token = userTokens.get(userId);
  if (!token) {
    log(`⚠️ Cannot send VoIP push to ${userId}: No APNs token registered.`);
    return false;
  }

  const notification = new apn.Notification();
  notification.topic = 'com.bap.phone.voip'; // Must match your bundle ID + .voip
  notification.payload = {
    uuid: callUuid || require('uuid').v4(), // Use existing UUID for cancel, or generate new
    callerName: callerName || callerId,
    callerId: callerId,
    hasVideo: false,
    type: isCancel ? 'call-cancel' : 'call-offer'
  };

  apnProvider.send(notification, token).then((result) => {
    if (result.sent.length > 0) {
      log(`🍏✅ VoIP Push (${isCancel ? 'CANCEL' : 'OFFER'}) successfully sent to ${userId}`);
    }
    if (result.failed.length > 0) {
      result.failed.forEach(failure => {
        log(`🍏❌ VoIP Push failed to ${userId}: ${failure.error?.message || failure.response?.reason}`);
      });
    }
  });

  return notification.payload.uuid;
}

/**
 * Clear call timeout if answered/rejected/ended
 */
function clearCallTimeout(receiverId) {
  if (activeCalls.has(receiverId)) {
    const callData = activeCalls.get(receiverId);
    clearTimeout(callData.timeout);
    activeCalls.delete(receiverId);
    log(`⏱️ Call timeout cleared for ${receiverId}`);
  }
}

/**
 * Send message to specific user
 * @param {string} userId - Target user ID
 * @param {object} message - Message object
 * @returns {boolean} - Success status
 */
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

  if (req.method === 'GET' && pathname === '/api/tenants') {
    const allTenants = await getAllTenants();
    sendJson(res, 200, allTenants);
    return true;
  }

  if (req.method === 'POST' && pathname === '/api/tenants') {
    const payload = await readRequestBody(req);
    const createdTenant = await createNewTenant(payload);
    sendJson(res, 201, createdTenant);
    return true;
  }

  const tenantIdMatch = pathname.match(/^\/api\/tenants\/([^/]+)$/);
  if (tenantIdMatch) {
    const tenantId = decodeURIComponent(tenantIdMatch[1]);

    if (req.method === 'GET') {
      const tenant = await getTenantDetail(tenantId);
      sendJson(res, 200, tenant);
      return true;
    }

    if (req.method === 'PUT') {
      const payload = await readRequestBody(req);
      const updatedTenant = await updateExistingTenant(tenantId, payload);
      sendJson(res, 200, updatedTenant);
      return true;
    }

    if (req.method === 'DELETE') {
      const deletedTenant = await deleteExistingTenant(tenantId);
      sendJson(res, 200, deletedTenant);
      return true;
    }
  }

  const tenantUsersMatch = pathname.match(/^\/api\/tenants\/([^/]+)\/users$/);
  if (req.method === 'GET' && tenantUsersMatch) {
    const tenantId = decodeURIComponent(tenantUsersMatch[1]);
    const tenantUsers = await getTenantUsers(tenantId);
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
        case 'register':
          currentUserId = message.userId;
          users.set(currentUserId, ws);
          
          if (ENABLE_PUSH_NOTIFICATIONS && message.apnsToken) {
            userTokens.set(currentUserId, message.apnsToken);
            log(`🍏 APNs token registered for ${currentUserId}`);
          }

          log(`✅ User registered: ${currentUserId} (${message.userName || 'No name'})`);
          log(`📊 Online users (${users.size}): ${getOnlineUsers().join(', ')}`);

          // Send registration success
          ws.send(JSON.stringify({
            type: 'register-success',
            userId: currentUserId,
            onlineUsers: getOnlineUsers().filter(id => id !== currentUserId),
            timestamp: Date.now(),
          }));

          // Check for pending calls
          if (activeCalls.has(currentUserId)) {
            const pending = activeCalls.get(currentUserId);
            if (pending.offer) {
              log(`🔄 Sending pending call offer to newly registered ${currentUserId}`);
              sendToUser(currentUserId, {
                type: 'incoming-call',
                from: pending.callerId,
                fromName: pending.callerName,
                offer: pending.offer,
                uuid: pending.uuid,
                timestamp: Date.now(),
              });
              // We don't delete from activeCalls yet, let the 30s timeout or clearCallTimeout handle it
            }
          }

          // Notify others
          broadcastExcept(currentUserId, {
            type: 'user-online',
            userId: currentUserId,
            userName: message.userName,
            timestamp: Date.now(),
          });
          break;

        // ============================================
        // CALL OFFER
        // ============================================
        case 'call-offer': {
          const { to: receiver, offer, callerName } = message;

          log(`📞 Call offer: ${currentUserId} → ${receiver}`);

          // Always generate a UUID for the call so we can cancel it later via Push if needed
          let callUuid = null;

          // Timeout Handler setup (30s)
            const setupCallTimeout = (uuid, callerId, callerName, offer = null) => {
            const timeout = setTimeout(() => {
              log(`⏳ Timeout reached for call: ${callerId} → ${receiver}`);
              activeCalls.delete(receiver);

              // Tell caller that the receiver didn't answer
              sendToUser(callerId, {
                type: 'call-timeout',
                to: receiver,
                message: 'No answer',
                timestamp: Date.now()
              });

              // Send VoIP Push to CANCEL the call on receiver's CallKit UI
              if (ENABLE_PUSH_NOTIFICATIONS && userTokens.has(receiver)) {
                log(`🍏 Sending Cancel Push to ${receiver} to close CallKit UI`);
                sendVoIPPush(receiver, callerId, callerName, true, uuid);
              }
            }, 30000); // 30 seconds

            activeCalls.set(receiver, { uuid, callerId, callerName, offer, timeout });
          };

          // Check if receiver is online via WebSocket
          if (!users.has(receiver)) {
            if (ENABLE_PUSH_NOTIFICATIONS) {
              log(`⚠️ Receiver offline: ${receiver}. Attempting to wake via VoIP Push...`);

              // Attempt to send VoIP Push
              callUuid = sendVoIPPush(receiver, currentUserId, callerName);

              if (callUuid) {
                log(`⏳ Waiting for ${receiver} to wake up and reconnect...`);
                // Save offer to send when receiver reconnects
                setupCallTimeout(callUuid, currentUserId, callerName, offer);
              } else {
                ws.send(JSON.stringify({
                  type: 'user-offline',
                  userId: receiver,
                  timestamp: Date.now(),
                }));
              }
            } else {
              // Standard Phase 2 flow: User is offline
              log(`❌ Receiver offline: ${receiver}`);
              ws.send(JSON.stringify({
                type: 'user-offline',
                userId: receiver,
                timestamp: Date.now(),
              }));
            }
            break;
          }

          // Forward offer to receiver (they are online via WS)
          // We still create a UUID to track the timeout just in case they don't answer WS either
          callUuid = require('uuid').v4();

          const sent = sendToUser(receiver, {
            type: 'incoming-call',
            from: currentUserId,
            fromName: callerName,
            offer,
            uuid: callUuid,
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
            setupCallTimeout(callUuid, currentUserId, callerName, offer);
          }
          break;
        }

        // ============================================
        // CALL ANSWER
        // ============================================
        case 'call-answer':
          log(`✅ Call answered: ${currentUserId} → ${message.to}`);
          clearCallTimeout(currentUserId); // currentUserId is the receiver here

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
          clearCallTimeout(currentUserId);

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
          
          // Also send a cancel push just in case the receiver is offline and we just rang them
          if (ENABLE_PUSH_NOTIFICATIONS && activeCalls.has(message.to)) {
             const callData = activeCalls.get(message.to);
             if (callData.callerId === currentUserId) {
                log(`🍏 Sending Cancel Push to ${message.to} because caller ended call early`);
                sendVoIPPush(message.to, currentUserId, null, true, callData.uuid);
             }
          }

          // message.to is the receiver if caller ends it, or currentUserId if receiver ends it
          clearCallTimeout(message.to);
          clearCallTimeout(currentUserId);

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

  ws.on('close', () => {
    if (currentUserId) {
      log(`👋 User disconnected: ${currentUserId}`);
      users.delete(currentUserId);
      
      // Notify others
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
}

async function startServer() {
  await waitForDatabase();
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

      if ((req.method === 'GET' || req.method === 'HEAD') && (pathname === '/' || pathname === '/admin' || pathname === '/admin.html')) {
        if (req.method === 'HEAD') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end();
          return;
        }

        const adminPage = fs.readFileSync(ADMIN_PAGE_PATH, 'utf8');
        sendHtml(res, adminPage);
        return;
      }

      if ((req.method === 'GET' || req.method === 'HEAD') && (pathname === '/tenant_detail' || pathname === '/tenant_detail.html')) {
        if (req.method === 'HEAD') {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end();
          return;
        }

        const tenantDetailPage = fs.readFileSync(TENANT_DETAIL_PAGE_PATH, 'utf8');
        sendHtml(res, tenantDetailPage);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (error) {
      handleDatabaseError(res, error);
    }
  });

  webSocketServer = new WebSocket.Server({ server });
  handleWebSocketConnection(webSocketServer);

  server.listen(PORT, () => {
    console.log(`🚀 BAP Signaling Server started on port ${PORT}`);
    console.log(`🌐 Admin page: http://localhost:${PORT}/admin`);
    console.log(`📡 WebSocket endpoint: ws://localhost:${PORT}`);
    console.log('─'.repeat(50));
  });

// ============================================
// Server Error Handler
// ============================================

wss.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// ============================================
// Graceful Shutdown
// ============================================

process.on('SIGINT', () => {
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
  
  if (ENABLE_PUSH_NOTIFICATIONS && apnProvider) {
    apnProvider.shutdown();
  }
  // Close database
  closeDatabase();

  wss.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });
});

// ============================================
// Status Logging (every 30 seconds)
// ============================================

setInterval(() => {
  log(`📊 Status: ${users.size} users online - ${getOnlineUsers().join(', ') || 'none'}`);
}, 30000);

log('📡 Signaling server is ready for connections');
