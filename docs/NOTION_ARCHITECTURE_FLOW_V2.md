# 🏗️ BREKEKE PHONE - ARCHITECTURE FLOW V2

> **Project:** Brekeke Phone White-label Solution  
> **Version:** 2.16.11  
> **Date:** April 2, 2026  
> **Purpose:** Documentation cho giai đoạn sales và implementation planning  
> **Status:** Draft

---

## 📋 OVERVIEW

### 🎯 Mục tiêu White-label Solution

**Khách hàng đã mua license Brekeke** → Muốn tạo app với **thương hiệu riêng** (logo, màu sắc) và **trải nghiệm đơn giản** (chỉ nhập username/password)

### ✅ Key Requirements

| Requirement | Description | Priority |
|-------------|-------------|----------|
| Ẩn thông tin technical | Hostname, port, tenant | 🔴 High |
| Multi-tenant branding | Logo, màu sắc riêng cho từng tenant | 🔴 High |
| Simplified login | Chỉ nhập username/password | 🔴 High |
| Giữ nguyên license | Không ảnh hưởng Brekeke server | 🟡 Medium |
| Push notification | Hoạt động với app ID mới | 🔴 High |
| Dynamic logo loading | Fetch logo theo tenant sau khi login | 🟡 Medium |

### 🛠️ Tech Stack

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

## 👥 ACTORS & ROLES

### 1️⃣ BREKEKE (Vendor/Provider)
```yaml
Role: Vendor
Responsibilities:
  - Cung cấp phần mềm Brekeke PBX + license
  - Phát triển & maintain Brekeke Phone app (official)
  - Public app trên App Store/Play Store
  - Cung cấp support & documentation
```

### 2️⃣ KHÁCH HÀNG (Company - License Owner)
```yaml
Example: ABC Corporation
Role: License Owner
Responsibilities:
  - Đã mua license Brekeke PBX
  - Setup & vận hành Brekeke server riêng
  - Quản lý danh sách nhân viên (end-users) trong PBX
  - Cấp account cho từng nhân viên

Server Info:
  - Hostname: pbx.abc-company.com
  - Port: 5060
  - Tenant: abc-tenant
```

### 3️⃣ END-USERS (Nhân viên của khách hàng)
```yaml
Examples: John Doe, Jane Smith, Bob Wilson
Role: End User
Responsibilities:
  - Nhận thông tin từ IT admin công ty
  - Download Brekeke Phone app từ store
  - Tạo account với thông tin được cung cấp
  - Sử dụng app để gọi điện, nhắn tin
```

---

## 🔄 FLOW 1: ARCHITECTURE HIỆN TẠI

### 📝 A. User Registration & Login Flow

**Step 1: Account Creation Screen**
```
User phải nhập TẤT CẢ thông tin:
┌────────────────────────────────────┐
│ Hostname:  [pbx.company.com    ]  │  ← Technical info
│ Port:      [5060               ]  │  ← Technical info
│ Tenant:    [company-tenant     ]  │  ← Technical info
│ Username:  [john.doe           ]  │  ← User credential
│ Password:  [••••••••           ]  │  ← User credential
│ Phone:     [1 ▼] (1-4)           │  ← Extension number
│                                    │
│ [ ] Push Notification             │  ← Optional features
│ [ ] UC Chat                       │
│                                    │
│      [  CREATE ACCOUNT  ]         │
└────────────────────────────────────┘
```

**Step 2: Save to AsyncStorage**
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

**Step 3: User clicks SIGN IN**
- authStore.signIn(account)
- Triggers 3 parallel authentications:
  1. AuthPBX (PAL WebSocket)
  2. AuthSIP (SIP WebRTC) - after PBX success
  3. AuthUC (Chat) - if enabled

### 🔐 B. Authentication Flow - PBX Connection

**Connection Flow:**
```
MOBILE APP (React Native)
src/api/pbx.ts → connect()
        │
        │ WebSocket Connection
        ▼
wss://pbx.company.com:5060/pbx/ws
        │
        ▼
BREKEKE PBX SERVER (Licensed)
PAL (Phone Application Link) WebSocket Endpoint
        │
        ▼
PAL LOGIN PACKET (sent from app)
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
        │
        ▼
BREKEKE VALIDATES
- Check tenant exists
- Authenticate username/password
- Check phone_idx available
- Return session + configuration
        │
        ▼
RESPONSE: notify_serverstatus + config
App receives:
- Session established ✅
- PBX config (getProductInfo):
{
  "sip.wss.port": "5060",
  "webphone.dtmf.send.pal": "true",
  "webphone.turn.uri": "turn:server",
  "webphone.custompage.*": {...}
}
```

**Key Files:**
- `src/api/pbx.ts` - PBX WebSocket client
- `src/stores/authStore.ts` - Authentication orchestration
- `src/stores/accountStore.ts` - Account management

### 📞 C. Authentication Flow - SIP Connection

**SIP Connection Flow:**
```
APP (after PBX connected)
src/api/sip.ts → connect()
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
wss://pbx.company.com:5060/phone
        │
        ▼
BREKEKE SIP SERVER
- WebRTC SIP endpoint
- Uses JsSIP library
        │
        ▼
SIP REGISTRATION
phone.startWebRTC({
  url: "wss://pbx.company.com:5060/phone",
  user: "1001",
  auth: "sip-auth-token-jwt...",
  userAgent: "Brekeke Phone for iOS 1.0.0, JsSIP 3.2.15, ..."
})
        │
        ▼
SIP REGISTERED
- Ready for incoming/outgoing calls
- Can receive INVITE, ACK, BYE, etc.
```

**Key Methods:**
- `pbx.call_pal('updatePhoneIndex')` - Get SIP phone ID
- `pbx.call_pal('createAuthHeader')` - Generate SIP auth token
- `phone.startWebRTC()` - Register SIP client (JsSIP)

### 🔔 D. Push Notification Registration

**Push Notification Flow:**
```
APP (after PBX connected)
src/api/pbx.ts → pnmanage()
        │
        ▼
PUSH NOTIFICATION REGISTRATION
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
BREKEKE PBX - PN DATABASE
Lưu mapping:
{
  "tenant": "company-tenant",
  "username": "john.doe",
  "app_id": "com.brekeke.phonedev",
  "device_token": "apns-token-abc123...",
  "voip_token": "voip-token-xyz..."
}
        │
        │ When incoming call arrives
        ▼
SEND PUSH NOTIFICATION
Brekeke → APNs/FCM Server
- Use app_id: "com.brekeke.phonedev"
- Use certificate/key for this app_id
- Include sipAuth token (90s TTL)
→ Device receives notification
→ App wakes up
→ Auto-connect SIP using sipAuth
→ Answer call
```

**Critical Point:** Push notification requires:
- Correct Bundle ID / Package Name
- Valid APNs certificate (.p12/.p8) or FCM Server Key
- Brekeke admin configuration matching app ID

### 🌐 E. Complete Connection Diagram

**Current Architecture:**
```
BREKEKE PHONE APP
com.brekeke.phonedev

User enters:
- Hostname, Port, Tenant
- Username, Password, Phone Index
        │
        │ Direct connection
        ▼
Internet (Public)
        │
        ▼
BREKEKE SERVER (Licensed)
pbx.company.com:5060

├── PAL WebSocket (/pbx/ws)
│   - Tenant validation
│   - User authentication
│   - Config distribution
│   - Call control (hold, transfer, park)
│
├── SIP WebSocket (/phone)
│   - SIP registration
│   - Call signaling (INVITE, ACK, BYE)
│   - Media negotiation (SDP)
│
├── UC HTTPS (:443)
│   - Chat/messaging
│   - Presence/status
│   - File transfer
│
└── Push Notification Manager
    - Store device tokens
    - Send push via APNs/FCM
    - Certificate: com.brekeke.phonedev
        │
        │ Push notifications
        ▼
APNs / FCM Servers
(Apple / Google)
```

---

## 🎭 REAL-WORLD SCENARIO

### 📊 ABC Corporation Case Study

**Company Profile:**
- 100 nhân viên
- Đã mua license Brekeke PBX
- Server: pbx.abc-company.com:5060
- Tenant: abc-tenant

### 📋 Step 1: Setup Server

**IT Admin tạo accounts trong PBX:**
| Username | Password | Extension | Phone |
|----------|----------|-----------|-------|
| john.doe | john123 | 1001 | 1 |
| jane.smith | jane456 | 1002 | 1 |
| bob.wilson | bob789 | 1003 | 1 |
| alice.johnson | alice000 | 1004 | 1 |
| ... (96 users more) | | | |

### 📧 Step 2: IT Admin Gửi Thông Tin

**Mass Email Template:**
```
To: all-employees@abc-company.com
Subject: Setup Brekeke Phone App

Dear Team,

Please download "Brekeke Phone" and use:

Hostname: pbx.abc-company.com
Port: 5060
Tenant: abc-tenant
Username: [your username]
Password: [your password]
Phone: 1

Contact IT if you have issues.
```

### 👨‍💼 Step 3: John Doe Setup App

**John's Setup Process:**
1. Download "Brekeke Phone" from App Store
2. Open app → See Brekeke logo (green)
3. Tap "New Account"
4. Nhập thông tin:
   - Hostname: pbx.abc-company.com
   - Port: 5060
   - Tenant: abc-tenant
   - Username: john.doe
   - Password: john123
   - Phone: 1
5. Tap "Create Account"
6. Tap "Sign In"

### 🔗 Step 4: App Connects & Registers

**Connection Process:**
```
John's iPhone (com.brekeke.phonedev)
        │
        │ Connect to: wss://pbx.abc-company.com:5060/pbx/ws
        │ Send PAL login:
        │   { tenant: "abc-tenant", login_user: "john.doe", ... }
        ▼
ABC Corp's Brekeke Server
        │
        │ ✅ Validate john.doe in abc-tenant
        │ ✅ Assign extension 1001
        │ ✅ Return session
        ▼
John's App
        │
        │ Register push notification:
        │   pnmanage({
        │     app_id: "com.brekeke.phonedev",
        │     username: "john.doe",
        │     device_id: "john-iphone-token-abc123..."
        │   })
        ▼
Brekeke PN Database
        │
        │ Store mapping:
        │ abc-tenant | john.doe | 1001 | john-iphone-token
        ▼
John's app is ready! ✅
```

### 📞 Step 5: Incoming Call to John

**Incoming Call Flow:**
```
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
```

**⚠️ IMPORTANT:** Jane, Bob, Alice không nhận push này. Chỉ có John's device nhận notification vì Brekeke routing dựa trên tenant + username + extension.

### 📈 Multiple Users Scenario

**Push Notification Database:**
| Tenant | Username | Ext | Device Token |
|--------|----------|-----|--------------|
| abc-tenant | john.doe | 1001 | john-iphone-token |
| abc-tenant | jane.smith | 1002 | jane-android-token |
| abc-tenant | bob.wilson | 1003 | bob-iphone-token |
| abc-tenant | alice.johnson | 1004 | alice-ipad-token |
| abc-tenant | alice.johnson | 1004 | alice-iphone-token |
| ... (95 more users) | | | |

**Call Scenarios:**

**Scenario 1:** External call to extension 1002
- Brekeke lookup: 1002 → jane.smith
- Send push to: jane-android-token
- ONLY Jane's Android rings 🔔

**Scenario 2:** Internal call - John calls Bob (1001 → 1003)
- John dials 1003 from his app
- Brekeke routes to extension 1003
- Brekeke lookup: 1003 → bob.wilson
- Send push to: bob-iphone-token
- ONLY Bob's iPhone rings 🔔

**Scenario 3:** Conference call to extension 1004 (Alice)
- Brekeke lookup: 1004 → alice.johnson
- Alice có 2 devices registered
- Send push to BOTH:
  - alice-ipad-token
  - alice-iphone-token
- Alice's iPad AND iPhone ring 🔔🔔
- Alice answer từ iPad → iPhone stop ringing

**Scenario 4:** Broadcast announcement to all 100 users
- Brekeke sends 100 separate pushes:
  1001 → john-iphone-token
  1002 → jane-android-token
  1003 → bob-iphone-token
  ...
  1100 → user100-token
- All 100 devices ring 🔔 (100 pushes sent)

**✅ Push notification routing is PRECISE & SCALABLE:**
- Mỗi user chỉ nhận push của mình
- Support multiple devices per user
- No cross-contamination between users

---

## ❌ PAIN POINTS HIỆN TẠI

### 🎯 ABC Corp's Pain Points

| Issue | Description | Impact |
|-------|-------------|--------|
| **Branding** | App vẫn hiển thị "Brekeke Phone" logo | 🔴 High |
| **User Experience** | Nhân viên phải nhập hostname, port, tenant | 🔴 High |
| **Security** | Tất cả nhân viên biết server info | 🟡 Medium |
| **Professional Image** | Customer-facing employees dùng "Brekeke Phone" | 🟡 Medium |
| **Onboarding** | Mất thời gian training & support | 🔴 High |

### 📊 Pain Points Detail

**1. BRANDING:**
- ❌ App vẫn hiển thị "Brekeke Phone" logo
- ❌ Nhân viên hỏi: "Why are we using another company's app?"
- ❌ ABC Corp muốn: "ABC Phone" với logo công ty

**2. USER EXPERIENCE:**
- ❌ Nhân viên phải nhập hostname, port, tenant
- ❌ Support tickets: "What is hostname?", "I forgot the port"
- ❌ 30% nhân viên nhập sai → không connect được
- ❌ Mất thời gian training & support

**3. SECURITY CONCERNS:**
- ❌ Tất cả 100 nhân viên biết:
  - Server hostname: pbx.abc-company.com
  - Port: 5060
  - Tenant: abc-tenant
- ❌ Nếu nhân viên nghỉ việc → họ vẫn biết server info
- ❌ Risk: Ex-employee có thể attempt brute force attack

**4. PROFESSIONAL IMAGE:**
- ❌ Customer-facing employees dùng "Brekeke Phone"
- ❌ Customers Google "Brekeke" → confused
- ❌ ABC Corp muốn professional image

**5. ONBOARDING COMPLEXITY:**
- ❌ 100 nhân viên mới mỗi năm
- ❌ Mỗi người cần instruction document
- ❌ IT helpdesk overwhelmed với setup issues

---

## ✅ WHITE-LABEL SOLUTION

### 🎯 ABC Corp's Wish List

| Feature | Description | Priority |
|---------|-------------|----------|
| **Branded App** | App name: "ABC Phone", logo & colors | 🔴 High |
| **Simplified Login** | Chỉ nhập Username + Password | 🔴 High |
| **Security** | Server info ẩn trong middleware | 🔴 High |
| **Easy Onboarding** | 1-minute setup vs 10-minute setup | 🟡 Medium |
| **Scalability** | 100 users today, 500 users next year | 🟡 Medium |

### 📋 Wish List Detail

**1. BRANDED APP:**
- ✅ App name: "ABC Phone"
- ✅ ABC Corp logo & colors (blue)
- ✅ On App Store/Play Store as "ABC Corporation"
- ✅ Professional image for employees & customers

**2. SIMPLIFIED LOGIN:**
- ✅ Nhân viên CHỈ nhập: Username + Password
- ✅ Như Gmail, Facebook, etc. (user-friendly)
- ✅ No technical jargon (hostname/port/tenant)
- ✅ Giảm 90% support tickets

**3. SECURITY:**
- ✅ Server info ẩn trong middleware
- ✅ Nhân viên KHÔNG biết hostname/port/tenant
- ✅ Ex-employees không có thông tin để attack
- ✅ Centralized control

**4. EASY ONBOARDING:**
- ✅ New hire email: "Download ABC Phone, use your username/password"
- ✅ 1-minute setup vs 10-minute setup
- ✅ Reduce helpdesk load by 80%

**5. SCALABILITY:**
- ✅ 100 users today, 500 users next year
- ✅ Middleware có thể load balance
- ✅ Multiple Brekeke servers if needed
- ✅ Centralized monitoring & logging

**SOLUTION:** White-label app + Middleware server

---

## 🔄 FLOW 2: ARCHITECTURE WHITE-LABEL

### 📝 A. Simplified User Login Flow

**Step 1: Simplified Login Screen**
```
User chỉ cần nhập:
┌────────────────────────────────────┐
│  🏢 YOUR COMPANY LOGO             │
│                                    │
│  Username: [john.doe           ]  │  ← Only user credential
│  Password: [••••••••           ]  │  ← Only user credential
│  Phone:    [1 ▼] (1-4)           │  ← Extension number
│                                    │
│  [ ] Push Notification             │  ← Optional features
│  [ ] UC Chat                       │
│                                    │
│      [  SIGN IN  ]                │
└────────────────────────────────────┘

❌ KHÔNG CÒN: Hostname, Port, Tenant
✅ User chỉ nhập: Username, Password, Phone
```

**Step 2: Auto-inject Middleware Config**
```javascript
MIDDLEWARE_CONFIG = {
  baseUrl: "https://your-middleware.com",
  defaultTenant: "-",
  defaultPort: "443"
}

Account Object (auto-filled):
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

⚠️ User KHÔNG BIẾT đang connect qua middleware
```

**Step 3: User clicks SIGN IN**
- authStore.signIn(account)
- App connects to MIDDLEWARE instead of Brekeke

### 🔐 B. Authentication with Middleware

**Middleware Connection Flow:**
```
MOBILE APP (React Native)
src/api/pbx.ts → connect()

WebSocket URL:
wss://your-middleware.com/pbx/ws ← Points to middleware!
        │
        │ WebSocket Connection
        ▼
MIDDLEWARE SERVER (Node.js - YOUR SERVER)
https://your-middleware.com

├── WebSocket Endpoint: /pbx/ws
│   1. Accept connection from app
│   2. Establish connection to Brekeke server
│   3. Proxy messages bidirectionally
│   4. INJECT tenant into login params
        │
        │ INTERCEPTION POINT
        ▼
MIDDLEWARE LOGIC - TENANT INJECTION

App sends (tenant = "-"):
{
  "tenant": "-",
  "login_user": "john.doe",
  "login_password": "secret123",
  "phone_idx": "1"
}

▼ MIDDLEWARE INTERCEPTS & MODIFIES ▼

Middleware injects from env:
{
  "tenant": "company-tenant",
  "login_user": "john.doe",
  "login_password": "secret123",
  "phone_idx": "1"
}

Environment variables on middleware:
BREKEKE_HOST=pbx.company.com
BREKEKE_PORT=5060
BREKEKE_TENANT=company-tenant ← SECRET, not in app!
        │
        │ Forward to Brekeke
        ▼
BREKEKE PBX SERVER (Licensed)
pbx.company.com:5060

Receives:
{
  "tenant": "company-tenant",
  "login_user": "john.doe",
  "login_password": "secret123",
  "phone_idx": "1"
}

✅ Validates & authenticates normally
✅ Returns session + config
        │
        │ Response
        ▼
MIDDLEWARE - Transparent Proxy

Response from Brekeke:
- notify_serverstatus
- PBX config

→ Forward unchanged to app
        │
        ▼
APP receives response
- Session established ✅
- Continue with SIP connection
```

### 📞 C. SIP Connection with Middleware

**SIP Connection Flow:**
```
APP
src/api/sip.ts → connect()

WebSocket URL:
wss://your-middleware.com/phone ← Points to middleware!
        │
        ▼
MIDDLEWARE SERVER

├── WebSocket Endpoint: /phone
│   1. Accept connection from app
│   2. Establish connection to Brekeke SIP
│   3. TRANSPARENT PROXY (no modification needed)
│     - SIP already authenticated via token from PAL
        │
        │ Proxy to Brekeke
        ▼
wss://pbx.company.com:5060/phone
        │
        ▼
BREKEKE SIP SERVER

- Receives SIP registration with auth token
- Process normally
```

### 🔔 D. Push Notification with New App ID

**Push Notification Flow:**
```
WHITE-LABEL APP
com.yourcompany.phone ← NEW Bundle ID!

1. Get device token from APNs/FCM
2. Send to Brekeke via PAL (through middleware)
        │
        ▼
PUSH NOTIFICATION REGISTRATION (through middleware)

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
BREKEKE PBX - PN DATABASE

⚠️ CRITICAL: Must be configured with NEW app ID!

Admin Panel → Push Notification Settings:

iOS Configuration:
- Application ID: com.yourcompany.phone ← NEW!
- APNs Certificate: [Upload new .p12/.p8] ← NEW!
- APNs Key ID: XYZ123
- APNs Team ID: ABC456

Android Configuration:
- Package: com.yourcompany.phone ← NEW!
- FCM Server Key: [New Firebase key] ← NEW!

Store mapping:
{
  "tenant": "company-tenant",
  "username": "john.doe",
  "app_id": "com.yourcompany.phone",
  "device_token": "new-apns-token-xyz...",
  "voip_token": "new-voip-token-abc..."
}
        │
        │ When call arrives
        ▼
SEND PUSH via NEW certificate

Brekeke uses:
- app_id: "com.yourcompany.phone"
- NEW APNs certificate for this app
- NEW FCM server key

→ APNs/FCM → Your white-label app
```

### 🌐 E. Complete White-label Architecture

**White-label Architecture:**
```
YOUR COMPANY PHONE APP (White-label)
com.yourcompany.phone

User ONLY sees:
- Username, Password, Phone Index
- Company logo & branding

User KHÔNG THẤY:
- Hostname, Port, Tenant
- Brekeke branding
        │
        │ Connect to middleware
        ▼
Internet (Public)
        │
        ▼
MIDDLEWARE SERVER (Node.js - YOUR SERVER)
https://your-middleware.com:443

Environment Config:
BREKEKE_HOST=pbx.company.com
BREKEKE_PORT=5060
BREKEKE_TENANT=company-tenant

├── PAL WebSocket Proxy: /pbx/ws
│   - Accept app connections
│   - Inject tenant from env
│   - Proxy to Brekeke PAL
│
├── SIP WebSocket Proxy: /phone
│   - Transparent proxy
│   - No modification needed
│
└── UC HTTPS Proxy: /uc/* (Optional)
    - Proxy chat requests
        │
        │ Proxy connections
        ▼
Private Network or Internet (Secured)
        │
        ▼
BREKEKE SERVER (Licensed)
pbx.company.com:5060
(Same as before, NO CHANGES)

⚠️ ONLY CHANGE: Push Notification Config
- Add new App ID: com.yourcompany.phone
- Upload new APNs certificate
- Add new FCM server key
        │
        │ Push notifications
        ▼
APNs / FCM Servers
(Apple / Google)
        │
        ▼
[Your white-label app]
```

---

## 📊 SO SÁNH FLOW 1 VS FLOW 2

### 📋 Comparison Table

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

### 🔄 Key Differences

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

## ✅ IMPLEMENTATION CHECKLIST

### 📋 Phase 1: Middleware Server Setup

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

### 📋 Phase 2: React Native App Modification

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

### 📋 Phase 3: Push Notification Setup

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

### 📋 Phase 4: Testing

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

### 📋 Phase 5: Deployment

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

## ⏱️ ESTIMATES & TIMELINE

### 📊 Development Time Estimates

#### Middleware Server Development:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **1. Project Setup & Infrastructure** | | |
| Initialize Node.js/TypeScript project | 2-3h | package.json, tsconfig, folder structure |
| Setup development environment | 1-2h | ESLint, Prettier, Git hooks |
| Install & configure dependencies | 2-3h | Express, ws, dotenv, cors, helmet |
| Setup development/production configs | 2-3h | Environment variables, config files |
| **2. PAL WebSocket Proxy Implementation** | | |
| Design proxy architecture | 3-4h | Class design, connection flow |
| Implement WebSocket server (/pbx/ws) | 4-6h | Accept client connections |
| Implement WebSocket client to Brekeke | 3-4h | Connect to real Brekeke server |
| Implement bidirectional message relay | 4-6h | Proxy messages both ways |
| Implement tenant injection logic | 3-4h | Parse, modify, inject tenant |
| Handle connection lifecycle | 3-4h | Connect, disconnect, reconnect |
| **3. SIP WebSocket Proxy Implementation** | | |
| Implement SIP WebSocket server (/phone) | 3-4h | Transparent proxy endpoint |
| Implement SIP message relay | 2-3h | Forward SIP packets |
| Handle SIP connection lifecycle | 2-3h | Connect, disconnect handling |
| **4. UC Proxy (Optional)** | | |
| Implement HTTP/HTTPS proxy (/uc/*) | 3-4h | REST API proxy |
| Handle UC authentication | 2-3h | Token forwarding |
| **5. Error Handling & Logging** | | |
| Implement error handling middleware | 3-4h | Try-catch, error responses |
| Setup logging system (Winston/Pino) | 2-3h | Logger configuration |
| Implement request/response logging | 2-3h | Debug logs, audit trail |
| Implement health check endpoint | 1-2h | /health, /status endpoints |
| **6. Security & SSL** | | |
| Generate/obtain SSL certificate | 2-3h | Let's Encrypt setup |
| Configure HTTPS server | 2-3h | SSL/TLS configuration |
| Implement CORS policies | 1-2h | Security headers |
| Implement rate limiting | 2-3h | Prevent abuse |
| **7. Testing** | | |
| Write unit tests (Jest) | 6-8h | Test individual functions |
| Write integration tests | 6-8h | Test WebSocket flow |
| Manual testing with wscat | 3-4h | Debug connection issues |
| Test with real Brekeke server | 4-6h | End-to-end testing |
| Load testing (Artillery/k6) | 3-4h | Performance testing |
| **8. Deployment & DevOps** | | |
| Setup server (VPS/Cloud) | 2-3h | Ubuntu/CentOS setup |
| Configure firewall rules | 1-2h | iptables/ufw |
| Setup PM2 process manager | 2-3h | Auto-restart, clustering |
| Setup monitoring (Prometheus/Grafana) | 4-6h | Metrics, alerts |
| Setup log rotation | 1-2h | logrotate configuration |
| Create deployment scripts | 2-3h | CI/CD, deploy.sh |
| Document deployment process | 2-3h | README, runbooks |
| **9. Bug Fixes & Refinement** | | |
| Fix bugs found during testing | 8-12h | Debugging, fixing issues |
| Performance optimization | 4-6h | Memory leaks, latency |
| Code refactoring | 3-4h | Clean up, improve code |
| **SUBTOTAL** | **95-135h** | **~12-17 days** |

#### React Native App Modification:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **1. Configuration Setup** | | |
| Create middleware.ts config file | 1-2h | Middleware URL, endpoints |
| Create branding.ts config file | 1-2h | Colors, company name |
| Update environment configs | 1-2h | dev/staging/prod |
| Create feature flags | 1-2h | Toggle middleware on/off |
| **2. UI Modifications** | | |
| Analyze AccountCreateForm component | 1-2h | Understand current code |
| Remove hostname/port/tenant fields | 2-3h | Update JSX, validation |
| Update form validation logic | 2-3h | Remove old validations |
| Update form state management | 1-2h | MobX store updates |
| Test AccountCreateForm | 2-3h | Manual testing, edge cases |
| Analyze AccountSignInItem component | 1h | Understand current code |
| Update display to hide tech info | 1-2h | Only show username |
| Test AccountSignInItem | 1-2h | Visual testing |
| Update variables.ts colors | 1-2h | Primary color, theme |
| Test color changes on all screens | 2-3h | 33 screens to verify |
| **3. Logic Changes** | | |
| Analyze accountStore.ts | 2-3h | Understand account flow |
| Implement auto-inject middleware config | 3-4h | Modify account creation |
| Update account validation | 2-3h | New validation rules |
| Test accountStore changes | 3-4h | Unit tests, integration |
| Analyze pbx.ts | 2-3h | Understand PBX connection |
| Update WebSocket URL to middleware | 2-3h | Change connection logic |
| Implement dev/prod URL switching | 1-2h | Environment-based URL |
| Add connection retry logic | 2-3h | Handle middleware down |
| Test pbx.ts changes | 3-4h | Test with middleware |
| Analyze sip.ts | 2-3h | Understand SIP connection |
| Update WebSocket URL to middleware | 2-3h | Change SIP endpoint |
| Test sip.ts changes | 3-4h | Test SIP registration |
| **4. Debug & Fix Issues** | | |
| Fix broken tests | 4-6h | Update test cases |
| Fix TypeScript errors | 2-3h | Type definitions |
| Fix runtime errors | 4-6h | Debug crashes |
| **SUBTOTAL (Code)** | **52-75h** | **~7-10 days** |

#### Branding Assets:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **1. Logo Design (if needed)** | | |
| Research competitor apps | 2-3h | App Store research |
| Create logo concepts | 4-6h | 3-5 variations |
| Refine selected logo | 2-3h | Polish final design |
| Export logo variations | 1h | PNG, SVG, different sizes |
| **2. iOS Icons Generation** | | |
| Research iOS icon requirements | 1h | Sizes, guidelines |
| Generate 20x20@2x, 20x20@3x | 0.5h | App icon sizes |
| Generate 29x29@2x, 29x29@3x | 0.5h | Settings icon |
| Generate 40x40@2x, 40x40@3x | 0.5h | Spotlight icon |
| Generate 60x60@2x, 60x60@3x | 0.5h | App icon (main) |
| Generate 76x76@1x, 76x76@2x | 0.5h | iPad icon |
| Generate 83.5x83.5@2x | 0.5h | iPad Pro icon |
| Generate 1024x1024 | 0.5h | App Store icon |
| Update AppIcon.appiconset/Contents.json | 1h | Icon metadata |
| Test on real devices | 1-2h | Verify icons appear |
| **3. Android Icons Generation** | | |
| Research Android icon requirements | 1h | Sizes, adaptive icons |
| Generate mipmap-mdpi (48x48) | 0.5h | Density icons |
| Generate mipmap-hdpi (72x72) | 0.5h | |
| Generate mipmap-xhdpi (96x96) | 0.5h | |
| Generate mipmap-xxhdpi (144x144) | 0.5h | |
| Generate mipmap-xxxhdpi (192x192) | 0.5h | |
| Create adaptive icon layers | 2-3h | Foreground, background |
| Update ic_launcher.xml | 1h | Icon configuration |
| Test on real devices | 1-2h | Multiple Android versions |
| **4. Splash Screens** | | |
| Design iOS splash screen | 2-3h | Launch screen design |
| Generate iOS splash variations | 2-3h | Different screen sizes |
| Update LaunchScreen.storyboard | 1-2h | iOS launch screen |
| Design Android splash screen | 2-3h | Launch screen design |
| Generate Android splash variations | 2-3h | Different densities |
| Update launch_screen.xml | 1-2h | Android splash config |
| Test splash screens | 1-2h | Both platforms |
| **5. Web Assets** | | |
| Create favicon.ico | 0.5h | 16x16, 32x32 |
| Create web app icons | 1h | 192x192, 512x512 |
| **6. Asset Integration** | | |
| Replace all iOS assets | 2-3h | Copy to Xcode project |
| Replace all Android assets | 2-3h | Copy to Android project |
| Verify no missing assets | 1-2h | Check warnings |
| Clean build & test | 2-3h | Full rebuild |
| **SUBTOTAL** | **40-58h** | **~5-7 days** |

#### Push Notification Setup:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **1. iOS APNs Setup** | | |
| Research APNs requirements | 1-2h | Documentation, guides |
| Login to Apple Developer Portal | 0.5h | Account access |
| Create new App ID | 1h | Identifier, capabilities |
| Enable Push Notifications capability | 0.5h | Configure capability |
| Create APNs Key (.p8 method) | 1-2h | Generate, download |
| OR Create APNs Certificate (.p12 method) | 2-3h | CSR, generate, export |
| Store keys/certificates securely | 0.5h | Password manager |
| Document Key ID, Team ID | 0.5h | For Brekeke config |
| **2. Android FCM Setup** | | |
| Research FCM requirements | 1-2h | Documentation, guides |
| Create Firebase project | 1h | Firebase Console |
| Configure project settings | 1h | Project name, region |
| Add Android app to project | 1h | Package name |
| Download google-services.json | 0.5h | Save to project |
| Get FCM Server Key | 1h | Cloud Messaging settings |
| Store server key securely | 0.5h | Password manager |
| Configure SHA-1 fingerprints | 1-2h | Debug + release keys |
| **3. App Configuration** | | |
| Add google-services.json to Android | 1h | Correct location |
| Update build.gradle dependencies | 1-2h | Firebase SDK |
| Configure iOS push capabilities | 1h | Xcode entitlements |
| Update Info.plist | 1h | Background modes |
| Test Firebase initialization | 1-2h | Debug logs |
| **4. Brekeke PBX Configuration** | | |
| Research Brekeke PN docs | 2-3h | Admin manual |
| Login to Brekeke Admin Panel | 0.5h | Get admin access |
| Navigate to PN Settings | 0.5h | Find correct page |
| Configure iOS settings | 2-3h | Upload cert/key, test |
| Configure Android settings | 1-2h | Add FCM key, test |
| Test push from admin panel | 2-3h | Send test notifications |
| Debug push failures | 3-4h | Check logs, fix issues |
| Document configuration steps | 1-2h | Screenshots, notes |
| **5. App Integration Testing** | | |
| Test device token registration | 2-3h | iOS + Android |
| Test push when app foreground | 1-2h | Both platforms |
| Test push when app background | 2-3h | Both platforms |
| Test push when app killed | 2-3h | Both platforms |
| Test VoIP push (iOS) | 2-3h | CallKit integration |
| Test notification actions | 2-3h | Accept/decline |
| Debug push issues | 4-6h | Fix token issues |
| **SUBTOTAL** | **42-62h** | **~5-8 days** |

#### Bundle ID Changes & Build:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **1. iOS Bundle ID Changes** | | |
| Research Bundle ID change process | 1h | Documentation |
| Open Xcode project | 0.5h | Navigate to settings |
| Update Bundle Identifier | 1h | com.yourcompany.phone |
| Update CFBundleDisplayName | 0.5h | App name |
| Update all targets (main, tests, etc.) | 1-2h | Multiple targets |
| Update Signing & Capabilities | 1-2h | Team, certificates |
| Update Info.plist references | 1h | URL schemes, etc. |
| Update scheme settings | 0.5h | Build schemes |
| Search & replace old Bundle ID | 1-2h | Entire codebase |
| **2. iOS Signing Setup** | | |
| Create new App ID (if not done) | 1h | Developer Portal |
| Generate provisioning profile | 1-2h | Development profile |
| Generate distribution profile | 1-2h | App Store profile |
| Download & install profiles | 1h | Xcode management |
| Configure automatic signing | 1h | Or manual signing |
| Verify signing settings | 1h | Check all targets |
| **3. Android Package Name Changes** | | |
| Research package rename process | 1h | Documentation |
| Update applicationId in build.gradle | 1h | App-level gradle |
| Update package in AndroidManifest.xml | 1h | Main manifest |
| Rename package folders | 2-3h | Java/Kotlin files |
| Update import statements | 2-3h | All imports |
| Update BuildConfig references | 1h | Build configs |
| Update R references | 1h | Resources |
| Update test package names | 1-2h | Test files |
| Search & replace old package name | 2-3h | Entire codebase |
| **4. Android Signing Setup** | | |
| Generate new signing keystore | 1h | keytool command |
| Store keystore securely | 0.5h | Password manager |
| Update gradle.properties | 1h | Keystore path, passwords |
| Update build.gradle signing config | 1h | Release signing |
| Verify signing configuration | 1h | Check builds |
| **5. Firebase Configuration** | | |
| Update iOS Firebase config | 1-2h | GoogleService-Info.plist |
| Update Android Firebase config | 1-2h | google-services.json |
| Update Firebase Console settings | 1h | App settings |
| Test Firebase connection | 1-2h | Analytics, FCM |
| **6. Build & Verification** | | |
| Clean iOS build | 0.5h | Clean derived data |
| Build iOS Debug | 1-2h | Fix build errors |
| Build iOS Release | 1-2h | Fix release errors |
| Test iOS on simulator | 1-2h | Verify functionality |
| Test iOS on real device | 2-3h | Debug on device |
| Clean Android build | 0.5h | Clean gradle cache |
| Build Android Debug | 1-2h | Fix build errors |
| Build Android Release | 2-3h | Fix release errors |
| Test Android on emulator | 1-2h | Verify functionality |
| Test Android on real device | 2-3h | Debug on device |
| **7. Troubleshooting** | | |
| Fix iOS build errors | 3-5h | Linking, dependencies |
| Fix Android build errors | 3-5h | Gradle, dependencies |
| Fix runtime errors | 4-6h | Crashes, bugs |
| Fix third-party SDK issues | 2-4h | SDK conflicts |
| **SUBTOTAL** | **56-82h** | **~7-10 days** |

#### Testing:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **1. Functional Testing** | | |
| Test login with simplified form | 2-3h | Username/password only |
| Test connection to middleware | 2-3h | WebSocket connection |
| Verify tenant injection works | 2-3h | Check Brekeke logs |
| Test PBX connection (PAL) | 3-4h | All PAL functions |
| Test SIP registration | 2-3h | SIP client works |
| Test outgoing calls | 3-4h | Make calls, audio |
| Test incoming calls | 3-4h | Receive calls |
| Test call hold | 1-2h | Hold/resume |
| Test call transfer | 2-3h | Blind, attended |
| Test call park | 2-3h | Park/unpark |
| Test conference calls | 2-3h | Multi-party |
| Test voicemail | 2-3h | Check messages |
| Test UC chat (if enabled) | 3-4h | Send/receive messages |
| Test presence status | 1-2h | Online/offline |
| Test contacts sync | 2-3h | Directory |
| Test call history | 1-2h | Recent calls |
| **2. Push Notification Testing** | | |
| Test iOS push (foreground) | 2-3h | App active |
| Test iOS push (background) | 2-3h | App in background |
| Test iOS push (killed) | 3-4h | App terminated |
| Test iOS VoIP push | 3-4h | CallKit integration |
| Test Android push (foreground) | 2-3h | App active |
| Test Android push (background) | 2-3h | App in background |
| Test Android push (killed) | 3-4h | App terminated |
| Test notification actions | 2-3h | Accept/decline |
| Test notification sound | 1-2h | Custom sounds |
| Debug push failures | 4-6h | Fix issues |
| **3. UI/UX Testing** | | |
| Test logo on all screens | 2-3h | 33 screens |
| Verify brand colors | 2-3h | All components |
| Test light mode | 2-3h | If supported |
| Test dark mode | 2-3h | If supported |
| Test different screen sizes | 3-4h | Phones, tablets |
| Test landscape orientation | 2-3h | Rotate device |
| Test accessibility | 2-3h | VoiceOver, TalkBack |
| **4. Cross-platform Testing** | | |
| Test on iOS Simulator (multiple versions) | 3-4h | iOS 14, 15, 16, 17 |
| Test on real iPhone | 3-4h | Multiple models |
| Test on real iPad | 2-3h | Different sizes |
| Test on Android Emulator | 3-4h | Different versions |
| Test on real Android phones | 3-4h | Samsung, Pixel, etc. |
| Test on Android tablets | 2-3h | Different sizes |
| **5. Performance Testing** | | |
| Measure app startup time | 2-3h | Cold, warm start |
| Measure login response time | 1-2h | Network latency |
| Measure call connection latency | 2-3h | Time to connect |
| Test middleware proxy latency | 2-3h | vs direct connection |
| Monitor memory usage | 3-4h | Memory leaks |
| Monitor battery consumption | 4-6h | Background, calls |
| Test with slow network | 2-3h | 3G, throttled |
| Test offline behavior | 2-3h | No internet |
| **6. Regression Testing** | | |
| Re-test core features | 4-6h | Ensure nothing broke |
| Test edge cases | 3-4h | Unusual scenarios |
| Test error handling | 2-3h | Invalid inputs |
| **7. Bug Fixes** | | |
| Fix critical bugs | 8-12h | P0 issues |
| Fix major bugs | 6-10h | P1 issues |
| Fix minor bugs | 4-6h | P2 issues |
| Re-test after fixes | 4-6h | Verify fixes |
| **SUBTOTAL** | **120-170h** | **~15-21 days** |

#### Deployment:
| Task | Estimated Hours | Notes |
|------|----------------|-------|
| **1. App Store Preparation (iOS)** | | |
| Create App Store Connect listing | 2-3h | App info, categories |
| Write app description | 2-3h | Marketing copy |
| Write keywords | 1h | ASO optimization |
| Prepare screenshots (6.5" iPhone) | 2-3h | 5-8 screenshots |
| Prepare screenshots (5.5" iPhone) | 1-2h | 5-8 screenshots |
| Prepare screenshots (iPad Pro) | 2-3h | 5-8 screenshots |
| Create app preview video (optional) | 4-6h | Video editing |
| Fill in app details | 1-2h | Privacy policy, etc. |
| Configure pricing & availability | 1h | Regions, price |
| **2. Play Store Preparation (Android)** | | |
| Create Play Console listing | 2-3h | App info, categories |
| Write app description | 2-3h | Marketing copy |
| Prepare screenshots (phone) | 2-3h | 5-8 screenshots |
| Prepare screenshots (tablet) | 1-2h | 2-4 screenshots |
| Create feature graphic | 1-2h | 1024x500 banner |
| Create promo video (optional) | 4-6h | YouTube upload |
| Fill in app details | 1-2h | Privacy policy, etc. |
| Configure pricing & availability | 1h | Regions, price |
| Complete content rating | 1h | Questionnaire |
| **3. Build & Upload** | | |
| Archive iOS build | 1-2h | Xcode archive |
| Upload to App Store Connect | 1-2h | Transporter/Xcode |
| Wait for processing | 0.5-1h | Apple processing |
| Configure TestFlight (optional) | 1-2h | Beta testing |
| Submit for review | 1h | Fill in forms |
| Generate Android Release APK/AAB | 1-2h | Gradle build |
| Sign Android release | 1h | Keystore signing |
| Upload to Play Console | 1-2h | Upload AAB |
| Configure release track | 1h | Production/beta |
| Submit for review | 1h | Fill in forms |
| **4. Review & Iteration** | | |
| Monitor review status | 1-2h/day | Check daily |
| Wait for Apple review | 24-72h | Apple timeline |
| Wait for Google review | 4-24h | Google timeline |
| Address review feedback | 4-8h | Fix rejection issues |
| Re-submit if rejected | 2-4h | Fix & resubmit |
| **5. Documentation** | | |
| Write user guide | 3-4h | How to login, use app |
| Create admin guide | 3-4h | Brekeke configuration |
| Write troubleshooting guide | 2-3h | Common issues |
| Create FAQ document | 2-3h | Q&A |
| Write deployment guide | 2-3h | For future reference |
| Create video tutorials (optional) | 6-8h | Screen recordings |
| **6. Support Preparation** | | |
| Setup support email | 1h | Create email account |
| Setup support ticketing system | 2-3h | Zendesk, Freshdesk |
| Create response templates | 2-3h | Common questions |
| Write support scripts | 2-3h | For support team |
| Train support team | 4-6h | Training session |
| Create internal wiki | 2-3h | Knowledge base |
| **SUBTOTAL** | **70-105h** | **~9-13 days** |
| *(excluding review wait time)* | | |

### 📅 **TOTAL ESTIMATES (Realistic for Middle Developer):**

| Phase | Hours | Days (8h/day) | Notes |
|-------|-------|---------------|-------|
| Middleware Development | 95-135h | ~12-17 days | Build from scratch, no AI |
| App Code Modification | 52-75h | ~7-10 days | Manual refactoring |
| Branding Assets | 10.5-18.5h | ~1.5-2.5 days | Design + generate all sizes |
| Push Notification | 42-62h | ~5-8 days | Setup, config, debug |
| Bundle ID & Build | 44-62h | ~5-8 days | Rename, rebuild, fix |
| Testing | 40-64h | ~5-8 days | Comprehensive testing |
| Deployment | 32-42h | ~4-5.5 days | Store submission + docs |
| **TOTAL** | **315.5-458.5h** | **~39-58 days** | **~2-3 months** |

**Note:** Estimates assume:
- **Middle-level developer** (2-4 years experience)
- Building **manually without AI assistance**
- First time doing white-label implementation
- Learning curve for Brekeke PBX specifics
- Normal amount of bugs and issues
- Some blockers and waiting time (reviews, support)
- Does NOT include weekends/holidays
- Does NOT include time for meetings, code reviews

**Factors that increase time:**
- Unfamiliarity with Brekeke PBX
- Complex Brekeke server configuration
- Push notification debugging issues
- App Store rejection (1-2 iterations)
- Unexpected bugs in production
- Learning WebSocket proxy patterns
- TypeScript/Node.js inexperience

**Factors that decrease time:**
- Previous Brekeke experience
- Previous white-label experience
- Existing middleware boilerplate
- Senior developer (can reduce 20-30%)
- Pair programming or mentorship
- Using AI coding assistants (can reduce 30-40%)
- Existing design assets ready

### 🗓️ Timeline with Dependencies (2-3 Months, ~40-58 Days)

---

#### **📅 PHASE 1: Infrastructure & Middleware (Weeks 1-3, ~12-17 days)**

**Week 1: Middleware Foundation**
- Day 1-2: Project setup, TypeScript config, dependencies
- Day 3-4: Implement PAL WebSocket proxy server
- Day 5: Implement PAL WebSocket client to Brekeke

**Week 2: Middleware Core Features**
- Day 1-2: Implement bidirectional message relay
- Day 3: Implement tenant injection logic
- Day 4: Implement SIP WebSocket proxy (transparent)
- Day 5: Implement UC proxy (optional)

**Week 3: Middleware Security & Deployment**
- Day 1-2: Error handling, logging, health checks
- Day 3: SSL setup, security (CORS, rate limiting)
- Day 4-5: Unit/integration testing with Brekeke server

**Deliverables:**
- ✅ Middleware server running on dev environment
- ✅ Successfully proxying PAL & SIP connections
- ✅ Tenant injection working correctly
- ✅ SSL configured, basic monitoring setup

---

#### **📅 PHASE 2: App Modification & Branding (Weeks 4-6, ~14-20 days)**

**Week 4: App Configuration & UI Changes**
- Day 1: Create middleware.ts, branding.ts config files
- Day 2-3: Modify AccountCreateForm (remove hostname/port/tenant)
- Day 4: Update AccountSignInItem (hide tech info)
- Day 5: Update variables.ts (brand colors)

**Week 5: App Logic Changes**
- Day 1-2: Modify accountStore.ts (auto-inject middleware config)
- Day 3-4: Update pbx.ts (point to middleware, retry logic)
- Day 5: Update sip.ts (point to middleware)

**Week 6: Branding Assets (can run parallel with Week 4-5)**
- Day 1-2: Design/finalize logo (if needed)
- Day 3: Generate iOS app icons (20+ sizes)
- Day 4: Generate Android app icons (5+ densities)
- Day 5: Generate splash screens (iOS + Android)

**Deliverables:**
- ✅ App connects to middleware successfully
- ✅ Simplified login UI (username/password only)
- ✅ Brand colors applied throughout app
- ✅ All icons and splash screens generated

---

#### **📅 PHASE 3: Bundle ID & Push Notifications (Weeks 7-9, ~10-16 days)**

**Week 7: Bundle ID Changes**
- Day 1-2: iOS Bundle ID changes (Xcode project)
- Day 3: iOS signing setup (provisioning profiles)
- Day 4: Android package name changes (gradle, manifest, folders)
- Day 5: Android signing setup (keystore)

**Week 8: Build & Fix Errors**
- Day 1-2: Clean build iOS, fix build errors
- Day 3: Clean build Android, fix build errors
- Day 4-5: Test on simulators/emulators, fix runtime errors

**Week 9: Push Notification Setup**
- Day 1-2: iOS APNs setup (App ID, certificate/key)
- Day 3: Android FCM setup (Firebase project, google-services.json)
- Day 4-5: Brekeke PBX configuration (upload certs, test push)

**Deliverables:**
- ✅ App builds with new Bundle ID
- ✅ App runs on real devices
- ✅ Push notifications configured on Brekeke
- ✅ Test push received on both platforms

---

#### **📅 PHASE 4: Testing & Quality Assurance (Weeks 10-11, ~5-8 days)**

**Week 10: Functional Testing**
- Day 1: Test login, middleware connection, tenant injection
- Day 2: Test PBX connection (PAL), SIP registration
- Day 3: Test outgoing/incoming calls, call hold/transfer/park
- Day 4: Test voicemail, UC chat, presence, contacts
- Day 5: Test push notifications (foreground/background/killed)

**Week 11: Cross-platform & Performance Testing**
- Day 1: Test on multiple iOS devices/versions
- Day 2: Test on multiple Android devices/versions
- Day 3: Performance testing (startup, latency, memory, battery)
- Day 4-5: Bug fixes from testing

**Deliverables:**
- ✅ All core features working
- ✅ Push notifications working on both platforms
- ✅ Tested on multiple devices
- ✅ Critical/major bugs fixed

---

#### **📅 PHASE 5: Deployment & Launch (Weeks 12-13, ~4-5.5 days + review time)**

**Week 12: Store Preparation**
- Day 1-2: iOS App Store listing (screenshots, description, keywords)
- Day 3: Android Play Store listing (screenshots, feature graphic)
- Day 4: Archive iOS build, upload to App Store Connect
- Day 5: Build Android release APK/AAB, upload to Play Console

**Week 13: Documentation & Submit**
- Day 1: Write user guide, admin guide
- Day 2: Write troubleshooting guide, FAQ
- Day 3: Setup support email, response templates
- Day 4: Submit to App Store & Play Store
- Day 5: Monitor review status

**Week 14-15: Review & Launch** *(external timeline)*
- Day 1-3: Wait for Apple review (1-3 days typically)
- Day 1: Wait for Google review (few hours to 1 day typically)
- Day 4-5: Address feedback if rejected, re-submit
- Final: Launch 🚀

**Deliverables:**
- ✅ App live on App Store
- ✅ App live on Play Store
- ✅ Documentation complete
- ✅ Support system ready

---

### 📊 **TIMELINE SUMMARY:**

| Phase | Duration | Cumulative Days |
|-------|----------|-----------------|
| Phase 1: Middleware | 12-17 days | Day 1-17 |
| Phase 2: App + Branding | 14-20 days | Day 18-37 |
| Phase 3: Bundle ID + Push | 10-16 days | Day 38-53 |
| Phase 4: Testing | 5-8 days | Day 54-61 |
| Phase 5: Deployment | 4-5.5 days | Day 62-66 |
| **TOTAL (Development)** | **~40-58 days** | **~2-3 months** |
| + App Store Review | +3-7 days | |
| **TOTAL (with Review)** | **~43-65 days** | **~2-3.5 months** |

---

### 🔄 **PARALLEL WORK OPPORTUNITIES:**

**Can be done in parallel:**
- ✅ Branding assets (Week 6) during App modification (Week 4-5)
- ✅ Documentation (Week 13) during final testing
- ✅ Store listings prepared before builds ready

**Critical path (cannot parallelize):**
- 🔴 Middleware MUST be stable before app testing (Week 1-3)
- 🔴 Bundle ID changes MUST be done before push notification test (Week 7-8)
- 🔴 Push notification config blocks final testing (Week 9)
- 🔴 Testing MUST complete before store submission (Week 10-11)

---

### ⚠️ **RISK BUFFERS:**

**Add extra time for:**
- Middleware debugging issues: +2-4 days
- Push notification debugging: +2-3 days
- App Store rejection (1 iteration): +3-5 days
- Unexpected bugs in production: +2-4 days
- Brekeke support response time: +1-3 days

**Recommended buffer:** Add 20-30% to timeline = **~50-75 total days (2.5-3.5 months)**
- Day 4: Address feedback (if any)
- Day 5: Final approval & launch 🚀

---

## 🚨 CRITICAL SUCCESS FACTORS

### 🔴 Must-Have for Success:

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

## ⚠️ RISKS & MITIGATION

### 🔴 Risk 1: Middleware Single Point of Failure
**Impact:** High - App không hoạt động nếu middleware down

**Mitigation:**
- Setup monitoring & alerting
- Use PM2 with auto-restart
- Consider multi-instance deployment
- Setup health check endpoint
- Document rollback procedure

### 🟡 Risk 2: Brekeke Push Config Complexity
**Impact:** Medium - Push notification fail nếu config sai

**Mitigation:**
- Test trên dev environment trước
- Contact Brekeke support để verify steps
- Document config steps với screenshots
- Keep backup của config cũ

### 🟡 Risk 3: App Store Rejection
**Impact:** Medium - Delay launch timeline

**Mitigation:**
- Follow Apple/Google guidelines strictly
- Prepare clear app description
- Test thoroughly trước khi submit
- Có plan B nếu bị reject

### 🔴 Risk 4: Tenant Injection Logic Fail
**Impact:** High - Users không login được

**Mitigation:**
- Unit test tenant injection logic
- Integration test với real Brekeke server
- Add detailed logging
- Setup fallback mechanism

---

## 📞 CONTACT & SUPPORT

### ❓ Questions for Customer:

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

## 📝 NOTES

### ✅ Những gì KHÔNG thay đổi:
- Brekeke server license - hoạt động bình thường
- PAL/SIP protocol - giữ nguyên
- App features - tất cả chức năng vẫn hoạt động
- Database/storage - không migration

### ⚠️ Những gì THAY ĐỔI:
- App UI - Simplified login
- Connection flow - Via middleware
- Bundle ID - New app identity
- Push config - New certificates
- Branding - Company logo & colors

---

## 🎯 NEXT STEPS

1. **Review this document with stakeholders**
2. **Gather required information** (domain, credentials, assets)
3. **Approve timeline & budget**
4. **Start Phase 1: Middleware Development**

---

> **Document Version:** 2.0  
> **Last Updated:** April 2, 2026  
> **Next Review:** Before implementation starts  
> **Contact:** Development team for questions or clarifications
