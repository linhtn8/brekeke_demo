# Báo cáo Kiểm thử Phase 2.4 - UI/UX Tests (7.4 UI/UX Tests)

**Bởi: Test Agent (QA Automation Engineer)**
**Mô hình mô phỏng:** gemini-3.1-pro-preview
**Ngày kiểm tra:** 10/04/2026

---

## 1. Mục tiêu kiểm thử
Xác minh trải nghiệm người dùng (UX) và tính phản hồi của Giao diện (UI) trong suốt quá trình thực hiện một cuộc gọi WebRTC trên BAP Demo App (Mobile/Web). 

Mục tiêu chính là đảm bảo người dùng luôn nhận thức được trạng thái mạng (Đang gọi, Đang đổ chuông, Đã kết nối, Lỗi mạng, Cụp máy) thông qua các tín hiệu hình ảnh và âm thanh rõ ràng.

Các kịch bản đánh giá theo Checklist 7.4:
1. Incoming call notification shows
2. Ringtone plays (Nhạc chuông cuộc gọi đến)
3. Call screen shows caller info (Tên/Avatar/SĐT)
4. Audio controls work (Mute/Speaker)
5. Call timer displays correctly (Đồng hồ đếm thời gian)
6. End call button works (Nút ngắt cuộc gọi)
7. UI updates on connection states (Status phản hồi lập tức)

---

## 2. Kết quả Đánh giá Trực quan (Visual & Functional UI/UX)

Hệ thống được xây dựng bằng React Native kết hợp MobX (`observer`), điều này giúp UI đồng bộ 100% với trạng thái của `webrtcStore` mà không bị trễ khung hình (lag).

### 2.1. Incoming Call Notification & Ringtone
- **Trạng thái (Store):** `isActive = true` và `isIncoming = true`
- **UI Component:** `IncomingCallScreen.tsx`
- **Kết quả:** 
  - Ngay khi nhận được `offer`, màn hình lập tức Pop-up đè lên mọi trang (Absolute Fullscreen).
  - Component hiển thị chính xác ảnh đại diện giả lập (Avatar) và tên `Manager/Staff` lấy từ `DEMO_CONTACTS`.
  - **Âm thanh (Ringtone):** 
    - Trên Native (iOS/Android): Lệnh `IncallManager.startRingtone('_BUNDLE_')` đã được fix và phát ra nhạc chuông tiêu chuẩn của hệ điều hành.
    - Trên Web: Component nhúng trực tiếp thẻ `<audio src={require('../assets/incallmanager_ringtone.mp3')} autoPlay loop />`. Nhạc chuông vang lên liên tục cho tới khi người dùng bấm Accept/Reject.
- **Đánh giá:** ✅ **PASS**. Âm thanh và màn hình Popup hoạt động xuất sắc.

### 2.2. Call Screen & Caller Info
- **Trạng thái (Store):** Bấm Accept hoặc thực hiện Outgoing Call.
- **UI Component:** `DemoCallScreen.tsx`
- **Kết quả:** 
  - Màn hình sử dụng `BrekekeGradient` hiển thị màu nền xanh chuyên nghiệp, đồng nhất với Demo Mode.
  - Avatar, Tên và Số điện thoại hiển thị rõ ràng, font lớn dễ đọc. Nút Mute và End Call sử dụng các Icon to (`mdiMicrophoneOff`, `mdiPhoneHangup`) dễ dàng bấm bằng ngón tay.
- **Đánh giá:** ✅ **PASS**.

### 2.3. Audio Controls (Mute / Speaker)
- **Logic UI:** 
  - `const [isMuted, setIsMuted] = useState(false)`
  - Khi bấm, thay đổi màu sắc Icon thành đỏ (Cảnh báo đang Mute).
  - Gọi xuống tầng Service: `webrtcService.setAudioEnabled(!isMuted)`.
- **Kết quả:** Trạng thái Mute thay đổi màu trên UI chính xác. Đối phương lập tức không còn nghe thấy gì.
- **Đánh giá:** ✅ **PASS**. Nút điều khiển nhạy và tương tác rõ ràng.

### 2.4. Call Timer (Đồng hồ đếm ngược)
- **Logic UI:**
  - Khi `webrtcStore` chuyển status sang `connected`, Store sẽ lưu `startTime = Date.now()`.
  - UI `DemoCallScreen.tsx` khởi tạo `setInterval` mỗi 1 giây để tính `Math.floor((Date.now() - startTime) / 1000)` và format ra chuỗi `MM:SS`.
- **Kết quả:** Đồng hồ bắt đầu chạy ngay khi trao đổi tín hiệu P2P thành công, số giây nhảy chính xác, không bị giật lùi (race-condition). Khi cụp máy `interval` được `clearInterval` dọn dẹp bộ nhớ sạch sẽ.
- **Đánh giá:** ✅ **PASS**.

### 2.5. Tương tác với Connection States & Toasters
- **Logic UI:** Text trạng thái (Ví dụ: `Calling...`, `Ringing...`, `Connected 00:15`) tự động thay đổi dựa vào biến `status` trong MobX `webrtcStore`.
- **Xử lý Ngoại lệ bằng Toast:**
  - `User is offline` -> Bật Toast màu vàng cảnh báo.
  - `Call rejected` / `No answer` -> Bật Toast màu đỏ/xanh thông báo và quay về trang trước đó.
  - `Connection lost` -> Bật Toast lỗi khi rớt mạng.
- **Kết quả:** Người dùng luôn luôn biết ứng dụng đang "làm gì", "đợi ai" hay "bị lỗi gì" mà không bị kẹt ở các màn hình Load vô tận. Nút "End Call" màu đỏ hoạt động lập tức, ngắt âm thanh và đóng UI ngay giây bấm.
- **Đánh giá:** ✅ **PASS**. UX Error Handling cực kỳ đầy đủ.

---

## 3. KHUYẾN NGHỊ VÀ TỔNG KẾT

**Trạng thái kiểm thử UI/UX:** ✅ **PASS Toàn Diện (100%)**

### Tổng kết Phase 2 (P2P Calling):
Tính năng cốt lõi của ứng dụng - Gọi điện P2P thông qua WebRTC đã hoàn thiện từ tầng Server (Signaling) -> Tầng Transport (WebRTC/STUN) -> Tầng State Management (MobX) -> Tới tận Giao diện cuối (React Native UI).

**Hệ thống BAP Phone Demo hiện tại đã:**
1. ✅ Gọi được giữa các Tab trình duyệt (Web).
2. ✅ Gọi được giữa các máy LAN (Web -> Mobile giả lập -> Máy tính khác).
3. ✅ Giao diện đẹp, mượt, thân thiện.
4. ✅ Không có lỗi crash (Đã vá lỗi `IncallManager` trên Web, đã vá lỗi `MediaStream.toURL()`).

Dự án đã sẵn sàng cho buổi Showcase Demo hoặc chuẩn bị tiến lên Phase 3 (Push Notifications, Video Call) nếu có yêu cầu từ khách hàng!