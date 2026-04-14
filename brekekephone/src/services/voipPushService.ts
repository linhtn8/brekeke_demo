import { Platform } from 'react-native'
import RNCallKeep from 'react-native-callkeep'
import VoipPushNotification from 'react-native-voip-push-notification'

import { PHASE_3_ENABLED } from '#/config/demoConfig'
import { signalingService } from '#/services/signalingService'

class VoipPushService {
  private initialized = false
  private currentCallId: string | null = null

  public init() {
    if (!PHASE_3_ENABLED || Platform.OS !== 'ios' || this.initialized) {
      return
    }

    console.log('[VoIP] Initializing VoipPushService...')
    this.setupCallKeep()
    this.setupVoipPush()
    this.initialized = true
  }

  private setupCallKeep() {
    const options = {
      ios: {
        appName: 'BAP Phone',
        imageName: 'CallKitLogo',
        supportsVideo: false,
        maximumCallGroups: '1',
        maximumCallsPerCallGroup: '1',
        includesCallsInRecents: true,
      },
      android: {
        alertTitle: 'Permissions Required',
        alertDescription:
          'This application needs to access your phone calling accounts to make calls',
        cancelButton: 'Cancel',
        okButton: 'ok',
        imageName: 'CallKitLogo',
        additionalPermissions: [] as string[],
      },
    }

    try {
      RNCallKeep.setup(options).then(accepted => {
        console.log('[VoIP] CallKeep setup accepted:', accepted)
      })

      // Set up CallKit event listeners
      RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
        console.log('[VoIP] User answered call from CallKit:', callUUID)
        this.currentCallId = callUUID

        import('#/stores/ctx')
          .then(({ ctx }) => {
            if (
              ctx.webrtc.currentCall.isIncoming &&
              ctx.webrtc.currentCall.remoteOffer
            ) {
              console.log(
                '[VoIP] Call offer already present, accepting immediately',
              )
              ctx.webrtc.acceptCall()
            } else {
              console.log(
                '[VoIP] Waiting for WebRTC offer to arrive via WebSocket...',
              )
              ctx.webrtc.pendingAcceptCall = true
            }
          })
          .catch(err => console.error('[VoIP] Failed to accept call:', err))
      })

      RNCallKeep.addEventListener('endCall', ({ callUUID }) => {
        console.log('[VoIP] User ended/rejected call from CallKit:', callUUID)
        this.currentCallId = null

        import('#/stores/ctx')
          .then(({ ctx }) => {
            ctx.webrtc.pendingAcceptCall = false
            if (ctx.webrtc.currentCall.isActive) {
              ctx.webrtc.rejectCall()
              ctx.webrtc.endCall(true)
            }
          })
          .catch(err => console.error('[VoIP] Failed to reject call:', err))
      })
    } catch (err) {
      console.error('[VoIP] Error setting up CallKeep:', err)
    }
  }

  private setupVoipPush() {
    try {
      // 1. Request VoIP push permissions (this triggers OS to give us the apnsToken)
      VoipPushNotification.registerVoipToken()

      // 2. Listen for the token
      VoipPushNotification.addEventListener('register', (token: string) => {
        console.log('[VoIP] Registered with APNs token:', token)
        // Store token in signalingService so it sends to backend upon websocket connection
        signalingService.setApnsToken(token)
      })

      // 3. Listen for incoming VoIP Push (Background / Killed state)
      VoipPushNotification.addEventListener(
        'notification',
        (notification: any) => {
          console.log('[VoIP] Received VoIP Push notification:', notification)

          // Parse payload matching our backend server.js format
          const uuid = notification?.uuid || 'unknown-uuid'
          const callerName = notification?.callerName || 'Unknown Caller'
          const callerId = notification?.callerId || 'Unknown Number'
          const type = notification?.type || 'call-offer'

          if (type === 'call-cancel') {
            console.log('[VoIP] Received call-cancel push. Closing CallKit UI.')
            RNCallKeep.endCall(uuid)
            import('#/stores/ctx').then(({ ctx }) => {
              ctx.webrtc.pendingAcceptCall = false
              if (ctx.webrtc.currentCall.isActive) {
                ctx.webrtc.endCall(true)
              }
            })
          } else {
            // Display the native iOS ringing UI for incoming call
            RNCallKeep.displayIncomingCall(
              uuid,
              callerId,
              callerName,
              'number',
              false,
            )
          }

          // Acknowledge to OS
          if (uuid !== 'unknown-uuid') {
            VoipPushNotification.onVoipNotificationCompleted(uuid)
          }
        },
      )
    } catch (err) {
      console.error('[VoIP] Error setting up VoIP Push:', err)
    }
  }

  public reportEndCall(callId: string) {
    if (!PHASE_3_ENABLED || Platform.OS !== 'ios') {
      return
    }
    try {
      RNCallKeep.endCall(callId)
    } catch (err) {
      console.error('[VoIP] Error ending CallKeep call:', err)
    }
  }

  public displayCallKit(uuid: string, callerId: string, callerName: string) {
    if (!PHASE_3_ENABLED || Platform.OS !== 'ios') {
      return
    }
    const { AppState } = require('react-native')
    if (AppState.currentState === 'active') {
      console.log('[VoIP] App is active, skipping CallKit UI for incoming call')
      return
    }
    try {
      console.log(`[VoIP] Forcing CallKit display for WS incoming call: ${uuid}`)
      RNCallKeep.displayIncomingCall(
        uuid,
        callerId,
        callerName,
        'number',
        false,
      )
    } catch (err) {
      console.error('[VoIP] Error displaying CallKit natively:', err)
    }
  }

  public reportAnswerCall(callId: string) {
    if (!PHASE_3_ENABLED || Platform.OS !== 'ios') {
      return
    }
    try {
      console.log(`[VoIP] Programmatically answering CallKit for call: ${callId}`)
      RNCallKeep.answerIncomingCall(callId)
    } catch (err) {
      console.error('[VoIP] Error answering CallKeep call:', err)
    }
  }
}

export const voipPushService = new VoipPushService()
