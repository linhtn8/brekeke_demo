# BAP Demo App - Implementation Plan

## Overview
Build a demo app for BAP customer showcase that demonstrates branding customization (Logo, Colors) and UX.

**Demo Flow:** Login Screen → Show BAP Logo → Fake Contact List → Press Call Button (mock call, no real SIP connection)

---

## Implementation Status

### ✅ Phase 1 Complete (Demo Mode)

| Task | Status | File |
|------|--------|------|
| Demo Configuration | ✅ Done | `src/config/demoConfig.ts` |
| Demo MobX Store | ✅ Done | `src/stores/demoStore.ts` |
| BAP Logo Component | ✅ Done | `src/components/BapLogo.tsx` |
| Demo Call Screen | ✅ Done | `src/components/DemoCallScreen.tsx` |
| Theme Colors | ✅ Done | `src/components/variables.ts` |
| Gradient Background | ✅ Done | `src/components/BrekekeGradient.tsx` |
| Login Screen | ✅ Done | `src/pages/PageAccountSignIn.tsx` |
| Contact List UI | ✅ Done | `src/pages/PageContactUsers.tsx` |
| Call Store Integration | ✅ Done | `src/stores/callStore.ts` |
| Call Screen Integration | ✅ Done | `src/pages/PageCallManage.tsx` |
| TypeScript Verification | ✅ Pass | All demo files compile |

### ⏳ Pending User Action
- **BAP Logo Asset** - Place logo file at `src/assets/bap-logo.png` (currently using text fallback "BAP")

### How to Toggle Demo Mode
```typescript
// In src/config/demoConfig.ts
export const DEMO_MODE = true  // Enable demo mode
export const DEMO_MODE = false // Disable demo mode (normal app)
```

---

## Requirements

### Branding
- **Logo:** BAP logo (asset: `src/assets/bap-logo.png`)
- **Primary Color:** Dark blue `#0D47A1` (Material Blue 900)
- **Gradient:** Dark blue theme gradient

### Login Screen
- Username/password fields (fake, no real validation)
- Loading spinner (2 seconds delay)
- Auto-login to contact list

### Contact List
Fake/hardcoded data:
```javascript
[
  { name: "Manager 01", phone: "101" },
  { name: "Manager 02", phone: "102" },
  { name: "Staff 01", phone: "201" },
  { name: "Staff 02", phone: "202" },
  { name: "Staff 03", phone: "203" },
  { name: "Reception", phone: "300" },
  { name: "Support", phone: "400" },
  { name: "Sales", phone: "500" },
]
```

### Call Screen
- Display "Calling..." with callee info
- Auto-end after **10 seconds** OR user can manually end call
- No real SIP connection required

## Architecture

### Files to Create
| File | Purpose |
|------|---------|
| `src/config/demoConfig.ts` | Demo mode configuration & constants |
| `src/stores/demoStore.ts` | MobX store for demo state |
| `src/components/BapLogo.tsx` | BAP logo component |
| `src/assets/bap-logo.png` | BAP logo asset (from user) |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/variables.ts` | Add dark blue colors |
| `src/components/BrekekeGradient.tsx` | Support demo gradient |
| `src/pages/PageAccountSignIn.tsx` | Demo login with loading |
| `src/stores/contactStore.ts` | Return fake contacts in demo mode |
| `src/pages/PageContactUsers.tsx` | Display fake contacts |
| `src/stores/callStore.ts` | Mock call with 10s auto-end |

## Implementation Details

### Task 1: Demo Configuration (`demoConfig.ts`)
```typescript
export const DEMO_MODE = true // Toggle demo mode

export const DEMO_COLORS = {
  primary: '#0D47A1',
  primaryLight: '#5472D3',
  primaryDark: '#002171',
  gradient: ['#0D47A1', '#1565C0', '#1976D2'],
}

export const DEMO_CONTACTS = [
  { id: '1', name: 'Manager 01', phone: '101' },
  { id: '2', name: 'Manager 02', phone: '102' },
  // ...
]

export const DEMO_CALL_DURATION = 10000 // 10 seconds
```

### Task 2: Demo Store (`demoStore.ts`)
MobX store managing:
- `isLoggedIn: boolean`
- `isLoading: boolean`
- `currentCall: { callee, startTime } | null`
- Actions: `login()`, `logout()`, `startMockCall()`, `endMockCall()`

### Task 3: BAP Logo Component (`BapLogo.tsx`)
- Display BAP logo image
- Support size props
- Fallback to text "BAP" if image not found

### Task 4: Theme Colors (`variables.ts`)
Add demo color variants:
```typescript
export const v = {
  // ... existing
  demoPrimary: '#0D47A1',
  demoPrimaryLight: '#5472D3',
  demoPrimaryDark: '#002171',
}
```

### Task 5: Gradient Update (`BrekekeGradient.tsx`)
Check demo mode and use demo gradient colors.

### Task 6: Login Screen (`PageAccountSignIn.tsx`)
- Check `DEMO_MODE`
- Show loading spinner for 2s
- Navigate to contact list (skip real auth)

### Task 7: Contact Store (`contactStore.ts`)
- Check `DEMO_MODE`
- Return `DEMO_CONTACTS` instead of real pbxUsers

### Task 8: Contact List UI (`PageContactUsers.tsx`)
- Display fake contacts in demo mode
- Call button triggers mock call

### Task 9: Call Store (`callStore.ts`)
- Check `DEMO_MODE` in `startCall()`
- Start timer for 10s auto-end
- Skip SIP connection

## Testing Checklist
- [ ] App launches with BAP logo
- [ ] Login shows loading spinner
- [ ] Contact list displays 8 fake contacts
- [ ] Pressing call shows "Calling..." screen
- [ ] Call auto-ends after 10 seconds
- [ ] Manual end call works
- [ ] Dark blue theme applied throughout

## Phase 2 (Future)
- Real calling between 2 apps using WebRTC
- Brekeke server integration
- Real authentication
