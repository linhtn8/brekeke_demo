# Báo Cáo Review Phase 3.3: VoIP Push & CallKit Integration

Dưới vai trò là một **Review Agent**, tôi đã tiến hành review chi tiết tiến trình code liên quan đến **Phase 3.3 (VoIP Push & CallKit Integration)** trong Node.js Signaling Server và React Native App (`voipPushService.ts`).

Dưới đây là báo cáo review luồng dữ liệu (Flow), kiểm tra lỗi (Bugs) và đánh giá hiệu năng (Performance):

### 1. Đánh giá Logic luồng dữ liệu (Flow Logic)
**Phía Frontend (React Native - `voipPushService.ts`):**
- **Đúng chuẩn Apple:** Flow xin quyền APNs Token qua thư viện `react-native-voip-push-notification` và bắn lên server lúc WebSocket `register` là hoàn toàn chính xác.
- **CallKit Trigger:** Khi nhận được Notification từ hàm listener `notification`, việc bóc tách chuỗi JSON Payload (`uuid`, `callerName`, `callerId`) và gọi ngay hàm `RNCallKeep.displayIncomingCall()` hoàn toàn chuẩn xác. Màn hình iPhone sẽ sáng lên và đổ chuông ngay lập tức.
- **Tách biệt Module:** Service VoIP được cô lập trong `voipPushService.ts` là rất tốt, không làm bẩn logic của Phase 1 và 2.

**Phía Backend (Node.js - `signaling-server/server.js`):**
- **Sử dụng Feature Flag an toàn:** Bạn dùng cờ `ENABLE_PUSH_NOTIFICATIONS = false` và bọc module `apn` trong khối `try/catch`. Điều này rất tốt vì team khác tải code về test Local Phase 2 sẽ không bị báo lỗi thiếu module hay thiếu chứng chỉ.
- **Lưu trữ Token:** Lưu APNs token vào biến RAM `userTokens = new Map()` dựa theo user ID khi user gửi lệnh `register` là chuẩn.
- **Tạo Payload APNs:** Payload đúng chuẩn VoIP Push (`topic` đuôi `.voip`, chứa param `uuid` và custom body).

### 2. Các lỗi tiềm ẩn (Hidden Bugs) mức độ MAJOR/BLOCKER cần fix
Mặc dù code cấu trúc đúng, nhưng đối với đặc thù khắt khe của PushKit (iOS 13+), có những lỗi sau sẽ khiến app của bạn bị Crash hoặc bị Apple khoá chức năng Push:

1. **Lỗi Crash CallKit do UUID (BLOCKER):**
   - *Vấn đề:* Trong `server.js`, UUID đang được render thủ công bằng: `uuid: "call-" + Date.now() + "-" + callerId`. Nhưng CallKit (iOS) **bắt buộc** param `uuid` phải là chuẩn UUID v4 (vd: `123e4567-e89b-12d3-a456-426614174000`). Nếu truyền một chuỗi text thường, hàm `RNCallKeep.displayIncomingCall(uuid)` sẽ làm app Crash lập tức (Exception từ Objective-C).
   - *Giải pháp:* Dùng thư viện `uuid` (NPM) trên Node.js server để gen chuẩn UUID v4 cho Push.

2. **Lỗi Apple khoá Push do không Report CallKit (BLOCKER):**
   - *Vấn đề:* Từ iOS 13, Apple quy định: Bất cứ khi nào app nhận được 1 tín hiệu VoIP Push từ server, app **phải báo cáo** cho CallKit bằng lệnh `displayIncomingCall` ngay lập tức. Trong code `voipPushService.ts` bạn đang có log check `if (uuid !== 'unknown-uuid')`. Nếu lỡ Server bắn Push bị thiếu `uuid`, hàm báo cáo sẽ không chạy. Apple sẽ nghi ngờ app lạm dụng VoIP Push để chạy ngầm và sẽ cấm vĩnh viễn tính năng PushKit của app sau 3 lần vi phạm.
   - *Giải pháp:* Đảm bảo Server 100% sinh ra UUID chuẩn v4 gắn vào Payload. Ở Frontend, luôn report cho iOS dù Payload có bị lỗi.

3. **Lỗi luồng WebSocket Reconnect (MAJOR):**
   - *Vấn đề:* Khi User đang ở màn hình khoá và bấm Accept (Answer) từ màn hình Native iOS, bạn có TODO: *"Notify signalingService/callStore that we answered"*. Tuy nhiên hiện tại WebSocket đã bị đóng do app nằm dưới background.
   - *Giải pháp:* Bạn phải chắc chắn gọi hàm `signalingService.connect(...)` lại trước. Chỉ khi sự kiện `onConnected` nhảy ra, bạn mới được bắn gói `call-answer` và tiến hành tạo `webrtcService.getUserMedia()`.

### 3. Tối ưu hoá hiệu năng (Performance)
- **Tối ưu RAM trên Backend:** Biến `userTokens` lưu vĩnh viễn trên RAM. Khi user đăng xuất hoặc WebSocket disconnect, bạn đang có logic xóa `users.delete(currentUserId)` nhưng lại quên xóa `userTokens.delete(currentUserId)`. Điều này gây ra Memory Leak trên server Node.js nếu chạy lâu dài.
- **CallKeep Setup:** Tránh gọi `RNCallKeep.setup()` quá nhiều lần nếu App bị rerender do React Navigation. Biến `this.initialized` của bạn đang làm rất tốt việc kiểm soát việc này.

---

### 💡 Recommendation (Khuyến nghị hành động / Prompt gợi ý cho AI khác)

Dưới đây là gợi ý để bạn cung cấp cho AI/Coder khác tiến hành fix:

**1. Sửa UUID format ở Backend (`server.js`):**
Yêu cầu AI cập nhật Backend: Cài thêm thư viện `uuid` (`npm install uuid`) và sử dụng chuẩn v4 để gen mã `uuid` bắt buộc trong hàm `sendVoIPPush`. Ví dụ:
```javascript
const { v4: uuidv4 } = require('uuid');

// Trong hàm sendVoIPPush:
notification.payload = {
  uuid: uuidv4(), // BẮT BUỘC dùng UUID chuẩn v4 của Apple (CallKit)
  callerName: callerName || callerId,
  callerId: callerId,
};
```

**2. Vá Memory Leak khi ngắt kết nối WebSocket (`server.js`):**
Yêu cầu AI cập nhật sự kiện `ws.on('close')`:
```javascript
ws.on('close', () => {
    if (currentUserId) {
      users.delete(currentUserId);
      userTokens.delete(currentUserId); // Thêm dòng này để dọn rác RAM
    }
});
```

**3. Khớp nối Answer Call (Frontend - `voipPushService.ts`):**
Yêu cầu AI hoàn thiện hàm `RNCallKeep.addEventListener('answerCall')`:
```typescript
RNCallKeep.addEventListener('answerCall', ({ callUUID }) => {
  this.currentCallId = callUUID;
  // Trigger action để gọi hàm reconnect WebSocket và báo Answer:
  ctx.webrtc.acceptCall(); 
  // Chú ý: webrtcStore.acceptCall() phải được refactor để check nếu WebSocket
  // đang disconnect thì connect() lại trước khi getUserMedia() và gửi sdp answer.
});
```