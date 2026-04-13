/**
 * Signaling Service - Phase 2
 *
 * WebSocket client for connecting to the BAP Signaling Server
 * Manages signaling messages (SDP, ICE candidates, call events)
 */

// ============================================
// Type Definitions
// ============================================

export interface SignalingCallbacks {
  /** Called when connected to signaling server */
  onConnected?: () => void
  /** Called when disconnected from signaling server */
  onDisconnected?: () => void
  /** Called when registered successfully */
  onRegistered?: (data: { onlineUsers: string[] }) => void
  /** Called on incoming call offer */
  onIncomingCall?: (data: {
    from: string
    fromName?: string
    offer: any
  }) => void
  /** Called when call is answered */
  onCallAnswer?: (data: { from: string; answer: any }) => void
  /** Called when ICE candidate is received */
  onIceCandidate?: (data: { from: string; candidate: any }) => void
  /** Called when call is rejected */
  onCallRejected?: (data: { from: string; reason?: string }) => void
  /** Called when call is ended */
  onCallEnded?: (data: { from: string }) => void
  /** Called when a user comes online */
  onUserOnline?: (data: { userId: string; userName?: string }) => void
  /** Called when a user goes offline */
  onUserOffline?: (data: { userId: string }) => void
  /** Called on server error */
  onError?: (data: { code: string; message: string }) => void
}

// ============================================
// Signaling Service Class
// ============================================

export class SignalingService {
  private ws: WebSocket | null = null
  private callbacks: SignalingCallbacks = {}
  private currentUserId: string | null = null
  private currentUserName?: string
  private serverUrl: string = ''
  private apnsToken?: string

  // Reconnection logic
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private intentionalDisconnect = false

  /**
   * Set APNs token for iOS Push Notifications
   */
  setApnsToken(token: string): void {
    this.apnsToken = token
    console.log('[Signaling] APNs token stored')
  }

  /**
   * Initialize signaling service with callbacks
   */
  initialize(callbacks: SignalingCallbacks): void {
    this.callbacks = callbacks
    console.log('[Signaling] Service initialized')
  }

  /**
   * Connect to signaling server
   * @param serverUrl WebSocket server URL
   * @param userId User's phone number/ID
   * @param userName User's display name
   */
  connect(
    serverUrl: string,
    userId: string,
    userName?: string,
    apnsToken?: string,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[Signaling] Connecting to ${serverUrl}...`)

        this.serverUrl = serverUrl
        this.currentUserId = userId
        this.currentUserName = userName
        this.intentionalDisconnect = false

        this.ws = new WebSocket(serverUrl)

        // Connection opened
        this.ws.onopen = () => {
          console.log('[Signaling] ✅ Connected to server')
          this.reconnectAttempts = 0
          this.callbacks.onConnected?.()

          // Register user
          this.send({
            type: 'register',
            userId,
            userName,
            apnsToken: apnsToken || this.apnsToken,
          })

          resolve()
        }

        // Message received
        this.ws.onmessage = event => {
          try {
            const message = JSON.parse(event.data)
            console.log(`[Signaling] 📨 Received: ${message.type}`)
            this.handleMessage(message)
          } catch (error) {
            console.error('[Signaling] ❌ Message parse error:', error)
          }
        }

        // Connection error
        this.ws.onerror = error => {
          console.error('[Signaling] ❌ WebSocket error:', error)
          // If we haven't connected yet, reject the promise
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(error)
          }
        }

        // Connection closed
        this.ws.onclose = () => {
          console.log('[Signaling] 🔌 Disconnected from server')
          this.callbacks.onDisconnected?.()
          this.ws = null

          // Attempt reconnection if not intentional
          if (!this.intentionalDisconnect) {
            this.attemptReconnect()
          }
        }
      } catch (error) {
        console.error('[Signaling] ❌ Connection exception:', error)
        reject(error)
      }
    })
  }

  /**
   * Attempt to reconnect to server with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[Signaling] 🛑 Max reconnect attempts reached')
      this.callbacks.onError?.({
        code: 'MAX_RECONNECT_ATTEMPTS',
        message:
          'Could not connect to signaling server after multiple attempts',
      })
      return
    }

    this.reconnectAttempts++
    // Exponential backoff: 2s, 4s, 8s, 16s, 30s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)

    console.log(
      `[Signaling] 🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`,
    )

    this.reconnectTimer = setTimeout(() => {
      if (this.currentUserId && this.serverUrl) {
        this.connect(
          this.serverUrl,
          this.currentUserId,
          this.currentUserName,
        ).catch(error => {
          console.error('[Signaling] ❌ Reconnect failed:', error)
        })
      }
    }, delay)
  }

  /**
   * Handle incoming signaling messages
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'register-success':
        console.log('[Signaling] ✅ Registered successfully')
        this.callbacks.onRegistered?.({
          onlineUsers: message.onlineUsers || [],
        })
        break

      case 'incoming-call':
        console.log(`[Signaling] 📞 Incoming call from: ${message.from}`)
        this.callbacks.onIncomingCall?.({
          from: message.from,
          fromName: message.fromName,
          offer: message.offer,
        })
        break

      case 'call-answer':
        console.log(`[Signaling] ✅ Call answered by: ${message.from}`)
        this.callbacks.onCallAnswer?.({
          from: message.from,
          answer: message.answer,
        })
        break

      case 'ice-candidate':
        console.log(`[Signaling] 🧊 ICE candidate from: ${message.from}`)
        this.callbacks.onIceCandidate?.({
          from: message.from,
          candidate: message.candidate,
        })
        break

      case 'call-rejected':
        console.log(`[Signaling] ❌ Call rejected by: ${message.from}`)
        this.callbacks.onCallRejected?.({
          from: message.from,
          reason: message.reason,
        })
        break

      case 'call-ended':
        console.log(`[Signaling] 📴 Call ended by: ${message.from}`)
        this.callbacks.onCallEnded?.({
          from: message.from,
        })
        break

      case 'user-online':
        console.log(`[Signaling] 👤 User online: ${message.userId}`)
        this.callbacks.onUserOnline?.({
          userId: message.userId,
          userName: message.userName,
        })
        break

      case 'user-offline':
        console.log(`[Signaling] 👻 User offline: ${message.userId}`)
        this.callbacks.onUserOffline?.({
          userId: message.userId,
        })
        break

      case 'error':
        console.error(`[Signaling] ❌ Server error: ${message.message}`)
        this.callbacks.onError?.({
          code: message.code,
          message: message.message,
        })
        break

      case 'server-shutdown':
        console.warn(`[Signaling] 🛑 Server shutting down: ${message.message}`)
        break

      default:
        console.warn(`[Signaling] ⚠️ Unknown message type: ${message.type}`)
    }
  }

  /**
   * Send message to signaling server
   */
  private send(message: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error(
        '[Signaling] ❌ Cannot send message: WebSocket not connected',
      )
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('[Signaling] ❌ Send error:', error)
    }
  }

  // ============================================
  // Call Operations
  // ============================================

  /**
   * Send call offer
   * @param to Receiver's user ID
   * @param offer SDP offer
   * @param callerName Optional caller display name
   */
  sendCallOffer(to: string, offer: any, callerName?: string): void {
    console.log(`[Signaling] 📤 Sending call offer to ${to}`)
    this.send({
      type: 'call-offer',
      from: this.currentUserId,
      to,
      offer,
      callerName: callerName || this.currentUserName,
    })
  }

  /**
   * Send call answer
   * @param to Caller's user ID
   * @param answer SDP answer
   */
  sendCallAnswer(to: string, answer: any): void {
    console.log(`[Signaling] 📤 Sending call answer to ${to}`)
    this.send({
      type: 'call-answer',
      from: this.currentUserId,
      to,
      answer,
    })
  }

  /**
   * Send ICE candidate
   * @param to Target user ID
   * @param candidate ICE candidate
   */
  sendIceCandidate(to: string, candidate: any): void {
    this.send({
      type: 'ice-candidate',
      from: this.currentUserId,
      to,
      candidate,
    })
  }

  /**
   * Reject incoming call
   * @param to Caller's user ID
   * @param reason Reason for rejection
   */
  rejectCall(to: string, reason?: string): void {
    console.log(`[Signaling] 📤 Rejecting call from ${to}`)
    this.send({
      type: 'call-rejected',
      from: this.currentUserId,
      to,
      reason,
    })
  }

  /**
   * End active call
   * @param to Peer's user ID
   */
  endCall(to: string): void {
    console.log(`[Signaling] 📤 Ending call with ${to}`)
    this.send({
      type: 'call-ended',
      from: this.currentUserId,
      to,
    })
  }

  // ============================================
  // Connection Management
  // ============================================

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.intentionalDisconnect = true

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.currentUserId = null
    this.reconnectAttempts = 0
    console.log('[Signaling] ✅ Disconnected')
  }

  /**
   * Check if connected to server
   * @returns boolean
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * Get current user ID
   * @returns string | null
   */
  getCurrentUserId(): string | null {
    return this.currentUserId
  }
}

// ============================================
// Singleton Instance
// ============================================

export const signalingService = new SignalingService()
