# Hướng Dẫn Test App Local (Dành Cho Dự Án VoIP / WebRTC)

Khi bạn cần test code ở dưới local (máy cá nhân) trước khi quyết định push lên cho presale, đặc biệt với dự án React Native CLI có sử dụng WebRTC (gọi thoại/video), dưới đây là các phương án khả thi nhất:

## 1. Test trên nền tảng Web (Nhanh nhất, Không cần Xcode/Android Studio)
Dự án `brekekephone` của bạn có hỗ trợ nền tảng Web (sử dụng `react-native-web` và `craco`). Đây là cách tuyệt vời nhất để test UI và logic WebRTC (Camera/Mic) ngay lập tức trên máy Mac Intel của bạn mà không cần cài cắm phức tạp.

*   **Cách chạy:** Mở terminal tại thư mục gốc và gõ `yarn start`
*   **Kết quả:** App sẽ chạy trực tiếp trên trình duyệt (Chrome/Safari) tại `localhost`. Trình duyệt hỗ trợ WebRTC cực kỳ tốt.

## 2. Test trên thiết bị Android thật (Rất dễ trên máy Mac Intel)
Nếu bạn có một chiếc điện thoại Android, việc test local dễ thở hơn iOS rất nhiều.
*   **Yêu cầu:** Máy đã cài Java (JDK) và Android SDK.
*   **Cách làm:**
    1. Bật "Gỡ lỗi USB" (USB Debugging) trên điện thoại Android.
    2. Cắm cáp nối điện thoại vào máy Mac.
    3. Chạy lệnh: `yarn android`
*   **Ưu điểm:** Test được 100% tính năng gọi điện, rung, chuông, camera, mic mà không lo giới hạn phần cứng của máy ảo.

## 3. Test trên thiết bị iOS thật (Bắt buộc phải có Xcode + Cáp USB)
Với React Native CLI, **KHÔNG CÓ CÁCH NÀO** chạy được app iOS local (dù là máy ảo hay máy thật) nếu bạn không cài **Xcode**.

Vì máy Mac Intel của bạn không cài được Xcode mới nhất, hãy tải bản Xcode cũ tương thích (như đã hướng dẫn ở file trước) từ trang web của Apple.

*   **Lưu ý quan trọng về WebRTC:** Bạn **KHÔNG NÊN** test tính năng gọi điện trên iOS Simulator (máy ảo iOS). Simulator không hỗ trợ Camera và Micro hoạt động rất chập chờn/lỗi.
*   **Cách test trên iPhone thật (Miễn phí, không cần mua tài khoản $99):**
    1. Cắm cáp iPhone vào máy Mac.
    2. Mở file `ios/brekekephone.xcworkspace` bằng Xcode.
    3. Ở thanh công cụ trên cùng, chọn thiết bị đích là chiếc iPhone của bạn (thay vì Simulator).
    4. Vào tab **Signing & Capabilities**, tick vào "Automatically manage signing".
    5. Chọn Team là tài khoản Apple ID cá nhân của bạn (Personal Team - Miễn phí).
    6. Bấm nút **Play (Run)**.
    7. Trên iPhone, vào *Cài đặt > Cài đặt chung > Quản lý VPN & Thiết bị*, chọn tin cậy (Trust) chứng chỉ của bạn để mở app.