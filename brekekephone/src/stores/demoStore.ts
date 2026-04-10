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
import type { SignalingUser } from '#/services/signalingUsersService'
import { signalingUsersService } from '#/services/signalingUsersService'
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

  /** Current logged in signaling user */
  @observable currentUser: SignalingUser | null = null

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
      ctx.webrtc.endCall(); return
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
    // If Phase 2 is enabled, optionally augment contacts with online status
    if (PHASE_2_ENABLED) {
      return DEMO_CONTACTS.map(c => ({
        ...c,
        isOnline: ctx.webrtc.onlineUsers.includes(c.phone),
      }))
    }
    return DEMO_CONTACTS
  }
  /**
   * Demo login - simulates authentication with loading delay
   */
  @action login = async (
    username: string = 'demo',
    password: string = '',
    onComplete?: () => void,
  ) => {
    if (!DEMO_MODE) {
      return false
    }

    this.isLoading = true

    try {
      const user = await signalingUsersService.login(username, password)

      await new Promise(resolve => setTimeout(resolve, DEMO_LOGIN_SETTINGS.loadingDuration))

      this.isLoggedIn = true
      this.currentUser = user

      if (ctx.account.accounts.length === 0) {
        const mockAccount = ctx.account.genEmptyAccount()
        mockAccount.pbxUsername = user.userName
        mockAccount.pbxTenant = user.tenant || '-'
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

      if (PHASE_2_ENABLED) {
        const userId = user.id || user.phone || user.userName
        const userNameLabel = user.displayName || user.userName || userId
        ctx.webrtc.connect(userId, userNameLabel)
      }

      onComplete?.()
      return true
    } catch (error) {
      console.log('[DemoStore] Login failed:', error)
      this.isLoggedIn = false
      throw error
    } finally {
      this.isLoading = false
    }
  }

  /**
   * Demo logout - resets login state
   */
  @action logout = () => {
    this.isLoggedIn = false
    this.isLoading = false
    this.currentUser = null
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
