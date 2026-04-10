# Phase 2 - WebRTC Real Calling Flow

## 📋 Tóm tắt

Tài liệu này mô tả chi tiết flow implementation cho **Phase 2** của BAP Demo App - thực hiện cuộc gọi thực giữa 2 app thông qua WebRTC.

### Yêu cầu Phase 2
- ✅ **Signaling:** Custom WebSocket server (Node.js) - giả lập Brekeke server
- ✅ **Call Type:** Audio only (voice call)
- ✅ **STUN Server:** Google STUN (free) - `stun:stun.l.google.com:19302`
- ✅ **Deployment:** Local development (localhost)
- ✅ **No Real SIP:** Không cần license Brekeke, chỉ WebRTC thuần

---

## 1. Architecture Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                         WEBRTC DEMO ARCHITECTURE                        │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────────────┐          WebSocket          ┌──────────────────┐ │
│   │    App A        │          Signaling          │   Signaling      │ │
│   │   (Caller)      │◄─────────────────────────►│   Server         │ │
│   │                 │      (Message Relay)        │   (Node.js)      │ │
│   │  - React Native │                             │   - WebSocket    │ │
│   │  - WebRTC       │                             │   - User Mgmt    │ │
│   └────────┬────────┘                             └────────┬─────────┘ │
│            │                                               │           │
│            │                                               │           │
│            │          ◄──── WebRTC P2P Audio ────►         │           │
│            │              (Direct Connection)              │           │
│            │                                               │           │
│   ┌────────┴────────┐                             ┌────────┴─────────┐ │
│   │   STUN Server   │                             │    App B         │ │
│   │   (Google)      │                             │   (Receiver)     │ │
│   │                 │                             │                  │ │
│   │  NAT Traversal  │                             │  - React Native  │ │
│   └─────────────────┘                             │  - WebRTC        │ │
│                                                    └──────────────────┘ │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### Key Components:

1. **Signaling Server (Node.js + WebSocket)**
   - User registration/tracking
   - Forward SDP Offer/Answer
   - Forward ICE Candidates
   - Handle call events (reject, end, offline)

2. **WebRTC Service (React Native)**
   - Create RTCPeerConnection
   - getUserMedia (audio only)
   - SDP exchange
   - ICE candidate exchange
   - Audio stream handling

3. **UI Integration**
   - Outgoing call screen
   - Incoming call notification
   - Active call management
   - End call handling

---

## 2. Signaling Messages Format

### TypeScript Message Definitions

```typescript
// Base message interface
interface SignalingMessage {
  type: string
  timestamp?: number
}

// 1. User Registration
interface RegisterMessage extends SignalingMessage {
  type: 'register'
  userId: string          // User phone number (e.g., "101", "102")
  userName?: string       // Optional display name
}

interface RegisterSuccessMessage extends SignalingMessage {
  type: 'register-success'
  userId: string
  onlineUsers: string[]   // List of currently online users
}

// 2. Call Initiation
interface CallOfferMessage extends SignalingMessage {
  type: 'call-offer'
  from: string           // Caller userId
  to: string             // Receiver userId
  offer: RTCSessionDescriptionInit  // SDP Offer
  callerName?: string    // Display name
}

// 3. Incoming Call Notification (Server → Receiver)
interface IncomingCallMessage extends SignalingMessage {
  type: 'incoming-call'
  from: string
  fromName?: string
  offer: RTCSessionDescriptionInit
}

// 4. Call Answer
interface CallAnswerMessage extends SignalingMessage {
  type: 'call-answer'
  from: string           // Answerer userId
  to: string             // Original caller
  answer: RTCSessionDescriptionInit  // SDP Answer
}

// 5. ICE Candidate Exchange
interface IceCandidateMessage extends SignalingMessage {
  type: 'ice-candidate'
  from: string
  to: string
  candidate: RTCIceCandidateInit
}

// 6. Call Events
interface CallRejectedMessage extends SignalingMessage {
  type: 'call-rejected'
  from: string
  to: string
  reason?: string  // "busy" | "declined" | "timeout"
}

interface CallEndedMessage extends SignalingMessage {
  type: 'call-ended'
  from: string
  to: string
}

// 7. User Status
interface UserOfflineMessage extends SignalingMessage {
  type: 'user-offline'
  userId: string
}

interface UserOnlineMessage extends SignalingMessage {
  type: 'user-online'
  userId: string
  userName?: string
}

// 8. Error Messages
interface ErrorMessage extends SignalingMessage {
  type: 'error'
  code: string
  message: string
}
```

---

## 3. Full Sequence Diagram

```
App A (Caller: "101")    Signaling Server       App B (Receiver: "102")     STUN Server
       │                        │                         │                      │
       │                        │                         │                      │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                   1. USER REGISTRATION                                   │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                        │                         │                      │
       │─── register(101) ─────►│                         │                      │
       │                        │  Store: users[101] = ws │                      │
       │◄─ register-success ────│                         │                      │
       │   onlineUsers: []      │                         │                      │
       │                        │                         │                      │
       │                        │◄─── register(102) ──────│                      │
       │                        │  Store: users[102] = ws │                      │
       │                        │─── register-success ───►│                      │
       │                        │   onlineUsers: [101]    │                      │
       │                        │                         │                      │
       │◄─ user-online(102) ────│                         │                      │
       │                        │                         │                      │
       │                        │                         │                      │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                   2. CALL INITIATION (101 → 102)                         │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                        │                         │                      │
       │  User presses          │                         │                      │
       │  "Call" button         │                         │                      │
       │                        │                         │                      │
       │  getUserMedia()        │                         │                      │
       │  ✓ Audio stream OK     │                         │                      │
       │                        │                         │                      │
       │  createPeerConnection()│                         │                      │
       │  addTrack(audioStream) │                         │                      │
       │                        │                         │                      │
       │  createOffer()         │                         │                      │
       │  setLocalDescription() │                         │                      │
       │                        │                         │                      │
       │─── call-offer ────────►│                         │                      │
       │   { from: 101,         │                         │                      │
       │     to: 102,           │                         │                      │
       │     offer: SDP }       │                         │                      │
       │                        │                         │                      │
       │                        │  Forward to 102         │                      │
       │                        │                         │                      │
       │                        │─── incoming-call ──────►│                      │
       │                        │   { from: 101,          │                      │
       │                        │     offer: SDP }        │  Show Incoming UI    │
       │                        │                         │  🔔 Ring...          │
       │                        │                         │                      │
       │                        │                         │  User presses        │
       │                        │                         │  "Accept"            │
       │                        │                         │                      │
       │                        │                         │  getUserMedia()      │
       │                        │                         │  ✓ Audio OK          │
       │                        │                         │                      │
       │                        │                         │  createPeerConnection()│
       │                        │                         │  addTrack(audioStream)│
       │                        │                         │                      │
       │                        │                         │  setRemoteDescription(offer)│
       │                        │                         │  createAnswer()      │
       │                        │                         │  setLocalDescription(answer)│
       │                        │                         │                      │
       │                        │◄─── call-answer ────────│                      │
       │                        │   { from: 102,          │                      │
       │                        │     to: 101,            │                      │
       │                        │     answer: SDP }       │                      │
       │                        │                         │                      │
       │◄─── call-answer ───────│                         │                      │
       │                        │                         │                      │
       │  setRemoteDescription(answer)                    │                      │
       │                        │                         │                      │
       │                        │                         │                      │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                   3. ICE CANDIDATE EXCHANGE                              │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                        │                         │                      │
       │  onicecandidate ──────►│─── ice-candidate ──────►│                      │
       │                        │                         │  addIceCandidate()   │
       │                        │                         │                      │
       │                        │◄─── ice-candidate ──────│  onicecandidate      │
       │  addIceCandidate() ◄───│                         │                      │
       │                        │                         │                      │
       │  (Multiple ICE exchanges...)                     │                      │
       │                        │                         │                      │
       │  STUN Request ─────────┼─────────────────────────┼─────────────────────►│
       │◄──────────────────────────────────────────────────────── STUN Response ─│
       │                        │                         │                      │
       │                        │                         │  STUN Request ───────►│
       │                        │                         │◄───── STUN Response ─│
       │                        │                         │                      │
       │                        │                         │                      │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                4. P2P CONNECTION ESTABLISHED                             │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                        │                         │                      │
       │  onconnectionstatechange                         │                      │
       │  → "connected"         │                         │  onconnectionstatechange│
       │                        │                         │  → "connected"       │
       │                        │                         │                      │
       │◄═══════════════════════════════════════════════════════════════════════►│
       │                    Direct P2P Audio Stream                               │
       │                    (RTP packets, encrypted)                              │
       │                                                                          │
       │  🔊 Caller speaks ──────────────────────────────►│ 🎧 Receiver hears    │
       │  🎧 Caller hears  ◄──────────────────────────────│ 🔊 Receiver speaks   │
       │                        │                         │                      │
       │                        │                         │                      │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                     5. CALL END (User hangs up)                          │
       ├──────────────────────────────────────────────────────────────────────────┤
       │                        │                         │                      │
       │  User presses "End"    │                         │                      │
       │                        │                         │                      │
       │  peerConnection.close()│                         │                      │
       │                        │                         │                      │
       │─── call-ended ────────►│                         │                      │
       │   { from: 101,         │                         │                      │
       │     to: 102 }          │                         │                      │
       │                        │                         │                      │
       │                        │─── call-ended ─────────►│                      │
       │                        │                         │                      │
       │                        │                         │  peerConnection.close()│
       │                        │                         │  Show "Call Ended"   │
       │                        │                         │                      │
       └────────────────────────┴─────────────────────────┴──────────────────────┘
```

### Alternative Flows:

#### Call Rejected Flow
```
App A (Caller)         Signaling Server         App B (Receiver)
      │                       │                         │
      │─── call-offer ───────►│─── incoming-call ──────►│
      │                       │                         │
      │                       │                         │  User presses "Reject"
      │                       │                         │
      │                       │◄─── call-rejected ──────│
      │                       │   { reason: "declined" }│
      │                       │                         │
      │◄─── call-rejected ────│                         │
      │                       │                         │
      │  peerConnection.close()                         │
      │  Show "Call Rejected" │                         │
      │                       │                         │
```

#### User Offline Flow
```
App A (Caller)         Signaling Server
      │                       │
      │─── call-offer ───────►│  Check: users[102] exists?
      │   { to: "102" }       │  ✗ Not found
      │                       │
      │◄─── user-offline ─────│
      │   { userId: "102" }   │
      │                       │
      │  Show "User Offline"  │
      │                       │
```

---

## 4. Files Structure

### 4.1 Files to CREATE

```
project-root/
│
├── signaling-server/                    # NEW - WebSocket signaling server
│   ├── package.json
│   ├── server.js                        # Main server logic
│   └── README.md                        # Server setup instructions
│
└── brekekephone/src/
    ├── services/
    │   ├── webrtcService.ts             # NEW - WebRTC connection logic
    │   └── signalingService.ts          # NEW - WebSocket client
    │
    ├── stores/
    │   └── webrtcStore.ts               # NEW - MobX store for WebRTC state
    │
    └── components/
        └── IncomingCallScreen.tsx       # NEW - Incoming call UI
```

### 4.2 Files to MODIFY

```
brekekephone/src/
├── config/
│   └── demoConfig.ts                    # Add Phase 2 configuration
│
├── stores/
│   └── demoStore.ts                     # Integrate WebRTC calls
│
└── pages/
    ├── PageContactUsers.tsx             # Real call button
    └── PageCallManage.tsx               # Real call screen UI
```

---

## 5. Implementation Details

### 5.1 Signaling Server Code

**File:** `signaling-server/package.json`

```json
{
  "name": "bap-signaling-server",
  "version": "1.0.0",
  "description": "WebSocket signaling server for WebRTC demo",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "ws": "^8.14.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

**File:** `signaling-server/server.js`

```javascript
const WebSocket = require('ws');

// Configuration
const PORT = process.env.PORT || 8080;

// Store connected users: { userId: WebSocket }
const users = new Map();

// Create WebSocket server
const wss = new WebSocket.Server({ port: PORT });

console.log(`🚀 Signaling Server started on port ${PORT}`);

// Helper: Send message to specific user
function sendToUser(userId, message) {
  const ws = users.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
    return true;
  }
  return false;
}

// Helper: Broadcast to all users except sender
function broadcastExcept(senderId, message) {
  users.forEach((ws, userId) => {
    if (userId !== senderId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Helper: Get list of online users
function getOnlineUsers() {
  return Array.from(users.keys());
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  let currentUserId = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received:', message.type, message);

      switch (message.type) {
        // ============================================
        // USER REGISTRATION
        // ============================================
        case 'register':
          currentUserId = message.userId;
          users.set(currentUserId, ws);
          
          console.log(`✅ User registered: ${currentUserId}`);
          console.log(`📊 Online users: ${getOnlineUsers().join(', ')}`);
          
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
          
          console.log(`📞 Call offer from ${currentUserId} to ${receiver}`);
          
          // Check if receiver is online
          if (!users.has(receiver)) {
            ws.send(JSON.stringify({
              type: 'user-offline',
              userId: receiver,
              timestamp: Date.now(),
            }));
            return;
          }
          
          // Forward offer to receiver
          const sent = sendToUser(receiver, {
            type: 'incoming-call',
            from: currentUserId,
            fromName: callerName,
            offer,
            timestamp: Date.now(),
          });
          
          if (!sent) {
            ws.send(JSON.stringify({
              type: 'error',
              code: 'SEND_FAILED',
              message: 'Failed to send call offer',
              timestamp: Date.now(),
            }));
          }
          break;

        // ============================================
        // CALL ANSWER
        // ============================================
        case 'call-answer':
          console.log(`✅ Call answered by ${currentUserId} to ${message.to}`);
          
          sendToUser(message.to, {
            type: 'call-answer',
            from: currentUserId,
            answer: message.answer,
            timestamp: Date.now(),
          });
          break;

        // ============================================
        // ICE CANDIDATE
        // ============================================
        case 'ice-candidate':
          console.log(`🧊 ICE candidate from ${currentUserId} to ${message.to}`);
          
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
          console.log(`❌ Call rejected by ${currentUserId} to ${message.to}`);
          
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
          console.log(`📴 Call ended by ${currentUserId} to ${message.to}`);
          
          sendToUser(message.to, {
            type: 'call-ended',
            from: currentUserId,
            timestamp: Date.now(),
          });
          break;

        default:
          console.log(`⚠️  Unknown message type: ${message.type}`);
          ws.send(JSON.stringify({
            type: 'error',
            code: 'UNKNOWN_MESSAGE_TYPE',
            message: `Unknown message type: ${message.type}`,
            timestamp: Date.now(),
          }));
      }
    } catch (error) {
      console.error('Error processing message:', error);
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
      console.log(`👋 User disconnected: ${currentUserId}`);
      users.delete(currentUserId);
      
      // Notify others
      broadcastExcept(currentUserId, {
        type: 'user-offline',
        userId: currentUserId,
        timestamp: Date.now(),
      });
      
      console.log(`📊 Online users: ${getOnlineUsers().join(', ') || 'none'}`);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log('📡 Signaling server is ready for connections');
```

**File:** `signaling-server/README.md`

```markdown
# Signaling Server for WebRTC Demo

Simple WebSocket server for relaying WebRTC signaling messages.

## Installation

```bash
cd signaling-server
npm install
```

## Run Server

```bash
npm start
```

Server will start on `ws://localhost:8080`

## Development (Auto-restart)

```bash
npm run dev
```

## Testing

Open browser console and connect:

```javascript
const ws = new WebSocket('ws://localhost:8080');

ws.onopen = () => {
  console.log('Connected to signaling server');
  
  // Register user
  ws.send(JSON.stringify({
    type: 'register',
    userId: '101',
    userName: 'Manager 01'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```
```

---

### 5.2 WebRTC Service

**File:** `brekekephone/src/services/webrtcService.ts`

```typescript
import { RTCPeerConnection, RTCSessionDescription, RTCIceCandidate, mediaDevices } from 'react-native-webrtc';

// STUN server configuration
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export interface WebRTCCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
  onConnectionStateChange?: (state: string) => void;
  onError?: (error: Error) => void;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private callbacks: WebRTCCallbacks = {};

  /**
   * Initialize WebRTC service with callbacks
   */
  initialize(callbacks: WebRTCCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Get user media (audio only)
   */
  async getUserMedia(): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      this.localStream = stream;
      this.callbacks.onLocalStream?.(stream);

      console.log('[WebRTC] Local stream obtained:', stream.id);
      return stream;
    } catch (error) {
      console.error('[WebRTC] getUserMedia error:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Create RTCPeerConnection
   */
  createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      console.warn('[WebRTC] Peer connection already exists');
      return this.peerConnection;
    }

    console.log('[WebRTC] Creating peer connection...');
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate:', event.candidate);
        this.callbacks.onIceCandidate?.(event.candidate.toJSON());
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.streams[0].id);
      this.callbacks.onRemoteStream?.(event.streams[0]);
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      this.callbacks.onConnectionStateChange?.(pc.connectionState);
    };

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
    };

    this.peerConnection = pc;
    return pc;
  }

  /**
   * Add local stream to peer connection
   */
  addLocalStream() {
    if (!this.peerConnection || !this.localStream) {
      throw new Error('Peer connection or local stream not initialized');
    }

    this.localStream.getTracks().forEach((track) => {
      this.peerConnection!.addTrack(track, this.localStream!);
      console.log('[WebRTC] Added track:', track.kind);
    });
  }

  /**
   * Create SDP offer (caller side)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('[WebRTC] Created offer:', offer.type);

      return offer;
    } catch (error) {
      console.error('[WebRTC] Create offer error:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Create SDP answer (receiver side)
   */
  async createAnswer(offer: RTCSessionDescriptionInit): Promise<RTCSessionDescriptionInit> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Set remote description (offer)');

      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('[WebRTC] Created answer:', answer.type);

      return answer;
    } catch (error) {
      console.error('[WebRTC] Create answer error:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Set remote answer (caller side)
   */
  async setRemoteAnswer(answer: RTCSessionDescriptionInit) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Set remote description (answer)');
    } catch (error) {
      console.error('[WebRTC] Set remote answer error:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Add received ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidateInit) {
    if (!this.peerConnection) {
      console.warn('[WebRTC] Peer connection not ready, ignoring ICE candidate');
      return;
    }

    try {
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('[WebRTC] Added ICE candidate');
    } catch (error) {
      console.error('[WebRTC] Add ICE candidate error:', error);
      // Don't throw - ICE candidates can fail gracefully
    }
  }

  /**
   * Close connection and cleanup
   */
  close() {
    console.log('[WebRTC] Closing connection...');

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        track.stop();
        console.log('[WebRTC] Stopped track:', track.kind);
      });
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    console.log('[WebRTC] Connection closed');
  }

  /**
   * Get connection state
   */
  getConnectionState(): string | null {
    return this.peerConnection?.connectionState || null;
  }

  /**
   * Mute/unmute local audio
   */
  setAudioEnabled(enabled: boolean) {
    if (!this.localStream) return;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = enabled;
      console.log('[WebRTC] Audio track enabled:', enabled);
    });
  }
}

// Singleton instance
export const webrtcService = new WebRTCService();
```

---

### 5.3 Signaling Service

**File:** `brekekephone/src/services/signalingService.ts`

```typescript
export interface SignalingCallbacks {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onRegistered?: (data: { onlineUsers: string[] }) => void;
  onIncomingCall?: (data: { from: string; fromName?: string; offer: RTCSessionDescriptionInit }) => void;
  onCallAnswer?: (data: { from: string; answer: RTCSessionDescriptionInit }) => void;
  onIceCandidate?: (data: { from: string; candidate: RTCIceCandidateInit }) => void;
  onCallRejected?: (data: { from: string; reason?: string }) => void;
  onCallEnded?: (data: { from: string }) => void;
  onUserOnline?: (data: { userId: string; userName?: string }) => void;
  onUserOffline?: (data: { userId: string }) => void;
  onError?: (data: { code: string; message: string }) => void;
}

export class SignalingService {
  private ws: WebSocket | null = null;
  private callbacks: SignalingCallbacks = {};
  private currentUserId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Initialize signaling service with callbacks
   */
  initialize(callbacks: SignalingCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Connect to signaling server
   */
  connect(serverUrl: string, userId: string, userName?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[Signaling] Connecting to ${serverUrl}...`);

        this.ws = new WebSocket(serverUrl);
        this.currentUserId = userId;

        this.ws.onopen = () => {
          console.log('[Signaling] Connected to server');
          this.reconnectAttempts = 0;
          this.callbacks.onConnected?.();

          // Register user
          this.send({
            type: 'register',
            userId,
            userName,
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            console.log('[Signaling] Received:', message.type);
            this.handleMessage(message);
          } catch (error) {
            console.error('[Signaling] Message parse error:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[Signaling] WebSocket error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('[Signaling] Disconnected from server');
          this.callbacks.onDisconnected?.();
          this.ws = null;

          // Attempt reconnection
          this.attemptReconnect(serverUrl, userId, userName);
        };
      } catch (error) {
        console.error('[Signaling] Connection error:', error);
        reject(error);
      }
    });
  }

  /**
   * Attempt to reconnect to server
   */
  private attemptReconnect(serverUrl: string, userId: string, userName?: string) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Signaling] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

    console.log(`[Signaling] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect(serverUrl, userId, userName).catch((error) => {
        console.error('[Signaling] Reconnect failed:', error);
      });
    }, delay);
  }

  /**
   * Handle incoming signaling messages
   */
  private handleMessage(message: any) {
    switch (message.type) {
      case 'register-success':
        console.log('[Signaling] Registered successfully');
        this.callbacks.onRegistered?.({
          onlineUsers: message.onlineUsers,
        });
        break;

      case 'incoming-call':
        console.log('[Signaling] Incoming call from:', message.from);
        this.callbacks.onIncomingCall?.({
          from: message.from,
          fromName: message.fromName,
          offer: message.offer,
        });
        break;

      case 'call-answer':
        console.log('[Signaling] Call answered by:', message.from);
        this.callbacks.onCallAnswer?.({
          from: message.from,
          answer: message.answer,
        });
        break;

      case 'ice-candidate':
        this.callbacks.onIceCandidate?.({
          from: message.from,
          candidate: message.candidate,
        });
        break;

      case 'call-rejected':
        console.log('[Signaling] Call rejected by:', message.from);
        this.callbacks.onCallRejected?.({
          from: message.from,
          reason: message.reason,
        });
        break;

      case 'call-ended':
        console.log('[Signaling] Call ended by:', message.from);
        this.callbacks.onCallEnded?.({
          from: message.from,
        });
        break;

      case 'user-online':
        console.log('[Signaling] User online:', message.userId);
        this.callbacks.onUserOnline?.({
          userId: message.userId,
          userName: message.userName,
        });
        break;

      case 'user-offline':
        console.log('[Signaling] User offline:', message.userId);
        this.callbacks.onUserOffline?.({
          userId: message.userId,
        });
        break;

      case 'error':
        console.error('[Signaling] Server error:', message.message);
        this.callbacks.onError?.({
          code: message.code,
          message: message.message,
        });
        break;

      default:
        console.warn('[Signaling] Unknown message type:', message.type);
    }
  }

  /**
   * Send message to signaling server
   */
  private send(message: any) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('[Signaling] WebSocket not connected');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send call offer
   */
  sendCallOffer(to: string, offer: RTCSessionDescriptionInit, callerName?: string) {
    console.log(`[Signaling] Sending call offer to ${to}`);
    this.send({
      type: 'call-offer',
      from: this.currentUserId,
      to,
      offer,
      callerName,
    });
  }

  /**
   * Send call answer
   */
  sendCallAnswer(to: string, answer: RTCSessionDescriptionInit) {
    console.log(`[Signaling] Sending call answer to ${to}`);
    this.send({
      type: 'call-answer',
      from: this.currentUserId,
      to,
      answer,
    });
  }

  /**
   * Send ICE candidate
   */
  sendIceCandidate(to: string, candidate: RTCIceCandidateInit) {
    this.send({
      type: 'ice-candidate',
      from: this.currentUserId,
      to,
      candidate,
    });
  }

  /**
   * Reject incoming call
   */
  rejectCall(to: string, reason?: string) {
    console.log(`[Signaling] Rejecting call to ${to}`);
    this.send({
      type: 'call-rejected',
      from: this.currentUserId,
      to,
      reason,
    });
  }

  /**
   * End call
   */
  endCall(to: string) {
    console.log(`[Signaling] Ending call with ${to}`);
    this.send({
      type: 'call-ended',
      from: this.currentUserId,
      to,
    });
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.currentUserId = null;
    this.reconnectAttempts = 0;
    console.log('[Signaling] Disconnected');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const signalingService = new SignalingService();
```

---

### 5.4 Updated Demo Config

**File:** `brekekephone/src/config/demoConfig.ts` (additions)

```typescript
// Add to existing file:

// ============================================
// PHASE 2 - WEBRTC CONFIGURATION
// ============================================
export const PHASE_2_ENABLED = false // Toggle Phase 2 (WebRTC real calling)

export const WEBRTC_CONFIG = {
  // Signaling server URL
  signalingServerUrl: 'ws://localhost:8080',
  
  // STUN servers for NAT traversal
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
  
  // Call timeouts (milliseconds)
  callTimeout: 30000, // 30 seconds - auto-reject if not answered
  
  // Reconnection settings
  reconnectAttempts: 5,
  reconnectDelay: 2000, // Initial delay, will exponentially backoff
}
```

---

## 6. Implementation Phases

### Phase 2.1: Signaling Server ✅ **COMPLETED**

**Location:** `BE/signaling-server/`

**Tasks:**
- [x] ✅ Create `signaling-server/` directory
- [x] ✅ Setup package.json
- [x] ✅ Implement WebSocket server logic
- [x] ✅ User registration/tracking
- [x] ✅ Message forwarding (offer, answer, ICE)
- [x] ✅ Handle call events (reject, end, offline)
- [x] ✅ Error handling
- [x] ✅ Create README.md with documentation
- [x] ✅ Create .gitignore

**Files Created:**
- `BE/signaling-server/package.json`
- `BE/signaling-server/server.js`
- `BE/signaling-server/README.md`
- `BE/signaling-server/.gitignore`

**Testing:**
```bash
cd BE/signaling-server
npm install
npm start

# Test with browser console (see README.md)
```

**Status:** ✅ Ready for testing

---

### Phase 2.2: WebRTC Service ✅ **COMPLETED**

**Location:** `brekekephone/src/services/webrtcService.ts`

**Tasks:**
- [x] ✅ Install `react-native-webrtc` package (already installed v111.0.3)
- [x] ✅ Create `webrtcService.ts` (520 lines)
- [x] ✅ Implement getUserMedia (audio only)
- [x] ✅ Create RTCPeerConnection
- [x] ✅ SDP offer/answer handling
- [x] ✅ ICE candidate handling
- [x] ✅ Connection state management
- [x] ✅ Audio mute/unmute
- [x] ✅ Bonus: ICE restart, getStats(), detailed logging

**Files Created:**
- `brekekephone/src/services/webrtcService.ts` (13.8 KB)

**Features Implemented:**
- ✅ Full TypeScript support with type definitions
- ✅ Singleton pattern for easy access
- ✅ Comprehensive error handling
- ✅ Detailed console logging for debugging
- ✅ Event callbacks (onLocalStream, onRemoteStream, onIceCandidate, etc.)
- ✅ Connection state monitoring
- ✅ Audio mute/unmute functionality
- ✅ ICE restart capability
- ✅ WebRTC statistics retrieval
- ✅ Clean resource cleanup on close()

**Usage Example:**
```typescript
import { webrtcService } from '#/services/webrtcService'

// Initialize
webrtcService.initialize({
  onLocalStream: (stream) => console.log('Local stream:', stream.id),
  onRemoteStream: (stream) => console.log('Remote stream:', stream.id),
  onIceCandidate: (candidate) => signalingService.sendIceCandidate(peerId, candidate),
  onConnectionStateChange: (state) => console.log('State:', state),
})

// Caller flow
const stream = await webrtcService.getUserMedia()
webrtcService.createPeerConnection()
webrtcService.addLocalStream()
const offer = await webrtcService.createOffer()
// Send offer via signaling...

// Receiver flow
const stream = await webrtcService.getUserMedia()
webrtcService.createPeerConnection()
webrtcService.addLocalStream()
const answer = await webrtcService.createAnswer(remoteOffer)
// Send answer via signaling...
```

**Status:** ✅ Ready for integration

---

### Phase 2.3: Signaling Client ✅ **COMPLETED**

**Location:** `brekekephone/src/services/signalingService.ts`

**Tasks:**
- [x] ✅ Create `signalingService.ts` (396 lines)
- [x] ✅ WebSocket connection
- [x] ✅ User registration
- [x] ✅ Send/receive signaling messages
- [x] ✅ Reconnection logic (exponential backoff)
- [x] ✅ Error handling

**Files Created:**
- `brekekephone/src/services/signalingService.ts` (11 KB)

**Features Implemented:**
- ✅ Full TypeScript support with `SignalingCallbacks` interface
- ✅ Exponential backoff reconnection logic (max 5 attempts, up to 30s delay)
- ✅ Message handling for all defined signaling types (offers, answers, candidates, events)
- ✅ Call operations (`sendCallOffer`, `sendCallAnswer`, `sendIceCandidate`, `rejectCall`, `endCall`)
- ✅ Detailed logging with emojis
- ✅ Graceful disconnect handling (`intentionalDisconnect` flag)
- ✅ Singleton instance export

**Status:** ✅ Ready for Store Integration

---

### Phase 2.4: MobX Store Integration ✅ **COMPLETED**

**Tasks:**
- [x] Create `webrtcStore.ts`
- [x] Integrate with `demoStore.ts`
- [x] Call state management
- [x] Online users tracking
- [x] Call history

---

### Phase 2.5: UI Integration ✅ **COMPLETED**

**Tasks:**
- [x] Create `IncomingCallScreen.tsx`
- [x] Update `PageContactUsers.tsx` - real call button
- [x] Update `PageCallManage.tsx` - active call UI
- [x] Add call notification/ringtone
- [x] Call controls (mute, speaker, end)

---

### Phase 2.6: Error Handling & Edge Cases ✅ **COMPLETED**

**Scenarios to handle:**
- [x] User offline
- [x] Call rejected
- [x] Call timeout (no answer)
- [x] Network disconnection during call
- [x] Signaling server down
- [x] Microphone permission denied
- [x] Multiple incoming calls
- [x] Call collision (A calls B, B calls A simultaneously)

---

## 7. Testing Checklist

### 7.1 Signaling Server Tests

- [x] Server starts successfully
- [x] Client connects via WebSocket
- [x] User registration works
- [x] Online users list updates
- [x] Call offer forwarding
- [x] Call answer forwarding
- [x] ICE candidate forwarding
- [x] User offline detection
- [x] Multiple clients can connect

### 7.2 WebRTC Tests

- [x] Local audio stream captured
- [x] Peer connection created
- [x] SDP offer generated
- [x] SDP answer generated
- [x] ICE candidates collected
- [x] P2P connection established
- [x] Audio flows both directions
- [x] Mute/unmute works
- [x] Call end cleanup

### 7.3 Integration Tests

- [x] App A can call App B
- [x] App B receives incoming call
- [x] Accept call works
- [x] Reject call works
- [x] End call from caller side
- [x] End call from receiver side
- [x] Call timeout works
- [x] User offline handling
- [x] Reconnection after disconnect

### 7.4 UI/UX Tests

- [x] Incoming call notification shows
- [x] Ringtone plays
- [x] Call screen shows caller info
- [x] Audio controls work
- [x] Call timer displays correctly
- [x] End call button works
- [x] UI updates on connection states

---

## 8. Known Limitations & Future Enhancements

### Current Limitations:

1. **No TURN server** - P2P may fail in restrictive NAT/firewall scenarios
2. **Audio only** - No video support
3. **No call history** - Calls not persisted
4. **No call quality metrics** - No stats/diagnostics
5. **Single call only** - No call waiting/hold

### Future Enhancements (Phase 3+):

- [ ] Add TURN server for better connectivity
- [ ] Video call support
- [ ] Group calling
- [ ] Call recording
- [ ] Call transfer
- [ ] Call quality indicators
- [ ] Background mode support
- [ ] Push notifications for incoming calls
- [ ] Integration with real Brekeke PBX

---

## 9. Troubleshooting Guide

### Issue: WebSocket connection fails

**Solution:**
1. Check if signaling server is running: `lsof -i :8080`
2. Verify server URL in `demoConfig.ts`
3. Check firewall/network settings
4. Look at server logs

### Issue: No audio in call

**Solution:**
1. Check microphone permissions
2. Verify `getUserMedia` succeeds
3. Check if audio tracks are added to peer connection
4. Use `chrome://webrtc-internals` (web) or logs to debug

### Issue: Call connects but no audio

**Solution:**
1. Check ICE connection state (should be "connected" or "completed")
2. Verify STUN servers are reachable
3. Check NAT/firewall settings
4. May need TURN server

### Issue: "User offline" error

**Solution:**
1. Ensure both apps are registered to signaling server
2. Check `onlineUsers` array
3. Verify userIds match exactly
4. Check server logs

---

## 10. References & Resources

### WebRTC Documentation:
- [MDN WebRTC API](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)
- [react-native-webrtc](https://github.com/react-native-webrtc/react-native-webrtc)

### Signaling:
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [ws npm package](https://github.com/websockets/ws)

### STUN/TURN:
- [Google STUN servers](https://gist.github.com/mondain/b0ec1cf5f60ae726202e)
- [WebRTC ICE](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity)

### Debugging:
- `chrome://webrtc-internals` (Chrome browser)
- React Native Debugger
- Console logs

---

**Document Version:** 1.0  
**Created:** 2026-04-08  
**Last Updated:** 2026-04-08  
**Author:** BAP Development Team
