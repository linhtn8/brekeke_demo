/**
 * Demo Store - MobX Store for Demo Mode State Management
 *
 * Manages:
 * - Login state (fake authentication)
 * - Loading states
 * - Mock call state with auto-end timer
 */

import { action, computed, observable } from 'mobx'

import type { DemoContact } from '#/config/demoConfig'
import {
  DEMO_CALL_SETTINGS,
  DEMO_CONTACTS,
  DEMO_LOGIN_SETTINGS,
  DEMO_MODE,
  PHASE_2_ENABLED,
} from '#/config/demoConfig'
import { ctx } from '#/stores/ctx'

export interface DemoCallState {
  isActive: boolean
  callee: DemoContact | null
  startTime: number | null
  status: 'connecting' | 'ringing' | 'connected' | 'ended' | 'rejected'
}

class DemoStore {
  // ...

  // ============================================
  // Observable State
  // ============================================

  /** Whether user is "logged in" (demo mode only) */
  @observable isLoggedIn = false

  /** Loading state for login spinner */
  @observable isLoading = false

  /** Current mock call state */
  @observable currentCall: DemoCallState = {
    isActive: false,
    callee: null,
    startTime: null,
    status: 'ended',
  }

  /** Timer reference for auto-end call */
  private autoEndTimer: ReturnType<typeof setTimeout> | null = null

  /** Timer reference for call status progression */
  private statusTimer: ReturnType<typeof setTimeout> | null = null

  // ============================================
  // Actions
  // ============================================

  /**
   * Start a mock call to a contact
   * @param contactId ID of the contact to call
   * @returns true if call started, false if already in call or contact not found
   */
  @action startMockCall = async (contactId: string): Promise<boolean> => {
    if (!DEMO_MODE) {
      return false
    }

    if (PHASE_2_ENABLED) {
      return ctx.webrtc.startCall(contactId)
    }

    // Already in a call
    if (this.currentCall.isActive) {
      console.log('[DemoStore] Already in a call')
      return false
    }

    // Find the contact
    const contact = DEMO_CONTACTS.find(c => c.id === contactId)
    if (!contact) {
      console.log('[DemoStore] Contact not found:', contactId)
      return false
    }

    console.log('[DemoStore] Starting mock call to:', contact.name)

    // Initialize call state
    this.currentCall = {
      isActive: true,
      callee: contact,
      startTime: Date.now(),
      status: 'connecting',
    }

    // Progress through call statuses
    this.statusTimer = setTimeout(
      action(() => {
        if (this.currentCall.isActive) {
          this.currentCall.status = 'ringing'

          this.statusTimer = setTimeout(
            action(() => {
              if (this.currentCall.isActive) {
                this.currentCall.status = 'connected'
              }
            }),
            DEMO_CALL_SETTINGS.ringingDuration,
          )
        }
      }),
      DEMO_CALL_SETTINGS.connectingDelay,
    )

    // Set auto-end timer
    this.autoEndTimer = setTimeout(() => {
      console.log('[DemoStore] Auto-ending call after 10 seconds')
      this.endMockCall()
    }, DEMO_CALL_SETTINGS.autoEndDuration)

    return true
  }

  /**
   * End the current mock call
   */
  @action endMockCall = () => {
    if (PHASE_2_ENABLED) {
      ctx.webrtc.endCall()
      return
    }

    console.log('[DemoStore] Ending mock call')

    // Clear timers
    if (this.autoEndTimer) {
      clearTimeout(this.autoEndTimer)
      this.autoEndTimer = null
    }
    if (this.statusTimer) {
      clearTimeout(this.statusTimer)
      this.statusTimer = null
    }

    // Reset call state
    this.currentCall = {
      isActive: false,
      callee: null,
      startTime: null,
      status: 'ended',
    }
  }

  /**
   * Update call status manually
   */
  @action updateCallStatus = (
    status: 'connecting' | 'ringing' | 'connected' | 'ended' | 'rejected',
  ) => {
    if (PHASE_2_ENABLED) {
      return
    } // handled by webrtcStore

    if (this.currentCall.isActive) {
      this.currentCall.status = status
    }
  }

  // ============================================
  // Computed Getters
  // ============================================

  @computed get getActiveCall() {
    return PHASE_2_ENABLED ? ctx.webrtc.currentCall : this.currentCall
  }

  /**
   * Get the list of demo contacts
   */
  @computed get contacts(): DemoContact[] {
    // Filter out the currently logged-in user so they can't call themselves
    const currentUserPhone = ctx.auth.getCurrentAccount()?.pbxUsername
    const availableContacts = DEMO_CONTACTS.filter(
      c => c.phone !== currentUserPhone,
    )

    // If Phase 2 is enabled, optionally augment contacts with online status
    if (PHASE_2_ENABLED) {
      return availableContacts.map(c => ({
        ...c,
        isOnline: ctx.webrtc.onlineUsers.includes(c.phone),
      }))
    }
    return availableContacts
  }
  /**
   * Demo login - simulates authentication with loading delay
   */
  @action login = async (
    username: string = 'demo',
    onComplete?: () => void,
  ) => {
    if (!DEMO_MODE) {
      return
    }

    // DEMO MODE CHECK: ONLY ALLOW LOGGING IN AS USERS IN DEMO_CONTACTS
    const isAllowed = DEMO_CONTACTS.some(c => c.phone === username)
    if (!isAllowed) {
      const { RnAlert } = require('#/stores/RnAlert')
      RnAlert.error({
        err: new Error(`Login incorrect. Extension ${username} is not allowed in Demo Mode.\nValid extensions:\n${DEMO_CONTACTS.map(c => c.phone).join(', ')}`),
      })
      return
    }

    this.isLoading = true

    setTimeout(
      action(async () => {
        this.isLoading = false
        this.isLoggedIn = true

        // Create a mock account for demo mode
        if (ctx.account.accounts.length === 0) {
          const mockAccount = ctx.account.genEmptyAccount()
          mockAccount.pbxUsername = username
          mockAccount.pbxTenant = '-'
          mockAccount.pbxHostname = 'demo.local'
          mockAccount.pbxPort = '8443'
          await ctx.account.upsertAccount(mockAccount)
          ctx.auth.signedInId = mockAccount.id
          console.log('[DemoStore] Created mock account:', mockAccount.id)
        } else if (!ctx.auth.signedInId) {
          const acc = ctx.account.accounts[0]
          ctx.auth.signedInId = acc.id
          console.log('[DemoStore] Using existing account:', acc.id)
        }

        // Initialize WebRTC signaling if Phase 2 is enabled
        if (PHASE_2_ENABLED) {
          // Use the entered username as the WebRTC ID so we can differentiate users
          const userId = username || ctx.auth.signedInId || 'demo'

          // Try to find a matching contact name, or default to standard label
          const matchedContact = DEMO_CONTACTS.find(
            c => c.phone === userId || c.id === userId,
          )
          const userNameLabel = matchedContact
            ? matchedContact.name
            : `Demo User ${userId}`

          ctx.webrtc.connect(userId, userNameLabel)
        }

        onComplete?.()
      }),
      DEMO_LOGIN_SETTINGS.loadingDuration,
    )
  }

  /**
   * Demo logout - resets login state
   */
  @action logout = () => {
    this.isLoggedIn = false
    this.isLoading = false
    this.endMockCall()

    if (PHASE_2_ENABLED) {
      ctx.webrtc.disconnect()
    }
  }

  /**
   * Get call duration in seconds (for display)
   */
  @computed get callDurationSeconds(): number {
    if (PHASE_2_ENABLED) {
      return ctx.webrtc.callDurationSeconds
    }

    if (!this.currentCall.isActive || !this.currentCall.startTime) {
      return 0
    }
    return Math.floor((Date.now() - this.currentCall.startTime) / 1000)
  }

  /**
   * Get formatted call status text
   */
  @computed get callStatusText(): string {
    if (PHASE_2_ENABLED) {
      return ctx.webrtc.callStatusText
    }

    switch (this.currentCall.status) {
      case 'connecting':
        return 'Connecting...'
      case 'ringing':
        return 'Ringing...'
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

// Singleton instance
const demoStore = new DemoStore()

// Register to context
ctx.demo = demoStore

export { demoStore }
export type { DemoStore }
