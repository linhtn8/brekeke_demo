/**
 * Demo Mode Configuration for BAP Customer Showcase
 *
 * This file contains all configuration for the demo mode:
 * - Toggle demo mode on/off
 * - Demo colors (dark blue theme)
 * - Fake contacts data
 * - Call duration settings
 */

// ============================================
// DEMO MODE TOGGLE
// Set to true to enable demo mode
// Set to false to use normal Brekeke functionality
// ============================================
export const DEMO_MODE = true

// ============================================
// DEMO COLORS - Dark Blue Theme
// ============================================
export const DEMO_COLORS = {
  // Primary colors
  primary: '#0D47A1', // Material Blue 900
  primaryLight: '#5472D3',
  primaryDark: '#002171',

  // Gradient colors (for BrekekeGradient)
  gradient: ['#002171', '#0D47A1', '#1565C0'] as const,

  // Text colors
  textOnPrimary: '#FFFFFF',
  textOnLight: '#000000',

  // Status colors
  callActive: '#4CAF50', // Green for active call
  callEnding: '#FF5722', // Orange for ending call
}

// ============================================
// DEMO CONTACTS - Fake/Hardcoded Data
// ============================================
export interface DemoContact {
  id: string
  name: string
  phone: string
  avatar?: string
  isOnline?: boolean // Phase 2: Track if user is online
}

export const DEMO_CONTACTS: DemoContact[] = [
  { id: '1', name: 'Manager 01', phone: '101' },
  { id: '2', name: 'Manager 02', phone: '102' },
  { id: '3', name: 'Staff 01', phone: '201' },
  { id: '4', name: 'Staff 02', phone: '202' },
  { id: '5', name: 'Staff 03', phone: '203' },
  { id: '6', name: 'Reception', phone: '300' },
  { id: '7', name: 'Support', phone: '400' },
  { id: '8', name: 'Sales', phone: '500' },
]

// ============================================
// DEMO CALL SETTINGS
// ============================================
export const DEMO_CALL_SETTINGS = {
  // Auto-end call after this duration (milliseconds)
  autoEndDuration: 10000, // 10 seconds

  // Delay before showing "Connecting..." -> "Calling..."
  connectingDelay: 1000, // 1 second

  // Fake ringing duration before "connected"
  ringingDuration: 2000, // 2 seconds
}

// ============================================
// DEMO LOGIN SETTINGS
// ============================================
export const DEMO_LOGIN_SETTINGS = {
  // Loading spinner duration (milliseconds)
  loadingDuration: 2000, // 2 seconds

  // Default username/password (for display only)
  defaultUsername: '101',
  defaultPassword: 'demo123',
}

// ============================================
// DEMO BRANDING
// ============================================
export const DEMO_BRANDING = {
  // App name for demo
  appName: 'BAP Phone',

  // Company name
  companyName: 'BAP',

  // Logo path - will be set when bap-logo.png is provided
  // For now, BapLogo component will use text fallback
  logoPath: null as number | null,
}

// Load logo statically since it exists now
const logo = require('../assets/bap-logo.png');
DEMO_BRANDING.logoPath = logo.default || logo;

// ============================================
// PHASE 2 - WEBRTC CONFIGURATION
// ============================================
export const PHASE_2_ENABLED = true // Toggle Phase 2 (WebRTC real calling)

export const WEBRTC_CONFIG = {
  // Signaling server URL
  // Replace with your local IP if testing on physical devices (e.g. 'ws://192.168.1.10:8080')
  signalingServerUrl: 'ws://localhost:8080',
  // signalingServerUrl: 'ws://172.65.1.240:8080',
  // signalingServerUrl: 'wss://salty-squids-brake.loca.lt',

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
