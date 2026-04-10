import { WEBRTC_CONFIG } from '#/config/demoConfig'

export interface SignalingUser {
  id: string
  userName: string
  password: string
  displayName: string
  phone: string
  tenant: string
  status: string
  isActive: boolean
}

function getSignalingHttpBaseUrl() {
  const wsUrl = WEBRTC_CONFIG.signalingServerUrl
  if (wsUrl.startsWith('wss://')) {
    return wsUrl.replace('wss://', 'https://')
  }

  if (wsUrl.startsWith('ws://')) {
    return wsUrl.replace('ws://', 'http://')
  }

  return wsUrl
}

class SignalingUsersService {
  async login(userName: string, password: string): Promise<SignalingUser> {
    const response = await fetch(`${getSignalingHttpBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userName, password }),
    })

    if (!response.ok) {
      let message = `Failed to sign in: ${response.status}`
      try {
        const error = await response.json()
        message = error.message || message
      } catch (error) {
        // Ignore invalid JSON error payloads
      }
      throw new Error(message)
    }

    return response.json()
  }

  async getTenantUsers(tenant: string): Promise<SignalingUser[]> {
    const response = await fetch(`${getSignalingHttpBaseUrl()}/api/tenants/${encodeURIComponent(tenant)}/users`)
    if (!response.ok) {
      throw new Error(`Failed to fetch tenant users: ${response.status}`)
    }

    return response.json()
  }

  async getAllUsers(): Promise<SignalingUser[]> {
    const response = await fetch(`${getSignalingHttpBaseUrl()}/api/users`)
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`)
    }

    return response.json()
  }
}

export const signalingUsersService = new SignalingUsersService()
