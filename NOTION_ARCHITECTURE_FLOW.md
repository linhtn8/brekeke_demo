# BREKEKE PHONE - ARCHITECTURE FLOW DOCUMENTATION

**Project:** Brekeke Phone White-label Solution  
**Version:** 2.16.11  
**Date:** April 2, 2026  
**Purpose:** Documentation cho giai đoạn sales và implementation planning

---

## MỤC LỤC

1. Tổng quan
2. Vai trò & Actors
3. Flow 1: Architecture hiện tại (Original Brekeke Phone)
4. Flow 2: Architecture White-label (With Middleware)
5. So sánh Flow 1 vs Flow 2
6. Implementation Checklist
7. Estimates & Timeline

---

## TỔNG QUAN

### Mục tiêu White-label Solution

**Khách hàng đã mua license Brekeke** → Muốn tạo app với **thương hiệu riêng** (logo, màu sắc) và **trải nghiệm đơn giản** (chỉ nhập username/password)

### Key Requirements

- Ẩn thông tin technical: hostname, port, tenant
- Đổi logo, màu sắc thành thương hiệu riêng
- App độc lập trên iOS/Android store với tên công ty
- Giữ nguyên backend license (không ảnh hưởng Brekeke server)
- Push notification hoạt động với app ID mới

### Tech Stack

**Frontend (React Native):**
- React Native 0.80.1
- TypeScript
- MobX state management
- Cross-platform: iOS, Android, Web

**Middleware (NEW):**
- Node.js + Express/NestJS
- WebSocket proxy (`ws` library)
- Environment-based configuration

**Backend (Unchanged):**
- Brekeke PBX Server (Licensed)
- PAL (Phone Application Link)
- SIP WebRTC
- UC (Unified Communications)

---

## VAI TRÒ & ACTORS

### Các bên liên quan

#### BREKEKE (Vendor/Provider)
- Cung cấp phần mềm Brekeke PBX + license
- Phát triển & maintain Brekeke Phone app (official)
- Public app trên App Store/Play Store
- Cung cấp support & documentation

#### KHÁCH HÀNG (Company - License Owner)
**Ví dụ: ABC Corporation**
- Đã mua license Brekeke PBX
- Setup & vận hành Brekeke server riêng
- Có thông tin server:
  - Hostname: `pbx.abc-company.com`
  - Port: `5060`
  - Tenant: `abc-tenant`
- Quản lý danh sách nhân viên (end-users) trong PBX
- Cấp account cho từng nhân viên

#### END-USERS (Nhân viên của khách hàng)
**Ví dụ: John Doe, Jane Smith, Bob Wilson**
- Là nhân viên của ABC Corporation
- Nhận thông tin từ IT admin công ty
- Download Brekeke Phone app từ store
- Tạo account với thông tin được cung cấp
- Sử dụng app để gọi điện, nhắn tin

---

### Flow từ mua license đến sử dụng

**PHASE 1: MUA LICENSE & SETUP**

BREKEKE (Vendor)
    │
    │ Bán license
    ▼
ABC CORPORATION (Khách hàng)
    │
    │ 1. Mua license key
    │ 2. Cài đặt Brekeke PBX trên server
    │ 3. Config hostname: pbx.abc-company.com
    │ 4. Setup tenant: abc-tenant
    │ 5. Tạo users trong PBX:
    │    - john.doe (ext: 1001)
    │    - jane.smith (ext: 1002)
    │    - bob.wilson (ext: 1003)
    ▼

**PHASE 2: PHÂN PHỐI THÔNG TIN CHO NHÂN VIÊN**

IT ADMIN (ABC Corp)
    │
    │ Gửi email/document cho nhân viên:
    │ ┌──────────────────────────────────────┐
    │ │ To: john.doe@abc-company.com         │
    │ │ Subject: Brekeke Phone Login Info    │
    │ │                                      │
    │ │ Download: Brekeke Phone app          │
    │ │ Hostname: pbx.abc-company.com        │
    │ │ Port: 5060                           │
    │ │ Tenant: abc-tenant                   │
    │ │ Username: john.doe                   │
    │ │ Password: [your-password]            │
    │ │ Phone: 1                             │
    │ └──────────────────────────────────────┘
    ▼
JOHN DOE (Nhân viên)

**PHASE 3: NHÂN VIÊN TẠO ACCOUNT & SỬ DỤNG**

JOHN DOE
    │
    │ 1. Download "Brekeke Phone" từ App Store
    │ 2. Mở app → "New Account" screen
    │ 3. Nhập thông tin từ email:
    │    - Hostname, Port, Tenant
    │    - Username, Password
    │ 4. Nhấn "Create Account"
    │ 5. App lưu thông tin
    │ 6. Nhấn "Sign In"
    ▼
APP connects to pbx.abc-company.com
    │
    │ PBX validates john.doe in abc-tenant
    │ Register push notification token
    ▼
JOHN có thể gọi điện & nhận cuộc gọi

---

### Push Notification Routing (Flow hiện tại)

**CÁCH BREKEKE ROUTE PUSH NOTIFICATION ĐẾN ĐÚNG USER**

ABC CORP'S BREKEKE SERVER (pbx.abc-company.com)
    │
    │ Push Notification Database:
    │ ┌───────────────────────────────────────────────────────┐
    │ │ Tenant      │ Username    │ Extension │ Device Token │
    │ ├───────────────────────────────────────────────────────┤
    │ │ abc-tenant  │ john.doe    │ 1001      │ john-token   │
    │ │ abc-tenant  │ jane.smith  │ 1002      │ jane-token   │
    │ │ abc-tenant  │ bob.wilson  │ 1003      │ bob-token    │
    │ └───────────────────────────────────────────────────────┘
    │
    │ Incoming call đến extension 1001:
    │   1. Lookup: extension 1001 → username: john.doe
    │   2. Query: tenant=abc-tenant AND username=john.doe
    │   3. Get device_token: john-token
    │   4. Send push to john-token via APNs/FCM
    │   5. ONLY John's device nhận notification
    ▼
JOHN'S iPHONE rings 🔔
(Jane và Bob KHÔNG nhận notification này)

**Key Points:**
- Mỗi user có device token riêng biệt
- Brekeke routing dựa trên: **Tenant + Username + Extension**
- Push notification được gửi CHÍNH XÁC đến đúng thiết bị
- Một user có thể có nhiều devices (iOS + Android) → gửi push đến tất cả devices của user đó

---

## FLOW 1: ARCHITECTURE HIỆN TẠI

### A. User Registration & Login Flow

**USER INTERACTION**
    │
    ▼
**STEP 1: Account Creation Screen (PageAccountCreate)**

User phải nhập TẤT CẢ thông tin:
- Hostname: [pbx.company.com] ← Technical info
- Port: [5060] ← Technical info  
- Tenant: [company-tenant] ← Technical info
- Username: [john.doe] ← User credential
- Password: [••••••••] ← User credential
- Phone: [1 ▼] (1-4) ← Extension number
- [ ] Push Notification ← Optional features
- [ ] UC Chat
- [CREATE ACCOUNT]

    │
    ▼
**STEP 2: Save to AsyncStorage (accountStore.ts)**

Account Object:
```json
{
  "id": "uuid-123",
  "pbxHostname": "pbx.company.com",
  "pbxPort": "5060",
  "pbxTenant": "company-tenant",
  "pbxUsername": "john.doe",
  "pbxPassword": "secret123",
  "pbxPhoneIndex": "1",
  "pushNotificationEnabled": true,
  "ucEnabled": true
}
```

Storage Key: `_api_profiles`

    │
    ▼
**STEP 3: User clicks SIGN IN**

- authStore.signIn(account)
- Triggers 3 parallel authentications:
  1. AuthPBX (PAL WebSocket)
  2. AuthSIP (SIP WebRTC) - after PBX success
  3. AuthUC (Chat) - if enabled

---

### B. Authentication Flow - PBX Connection

**MOBILE APP (React Native)**
`src/api/pbx.ts` → connect()
    │
    │ WebSocket Connection
    ▼
`wss://pbx.company.com:5060/pbx/ws`
    │
    ▼
**BREKEKE PBX SERVER (Licensed)**
- PAL (Phone Application Link) WebSocket Endpoint
    │
    ▼
**PAL LOGIN PACKET (sent from app)**

```json
{
  "tenant": "company-tenant",
  "login_user": "john.doe",
  "login_password": "secret123",
  "phone_idx": "1",
  "park": ["801", "802"],
  "voicemail": "self",
  "status": true,
  "secure_login_password": false,
  "phonetype": "webphone",
  "callrecording": "self",
  "ctype": 2
}
```

    │
    ▼
**BREKEKE VALIDATES**
- Check tenant exists
- Authenticate username/password
- Check phone_idx available
- Return session + configuration
    │
    ▼
**RESPONSE: notify_serverstatus + config**

App receives:
- Session established ✅
- PBX config (getProductInfo):
```json
{
  "sip.wss.port": "5060",
  "webphone.dtmf.send.pal": "true",
  "webphone.turn.uri": "turn:server",
  "webphone.custompage.*": {}
}
```

**Key Files:**
- `src/api/pbx.ts` - PBX WebSocket client
- `src/stores/authStore.ts` - Authentication orchestration
- `src/stores/accountStore.ts` - Account management

---

### C. Authentication Flow - SIP Connection

**APP (after PBX connected)**
`src/api/sip.ts` → connect()
    │
    │ 1. Get SIP token
    ▼
PAL Call: pbx.call_pal('updatePhoneIndex', { phone_idx: '1' })
→ Returns: { id: '1001' } (SIP phone ID)

PAL Call: pbx.call_pal('createAuthHeader', { username: '1001' })
→ Returns: "sip-auth-token-jwt-xyz..."
    │
    │ 2. Connect SIP WebSocket
    ▼
`wss://pbx.company.com:5060/phone`
    │
    ▼
**BREKEKE SIP SERVER**
- WebRTC SIP endpoint
- Uses JsSIP library
    │
    ▼
**SIP REGISTRATION**

```javascript
phone.startWebRTC({
  url: "wss://pbx.company.com:5060/phone",
  user: "1001",
  auth: "sip-auth-token-jwt...",
  userAgent: "Brekeke Phone for iOS 1.0.0, JsSIP 3.2.15, ..."
})
```

    │
    ▼
**SIP REGISTERED**
- Ready for incoming/outgoing calls
- Can receive INVITE, ACK, BYE, etc.

**Key Methods:**
- `pbx.call_pal('updatePhoneIndex')` - Get SIP phone ID
- `pbx.call_pal('createAuthHeader')` - Generate SIP auth token
- `phone.startWebRTC()` - Register SIP client (JsSIP)

---

### D. Push Notification Registration

**APP (after PBX connected)**
`src/api/pbx.ts` → pnmanage()
    │
    ▼
**PUSH NOTIFICATION REGISTRATION**

PAL Call: pbx.call_pal('pnmanage', {
  command: 'set',
  service_id: 'apns',
  application_id: 'com.brekeke.phonedev',
  username: 'john.doe',
  device_id: 'apns-token-abc123...',
  device_id_voip: 'voip-token-xyz...'
})
    │
    ▼
**BREKEKE PBX - PN DATABASE**

Lưu mapping:
```json
{
  "tenant": "company-tenant",
  "username": "john.doe",
  "app_id": "com.brekeke.phonedev",
  "device_token": "apns-token-abc123...",
  "voip_token": "voip-token-xyz..."
}
```

    │
    │ When incoming call arrives
    ▼
**SEND PUSH NOTIFICATION**

Brekeke → APNs/FCM Server
- Use app_id: "com.brekeke.phonedev"
- Use certificate/key for this app_id
- Include sipAuth token (90s TTL)

→ Device receives notification
→ App wakes up
→ Auto-connect SIP using sipAuth
→ Answer call

**Critical Point:** Push notification requires:
- Correct Bundle ID / Package Name
- Valid APNs certificate (.p12/.p8) or FCM Server Key
- Brekeke admin configuration matching app ID

---

### E. Complete Connection Diagram

**BREKEKE PHONE APP**
`com.brekeke.phonedev`

User enters:
- Hostname, Port, Tenant
- Username, Password, Phone Index
    │
    │ Direct connection
    ▼
**Internet (Public)**
    │
    ▼
**BREKEKE SERVER (Licensed)**
`pbx.company.com:5060`

- **PAL WebSocket (/pbx/ws)**
  - Tenant validation
  - User authentication
  - Config distribution
  - Call control (hold, transfer, park)

- **SIP WebSocket (/phone)**
  - SIP registration
  - Call signaling (INVITE, ACK, BYE)
  - Media negotiation (SDP)

- **UC HTTPS (:443)**
  - Chat/messaging
  - Presence/status
  - File transfer

- **Push Notification Manager**
  - Store device tokens
  - Send push via APNs/FCM
  - Certificate: com.brekeke.phonedev
    │
    │ Push notifications
    ▼
**APNs / FCM Servers**
(Apple / Google)

---

### F. Real-world Scenario - Complete Flow

#### Scenario: ABC Corporation đã mua license Brekeke

**STEP 1: ABC CORP MUA LICENSE & SETUP SERVER**

ABC Corporation (100 nhân viên)
    │
    │ Mua license Brekeke PBX (100 users)
    │ Cài đặt trên server: pbx.abc-company.com:5060
    │ Tạo tenant: abc-tenant
    │
    │ IT Admin tạo accounts trong PBX:
    │ ┌─────────────────────────────────────────────────────┐
    │ │ Username      │ Password    │ Extension │ Phone   │
    │ ├─────────────────────────────────────────────────────┤
    │ │ john.doe      │ john123     │ 1001      │ 1       │
    │ │ jane.smith    │ jane456     │ 1002      │ 1       │
    │ │ bob.wilson    │ bob789      │ 1003      │ 1       │
    │ │ alice.johnson │ alice000    │ 1004      │ 1       │
    │ │ ... (96 users more)                               │
    │ └─────────────────────────────────────────────────────┘
    ▼

**STEP 2: IT ADMIN GỬI THÔNG TIN CHO 100 NHÂN VIÊN**

IT Admin sends mass email:
    │
    │ To: all-employees@abc-company.com
    │ Subject: Setup Brekeke Phone App
    │
    │ ┌──────────────────────────────────────────────────────┐
    │ │ Dear Team,                                           │
    │ │                                                      │
    │ │ Please download "Brekeke Phone" and use:            │
    │ │                                                      │
    │ │ Hostname: pbx.abc-company.com                       │
    │ │ Port: 5060                                          │
    │ │ Tenant: abc-tenant                                  │
    │ │ Username: [your username]                           │
    │ │ Password: [your password]                           │
    │ │ Phone: 1                                            │
    │ │                                                      │
    │ │ Contact IT if you have issues.                      │
    │ └──────────────────────────────────────────────────────┘
    ▼

**STEP 3: JOHN DOE (1 trong 100 nhân viên) SETUP APP**

John Doe receives email
    │
    │ 1. Download "Brekeke Phone" from App Store
    │ 2. Open app → See Brekeke logo (green)
    │ 3. Tap "New Account"
    │ 4. Nhập thông tin:
    │    ┌──────────────────────────────────────┐
    │    │ Hostname: pbx.abc-company.com        │
    │    │ Port: 5060                           │
    │    │ Tenant: abc-tenant                   │
    │    │ Username: john.doe                   │
    │    │ Password: john123                    │
    │    │ Phone: 1                             │
    │    └──────────────────────────────────────┘
    │ 5. Tap "Create Account"
    │ 6. Tap "Sign In"
    ▼

**STEP 4: JOHN'S APP CONNECTS & REGISTERS**

John's iPhone (com.brekeke.phonedev)
    │
    │ Connect to: wss://pbx.abc-company.com:5060/pbx/ws
    │ Send PAL login:
    │   { tenant: "abc-tenant", login_user: "john.doe", ... }
    │
    ▼
ABC Corp's Brekeke Server
    │
    │ ✅ Validate john.doe in abc-tenant
    │ ✅ Assign extension 1001
    │ ✅ Return session
    │
    ▼
John's App
    │
    │ Register push notification:
    │   pnmanage({
    │     app_id: "com.brekeke.phonedev",
    │     username: "john.doe",
    │     device_id: "john-iphone-token-abc123..."
    │   })
    │
    ▼
Brekeke PN Database
    │
    │ Store mapping:
    │ ┌────────────────────────────────────────────────────┐
    │ │ abc-tenant | john.doe | 1001 | john-iphone-token │
    │ └────────────────────────────────────────────────────┘
    ▼
John's app is ready! ✅

**STEP 5: INCOMING CALL TO JOHN**

External caller dials ABC Corp's main number
    │
    │ IVR: "Press 1001 for John Doe"
    │ Caller presses 1001
    ▼
ABC Corp's Brekeke Server
    │
    │ Incoming call → extension 1001
    │ Lookup: 1001 → username: john.doe
    │ Check: john.doe online? → NO (app in background)
    │ Query PN database:
    │   SELECT device_token WHERE tenant='abc-tenant' 
    │   AND username='john.doe'
    │ Result: john-iphone-token-abc123...
    │
    │ Send push notification:
    │   To: APNs
    │   Topic: com.brekeke.phonedev
    │   Token: john-iphone-token-abc123...
    │   Payload: {
    │     alert: "Incoming call from +1-555-0100",
    │     sipAuth: "temp-90s-token-xyz...",
    │     extension: "1001"
    │   }
    ▼
Apple APNs
    │
    │ Route to: john-iphone-token-abc123...
    ▼
John's iPhone 🔔
    │
    │ Notification appears:
    │ ┌──────────────────────────────────────┐
    │ │ 📞 Brekeke Phone                     │
    │ │ Incoming call from +1-555-0100       │
    │ │                                      │
    │ │ [Decline]           [Answer]         │
    │ └──────────────────────────────────────┘
    │
    │ John taps "Answer"
    │ App wake up
    │ Connect SIP using temp-90s-token
    │ Call connected!
    ▼
John is talking ☎️

⚠️ IMPORTANT: Jane, Bob, Alice không nhận push này
   Chỉ có John's device nhận notification
   Vì Brekeke routing dựa trên tenant + username + extension

---

#### Multiple Users Scenario

**ABC CORP - 100 NHÂN VIÊN ĐANG DÙNG BREKEKE PHONE**

Brekeke Server: pbx.abc-company.com
Tenant: abc-tenant

Push Notification Database:
```
┌──────────────────────────────────────────────────────────────┐
│ Tenant      │ Username      │ Ext  │ Device Token           │
├──────────────────────────────────────────────────────────────┤
│ abc-tenant  │ john.doe      │ 1001 │ john-iphone-token      │
│ abc-tenant  │ jane.smith    │ 1002 │ jane-android-token     │
│ abc-tenant  │ bob.wilson    │ 1003 │ bob-iphone-token       │
│ abc-tenant  │ alice.johnson │ 1004 │ alice-ipad-token       │
│ abc-tenant  │ alice.johnson │ 1004 │ alice-iphone-token     │ ← Same user, 2 devices
│ ... (95 more users)                                          │
└──────────────────────────────────────────────────────────────┘
```

**SCENARIO 1:** External call to extension 1002
    → Brekeke lookup: 1002 → jane.smith
    → Send push to: jane-android-token
    → ONLY Jane's Android rings 🔔

**SCENARIO 2:** Internal call - John calls Bob (1001 → 1003)
    → John dials 1003 from his app
    → Brekeke routes to extension 1003
    → Brekeke lookup: 1003 → bob.wilson
    → Send push to: bob-iphone-token
    → ONLY Bob's iPhone rings 🔔

**SCENARIO 3:** Conference call to extension 1004 (Alice)
    → Brekeke lookup: 1004 → alice.johnson
    → Alice có 2 devices registered
    → Send push to BOTH:
      - alice-ipad-token
      - alice-iphone-token
    → Alice's iPad AND iPhone ring 🔔🔔
    → Alice answer từ iPad → iPhone stop ringing

**SCENARIO 4:** Broadcast announcement to all 100 users
    → Brekeke sends 100 separate pushes:
      1001 → john-iphone-token
      1002 → jane-android-token
      1003 → bob-iphone-token
      ...
      1100 → user100-token
    → All 100 devices ring 🔔 (100 pushes sent)

✅ Push notification routing is PRECISE & SCALABLE
   - Mỗi user chỉ nhận push của mình
   - Support multiple devices per user
   - No cross-contamination between users

---

#### Vấn đề với Flow hiện tại (quan điểm khách hàng)

**ABC CORP'S PAIN POINTS**

1. **BRANDING:**
   - ❌ App vẫn hiển thị "Brekeke Phone" logo
   - ❌ Nhân viên hỏi: "Why are we using another company's app?"
   - ❌ ABC Corp muốn: "ABC Phone" với logo công ty

2. **USER EXPERIENCE:**
   - ❌ Nhân viên phải nhập hostname, port, tenant
   - ❌ Support tickets: "What is hostname?", "I forgot the port"
   - ❌ 30% nhân viên nhập sai → không connect được
   - ❌ Mất thời gian training & support

3. **SECURITY CONCERNS:**
   - ❌ Tất cả 100 nhân viên biết:
     - Server hostname: pbx.abc-company.com
     - Port: 5060
     - Tenant: abc-tenant
   - ❌ Nếu nhân viên nghỉ việc → họ vẫn biết server info
   - ❌ Risk: Ex-employee có thể attempt brute force attack

4. **PROFESSIONAL IMAGE:**
   - ❌ Customer-facing employees dùng "Brekeke Phone"
   - ❌ Customers Google "Brekeke" → confused
   - ❌ ABC Corp muốn professional image

5. **ONBOARDING COMPLEXITY:**
   - ❌ 100 nhân viên mới mỗi năm
   - ❌ Mỗi người cần instruction document
   - ❌ IT helpdesk overwhelmed với setup issues

---

#### ABC Corp's Requirements → White-label Solution

**ABC CORP'S WISH LIST**

1. **BRANDED APP:**
   - ✅ App name: "ABC Phone"
   - ✅ ABC Corp logo & colors (blue)
   - ✅ On App Store/Play Store as "ABC Corporation"
   - ✅ Professional image for employees & customers

2. **SIMPLIFIED LOGIN:**
   - ✅ Nhân viên CHỈ nhập: Username + Password
   - ✅ Như Gmail, Facebook, etc. (user-friendly)
   - ✅ No technical jargon (hostname/port/tenant)
   - ✅ Giảm 90% support tickets

3. **SECURITY:**
   - ✅ Server info ẩn trong middleware
   - ✅ Nhân viên KHÔNG biết hostname/port/tenant
   - ✅ Ex-employees không có thông tin để attack
   - ✅ Centralized control

4. **EASY ONBOARDING:**
   - ✅ New hire email: "Download ABC Phone, use your username/password"
   - ✅ 1-minute setup vs 10-minute setup
   - ✅ Reduce helpdesk load by 80%

5. **SCALABILITY:**
   - ✅ 100 users today, 500 users next year
   - ✅ Middleware có thể load balance
   - ✅ Multiple Brekeke servers if needed
   - ✅ Centralized monitoring & logging

SOLUTION: White-label app + Middleware server

---

## FLOW 2: ARCHITECTURE WHITE-LABEL

### A. User Registration & Login Flow - Simplified

**USER INTERACTION**
    │
    ▼
**STEP 1: Simplified Login Screen (PageAccountCreate)**

- Username: [john.doe] ← Only user credential
- Password: [••••••••] ← Only user credential
- Phone: [1 ▼] (1-4) ← Extension number
- [ ] Push Notification ← Optional features
- [ ] UC Chat
- [SIGN IN]

❌ KHÔNG CÒN: Hostname, Port, Tenant
✅ User chỉ nhập: Username, Password, Phone

    │
    ▼
**STEP 2: Auto-inject Middleware Config (accountStore.ts)**

MIDDLEWARE_CONFIG = {
  baseUrl: "https://your-middleware.com",
  defaultTenant: "-",
  defaultPort: "443"
}

Account Object (auto-filled):
```json
{
  "id": "uuid-456",
  "pbxHostname": "your-middleware.com",
  "pbxPort": "443",
  "pbxTenant": "-",
  "pbxUsername": "john.doe",
  "pbxPassword": "secret123",
  "pbxPhoneIndex": "1",
  "pushNotificationEnabled": true,
  "ucEnabled": true
}
```

⚠️ User KHÔNG BIẾT đang connect qua middleware

    │
    ▼
**STEP 3: User clicks SIGN IN**

- authStore.signIn(account)
- App connects to MIDDLEWARE instead of Brekeke

**Modified Files:**
- `src/config/middleware.ts` (NEW) - Middleware configuration
- `src/components/AccountCreateForm.tsx` (MODIFY) - Remove hostname/port/tenant fields
- `src/stores/accountStore.ts` (MODIFY) - Auto-inject middleware config
- `src/components/variables.ts` (MODIFY) - Update brand colors
- `src/assets/brand.png`, `logo.png` (REPLACE) - New logo

---

### B. Authentication Flow - WITH MIDDLEWARE

**MOBILE APP (React Native)**
`src/api/pbx.ts` → connect()

WebSocket URL:
`wss://your-middleware.com/pbx/ws` ← Points to middleware!

    │
    │ WebSocket Connection
    ▼
**MIDDLEWARE SERVER (Node.js - YOUR SERVER)**
`https://your-middleware.com`

- **WebSocket Endpoint: /pbx/ws**
  1. Accept connection from app
  2. Establish connection to Brekeke server
  3. Proxy messages bidirectionally
  4. INJECT tenant into login params
    │
    │ INTERCEPTION POINT
    ▼
**MIDDLEWARE LOGIC - TENANT INJECTION**

App sends (tenant = "-"):
```json
{
  "tenant": "-",
  "login_user": "john.doe",
  "login_password": "secret123",
  "phone_idx": "1"
}
```

▼ MIDDLEWARE INTERCEPTS & MODIFIES ▼

Middleware injects from env:
```json
{
  "tenant": "company-tenant",
  "login_user": "john.doe",
  "login_password": "secret123",
  "phone_idx": "1"
}
```

Environment variables on middleware:
```
BREKEKE_HOST=pbx.company.com
BREKEKE_PORT=5060
BREKEKE_TENANT=company-tenant ← SECRET, not in app!
```

    │
    │ Forward to Brekeke
    ▼
**BREKEKE PBX SERVER (Licensed)**
`pbx.company.com:5060`

Receives:
```json
{
  "tenant": "company-tenant",
  "login_user": "john.doe",
  "login_password": "secret123",
  "phone_idx": "1"
}
```

✅ Validates & authenticates normally
✅ Returns session + config

    │
    │ Response
    ▼
**MIDDLEWARE - Transparent Proxy**

Response from Brekeke:
- notify_serverstatus
- PBX config

→ Forward unchanged to app

    │
    ▼
**APP receives response**
- Session established ✅
- Continue with SIP connection

**Middleware Implementation:**

File: `middleware-server/src/proxy/pbx-proxy.ts`

Key logic - Tenant injection:
```typescript
clientWs.on('message', (data: Buffer) => {
  let message = data.toString()
  
  // Inject tenant into login params
  if (message.includes('login_user')) {
    const params = JSON.parse(message)
    if (!params.tenant || params.tenant === '') {
      params.tenant = process.env.BREKEKE_TENANT || '-'
      message = JSON.stringify(params)
      console.log('Injected tenant:', params.tenant)
    }
  }
  
  brekekeWs.send(message)
})
```

---

### C. SIP Connection - WITH MIDDLEWARE

**APP**
`src/api/sip.ts` → connect()

WebSocket URL:
`wss://your-middleware.com/phone` ← Points to middleware!

    │
    ▼
**MIDDLEWARE SERVER**

- **WebSocket Endpoint: /phone**
  1. Accept connection from app
  2. Establish connection to Brekeke SIP
  3. TRANSPARENT PROXY (no modification needed)
     - SIP already authenticated via token from PAL
    │
    │ Proxy to Brekeke
    ▼
`wss://pbx.company.com:5060/phone`
    │
    ▼
**BREKEKE SIP SERVER**

- Receives SIP registration with auth token
- Process normally

**Modified Files:**
- `src/api/sip.ts` (MODIFY) - Point WebSocket URL to middleware

---

### D. Push Notification - WITH NEW APP ID

**WHITE-LABEL APP**
`com.yourcompany.phone` ← NEW Bundle ID!

1. Get device token from APNs/FCM
2. Send to Brekeke via PAL (through middleware)
    │
    ▼
**PUSH NOTIFICATION REGISTRATION (through middleware)**

PAL Call: pnmanage({
  command: 'set',
  service_id: 'apns',
  application_id: 'com.yourcompany.phone', ← NEW APP ID!
  username: 'john.doe',
  device_id: 'new-apns-token-xyz...',
  device_id_voip: 'new-voip-token-abc...'
})
    │
    │ Proxy through middleware
    ▼
**BREKEKE PBX - PN DATABASE**

⚠️ CRITICAL: Must be configured with NEW app ID!

Admin Panel → Push Notification Settings:
- **iOS Application ID:** com.yourcompany.phone ← NEW!
- **APNs Certificate:** [Upload new .p12/.p8] ← NEW!
- **APNs Key ID:** XYZ123
- **APNs Team ID:** ABC456

- **Android Package:** com.yourcompany.phone ← NEW!
- **FCM Server Key:** [New Firebase key] ← NEW!

Store mapping:
```json
{
  "tenant": "company-tenant",
  "username": "john.doe",
  "app_id": "com.yourcompany.phone",
  "device_token": "new-apns-token-xyz...",
  "voip_token": "new-voip-token-abc..."
}
```

    │
    │ When call arrives
    ▼
**SEND PUSH via NEW certificate**

Brekeke uses:
- app_id: "com.yourcompany.phone"
- NEW APNs certificate for this app
- NEW FCM server key

→ APNs/FCM → Your white-label app

**Critical Configuration Steps:**

1. **iOS APNs Setup:**
   - Create new App ID in Apple Developer: `com.yourcompany.phone`
   - Generate APNs Certificate (.p12) or Key (.p8)
   - Upload to Brekeke PBX admin panel

2. **Android FCM Setup:**
   - Create new Firebase project
   - Add Android app with package name: `com.yourcompany.phone`
   - Download `google-services.json`
   - Get FCM Server Key from Firebase Console
   - Add to Brekeke PBX admin panel

---

### E. Complete Architecture - WITH MIDDLEWARE

**YOUR COMPANY PHONE APP (White-label)**
`com.yourcompany.phone`

User ONLY sees:
- Username, Password, Phone Index
- Company logo & branding

User KHÔNG THẤY:
- Hostname, Port, Tenant
- Brekeke branding
    │
    │ Connect to middleware
    ▼
**Internet (Public)**
    │
    ▼
**MIDDLEWARE SERVER (Node.js - YOUR SERVER)**
`https://your-middleware.com:443`

Environment Config:
```
BREKEKE_HOST=pbx.company.com
BREKEKE_PORT=5060
BREKEKE_TENANT=company-tenant
```

- **PAL WebSocket Proxy: /pbx/ws**
  - Accept app connections
  - Inject tenant from env
  - Proxy to Brekeke PAL

- **SIP WebSocket Proxy: /phone**
  - Transparent proxy
  - No modification needed

- **UC HTTPS Proxy: /uc/* (Optional)**
  - Proxy chat requests
    │
    │ Proxy connections
    ▼
**Private Network or Internet (Secured)**
    │
    ▼
**BREKEKE SERVER (Licensed)**
`pbx.company.com:5060`
(Same as before, NO CHANGES)

⚠️ ONLY CHANGE: Push Notification Config
- Add new App ID: com.yourcompany.phone
- Upload new APNs certificate
- Add new FCM server key
    │
    │ Push notifications
    ▼
**APNs / FCM Servers**
(Apple / Google)
    │
    ▼
[Your white-label app]

---

## SO SÁNH FLOW 1 VS FLOW 2

### Comparison Table

| Aspect | FLOW 1 (Hiện tại) | FLOW 2 (White-label) |
|--------|-------------------|----------------------|
| **User Input** | Hostname, Port, Tenant, Username, Password | Chỉ Username, Password |
| **Login Screen** | 6 trường bắt buộc | 3 trường (simplified) |
| **App connects to** | Brekeke server trực tiếp | Middleware server |
| **Tenant info** | User nhập | Middleware inject tự động |
| **WebSocket URL (PAL)** | `wss://pbx.company.com:5060/pbx/ws` | `wss://your-middleware.com/pbx/ws` |
| **WebSocket URL (SIP)** | `wss://pbx.company.com:5060/phone` | `wss://your-middleware.com/phone` |
| **Tenant injection** | Không có | Middleware intercept & inject |
| **Brekeke config** | Không thay đổi | Chỉ thêm Push Notification app ID |
| **App Bundle ID** | `com.brekeke.phonedev` | `com.yourcompany.phone` (MỚI) |
| **Push Certificate** | Brekeke's certificate | Your certificate (MỚI) |
| **Branding** | Brekeke logo, màu xanh lá | Your company logo, custom colors |
| **User experience** | Technical, phức tạp | Simplified, user-friendly |
| **Deployment** | Direct to Brekeke | Via middleware layer |
| **Scalability** | N/A | Can load balance, multi-tenant support |
| **Maintenance** | User manages server info | Admin manages centrally |

---

### Key Differences

#### 1. User-facing Changes:
- ❌ **FLOW 1:** User phải biết technical details (hostname, port, tenant)
- ✅ **FLOW 2:** User chỉ nhập username/password như app thông thường

#### 2. Backend Changes:
- ❌ **FLOW 1:** Không có middleware, connect trực tiếp
- ✅ **FLOW 2:** Middleware layer inject tenant & proxy connections

#### 3. App Store Presence:
- ❌ **FLOW 1:** App name "Brekeke Phone", logo Brekeke
- ✅ **FLOW 2:** App name "Your Company Phone", logo của bạn, 100% white-label

#### 4. Push Notification:
- ❌ **FLOW 1:** Dùng Bundle ID `com.brekeke.phonedev` và certificate của Brekeke
- ✅ **FLOW 2:** Dùng Bundle ID `com.yourcompany.phone` và certificate riêng → **PHẢI config trên Brekeke admin**

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Middleware Server Setup

**Infrastructure:**
- [ ] Setup Node.js server (Express/NestJS)
- [ ] Setup SSL certificate (Let's Encrypt hoặc commercial)
- [ ] Configure environment variables (.env):
  - `BREKEKE_HOST`
  - `BREKEKE_PORT`
  - `BREKEKE_TENANT`
  - `SSL_CERT`, `SSL_KEY`

**Development:**
- [ ] Implement PAL WebSocket proxy (`/pbx/ws`)
  - [ ] Tenant injection logic
  - [ ] Bidirectional message proxy
  - [ ] Error handling & reconnection
- [ ] Implement SIP WebSocket proxy (`/phone`)
  - [ ] Transparent proxy
- [ ] Implement UC proxy (optional) (`/uc/*`)
- [ ] Add logging & monitoring
- [ ] Add health check endpoint

**Testing:**
- [ ] Test PAL connection with wscat
- [ ] Verify tenant injection
- [ ] Test SIP connection
- [ ] Load testing
- [ ] Security audit

**Deployment:**
- [ ] Deploy to production server
- [ ] Configure firewall rules
- [ ] Setup monitoring (PM2, logs)
- [ ] Configure backup & recovery

---

### Phase 2: React Native App Modification

**Configuration:**
- [ ] Create `src/config/middleware.ts`
  - [ ] Add middleware base URL
  - [ ] Add default tenant/port
  - [ ] Add feature toggle for dev/prod
- [ ] Create `src/config/branding.ts`
  - [ ] Company name, colors, logo paths

**UI Changes:**
- [ ] Modify `AccountCreateForm.tsx`
  - [ ] Remove hostname field
  - [ ] Remove port field
  - [ ] Remove tenant field
  - [ ] Keep username, password, phone index
- [ ] Modify `AccountSignInItem.tsx`
  - [ ] Remove technical info display
  - [ ] Show only username
- [ ] Update `variables.ts`
  - [ ] Change primary color from `#609B3A` to `#0D47A1`
  - [ ] Update other brand colors if needed

**Logic Changes:**
- [ ] Modify `accountStore.ts`
  - [ ] Auto-inject middleware hostname/port/tenant
  - [ ] Keep upsertAccount logic
- [ ] Modify `pbx.ts`
  - [ ] Change WebSocket URL to middleware
  - [ ] Add fallback logic for dev mode
- [ ] Modify `sip.ts`
  - [ ] Change WebSocket URL to middleware
  - [ ] Keep token-based auth

**Branding Assets:**
- [ ] Replace `src/assets/brand.png`
- [ ] Replace `src/assets/logo.png`
- [ ] Generate iOS app icons (15+ sizes)
  - [ ] Update `ios/BrekekePhone/Images.xcassets/AppIcon.appiconset/`
- [ ] Generate Android app icons (5+ densities)
  - [ ] Update `android/app/src/main/res/mipmap-*/ic_launcher.png`
- [ ] Generate iOS splash screen images
  - [ ] Update `ios/BrekekePhone/Images.xcassets/LaunchScreenLogo.imageset/`
- [ ] Generate Android splash screen images
  - [ ] Update `android/app/src/main/res/mipmap-*/launch_screen.png`
- [ ] Create new `public/favicon.ico`

**Bundle ID Changes:**
- [ ] iOS: Update Bundle Identifier in Xcode
  - [ ] Change from `com.brekeke.phonedev` to `com.yourcompany.phone`
  - [ ] Update `CFBundleDisplayName` to "Your Company Phone"
  - [ ] Update Signing & Capabilities → Team
- [ ] Android: Update Package Name
  - [ ] Change `applicationId` in `build.gradle`
  - [ ] Update `package` in `AndroidManifest.xml`
  - [ ] Update `strings.xml` app name
- [ ] Update `config.ts`
  - [ ] Update `bundleIdentifier`
  - [ ] Update `fcmApplicationId` if needed

**Build Configuration:**
- [ ] iOS: Generate new provisioning profile
- [ ] Android: Generate new signing keystore
- [ ] Replace `google-services.json` (Android)
- [ ] Update Firebase config (iOS)

---

### Phase 3: Push Notification Setup

**iOS APNs:**
- [ ] Create App ID in Apple Developer Portal
  - [ ] App ID: `com.yourcompany.phone`
  - [ ] Enable Push Notifications capability
- [ ] Generate APNs Certificate or Key
  - [ ] Option A: .p12 certificate (expires annually)
  - [ ] Option B: .p8 key (recommended, no expiry)
- [ ] Download certificate/key

**Android FCM:**
- [ ] Create Firebase project
- [ ] Add Android app: `com.yourcompany.phone`
- [ ] Download `google-services.json`
- [ ] Get FCM Server Key from Project Settings → Cloud Messaging

**Brekeke PBX Configuration:**
- [ ] Login to Brekeke Admin Panel
- [ ] Navigate to Push Notification Settings
- [ ] Add iOS configuration:
  - [ ] Application ID: `com.yourcompany.phone`
  - [ ] Upload APNs certificate (.p12) or Key (.p8)
  - [ ] Enter Key ID, Team ID (if using .p8)
  - [ ] Select environment (Production/Development)
- [ ] Add Android configuration:
  - [ ] Application ID: `com.yourcompany.phone`
  - [ ] Enter FCM Server Key
- [ ] Test push notification
  - [ ] Send test push to device
  - [ ] Verify app receives notification

---

### Phase 4: Testing

**Functional Testing:**
- [ ] Login with username/password only
- [ ] Verify connection to middleware
- [ ] Verify middleware injects tenant correctly
- [ ] Test PBX connection (PAL)
- [ ] Test SIP registration
- [ ] Make outgoing call
- [ ] Receive incoming call
- [ ] Test call hold, transfer, park
- [ ] Test voicemail
- [ ] Test UC chat (if enabled)

**Push Notification Testing:**
- [ ] Receive incoming call push (iOS)
- [ ] Receive incoming call push (Android)
- [ ] Answer call from push notification
- [ ] Verify VoIP push (iOS)
- [ ] Test push in background mode
- [ ] Test push when app is killed

**UI/UX Testing:**
- [ ] Verify logo appears correctly
- [ ] Verify brand colors throughout app
- [ ] Test all 33 screens for branding consistency
- [ ] Test light/dark mode (if supported)
- [ ] Test different screen sizes (iPhone, iPad, Android tablets)

**Cross-platform Testing:**
- [ ] iOS simulator testing
- [ ] iOS real device testing
- [ ] Android emulator testing
- [ ] Android real device testing
- [ ] Web browser testing (if applicable)

**Performance Testing:**
- [ ] App startup time
- [ ] Login response time
- [ ] Call connection latency
- [ ] Middleware proxy latency
- [ ] Memory usage
- [ ] Battery consumption

---

### Phase 5: Deployment

**App Store Submission:**
- [ ] iOS App Store:
  - [ ] Create app listing in App Store Connect
  - [ ] Prepare screenshots (6.5", 5.5", iPad)
  - [ ] Write app description (with your company branding)
  - [ ] Upload build via Xcode or Transporter
  - [ ] Submit for review
  - [ ] Estimated review time: 1-3 days
- [ ] Android Play Store:
  - [ ] Create app listing in Google Play Console
  - [ ] Prepare screenshots, feature graphic
  - [ ] Write app description
  - [ ] Upload APK/AAB
  - [ ] Submit for review
  - [ ] Estimated review time: Few hours to 1 day

**Documentation:**
- [ ] User guide (login instructions)
- [ ] Admin guide (Brekeke configuration)
- [ ] Troubleshooting guide
- [ ] FAQ

**Support Preparation:**
- [ ] Setup support email/chat
- [ ] Prepare response templates
- [ ] Train support team

---

## ESTIMATES & TIMELINE

### Development Time Estimates

#### Middleware Server Development:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| Project setup + dependencies | 2-3h | Node.js, TypeScript, WebSocket libs |
| PAL WebSocket proxy | 4-6h | Tenant injection logic |
| SIP WebSocket proxy | 2-3h | Transparent proxy |
| UC proxy (optional) | 2-3h | HTTP/HTTPS proxy |
| Error handling & logging | 2-3h | Proper error handling |
| SSL setup | 1-2h | Let's Encrypt or cert installation |
| Testing & debugging | 4-6h | Integration testing |
| Deployment & monitoring | 2-4h | PM2, server setup |
| **SUBTOTAL** | **19-30h** | **2.5-4 days** |

#### React Native App Modification:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| Config files (middleware.ts, branding.ts) | 1-2h | Setup config |
| Modify AccountCreateForm UI | 2-3h | Remove fields, update layout |
| Modify AccountSignInItem | 1-2h | Update display logic |
| Update accountStore logic | 2-3h | Auto-inject middleware config |
| Update pbx.ts, sip.ts | 3-4h | Point to middleware URLs |
| Update variables.ts (colors) | 1h | Change brand colors |
| **SUBTOTAL (Code)** | **10-15h** | **1.5-2 days** |

#### Branding Assets:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| Design new logo (if needed) | 4-8h | Graphic design work |
| Generate iOS icons (15+ sizes) | 2-3h | Use tools or manual resize |
| Generate Android icons (5+ sizes) | 1-2h | Use tools or manual resize |
| Generate splash screens | 2-3h | iOS + Android |
| Create favicon | 0.5h | Web |
| Replace all asset files | 1-2h | Copy to correct locations |
| **SUBTOTAL** | **10.5-18.5h** | **1.5-2.5 days** |

#### Push Notification Setup:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| Create Apple Developer App ID | 0.5h | Admin portal |
| Generate APNs certificate/key | 1h | Download & configure |
| Create Firebase project | 0.5h | Firebase Console |
| Setup FCM for Android | 1h | Download google-services.json |
| Configure Brekeke PBX admin | 1-2h | Upload certs, test |
| Test push notifications | 2-3h | iOS + Android testing |
| **SUBTOTAL** | **6-8h** | **1 day** |

#### Bundle ID Changes & Build:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| iOS: Change Bundle ID in Xcode | 1h | Update project settings |
| iOS: Generate signing certs | 1h | Provisioning profiles |
| Android: Change Package Name | 1h | build.gradle, manifest |
| Android: Generate signing key | 1h | Keystore creation |
| Build iOS | 1-2h | Xcode build + troubleshooting |
| Build Android | 1-2h | Gradle build + troubleshooting |
| **SUBTOTAL** | **6-8h** | **1 day** |

#### Testing:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| Functional testing (all features) | 4-6h | Login, calls, chat, etc. |
| Push notification testing | 2-3h | iOS + Android |
| Cross-platform testing | 3-4h | Multiple devices |
| Bug fixes | 4-8h | Based on findings |
| **SUBTOTAL** | **13-21h** | **2-3 days** |

#### Deployment:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| App Store preparation | 2-3h | Screenshots, descriptions |
| Play Store preparation | 2-3h | Screenshots, descriptions |
| Submit to stores | 1h | Upload builds |
| Review & iteration | 4-8h | Address review feedback |
| Documentation | 3-4h | User guide, admin guide |
| **SUBTOTAL** | **12-19h** | **2-3 days** |

---

### **TOTAL ESTIMATES:**

| Phase | Hours | Days (8h/day) |
|-------|-------|---------------|
| Middleware Development | 19-30h | 2.5-4 days |
| App Code Modification | 10-15h | 1.5-2 days |
| Branding Assets | 10.5-18.5h | 1.5-2.5 days |
| Push Notification | 6-8h | 1 day |
| Bundle ID & Build | 6-8h | 1 day |
| Testing | 13-21h | 2-3 days |
| Deployment | 12-19h | 2-3 days |
| **TOTAL** | **76.5-119.5h** | **~10-15 days** |

**Note:** Estimates assume:
- Developer có kinh nghiệm React Native & Node.js
- Có sẵn design cho logo/branding
- Không có blockers từ Brekeke support
- Apple/Google review process thuận lợi

---

### Timeline with Dependencies

**Week 1:**
- Day 1-2: Middleware development
- Day 3: App code modification
- Day 4: Branding assets preparation
- Day 5: Push notification setup

**Week 2:**
- Day 1: Bundle ID changes & build
- Day 2-3: Testing & bug fixes
- Day 4: App Store preparation
- Day 5: Submit to stores

**Week 3:**
- Day 1-3: Review process (Apple/Google)
- Day 4: Address feedback (if any)
- Day 5: Final approval & launch 🚀

---

## CRITICAL SUCCESS FACTORS

### Must-Have for Success:

1. **Middleware PHẢI inject đúng tenant**
   - Sai tenant = authentication fail
   - Test kỹ với Brekeke server trước khi deploy

2. **Brekeke admin PHẢI config app ID mới**
   - Không config = push notification fail 100%
   - Verify với Brekeke support nếu cần

3. **Certificate PHẢI match Bundle ID**
   - APNs cert phải cho `com.yourcompany.phone`
   - FCM key phải cho `com.yourcompany.phone`
   - Mismatch = push notification fail

4. **WebSocket proxy PHẢI stable**
   - Middleware down = toàn bộ app không hoạt động
   - Setup monitoring, auto-restart (PM2)
   - Consider load balancer for production

5. **SSL certificate PHẢI valid**
   - iOS yêu cầu HTTPS/WSS với valid cert
   - Không có SSL = app không connect

---

## RISKS & MITIGATION

### Risk 1: Middleware Single Point of Failure
**Impact:** High - App không hoạt động nếu middleware down

**Mitigation:**
- Setup monitoring & alerting
- Use PM2 with auto-restart
- Consider multi-instance deployment
- Setup health check endpoint
- Document rollback procedure

### Risk 2: Brekeke Push Config Complexity
**Impact:** Medium - Push notification fail nếu config sai

**Mitigation:**
- Test trên dev environment trước
- Contact Brekeke support để verify steps
- Document config steps với screenshots
- Keep backup của config cũ

### Risk 3: App Store Rejection
**Impact:** Medium - Delay launch timeline

**Mitigation:**
- Follow Apple/Google guidelines strictly
- Prepare clear app description
- Test thoroughly trước khi submit
- Có plan B nếu bị reject

### Risk 4: Tenant Injection Logic Fail
**Impact:** High - Users không login được

**Mitigation:**
- Unit test tenant injection logic
- Integration test với real Brekeke server
- Add detailed logging
- Setup fallback mechanism

---

## CONTACT & SUPPORT

### Questions for Customer:

**Before starting implementation:**
1. Domain cho middleware? (e.g., `api.yourcompany.com`)
2. SSL certificate sẵn có chưa?
3. Brekeke server info:
   - Hostname/IP?
   - Port? (default: 5060)
   - Tenant value? (default: `-`)
4. Test account credentials để test?
5. Logo assets (PNG/SVG high-res)?
6. Deployment hosting? (AWS, DigitalOcean, VPS?)

**During implementation:**
- Access to Brekeke admin panel?
- Apple Developer account owner?
- Google Play Console owner?

---

## NOTES

### Những gì KHÔNG thay đổi:
- Brekeke server license - hoạt động bình thường
- PAL/SIP protocol - giữ nguyên
- App features - tất cả chức năng vẫn hoạt động
- Database/storage - không migration

### Những gì THAY ĐỔI:
- App UI - Simplified login
- Connection flow - Via middleware
- Bundle ID - New app identity
- Push config - New certificates
- Branding - Company logo & colors

---

**Document Version:** 1.0  
**Last Updated:** April 2, 2026  
**Next Review:** Before implementation starts

---

## NEXT STEPS

1. **Review this document with stakeholders**
2. **Gather required information** (domain, credentials, assets)
3. **Approve timeline & budget**
4. **Start Phase 1: Middleware Development**

---

*For questions or clarifications, contact the development team.*
