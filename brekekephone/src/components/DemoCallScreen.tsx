import { observer } from 'mobx-react'
import { useEffect, useRef, useState } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { RTCView } from 'react-native-webrtc'

import {
  mdiMicrophone,
  mdiMicrophoneOff,
  mdiPhoneHangup,
  mdiVolumeHigh,
  mdiVolumeMedium,
} from '#/assets/icons'
import { BrekekeGradient } from '#/components/BrekekeGradient'
import { ButtonIcon } from '#/components/ButtonIcon'
import { RnText } from '#/components/RnText'
import { v } from '#/components/variables'
import { PHASE_2_ENABLED } from '#/config/demoConfig'
import { ctx } from '#/stores/ctx'
import { demoStore } from '#/stores/demoStore'

const css = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    lineHeight: 48,
    color: 'white',
  },
  calleeName: {
    fontSize: 28,
    fontWeight: 'bold',
    lineHeight: 28,
    color: 'white',
    marginBottom: 10,
    textAlign: 'center',
  },
  calleePhone: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 20,
  },
  statusContainer: {
    marginBottom: 40,
  },
  statusText: {
    fontSize: 20,
    lineHeight: 20,
    color: 'white',
    textAlign: 'center',
  },
  timerText: {
    fontSize: 24,
    lineHeight: 24,
    color: 'white',
    fontWeight: '600',
    marginTop: 10,
    textAlign: 'center',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 30,
  },
  hangupButton: {
    marginTop: 20,
  },
  noCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noCallText: {
    fontSize: 18,
    lineHeight: 18,
    color: 'white',
  },
})

// Format seconds to MM:SS
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const WebAudio = ({ stream }: { stream: any }) => {
  const audioRef = useRef<any>(null)
  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream
      // Explicitly play to bypass Safari iOS restrictions
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((e: any) => {
          console.warn('[WebAudio] Autoplay prevented:', e)
        })
      }
    }
  }, [stream])
  
  // Use width 0 instead of display:none, and add playsInline for iOS
  return <audio ref={audioRef} autoPlay playsInline style={{ width: 0, height: 0, opacity: 0, position: 'absolute' }} />
}

export const DemoCallScreen = observer(() => {
  const [elapsedTime, setElapsedTime] = useState(0)

  // Update elapsed time every second when call is active
  useEffect(() => {
    if (!demoStore.getActiveCall.isActive) {
      setElapsedTime(0)
      return
    }

    const interval = setInterval(() => {
      if (demoStore.getActiveCall.startTime) {
        const elapsed = Math.floor(
          (Date.now() - demoStore.getActiveCall.startTime) / 1000,
        )
        setElapsedTime(elapsed)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [demoStore.getActiveCall.isActive, demoStore.getActiveCall.startTime])

  const handleEndCall = () => {
    demoStore.endMockCall()
    ctx.nav.goToPageContactUsers()
  }

  const handleToggleMute = () => {
    if (PHASE_2_ENABLED) {
      ctx.webrtc.toggleMute()
    }
  }

  const handleToggleSpeaker = () => {
    ctx.call.toggleLoudSpeaker()
  }

  // If no active call, show message
  if (!demoStore.getActiveCall.isActive || !demoStore.getActiveCall.callee) {
    return (
      <BrekekeGradient>
        <View style={css.noCallContainer}>
          <RnText style={css.noCallText}>No active call</RnText>
        </View>
      </BrekekeGradient>
    )
  }

  const { callee, status } = demoStore.getActiveCall
  const isMuted = PHASE_2_ENABLED ? ctx.webrtc.isAudioMuted : false
  const isSpeakerOn = ctx.call.isLoudSpeakerEnabled

  // Get initials for avatar
  const initials = callee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'connecting':
        return 'Connecting...'
      case 'ringing':
        return 'Ringing...'
      case 'connected':
        return 'Connected'
      default:
        return ''
    }
  }

  return (
    <BrekekeGradient>
      <View style={css.container}>
        {/* Avatar */}
        <View style={css.avatar}>
          <RnText style={css.avatarText}>{initials}</RnText>
        </View>

        {/* Callee Info */}
        <RnText style={css.calleeName}>{callee.name}</RnText>
        <RnText style={css.calleePhone}>{callee.phone}</RnText>

        {/* Call Status */}
        <View style={css.statusContainer}>
          <RnText style={css.statusText}>{getStatusText()}</RnText>
          {status === 'connected' && (
            <RnText style={css.timerText}>{formatTime(elapsedTime)}</RnText>
          )}
        </View>

        {/* Call Controls */}
        {status === 'connected' && (
          <View style={css.controlsContainer}>
            <ButtonIcon
              bgcolor={isMuted ? v.colors.primary : 'white'}
              color={isMuted ? 'white' : 'black'}
              noborder
              onPress={handleToggleMute}
              path={isMuted ? mdiMicrophoneOff : mdiMicrophone}
              size={40}
              name={isMuted ? 'UNMUTE' : 'MUTE'}
              textcolor='white'
            />
            <ButtonIcon
              bgcolor={isSpeakerOn ? v.colors.primary : 'white'}
              color={isSpeakerOn ? 'white' : 'black'}
              noborder
              onPress={handleToggleSpeaker}
              path={isSpeakerOn ? mdiVolumeHigh : mdiVolumeMedium}
              size={40}
              name='SPEAKER'
              textcolor='white'
            />
          </View>
        )}

        {/* Remote audio stream for Phase 2 WebRTC - Web only */}
        {/* On native iOS, audio plays automatically via RTCAudioSession (no RTCView needed) */}
        {PHASE_2_ENABLED &&
          Platform.OS === 'web' &&
          ctx.webrtc.remoteStream && (
            <WebAudio stream={ctx.webrtc.remoteStream} />
          )}

        {/* Hangup Button */}
        <View style={css.hangupButton}>
          <ButtonIcon
            bgcolor={v.colors.danger}
            color='white'
            noborder
            onPress={handleEndCall}
            path={mdiPhoneHangup}
            size={50}
            name='END CALL'
            textcolor='white'
          />
        </View>
      </View>
    </BrekekeGradient>
  )
})
