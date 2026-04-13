import { action, computed, observable } from 'mobx'

import { DEMO_CONTACTS, WEBRTC_CONFIG } from '#/config/demoConfig'
import { signalingService } from '#/services/signalingService'
import { webrtcService } from '#/services/webrtcService'
import { ctx } from '#/stores/ctx'

export interface DemoContact {
  id: string
  name: string
  phone: string
  avatar?: string
  department?: string
}

export interface WebRTCCallState {
  isActive: boolean
  callee: DemoContact | null
  startTime: number | null
  status: 'connecting' | 'ringing' | 'connected' | 'ended' | 'rejected'
  isIncoming?: boolean
  remoteOffer?: any
}

export class WebRTCStore {
  @observable currentCall: WebRTCCallState = {
    isActive: false,
    callee: null,
    startTime: null,
    status: 'ended',
  }
  @observable onlineUsers: string[] = []
  @observable isAudioMuted: boolean = false
  @observable remoteStream: any = null

  // Phase 3: Flag to indicate user already tapped "Answer" from CallKit but we are waiting for WebSocket offer
  public pendingAcceptCall: boolean = false

  private callTimeoutTimer: ReturnType<typeof setTimeout> | null = null
  private durationInterval: ReturnType<typeof setInterval> | null = null
  @observable callDurationSeconds: number = 0

  constructor() {
    this.setupServices()
  }

  private setupServices() {
    signalingService.initialize({
      onConnected: action(() => {
        console.log('[WebRTCStore] Connected to signaling server')
      }),
      onDisconnected: action(() => {
        console.log('[WebRTCStore] Disconnected from signaling server')
        ctx.toast.warning('Disconnected from signaling server')
        if (this.currentCall.isActive) {
          this.endCall(true) // force end
        }
      }),
      onRegistered: action(({ onlineUsers }) => {
        this.onlineUsers = onlineUsers
      }),
      onUserOnline: action(({ userId }) => {
        if (!this.onlineUsers.includes(userId)) {
          this.onlineUsers.push(userId)
        }
      }),
      onUserOffline: action(({ userId }) => {
        this.onlineUsers = this.onlineUsers.filter(id => id !== userId)
        if (
          this.currentCall.isActive &&
          this.currentCall.callee?.phone === userId
        ) {
          ctx.toast.info(`User ${userId} went offline.`)
          this.endCall(true)
        }
      }),
      onIncomingCall: action(({ from, offer }) => {
        if (this.currentCall.isActive) {
          // Busy: Already in a call
          signalingService.rejectCall(from, 'busy')
          return
        }
        const contact = DEMO_CONTACTS.find(c => c.phone === from) || {
          id: from,
          name: from,
          phone: from,
        }
        this.currentCall = {
          isActive: true,
          callee: contact,
          startTime: null,
          status: 'ringing',
          isIncoming: true,
          remoteOffer: offer,
        }

        // Phase 3: If user already tapped Answer from CallKit while app was waking up
        if (this.pendingAcceptCall) {
          console.log('[WebRTCStore] Auto-accepting call from pending state')
          this.pendingAcceptCall = false
          this.acceptCall()
          return
        }

        // Start timeout for incoming call
        this.startCallTimeout(() => {
          ctx.toast.warning('Call missed')
          this.endCall(true)
        })
      }),
      onCallAnswer: action(async ({ from, answer }) => {
        this.clearCallTimeout()
        try {
          await webrtcService.setRemoteAnswer(answer)
          this.currentCall.status = 'connected'
          this.startDurationTimer()
        } catch (error) {
          ctx.toast.error({ err: new Error('Failed to set remote answer') })
          this.endCall(true)
        }
      }),
      onCallRejected: action(({ reason }) => {
        this.clearCallTimeout()
        ctx.toast.info(reason === 'busy' ? 'User is busy' : 'Call rejected')
        this.endCall(true)
      }),
      onCallEnded: action(() => {
        this.endCall(true)
      }),
      onIceCandidate: action(({ candidate }) => {
        webrtcService.addIceCandidate(candidate)
      }),
      onError: action(({ message }) => {
        ctx.toast.error({ message: { label: message, en: message } })
      }),
    })

    webrtcService.initialize({
      onLocalStream: action(stream => {
        // UI can bind to this if needed
      }),
      onRemoteStream: action(stream => {
        this.remoteStream = stream
      }),
      onIceCandidate: candidate => {
        if (this.currentCall.callee) {
          signalingService.sendIceCandidate(
            this.currentCall.callee.phone,
            candidate,
          )
        }
      },
      onConnectionStateChange: action(state => {
        if (
          state === 'failed' ||
          state === 'disconnected' ||
          state === 'closed'
        ) {
          ctx.toast.warning('Connection lost')
          this.endCall(true)
        }
      }),
      onError: action(error => {
        ctx.toast.error(
          { message: { label: error.message, en: error.message } },
          3000,
        )
      }),
    })
  }

  private startCallTimeout(onTimeout: () => void) {
    this.clearCallTimeout()
    this.callTimeoutTimer = setTimeout(
      onTimeout,
      WEBRTC_CONFIG.callTimeout || 30000,
    )
  }

  private clearCallTimeout() {
    if (this.callTimeoutTimer) {
      clearTimeout(this.callTimeoutTimer)
      this.callTimeoutTimer = null
    }
  }

  private startDurationTimer() {
    this.currentCall.startTime = Date.now()
    this.callDurationSeconds = 0
    if (this.durationInterval) {
      clearInterval(this.durationInterval)
    }
    this.durationInterval = setInterval(
      action(() => {
        this.callDurationSeconds++
      }),
      1000,
    )
  }

  private clearDurationTimer() {
    if (this.durationInterval) {
      clearInterval(this.durationInterval)
      this.durationInterval = null
    }
    this.callDurationSeconds = 0
  }

  @action connect(userId: string, name: string) {
    signalingService
      .connect(WEBRTC_CONFIG.signalingServerUrl, userId, name)
      .catch(e => {
        ctx.toast.error({
          err: new Error('Failed to connect to signaling server'),
        })
      })
  }

  @action disconnect() {
    signalingService.disconnect()
  }

  @action async startCall(contactId: string): Promise<boolean> {
    if (this.currentCall.isActive) {
      ctx.toast.warning('Already in a call')
      return false
    }

    const contact = DEMO_CONTACTS.find(c => c.id === contactId) || {
      id: contactId,
      name: contactId,
      phone: contactId,
    }
    if (!this.onlineUsers.includes(contact.phone)) {
      ctx.toast.warning('User is offline')
      return false
    }

    this.currentCall = {
      isActive: true,
      callee: contact,
      startTime: null,
      status: 'connecting',
      isIncoming: false,
    }

    try {
      await webrtcService.getUserMedia()
      webrtcService.createPeerConnection()
      webrtcService.addLocalStream()
      const offer = await webrtcService.createOffer()

      signalingService.sendCallOffer(
        contact.phone,
        offer,
        ctx.auth.signedInId || 'Me',
      )
      this.currentCall.status = 'ringing'

      this.startCallTimeout(() => {
        ctx.toast.info('No answer')
        this.endCall()
      })
      return true
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.message?.includes('permission')) {
        ctx.toast.error({ err: new Error('Microphone permission denied') })
      } else {
        ctx.toast.error({ err: new Error('Failed to start call') })
      }
      this.resetCallState()
      return false
    }
  }

  @action async acceptCall() {
    if (!this.currentCall.isIncoming || !this.currentCall.remoteOffer) {
      return
    }
    this.clearCallTimeout()
    try {
      await webrtcService.getUserMedia()
      webrtcService.createPeerConnection()
      webrtcService.addLocalStream()
      const answer = await webrtcService.createAnswer(
        this.currentCall.remoteOffer,
      )

      signalingService.sendCallAnswer(this.currentCall.callee!.phone, answer)
      this.currentCall.status = 'connected'
      this.startDurationTimer()
    } catch (e: any) {
      if (e?.name === 'NotAllowedError' || e?.message?.includes('permission')) {
        ctx.toast.error({ err: new Error('Microphone permission denied') })
      } else {
        ctx.toast.error({ err: new Error('Failed to accept call') })
      }
      this.endCall(true) // end cleanly
    }
  }

  @action rejectCall() {
    if (this.currentCall.callee && this.currentCall.isIncoming) {
      signalingService.rejectCall(this.currentCall.callee.phone, 'declined')
    }
    this.resetCallState()
  }

  @action endCall(force: boolean = false) {
    if (!force && this.currentCall.callee && this.currentCall.isActive) {
      signalingService.endCall(this.currentCall.callee.phone)
    }
    this.resetCallState()
  }

  @action private resetCallState() {
    this.clearCallTimeout()
    this.clearDurationTimer()
    webrtcService.close()

    this.currentCall = {
      isActive: false,
      callee: null,
      startTime: null,
      status: 'ended',
    }
    this.isAudioMuted = false
    this.remoteStream = null
  }

  @action toggleMute() {
    this.isAudioMuted = !this.isAudioMuted
    webrtcService.setAudioEnabled(!this.isAudioMuted)
  }

  @computed get callStatusText(): string {
    switch (this.currentCall.status) {
      case 'connecting':
        return 'Connecting...'
      case 'ringing':
        return this.currentCall.isIncoming ? 'Incoming Call...' : 'Ringing...'
      case 'connected':
        return 'Connected'
      case 'ended':
        return 'Call Ended'
      case 'rejected':
        return 'Call Rejected'
      default:
        return ''
    }
  }
}

export const webrtcStore = new WebRTCStore()
ctx.webrtc = webrtcStore
