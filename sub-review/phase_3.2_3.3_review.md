# Báo Cáo Review Phase 3.2 & 3.3 (VoIP Push & CallKit)

Dựa trên tài liệu `docs/flow_phase_3.md` và các bản cập nhật mã nguồn MỚI NHẤT, dưới đây là đánh giá chi tiết cho **Phase 3.2 (Backend)** và **Phase 3.3 (Frontend)** sau khi đã được khắc phục.

- **STATUS**: `[PASS]`
- **SUMMARY**: Toàn bộ luồng VoIP Push, CallKit, Reconnection và Timeout Handling đã được triển khai đầy đủ và chính xác. Các lỗi rủi ro (Memory leak, thiếu UUID chuẩn, thiếu Cancel Push) đã được giải quyết triệt để.

---

## 1. Review Phase 3.2: Signaling Server Upgrade (Backend)

**Tiến độ hiện tại:** Đã hoàn thành 100% (4/4 task).
- ✅ Tích hợp `apn` với Feature Flag `ENABLE_PUSH_NOTIFICATIONS = true` và truyền đúng file chứng chỉ `.p8`.
- ✅ Quản lý Device Token và giải quyết Memory Leak: Đã bổ sung `userTokens.delete(currentUserId)` khi socket đóng để dọn dẹp RAM.
- ✅ Bắn VoIP Push sử dụng chuẩn `require('uuid').v4()` của Apple (Khắc phục lỗi Crash CallKit trên iOS).
- ✅ **Timeout Handling:** Đã thêm logic đếm ngược 30s (`setupCallTimeout`). Nếu không ai nghe máy hoặc người gọi cúp ngang, tự động bắn Push mang lệnh `call-cancel` kèm UUID gốc xuống Client để dập rung chuông.

## 2. Review Phase 3.3: Native iOS CallKit & Push (Frontend)

**Tiến độ hiện tại:** Đã hoàn thành 100% (3/3 task).
- ✅ Lấy và đồng bộ `voipToken` lên server qua WebSocket.
- ✅ Tích hợp CallKeep: Đã xử lý triệt để sự kiện `answerCall` và `endCall` của iOS, móc nối trực tiếp vào `webrtcStore.acceptCall()` và `rejectCall()`.
- ✅ **WebRTC Background Reconnection:** 
  - Đã triển khai cơ chế Auto-Login trong `App.tsx` khi app bị đánh thức.
  - Sử dụng cờ `pendingAcceptCall` trong `webrtcStore`. Khi người dùng bấm "Nghe" lúc app đang bị kill, app ghi nhớ cờ này và sẽ tự động accept cuộc gọi ngay khi WebSocket kết nối lại và nhận được SDP Offer.
- ✅ Xử lý thành công Push `call-cancel`: Lắng nghe loại push này để tự động gọi `RNCallKeep.endCall(uuid)` đóng giao diện Native nếu người gọi tắt máy sớm.

---

## 3. RECOMMENDATION (Khuyến nghị)
Code đã đạt chuẩn chất lượng, tuân thủ đúng yêu cầu kiến trúc và các quy tắc an toàn. 
Không còn Issues nào tồn đọng. Dự án đã hoàn toàn sẵn sàng cho **Phase 3.4 (TestFlight Deployment & Testing)**.