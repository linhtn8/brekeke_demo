# BAP Signaling Server

WebSocket signaling server for WebRTC P2P calling demo - BAP Phone App Phase 2

## 📋 Overview

This is a simple WebSocket server that relays signaling messages between two WebRTC clients. It handles:

- User registration and tracking
- Call offer/answer forwarding
- ICE candidate exchange
- Call events (reject, end, offline)
- PostgreSQL user storage running in Docker
- Admin screen for listing, creating, updating, and deleting users

## 🚀 Quick Start

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn

### Installation

```bash
cd BE/signaling-server
npm install
cp .env.example .env
```

### Start Database

```bash
npm run db:up
```

PostgreSQL will be exposed at `localhost:5432` and seeded with a default user:

```json
{
  "id": "1",
  "userName": "user1",
  "password": "pass",
  "displayName": "Manager 01",
  "phone": "101",
  "tenant": "tenantA",
  "status": "active",
  "isActive": true
}
```

If you need to rerun the init script, remove the existing volume first:

```bash
docker compose down -v
npm run db:up
```

### Run Server

```bash
npm start
```

Server will start on `ws://localhost:8080`

Admin screen will be available at `http://localhost:8080/admin`

### Development Mode (Auto-restart)

```bash
npm run dev
```

## 📡 Server Configuration

| Setting | Default | Environment Variable |
|---------|---------|---------------------|
| Port    | 8080    | `PORT`              |
| DB Host | localhost | `DB_HOST`         |
| DB Port | 5432    | `DB_PORT`           |
| DB Name | signaling_db | `DB_NAME`      |
| DB User | postgres | `DB_USER`          |
| DB Password | postgres | `DB_PASSWORD`  |

**Example:**
```bash
PORT=9000 npm start
```

## 🧪 Testing

### Admin Screen

Open `http://localhost:8080/admin` to:

- View current users
- Add a new user
- Edit an existing user
- Delete a user

The screen uses the REST endpoints below on the same backend server.

### Test with Browser Console

Open browser console (Chrome DevTools) and run:

```javascript
// Connect to server
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('✅ Connected to signaling server');
  
// Register user
ws.send(JSON.stringify({
  type: 'register',
  userId: '1',
  password: 'pass'
}));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('📨 Received:', message);
};

ws.onerror = (error) => {
  console.error('❌ Error:', error);
};

ws.onclose = () => {
  console.log('👋 Disconnected');
};
```

### Test Call Flow

**Caller (101):**
```javascript
// After registration, send call offer
ws.send(JSON.stringify({
  type: 'call-offer',
  to: '102',
  callerName: 'Manager 01',
  offer: {
    type: 'offer',
    sdp: 'fake-sdp-offer-data'
  }
}));
```

**Receiver (102):**
```javascript
// Will receive:
{
  type: 'incoming-call',
  from: '101',
  fromName: 'Manager 01',
  offer: { type: 'offer', sdp: 'fake-sdp-offer-data' }
}

// Send answer
ws.send(JSON.stringify({
  type: 'call-answer',
  to: '101',
  answer: {
    type: 'answer',
    sdp: 'fake-sdp-answer-data'
  }
}));
```

## 📨 Message Types

### Client → Server

#### 1. Register
```json
{
  "type": "register",
  "userId": "1",
  "password": "pass"
}
```

#### 2. Call Offer
```json
{
  "type": "call-offer",
  "to": "102",
  "offer": { "type": "offer", "sdp": "..." },
  "callerName": "Manager 01"
}
```

#### 3. Call Answer
```json
{
  "type": "call-answer",
  "to": "101",
  "answer": { "type": "answer", "sdp": "..." }
}
```

#### 4. ICE Candidate
```json
{
  "type": "ice-candidate",
  "to": "102",
  "candidate": { "candidate": "...", "sdpMid": "...", "sdpMLineIndex": 0 }
}
```

#### 5. Reject Call
```json
{
  "type": "call-rejected",
  "to": "101",
  "reason": "declined"
}
```

#### 6. End Call
```json
{
  "type": "call-ended",
  "to": "102"
}
```

### Admin REST API

#### 1. List Users

```http
GET /api/users
```

#### 2. Create User

```http
POST /api/users
Content-Type: application/json
```

```json
{
  "id": "2",
  "userName": "user2",
  "password": "pass2",
  "displayName": "Agent 02",
  "phone": "102",
  "tenant": "tenantA",
  "status": "active",
  "isActive": true
}
```

#### 3. Update User

```http
PUT /api/users/2
Content-Type: application/json
```

#### 4. Delete User

```http
DELETE /api/users/2
```

### Server → Client

#### 1. Registration Success
```json
{
  "type": "register-success",
  "userId": "1",
  "user": {
    "id": "1",
    "userName": "user1",
    "displayName": "Manager 01",
    "phone": "101",
    "tenant": "tenantA",
    "status": "active",
    "isActive": true
  },
  "onlineUsers": ["102", "103"],
  "timestamp": 1234567890
}
```

#### 2. Incoming Call
```json
{
  "type": "incoming-call",
  "from": "101",
  "fromName": "Manager 01",
  "offer": { "type": "offer", "sdp": "..." },
  "timestamp": 1234567890
}
```

#### 3. Call Answer
```json
{
  "type": "call-answer",
  "from": "102",
  "answer": { "type": "answer", "sdp": "..." },
  "timestamp": 1234567890
}
```

#### 4. ICE Candidate
```json
{
  "type": "ice-candidate",
  "from": "102",
  "candidate": { "candidate": "...", "sdpMid": "...", "sdpMLineIndex": 0 },
  "timestamp": 1234567890
}
```

#### 5. Call Rejected
```json
{
  "type": "call-rejected",
  "from": "102",
  "reason": "declined",
  "timestamp": 1234567890
}
```

#### 6. Call Ended
```json
{
  "type": "call-ended",
  "from": "102",
  "timestamp": 1234567890
}
```

#### 7. User Online
```json
{
  "type": "user-online",
  "userId": "1",
  "userName": "user1",
  "displayName": "Manager 01",
  "timestamp": 1234567890
}
```

#### 8. User Offline
```json
{
  "type": "user-offline",
  "userId": "102",
  "timestamp": 1234567890
}
```

#### 9. Error
```json
{
  "type": "error",
  "code": "USER_OFFLINE",
  "message": "User is not online",
  "timestamp": 1234567890
}
```

## 📊 Server Logs

The server provides detailed logging:

```
🚀 BAP Signaling Server started on port 8080
📡 WebSocket endpoint: ws://localhost:8080
──────────────────────────────────────────────────
[14:30:15] New client connected
[14:30:15] Received: register from unknown
[14:30:15] ✅ User registered: 101 (Manager 01)
[14:30:15] 📊 Online users (1): 101
[14:30:20] New client connected
[14:30:20] Received: register from unknown
[14:30:20] ✅ User registered: 102 (Manager 02)
[14:30:20] 📊 Online users (2): 101, 102
[14:30:25] Received: call-offer from 101
[14:30:25] 📞 Call offer: 101 → 102
[14:30:25] ✅ Offer forwarded to 102
[14:30:30] Received: call-answer from 102
[14:30:30] ✅ Call answered: 102 → 101
[14:30:30] ✅ Answer forwarded to 101
[14:30:31] Received: ice-candidate from 101
[14:30:31] 🧊 ICE candidate: 101 → 102
```

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process (macOS/Linux)
kill -9 <PID>

# Or use a different port
PORT=9000 npm start
```

### Connection Refused

1. Check if server is running
2. Verify firewall settings
3. Ensure WebSocket URL is correct (`ws://` not `wss://`)

### Messages Not Forwarding

1. Check both users are registered (appear in online users list)
2. Verify user IDs match exactly
3. Check server logs for errors

## 🛡️ Security Notes

**⚠️ This is a DEMO server for development only!**

For production use, you should add:

- ✅ WSS (WebSocket Secure) with SSL/TLS
- ✅ User authentication
- ✅ Rate limiting
- ✅ Message validation
- ✅ CORS protection
- ✅ Connection timeout
- ✅ Logging to file

## 📖 References

- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws npm package](https://github.com/websockets/ws)
- [WebRTC Signaling](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling)

## 📝 License

MIT

---

**Version:** 1.0.0  
**Author:** BAP Development Team  
**Created:** 2026-04-08
