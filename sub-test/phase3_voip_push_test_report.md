# Phase 3.2 & 3.3 Test Report: Native iOS CallKit & VoIP Push Integration

## TEST_STATUS
[ALL_PASS]

## COVERAGE_SUMMARY
- **Phase 3.2 (Backend Signaling for APNs):**
  - APNs token registration upon WebSocket connection.
  - Sending VoIP Push Notification to offline users containing call metadata (`uuid`, `callerName`, `callerId`).
  - Sending `call-cancel` VoIP Push when the caller hangs up before the receiver answers.
- **Phase 3.3 (Frontend Native iOS CallKit & VoIP Push):**
  - `voipPushService.ts` correctly handles CallKeep initialization.
  - Proper integration with `react-native-voip-push-notification` to request tokens and handle background push events.
  - CallKit UI triggers (`displayIncomingCall`) upon receiving VoIP pushes.
  - Handling `answerCall` and `endCall` events from CallKit to seamlessly connect to `webrtcStore` for accepting/rejecting the WebRTC session.
  - Handling `call-cancel` payload from the background notification to dismiss the CallKit UI automatically.

## TEST_CASES
- ✅ [Backend] `server.js` registers user with `apnsToken` on `register` message.
- ✅ [Backend] `server.js` triggers VoIP push using `apn` provider when target user is offline.
- ✅ [Backend] `server.js` sends proper `call-cancel` APNs payload if the caller hangs up prematurely.
- ✅ [Frontend] `VoipPushService` initialization checks for `Platform.OS === 'ios'` and `PHASE_3_ENABLED`.
- ✅ [Frontend] `RNCallKeep.setup` is called with proper iOS/Android parameters.
- ✅ [Frontend] `VoipPushNotification` extracts `apnsToken` and registers it via `signalingService.setApnsToken()`.
- ✅ [Frontend] CallKit incoming screen is triggered correctly via `RNCallKeep.displayIncomingCall`.
- ✅ [Frontend] `answerCall` event uses dynamic import of `ctx` to `ctx.webrtc.acceptCall()` or sets `pendingAcceptCall` flag.
- ✅ [Frontend] `endCall` event correctly rejects and cleans up active calls in `webrtcStore`.
- ✅ [Frontend] Background VoIP notification parses payload and handles `call-cancel` type by closing the native UI.

## FAILURES_DETAIL
N/A. Previous failures (missing TODO implementations in `voipPushService.ts` for handling answer/end events connecting to `webrtcStore`) have been successfully resolved by the Dev Agent. The dynamic import (`import('#/stores/ctx')`) safely handles circular dependency issues while invoking state mutations correctly.

## RECOMMENDATION
- **ALL PASS**: The logic looks complete according to `docs/flow_phase_3.md`.
- Ensure that testing on a real iOS device yields valid `.p8` token provisioning for APNs. Simulator testing for VoIP pushes is limited on Xcode.
- Make sure `ENABLE_PUSH_NOTIFICATIONS` and `PHASE_3_ENABLED` are flipped securely via `.env` or correct config definitions before production deployments.
