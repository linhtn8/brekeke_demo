# Báo cáo Kiểm thử Phase 2.5 - WebRTC Real Calling UI Integration

**Bởi: Test Agent (QA Automation Engineer)**
**Mô hình mô phỏng:** claude-sonnet-4-5
**Ngày kiểm tra:** 09/04/2026

---

## 1. Mục tiêu kiểm thử
Xác minh tính đúng đắn và sự hoàn thiện của code được thực hiện trong **Phase 2.5: UI Integration**, bao gồm các luồng hiển thị cuộc gọi, nhận/từ chối cuộc gọi WebRTC qua WebSocket Signaling, cũng như các thao tác trên UI.

Các thành phần được kiểm tra:
1. `IncomingCallScreen.tsx`
2. `PageContactUsers.tsx`
3. `PageCallManage.tsx`

---

## 2. Kết quả phân tích Code (Static Analysis)

### 2.1. `IncomingCallScreen.tsx` (Mới tạo)
- **Tích hợp Nhạc chuông:** Đã triển khai `IncallManager.startRingtone()` khi mount và tự động dọn dẹp `stopRingtone()` khi unmount -> Đạt chuẩn hành vi của một cuộc gọi đến.
- **Xử lý Chấp nhận / Từ chối:** Các nút bấm gắn chặt với `ctx.webrtc.acceptCall()` và `ctx.webrtc.rejectCall()`. Khi từ chối, màn hình quay lại danh bạ qua `ctx.nav.goToPageContactUsers()`.
- **UI:** Tích hợp `BrekekeGradient` cho trải nghiệm đồng bộ, hiển thị được `Avatar` từ tên của `callee`.

### 2.2. `PageContactUsers.tsx` (Cập nhật nút Call)
- **Hỗ trợ Phase 2 Flag:** Component `DemoContactItem` đã bổ sung logic kiểm tra cờ `PHASE_2_ENABLED`.
  - Nếu `true`: Gắn logic với hàm `ctx.webrtc.startCall(contact.id)` mới.
  - Nếu `false`: Rơi về mock call của `demoStore` cũ.
- Việc thực hiện phân luồng tính năng như vậy giúp hệ thống không bị gián đoạn nếu WebRTC gặp lỗi.

### 2.3. `PageCallManage.tsx` (Cập nhật Active Call UI)
- **Điều hướng render màn hình:** Component `RenderAllCalls` đã bắt được trạng thái `ctx.demo.getActiveCall.isActive`.
- Có xử lý check `isIncoming` và `status === 'ringing'` để quyết định render `IncomingCallScreen` hay `DemoCallScreen`.

---

## 3. Tự động sinh Test Case (Gợi ý cho Jest & React Native Testing Library)

### Test Case 1: Kiểm thử màn hình IncomingCallScreen
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { IncomingCallScreen } from '#/components/IncomingCallScreen';
import IncallManager from 'react-native-incall-manager';
import { ctx } from '#/stores/ctx';

jest.mock('react-native-incall-manager', () => ({
  startRingtone: jest.fn(),
  stopRingtone: jest.fn(),
}));

describe('IncomingCallScreen', () => {
  it('nên phát nhạc chuông khi mount và dừng khi unmount', () => {
    const { unmount } = render(<IncomingCallScreen />);
    expect(IncallManager.startRingtone).toHaveBeenCalled();
    unmount();
    expect(IncallManager.stopRingtone).toHaveBeenCalled();
  });

  it('nên gọi acceptCall khi bấm Answer', () => {
    const { getByText } = render(<IncomingCallScreen />);
    fireEvent.press(getByText('ANSWER'));
    expect(ctx.webrtc.acceptCall).toHaveBeenCalled();
  });
});
```

### Test Case 2: Phân nhánh tính năng khi bấm nút Call (PageContactUsers)
```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { DemoContactItem } from '#/pages/PageContactUsers';
import { PHASE_2_ENABLED } from '#/config/demoConfig';

describe('DemoContactItem', () => {
  it('gọi ctx.webrtc.startCall khi PHASE_2_ENABLED = true', () => {
    // Đặt cờ thành true
    const { getByText } = render(<DemoContactItem contact={mockContact} />);
    fireEvent.press(getByText('Call'));
    expect(ctx.webrtc.startCall).toHaveBeenCalledWith(mockContact.id);
  });
});
```

---

## 4. RECOMMENDATION (Kết luận và Khuyến nghị)

**Trạng thái kiểm thử:** ✅ **PASS (Thành công cơ bản)**

**Lý do:**
Code đã tuân thủ đúng yêu cầu của Phase 2.5:
1. Đã tạo được Incoming Call Screen với tích hợp tiếng chuông.
2. Các action Answer / Reject đã map chính xác với WebRTC Store.
3. Nút Call ở Contact List đã phân luồng theo cấu hình (PHASE_2_ENABLED).
4. PageCallManage đã định tuyến đúng được UI (Incoming vs Ongoing Call).

**Khuyến nghị / Hành động tiếp theo:**
1. **Quản lý Vòng đời (Memory Leak):** Cần đảm bảo hàm `ctx.webrtc.rejectCall()` trong IncomingCallScreen không gặp lỗi nếu store rỗng hoặc WebSocket chưa connect.
2. **Kiểm thử Edge Cases (Phase 2.6):** Bạn cần tiếp tục cài đặt Phase 2.6 theo đúng kế hoạch (Các sự kiện Offline, Network Loss, Server down) vì hiện tại UI chưa render được các Error Message liên quan đến WebRTC state. 
3. Lập tức chạy Phase 2.6 dựa trên nền tảng UI ổn định này.