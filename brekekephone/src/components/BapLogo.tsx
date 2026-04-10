/**
 * BAP Logo Component
 *
 * Displays the BAP logo for demo mode.
 * Falls back to text "BAP" if logo image is not available.
 */

import type { FC } from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'

import { DEMO_BRANDING, DEMO_COLORS } from '#/config/demoConfig'

interface BapLogoProps {
  /** Size of the logo (width and height) */
  size?: number
  /** Whether to show text fallback only */
  textOnly?: boolean
  /** Custom style for the container */
  style?: object
}

export const BapLogo: FC<BapLogoProps> = ({
  size = 120,
  textOnly = false,
  style,
}) => {
  // If text only mode or logo not available, show text fallback
  if (textOnly || !DEMO_BRANDING.logoPath) {
    return (
      <View
        style={[styles.textContainer, { width: size, height: size }, style]}
      >
        <Text
          style={[
            styles.logoText,
            {
              fontSize: size * 0.4,
              color: DEMO_COLORS.textOnPrimary,
            },
          ]}
        >
          BAP
        </Text>
      </View>
    )
  }

  // Show the actual logo image
  return (
    <View style={[styles.container, style]}>
      <Image
        source={typeof DEMO_BRANDING.logoPath === 'string' ? { uri: DEMO_BRANDING.logoPath } : DEMO_BRANDING.logoPath as any}
        style={{
          width: size,
          height: size,
        }}
        resizeMode='contain'
      />
    </View>
  )
}

// Also export a simple text version for headers
export const BapLogoText: FC<{ size?: number; color?: string }> = ({
  size = 24,
  color = DEMO_COLORS.textOnPrimary,
}) => (
  <Text style={[styles.logoText, { fontSize: size, color }]}>BAP Phone</Text>
)

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: DEMO_COLORS.primary,
    borderRadius: 20,
  },
  logoText: {
    fontWeight: 'bold',
    letterSpacing: 2,
  },
})
