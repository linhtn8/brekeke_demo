const WebSocket = require('ws');
const fs = require('fs');

// FEATURE FLAG CHO PHASE 3
const ENABLE_PUSH_NOTIFICATIONS = false;

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

// Store connected users: { userId: WebSocket }
const users = new Map();
// Store user APNs tokens: { userId: apnsToken }
const userTokens = new Map();

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
        key: './AuthKey_placeholder.p8', // Path to .p8 file
        keyId: 'PLACEHOLDER_KEY_ID',     // 10-character Key ID
        teamId: 'PLACEHOLDER_TEAM_ID'    // 10-character Team ID
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
function sendVoIPPush(userId, callerId, callerName) {
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
  notification.topic = 'com.bap.brekekephone.voip'; // Must match your bundle ID + .voip
  notification.payload = {
    uuid: `call-${Date.now()}-${callerId}`,
    callerName: callerName || callerId,
    callerId: callerId,
    hasVideo: false
  };

  apnProvider.send(notification, token).then((result) => {
    if (result.sent.length > 0) {
      log(`🍏✅ VoIP Push successfully sent to ${userId}`);
    }
    if (result.failed.length > 0) {
      result.failed.forEach(failure => {
        log(`🍏❌ VoIP Push failed to ${userId}: ${failure.error?.message || failure.response?.reason}`);
      });
    }
  });

  return true;
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

// ============================================
// WebSocket Server Event Handlers
// ============================================

wss.on('connection', (ws) => {
  log('New client connected');
  
  let currentUserId = null;

  ws.on('message', (data) => {
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
        case 'call-offer':
          const { to: receiver, offer, callerName } = message;
          
          log(`📞 Call offer: ${currentUserId} → ${receiver}`);
          
          // Check if receiver is online via WebSocket
          if (!users.has(receiver)) {
            if (ENABLE_PUSH_NOTIFICATIONS) {
              log(`⚠️ Receiver offline: ${receiver}. Attempting to wake via VoIP Push...`);
              
              // Attempt to send VoIP Push
              const pushed = sendVoIPPush(receiver, currentUserId, callerName);
              
              if (pushed) {
                log(`⏳ Waiting for ${receiver} to wake up and reconnect...`);
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
            return;
          }
          
          // Forward offer to receiver (they are online via WS)
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

        // ============================================
        // CALL ANSWER
        // ============================================
        case 'call-answer':
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
