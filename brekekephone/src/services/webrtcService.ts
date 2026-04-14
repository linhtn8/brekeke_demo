/**
 * WebRTC Service - Phase 2
 *
 * Manages WebRTC peer-to-peer connections for audio calling
 * - Audio stream capture (getUserMedia)
 * - RTCPeerConnection management
 * - SDP offer/answer handling
 * - ICE candidate exchange
 * - Connection state management
 * - Audio mute/unmute

 */

import { Platform } from 'react-native'

let mediaDevices: any
let RTCPeerConnection: any
let RTCSessionDescription: any
let RTCIceCandidate: any
let MediaStream: any
let RTCView: any

if (Platform.OS !== 'web') {
  const webrtc = require('react-native-webrtc')
  mediaDevices = webrtc.mediaDevices
  RTCPeerConnection = webrtc.RTCPeerConnection
  RTCSessionDescription = webrtc.RTCSessionDescription
  RTCIceCandidate = webrtc.RTCIceCandidate
  MediaStream = webrtc.MediaStream
  RTCView = webrtc.RTCView
} else {
  const win = typeof window !== 'undefined' ? (window as any) : {}
  const nav = typeof navigator !== 'undefined' ? navigator : ({} as any)
  mediaDevices = nav.mediaDevices
  RTCPeerConnection = win.RTCPeerConnection || win.webkitRTCPeerConnection
  RTCSessionDescription =
    win.RTCSessionDescription || win.webkitRTCSessionDescription
  RTCIceCandidate = win.RTCIceCandidate || win.webkitRTCIceCandidate
  MediaStream = win.MediaStream || win.webkitMediaStream
  RTCView = () => null
}

let InCallManager: any
if (Platform.OS !== 'web') {
  InCallManager = require('react-native-incall-manager').default
}

// ============================================
// Type Definitions
// ============================================

export interface WebRTCCallbacks {
  /** Called when local audio stream is obtained */
  onLocalStream?: (stream: MediaStream) => void

  /** Called when remote audio stream is received */
  onRemoteStream?: (stream: MediaStream) => void

  /** Called when ICE candidate is generated */
  onIceCandidate?: (candidate: any) => void

  /** Called when connection state changes */
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void

  /** Called when ICE connection state changes */
  onIceConnectionStateChange?: (state: RTCIceConnectionState) => void

  /** Called on error */
  onError?: (error: Error) => void
}

export type RTCPeerConnectionState =
  | 'new'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'failed'
  | 'closed'

export type RTCIceConnectionState =
  | 'new'
  | 'checking'
  | 'connected'
  | 'completed'
  | 'failed'
  | 'disconnected'
  | 'closed'

import { WEBRTC_CONFIG } from '#/config/demoConfig'

// Get STUN/TURN servers from config (may be augmented with TURN at runtime)
let ICE_SERVERS = {
  iceServers: WEBRTC_CONFIG.iceServers,
}

/**
 * Fetch TURN server credentials from Metered API (if API key is configured)
 * Call this once before making/receiving calls.
 */
async function fetchTurnServers(): Promise<void> {
  const { meteredApiKey, meteredAppName } = WEBRTC_CONFIG
  if (!meteredApiKey || !meteredAppName) {
    console.log('[WebRTC] No Metered API key configured. Using STUN-only (same-network calls only).')
    return
  }

  try {
    console.log('[WebRTC] Fetching TURN credentials from Metered...')
    const response = await fetch(
      `https://${meteredAppName}.metered.live/api/v1/turn/credentials?apiKey=${meteredApiKey}`,
    )
    const turnServers = await response.json()
    console.log('[WebRTC] ✅ Got TURN servers:', turnServers.length, 'entries')

    // Merge: STUN from config + TURN from API
    ICE_SERVERS = {
      iceServers: [...WEBRTC_CONFIG.iceServers, ...turnServers],
    }
  } catch (error) {
    console.error('[WebRTC] ❌ Failed to fetch TURN credentials:', error)
    console.log('[WebRTC] Falling back to STUN-only')
  }
}

// ============================================
// WebRTC Service Class
// ============================================

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null
  private localStream: MediaStream | null = null
  private remoteStream: MediaStream | null = null
  private callbacks: WebRTCCallbacks = {}
  private isAudioEnabled = true
  private pendingCandidates: any[] = []
  private diagTimer: ReturnType<typeof setInterval> | null = null

  /**
   * Initialize WebRTC service with callbacks
   */
  initialize(callbacks: WebRTCCallbacks): void {
    this.callbacks = callbacks
    console.log('[WebRTC] Service initialized')
  }

  /**
   * Get user media (audio only)
   * @returns Promise<MediaStream> Local audio stream
   */
  async getUserMedia(): Promise<MediaStream> {
    try {
      console.log('[WebRTC] Requesting audio permission...')

      // Fetch TURN server credentials (if configured) before creating peer connection
      await fetchTurnServers()

      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: false,
      })

      this.localStream = stream
      this.isAudioEnabled = true

      console.log('[WebRTC] ✅ Local audio stream obtained:', stream.id)
      console.log('[WebRTC] Audio tracks:', stream.getAudioTracks().length)

      // Notify callback
      this.callbacks.onLocalStream?.(stream)

      console.log('[WebRTC] ✅ Local audio stream obtained:', stream.id)
      console.log('[WebRTC] Audio tracks:', stream.getAudioTracks().map(t => ({
        label: t.label,
        enabled: t.enabled,
        muted: t.muted,
        kind: t.kind
      })))

      // CRITICAL: natively configure AudioSession to VoIP mode (play and record)
      if (InCallManager) {
        console.log('[WebRTC] Starting InCallManager...')
        InCallManager.start({ media: 'audio' })
        // Route audio to earpiece by default (user can toggle speaker)
        InCallManager.setForceSpeakerphoneOn(false)
        InCallManager.setMicrophoneMute(false)
      }

      return stream
    } catch (error) {
      console.error('[WebRTC] ❌ getUserMedia error:', error)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Create RTCPeerConnection
   * @returns RTCPeerConnection instance
   */
  createPeerConnection(): RTCPeerConnection {
    if (this.peerConnection) {
      console.warn(
        '[WebRTC] ⚠️  Peer connection already exists, closing old one',
      )
      this.closePeerConnection()
    }

    console.log('[WebRTC] Creating peer connection...')
    console.log('[WebRTC] ICE servers:', ICE_SERVERS)

    const pc = new RTCPeerConnection(ICE_SERVERS)

    // ============================================
    // Event Handlers
    // ============================================

    // Handle ICE candidates
    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        console.log('[WebRTC] 🧊 ICE candidate generated')
        console.log('[WebRTC] Candidate:', event.candidate.candidate)
        
        // Fix: React Native WebRTC candidate might not have toJSON()
        const candidatePayload = typeof event.candidate.toJSON === 'function'
          ? event.candidate.toJSON()
          : {
              candidate: event.candidate.candidate,
              sdpMid: event.candidate.sdpMid,
              sdpMLineIndex: event.candidate.sdpMLineIndex,
            }
            
        this.callbacks.onIceCandidate?.(candidatePayload)
      } else {
        console.log('[WebRTC] 🧊 ICE candidate gathering complete')
      }
    }

    // Handle remote stream (when peer adds their audio)
    pc.ontrack = (event: any) => {
      console.log('[WebRTC] 🎧 Remote track received')
      console.log('[WebRTC] Track kind:', event.track?.kind)
      console.log('[WebRTC] Track enabled:', event.track?.enabled)
      console.log('[WebRTC] Track readyState:', event.track?.readyState)
      console.log('[WebRTC] event.streams length:', event.streams?.length)

      let stream: any = null

      if (event.streams && event.streams.length > 0 && event.streams[0]) {
        stream = event.streams[0]
        console.log('[WebRTC] ✅ Using stream from event.streams[0]:', stream.id)
      } else if (event.track) {
        // CRITICAL FIX: react-native-webrtc sometimes does NOT populate event.streams
        // We must manually create a MediaStream and add the track
        console.log('[WebRTC] ⚠️ event.streams empty, creating MediaStream manually')
        stream = new MediaStream()
        stream.addTrack(event.track)
        console.log('[WebRTC] ✅ Manual MediaStream created with track:', event.track.kind)
      }

      if (stream) {
        this.remoteStream = stream
        console.log('[WebRTC] ✅ Remote stream saved, audio tracks:', stream.getAudioTracks().length)
        this.callbacks.onRemoteStream?.(stream)
      } else {
        console.error('[WebRTC] ❌ No stream or track available in ontrack event!')
      }
    }

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState as RTCPeerConnectionState
      console.log('[WebRTC] 🔌 Connection state:', state)
      this.callbacks.onConnectionStateChange?.(state)

      // Handle connection failure
      if (state === 'failed') {
        console.error('[WebRTC] ❌ Connection failed')
        this.callbacks.onError?.(new Error('WebRTC connection failed'))
      }
    }

    // Handle ICE connection state changes
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState as RTCIceConnectionState
      console.log('[WebRTC] 🧊 ICE connection state:', state)
      this.callbacks.onIceConnectionStateChange?.(state)

      // Handle ICE failure
      if (state === 'failed') {
        console.error('[WebRTC] ❌ ICE connection failed')
        this.callbacks.onError?.(new Error('ICE connection failed'))
      }
    }

    // Handle ICE gathering state changes
    pc.onicegatheringstatechange = () => {
      console.log('[WebRTC] 🧊 ICE gathering state:', pc.iceGatheringState)
    }

    // Handle signaling state changes
    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] 📡 Signaling state:', pc.signalingState)
    }

    this.peerConnection = pc
    console.log('[WebRTC] ✅ Peer connection created')

    // Start diagnostic timer to monitor connection state
    this.startDiagnostics()

    return pc
  }

  /**
   * Diagnostic timer - logs connection state every 3 seconds
   */
  private startDiagnostics(): void {
    this.stopDiagnostics()
    this.diagTimer = setInterval(() => {
      if (!this.peerConnection) {
        this.stopDiagnostics()
        return
      }
      const iceState = this.peerConnection.iceConnectionState
      const connState = this.peerConnection.connectionState
      const sigState = this.peerConnection.signalingState
      const localTracks = this.localStream?.getAudioTracks()?.length ?? 0
      const remoteTracks = this.remoteStream?.getAudioTracks()?.length ?? 0
      const localEnabled = this.localStream?.getAudioTracks()?.[0]?.enabled
      const remoteEnabled = this.remoteStream?.getAudioTracks()?.[0]?.enabled

      console.log(
        `[WebRTC-DIAG] ICE=${iceState} | Conn=${connState} | Sig=${sigState} | ` +
        `LocalTracks=${localTracks}(enabled=${localEnabled}) | RemoteTracks=${remoteTracks}(enabled=${remoteEnabled})`
      )
    }, 3000)
  }

  private stopDiagnostics(): void {
    if (this.diagTimer) {
      clearInterval(this.diagTimer)
      this.diagTimer = null
    }
  }

  /**
   * Add local stream to peer connection
   * Must be called after getUserMedia() and createPeerConnection()
   */
  addLocalStream(): void {
    if (!this.peerConnection) {
      throw new Error(
        'Peer connection not initialized. Call createPeerConnection() first.',
      )
    }

    if (!this.localStream) {
      throw new Error('Local stream not available. Call getUserMedia() first.')
    }

    console.log('[WebRTC] Adding local stream to peer connection...')

    this.localStream.getTracks().forEach(track => {
      if (this.peerConnection && this.localStream) {
        this.peerConnection.addTrack(track, this.localStream)
        console.log('[WebRTC] ✅ Added track:', track.kind, '- ID:', track.id)
      }
    })

    console.log('[WebRTC] ✅ Local stream added to peer connection')
  }

  /**
   * Create SDP offer (caller side)
   * @returns Promise<any> SDP offer
   */
  async createOffer(): Promise<any> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      console.log('[WebRTC] Creating SDP offer...')

      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      })

      console.log('[WebRTC] ✅ SDP offer created')
      console.log('[WebRTC] Offer type:', offer.type)
      console.log('[WebRTC] Offer SDP length:', offer.sdp?.length || 0)

      await this.peerConnection.setLocalDescription(offer)
      console.log('[WebRTC] ✅ Local description set')

      return offer
    } catch (error) {
      console.error('[WebRTC] ❌ Create offer error:', error)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Create SDP answer (receiver side)
   * @param offer Remote SDP offer
   * @returns Promise<any> SDP answer
   */
  async createAnswer(offer: any): Promise<any> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      console.log('[WebRTC] Setting remote description (offer)...')
      console.log('[WebRTC] Offer type:', offer.type)

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer),
      )
      console.log('[WebRTC] ✅ Remote description set')

      this.processPendingCandidates()

      console.log('[WebRTC] Creating SDP answer...')
      const answer = await this.peerConnection.createAnswer()

      console.log('[WebRTC] ✅ SDP answer created')
      console.log('[WebRTC] Answer type:', answer.type)
      console.log('[WebRTC] Answer SDP length:', answer.sdp?.length || 0)

      await this.peerConnection.setLocalDescription(answer)
      console.log('[WebRTC] ✅ Local description set')

      return answer
    } catch (error) {
      console.error('[WebRTC] ❌ Create answer error:', error)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Set remote answer (caller side)
   * @param answer Remote SDP answer
   */
  async setRemoteAnswer(answer: any): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      console.log('[WebRTC] Setting remote description (answer)...')
      console.log('[WebRTC] Answer type:', answer.type)

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer),
      )
      console.log('[WebRTC] ✅ Remote description set')
      
      this.processPendingCandidates()
    } catch (error) {
      console.error('[WebRTC] ❌ Set remote answer error:', error)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Add received ICE candidate
   * @param candidate ICE candidate from remote peer
   */
  async addIceCandidate(candidate: any): Promise<void> {
    if (!this.peerConnection || !this.peerConnection.remoteDescription) {
      console.log(
        '[WebRTC] ⏳ Queuing ICE candidate (peer connection/remote description not ready)',
      )
      this.pendingCandidates.push(candidate)
      return
    }

    try {
      console.log('[WebRTC] Adding ICE candidate...')
      console.log('[WebRTC] Candidate:', candidate.candidate)

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      console.log('[WebRTC] ✅ ICE candidate added')
    } catch (error) {
      console.error('[WebRTC] ⚠️  Add ICE candidate error:', error)
      // Don't throw - ICE candidates can fail gracefully
    }
  }

  private async processPendingCandidates() {
    if (this.pendingCandidates.length > 0) {
      console.log(`[WebRTC] 🔄 Processing ${this.pendingCandidates.length} queued ICE candidates`)
      for (const candidate of this.pendingCandidates) {
        try {
          await this.peerConnection?.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (error) {
          console.error('[WebRTC] ⚠️  Process queued candidate error:', error)
        }
      }
      this.pendingCandidates = []
      console.log('[WebRTC] ✅ All queued candidates processed')
    }
  }

  /**
   * Mute/unmute local audio
   * @param enabled true to enable audio, false to mute
   */
  setAudioEnabled(enabled: boolean): void {
    if (!this.localStream) {
      console.warn('[WebRTC] ⚠️  No local stream to mute/unmute')
      return
    }

    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = enabled
    })

    this.isAudioEnabled = enabled
    console.log(`[WebRTC] 🎤 Audio ${enabled ? 'enabled' : 'muted'}`)
  }

  /**
   * Check if audio is enabled
   * @returns boolean
   */
  isAudioMuted(): boolean {
    return !this.isAudioEnabled
  }

  /**
   * Get connection state
   * @returns RTCPeerConnectionState | null
   */
  getConnectionState(): RTCPeerConnectionState | null {
    return (
      (this.peerConnection?.connectionState as RTCPeerConnectionState) || null
    )
  }

  /**
   * Get ICE connection state
   * @returns RTCIceConnectionState | null
   */
  getIceConnectionState(): RTCIceConnectionState | null {
    return (
      (this.peerConnection?.iceConnectionState as RTCIceConnectionState) || null
    )
  }

  /**
   * Get local stream
   * @returns MediaStream | null
   */
  getLocalStream(): MediaStream | null {
    return this.localStream
  }

  /**
   * Get remote stream
   * @returns MediaStream | null
   */
  getRemoteStream(): MediaStream | null {
    return this.remoteStream
  }

  /**
   * Close peer connection only (keep streams)
   */
  private closePeerConnection(): void {
    if (this.peerConnection) {
      console.log('[WebRTC] Closing peer connection...')
      this.peerConnection.close()
      this.peerConnection = null
      console.log('[WebRTC] ✅ Peer connection closed')
    }
  }

  /**
   * Close connection and cleanup all resources
   */
  close(): void {
    // Stop diagnostics
    this.stopDiagnostics()

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop()
        console.log('[WebRTC] 🛑 Stopped local track:', track.kind)
      })
      this.localStream = null
    }

    // Close peer connection
    this.closePeerConnection()

    // Clear remote stream reference
    this.remoteStream = null
    this.pendingCandidates = []

    // Reset state
    this.isAudioEnabled = true

    // Stop native audio session
    if (InCallManager) {
      console.log('[WebRTC] Stopping InCallManager...')
      InCallManager.stop()
    }

    console.log('[WebRTC] ✅ WebRTC service closed')
  }

  /**
   * Restart ICE (useful when connection fails)
   */
  async restartIce(): Promise<void> {
    if (!this.peerConnection) {
      console.warn('[WebRTC] ⚠️  No peer connection to restart ICE')
      return
    }

    try {
      console.log('[WebRTC] Restarting ICE...')
      const offer = await this.peerConnection.createOffer({ iceRestart: true })
      await this.peerConnection.setLocalDescription(offer)
      console.log('[WebRTC] ✅ ICE restart initiated')
    } catch (error) {
      console.error('[WebRTC] ❌ ICE restart error:', error)
      this.callbacks.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Get WebRTC statistics
   * @returns Promise<RTCStatsReport>
   */
  async getStats(): Promise<any> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized')
    }

    try {
      const stats = await this.peerConnection.getStats()
      console.log('[WebRTC] 📊 Stats retrieved')
      return stats
    } catch (error) {
      console.error('[WebRTC] ❌ Get stats error:', error)
      throw error
    }
  }
}

// ============================================
// Singleton Instance
// ============================================

export const webrtcService = new WebRTCService()

// ============================================
// Usage Example (for reference)
// ============================================

/*
// 1. Initialize with callbacks
webrtcService.initialize({
  onLocalStream: (stream) => {
    console.log('Got local stream:', stream.id)
  },
  onRemoteStream: (stream) => {
    console.log('Got remote stream:', stream.id)
  },
  onIceCandidate: (candidate) => {
    // Send to remote peer via signaling
    signalingService.sendIceCandidate(remotePeerId, candidate)
  },
  onConnectionStateChange: (state) => {
    console.log('Connection state:', state)
  },
  onError: (error) => {
    console.error('WebRTC error:', error)
  },
})

// 2. CALLER FLOW
// Get audio permission
const localStream = await webrtcService.getUserMedia()

// Create peer connection
webrtcService.createPeerConnection()

// Add local audio to connection
webrtcService.addLocalStream()

// Create offer
const offer = await webrtcService.createOffer()

// Send offer to remote peer via signaling
await signalingService.sendCallOffer(remotePeerId, offer)

// 3. RECEIVER FLOW
// Get audio permission
const localStream = await webrtcService.getUserMedia()

// Create peer connection
webrtcService.createPeerConnection()

// Add local audio to connection
webrtcService.addLocalStream()

// Create answer
const answer = await webrtcService.createAnswer(remoteOffer)

// Send answer to remote peer via signaling
await signalingService.sendCallAnswer(remotePeerId, answer)

// 4. BOTH PEERS
// Add ICE candidates as they arrive
webrtcService.addIceCandidate(remoteCandidate)

// 5. MUTE/UNMUTE
webrtcService.setAudioEnabled(false) // Mute
webrtcService.setAudioEnabled(true)  // Unmute

// 6. END CALL
webrtcService.close()
*/
