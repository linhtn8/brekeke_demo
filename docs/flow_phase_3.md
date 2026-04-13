# Phase 3 - iOS Background Calling & Push Notifications (TestFlight)

## 📋 Tóm tắt

Tài liệu này mô tả chi tiết flow implementation cho **Phase 3** của BAP Demo App. Mục tiêu là đưa ứng dụng lên TestFlight (chỉ áp dụng cho iOS) và tích hợp Apple Push Notification service (APNs/PushKit) kết hợp CallKit để có thể nhận cuộc gọi ngay cả khi ứng dụng đã bị đóng (background/killed).

### Yêu cầu Phase 3 (Focus: iOS & TestFlight)
- ✅ **iOS Bundle ID:** Thay đổi định danh ứng dụng Xcode (Bundle Identifier) để phù hợp với tài khoản Apple Developer của BAP.
- ✅ **Apple Push Notifications (APNs / PushKit):** Setup chứng chỉ Apple để cho phép Server đánh thức app iOS từ xa.
- ✅ **Backend Upgrade:** Nâng cấp Signaling Server (Node.js) để gửi lệnh Push Notification (VoIP Push) qua hệ thống của Apple khi người dùng iOS đang offline/background.
- ✅ **iOS CallKit UI:** Sử dụng `react-native-callkeep` để hiển thị màn hình cuộc gọi chuẩn của iPhone (Full-screen ringing) ngay cả khi màn hình đang khoá.

*(Lưu ý: Các task liên quan đến Android (Google Play, FCM, ConnectionService) đã được loại bỏ khỏi Phase này theo yêu cầu).*

---

## 1. Architecture Overview (iOS Phase 3)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 iOS BACKGROUND CALLING ARCHITECTURE                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌─────────────┐        1. Call Request       ┌──────────────────┐      │
│   │ Caller App  │─────────────────────────────►│   Signaling      │      │
│   │ (iOS/Web)   │                              │   Server         │      │
│   └─────────────┘                              └────────┬─────────┘      │
│                                                         │                │
│                                           2. Send VoIP Push via APNs     │
│                                              (Always send to iOS)        │
│                                                         │                │
│   ┌─────────────┐                              ┌────────▼─────────┐      │
│   │ Receiver App│    3. APNs VoIP Push         │   Apple Push     │      │
│   │ (iOS iPhone)│◄─────────────────────────────│   Servers (APNs) │      │
│   │ (Background)│                              └──────────────────┘      │
│   └────────┬────┘                                                        │
│            │                                                             │
│            │ 4. iOS Wakes App                                            │
│            │    Triggers iOS CallKit directly                            │
│            ▼                                                             │
│   ┌──────────────────┐                                                   │
│   │ iOS CallKit UI   │  5. User Accepts                                  │
│   │ (Native Ringing) │───────────────────┐                               │
│   └──────────────────┘                   │                               │
│                                          │                               │
│   ┌──────────────────┐                   ▼                               │
│   │ WebRTC Service   │  6. Reconnect WebSocket &                         │
│   │ (Background)     │     Exchange SDP/ICE                              │
│   └────────┬─────────┘                                                   │
│            │                                                             │
│            │           7. P2P Audio                                      │
│            └────────────────────────────────────────► (To Caller App)    │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Implementation Phases & Tasks

### Phase 3.1: Apple Developer & Xcode Setup
*(Thực hiện thủ công trên Xcode và Apple Developer Portal)*

- [x] **Đổi Bundle ID (iOS):** Thay đổi Bundle Identifier trong project Xcode (vd: `com.bap.brekekephone`).
- [x] **Apple Developer Portal:** *(Completed)*
  - [x] Đăng nhập Apple Developer, tạo App ID mới khớp với Bundle ID.
  - [x] Bật capabilities (Quyền): `Push Notifications`, `Voice over IP` (nếu có), `Background Modes`.
  - [x] Tạo Provisioning Profile cho App ID mới và tải về Xcode.
  - [x] Tạo file chứng chỉ `.p8` (APNs Auth Key) để dùng cho PushKit. Lưu file `.p8`, `Key ID` và `Team ID`.
- [x] **Xcode Capabilities:**
  - [x] Thêm capability `Background Modes` trong Xcode. Tích chọn: `Voice over IP`, `Audio, AirPlay, and Picture in Picture`, `Background fetch`, `Remote notifications`.
  - [x] Thêm capability `Push Notifications`.

### Phase 3.2: Signaling Server Upgrade (Backend)
*(Nâng cấp `BE/signaling-server` để hỗ trợ bắn Apple Push)*

- [x] **Install Dependencies:** Cài đặt thư viện `apn` (node-apn) để server Node.js giao tiếp với hệ thống của Apple.
- [x] **Device Token Management:**
  - [x] Thêm logic cho phép Client gửi mã `apnsToken` qua sự kiện WebSocket `register`.
  - [x] Lưu trữ token này vào RAM (Map/Dictionary) gắn liền với `userId`.
- [x] **VoIP Push Logic:**
  - [x] Khi nhận sự kiện `call-offer`, Server sẽ tìm `apnsToken` của Receiver.
  - [x] Gửi một gói tin VoIP Push qua thư viện `apn` đến máy iPhone nhận. Payload chứa thông tin cơ bản: `callerId`, `callerName`.
- [x] **Timeout Handling:** Nếu sau 30s không ai bắt máy, Server tiếp tục gửi một gói tin Push (hoặc WebSocket) mang lệnh huỷ để CallKit trên máy nhận tự động đóng giao diện.

### Phase 3.3: Native iOS CallKit & Push Integration (Frontend)
*(Code trong thư mục `brekekephone/src/` và Native modules iOS)*

- [x] **Push Notifications Setup:**
  - [x] Cấu hình thư viện `react-native-voip-push-notification` để bắt tín hiệu PushKit trên iOS.
  - [x] Ngay sau khi Login thành công, gọi lệnh lấy `voipToken` từ iOS và gửi lên Signaling Server qua WebSocket.
- [x] **CallKeep (CallKit) Integration:**
  - [x] Khởi tạo cấu hình `RNCallKeep.setup()` trong `index.js` (áp dụng cho nền tảng `ios`).
  - [x] Bắt sự kiện nhận VoIP Push (dù app đang chạy hay bị tắt). Khi có Push, gọi lệnh `RNCallKeep.displayIncomingCall()` để iOS lập tức sáng màn hình và hiện giao diện gọi điện chuẩn.
  - [x] Xử lý sự kiện `RNCallKeep.addEventListener('answerCall', ...)`: Khi User bấm nút Xanh (Nghe).
  - [x] Xử lý sự kiện `RNCallKeep.addEventListener('endCall', ...)`: Khi User bấm nút Đỏ (Từ chối).
- [x] **WebRTC Background Reconnection:**
  - [x] Khi CallKit báo `answerCall`, App dưới nền phải lập tức tự động Connect lại WebSocket.
  - [x] Đợi WebSocket báo Open, gửi SDP `call-answer` trả về cho Caller và khởi tạo WebRTC (Audio Stream).

### Phase 3.4: TestFlight Deployment & Testing
- [ ] **Build Production:** Xuất file `.ipa` từ Xcode (Archive).
- [ ] **Upload TestFlight:** Tải bản build lên App Store Connect và thêm người tester.
- [ ] **Test Background (iOS):**
  - Kịch bản 1: Mở app, tắt màn hình (Lock screen), máy khác gọi tới -> Màn hình phải sáng lên UI CallKit.
  - Kịch bản 2: Vuốt tắt hẳn ứng dụng (Kill app), máy khác gọi tới -> App bị đánh thức ngầm, màn hình vẫn phải sáng lên UI CallKit.
- [ ] **Audio Routing Test:** Bắt máy từ màn hình khoá, đảm bảo mic và loa ngoài hoạt động bình thường, không bị ngậm âm thanh.

---

## 3. Payload Format (VoIP Push via APNs)

```json
{
  "aps": {
    "content-available": 1
  },
  "uuid": "unique-call-id-1234",
  "callerName": "Manager 01",
  "callerId": "101",
  "hasVideo": false
}
```
