import { observer } from 'mobx-react'
import { useEffect, useRef } from 'react'
import { Animated, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { RnText } from '#/components/Rn'
import { ctx } from '#/stores/ctx'
import type { ToastType } from '#/stores/toastStore'

const getColors = (type: ToastType) => {
  switch (type) {
    case 'success':
      return { bg: '#1DB954', icon: '✓' }
    case 'error':
      return { bg: '#E53935', icon: '✕' }
    case 'warning':
      return { bg: '#F57C00', icon: '⚠' }
    default:
      return { bg: '#1565C0', icon: 'ℹ' }
  }
}

const s = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginHorizontal: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
    minWidth: 150,
    maxWidth: 340,
  },
  icon: {
    fontSize: 14,
    color: 'white',
    fontWeight: 'bold',
  },
  text: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flexShrink: 1,
  },
  errorDetail: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    flexShrink: 1,
  },
})

const TOAST_DISPLAY_DURATION = 2700

const Item = observer(
  ({
    data,
    onEnd,
  }: {
    data: {
      id: string
      msg: string | undefined
      type: ToastType
      err?: Error
    }
    onEnd: () => void
  }) => {
    const fade = useRef(new Animated.Value(0)).current
    const translateY = useRef(new Animated.Value(-10)).current
    const { bg, icon } = getColors(data.type)

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start()

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fade, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -10,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start(onEnd)
      }, TOAST_DISPLAY_DURATION)

      return () => clearTimeout(timer)
    }, [fade, translateY, onEnd])

    const errorDetail = data.err?.message

    return (
      <Animated.View
        style={[
          s.item,
          {
            backgroundColor: bg,
            opacity: fade,
            transform: [{ translateY }],
          },
        ]}
      >
        <RnText style={s.icon}>{icon}</RnText>
        <View style={{ flex: 1 }}>
          {data?.msg && (
            <RnText numberOfLines={2} ellipsizeMode='tail' style={s.text}>
              {data.msg}
            </RnText>
          )}
          {errorDetail && (
            <RnText numberOfLines={2} ellipsizeMode='tail' style={s.errorDetail}>
              {errorDetail}
            </RnText>
          )}
        </View>
      </Animated.View>
    )
  },
)

export const ToastRoot = observer(() => {
  const insets = useSafeAreaInsets()
  return (
    <View style={[s.root, { top: insets.top + 8 }]}>
      {ctx.toast.items.map(t => (
        <Item key={t.id} data={t} onEnd={() => ctx.toast.hide(t.id)} />
      ))}
    </View>
  )
})
