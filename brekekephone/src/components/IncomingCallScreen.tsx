import { observer } from 'mobx-react'
import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import IncallManager from 'react-native-incall-manager'

import { mdiPhone, mdiPhoneHangup } from '#/assets/icons'
import { BrekekeGradient } from '#/components/BrekekeGradient'
import { ButtonIcon } from '#/components/ButtonIcon'
import { RnText } from '#/components/RnText'
import { v } from '#/components/variables'
import { ctx } from '#/stores/ctx'

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
    color: 'white',
    lineHeight: 28,
    marginBottom: 10,
    textAlign: 'center',
  },
  calleePhone: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
    marginBottom: 20,
  },
  statusText: {
    fontSize: 20,
    color: 'white',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 60,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 40,
  },
})

export const IncomingCallScreen = observer(() => {
  useEffect(() => {
    // Start playing ringtone when the screen mounts
    IncallManager?.startRingtone('_BUNDLE_', [], 'ios_category', 0)

    return () => {
      // Stop ringtone when answered, rejected, or unmounted
      IncallManager?.stopRingtone()
    }
  }, [])

  const handleAccept = () => {
    ctx.webrtc.acceptCall()
  }

  const handleReject = () => {
    ctx.webrtc.rejectCall()
    ctx.nav.goToPageContactUsers()
  }

  const { callee, status } = ctx.webrtc.currentCall

  if (!callee) {
    return null
  }

  const initials = callee.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <BrekekeGradient>
      <View style={css.container}>
        <View style={css.avatar}>
          <RnText style={css.avatarText}>{initials}</RnText>
        </View>

        <RnText style={css.calleeName}>{callee.name}</RnText>
        <RnText style={css.calleePhone}>{callee.phone}</RnText>

        <RnText style={css.statusText}>Incoming Call...</RnText>

        <View style={css.buttonsContainer}>
          <ButtonIcon
            bgcolor={v.colors.primary}
            color='white'
            noborder
            onPress={handleAccept}
            path={mdiPhone}
            size={50}
            name='ANSWER'
            textcolor='white'
          />
          <ButtonIcon
            bgcolor={v.colors.danger}
            color='white'
            noborder
            onPress={handleReject}
            path={mdiPhoneHangup}
            size={50}
            name='REJECT'
            textcolor='white'
          />
        </View>
      </View>
    </BrekekeGradient>
  )
})
