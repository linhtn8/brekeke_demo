import type { FC } from 'react'
import { StyleSheet } from 'react-native'
import type { LinearGradientProps } from 'react-native-linear-gradient'
import LinearGradient from 'react-native-linear-gradient'

import { v } from '#/components/variables'
import { DEMO_COLORS, DEMO_MODE } from '#/config/demoConfig'

const css = StyleSheet.create({
  BrekekeGradient: {
    height: '100%',
    minHeight: 550,
  },
})

// Get gradient colors based on mode
const getGradientColors = (white?: boolean): string[] => {
  if (white) {
    return ['white', 'white']
  }
  if (DEMO_MODE) {
    // Dark blue gradient for demo mode
    return [...DEMO_COLORS.gradient]
  }
  // Original Brekeke gradient
  return [v.colors.primaryFn(0.2), v.revBg]
}

export type BrekekeGradientProps = Omit<LinearGradientProps, 'colors'> & {
  white?: boolean
}
export const BrekekeGradient: FC<BrekekeGradientProps> = props => (
  <LinearGradient
    {...props}
    colors={getGradientColors(props.white)}
    style={[css.BrekekeGradient, props.style]}
  />
)
