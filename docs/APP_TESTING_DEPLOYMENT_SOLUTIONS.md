# Các Giải Pháp Triển Khai App Test (Demo Presale) Nhanh Chóng

Khi đang bị áp lực về thời gian (deadline) cho presale, việc chọn phương pháp phân phối app test phụ thuộc vào nền tảng (iOS/Android) và việc bạn đã có sẵn tài khoản Developer hay chưa. Dưới đây là các hướng giải quyết từ nhanh nhất đến chuyên nghiệp nhất.

## 1. Dành cho Android (Cực kỳ nhanh - Khuyên dùng ngay)
Android có cơ chế cài đặt ứng dụng từ nguồn không xác định rất dễ dàng, nên bạn không cần đưa lên store nếu chỉ để demo nội bộ hoặc cho một nhóm nhỏ presale.

*   **Giải pháp:** Build trực tiếp file `.apk` và chia sẻ qua link.
*   **Cách làm:**
    1. Chạy lệnh build APK release trong project React Native của bạn (thường là `cd android && ./gradlew assembleRelease`).
    2. Lấy file `.apk` (thường nằm ở `android/app/build/outputs/apk/release/`).
    3. Upload file này lên **Google Drive**, **Dropbox**, hoặc **[Diawi](https://www.diawi.com/)**.
    4. Gửi link cho team presale tải và cài đặt trực tiếp.
*   **Thời gian:** ~15-30 phút.

## 2. Dành cho iOS (Khó khăn hơn do bảo mật của Apple)

Với iOS, bạn BẮT BUỘC phải có tài khoản Apple Developer Program ($99/năm) để cài đặt app lên thiết bị thật.

### Lựa chọn A: Dùng TestFlight (Phù hợp nhất, Chuyên nghiệp)
TestFlight là ứng dụng chính thức của Apple để test app.
*   **Internal Testing (Test nội bộ - Rất nhanh):**
    *   Thêm email của team presale vào danh sách App Store Connect Users.
    *   Build và push file `.ipa` lên App Store Connect (thường dùng Xcode).
    *   Sau khi Apple xử lý xong (khoảng 15-30 phút), app sẽ có sẵn trên TestFlight của các user đó mà **không cần qua khâu review của Apple**.
*   **External Testing (Test cho khách ngoài - Chậm hơn):**
    *   Tạo link Public TestFlight.
    *   Cần chờ Apple review bản test đầu tiên (mất từ 12 - 48 tiếng). Do đang gấp deadline, KHÔNG nên dùng cách này cho bản build đầu tiên.
*   **Ưu điểm:** Cập nhật phiên bản mới rất dễ dàng.

### Lựa chọn B: Build Ad-Hoc + Diawi (Nhanh nhưng thủ công)
Nếu bạn không muốn team presale phải tải TestFlight hoặc thêm họ vào App Store Connect.
*   **Cách làm:**
    1. Lấy **UDID** (Mã thiết bị) của tất cả các iPhone/iPad của team presale.
    2. Thêm các UDID này vào tài khoản Apple Developer của bạn.
    3. Tạo Provisioning Profile loại Ad-Hoc có chứa các thiết bị này.
    4. Build file `.ipa` với profile đó.
    5. Upload file `.ipa` lên **[Diawi.com](https://www.diawi.com/)** hoặc **Installr**.
    6. Gửi link cho presale dùng Safari tải về trực tiếp.
*   **Nhược điểm:** Mất công thu thập UDID. Nếu có thiết bị mới lại phải build lại từ đầu.

## 3. Giải pháp khi KHÔNG có máy Mac tải được Xcode mới nhất

Nếu máy Mac của bạn là chip Intel, hệ điều hành cũ (không tải được Xcode từ App Store) và bạn đang phát triển ứng dụng VoIP/WebRTC (cần test trên thiết bị thật vì Simulator không hỗ trợ tốt Mic/Camera):

*   **Giải pháp 1: Sử dụng Cloud CI/CD (Khuyên dùng nhất)**
    Thay vì build trên máy bạn, hãy để server đám mây của Apple/bên thứ 3 build và đẩy thẳng lên TestFlight.
    *   **Codemagic / Bitrise:** Cấu hình cực kỳ dễ cho React Native. Nó sẽ kéo code từ GitHub, tự động chạy build môi trường Mac cấu hình cao nhất và đẩy thẳng lên TestFlight của bạn.
    *   **EAS Build (Của Expo):** Ngay cả khi bạn dùng React Native CLI (không phải Expo), bạn vẫn có thể dùng dịch vụ EAS Build của họ. Lệnh `eas build --platform ios` sẽ đẩy code lên cloud của Expo để build ra file `.ipa` cho bạn.
    *   **GitHub Actions:** Miễn phí số phút nhất định, bạn cấu hình file `.yml` để chạy trên `macos-latest`.

*   **Giải pháp 2: Tải Xcode phiên bản cũ (Thủ công)**
    App Store chỉ cho tải Xcode mới nhất. Nhưng bạn có thể vào **[Apple Developer More Downloads](https://developer.apple.com/download/all/)** để tải các file `.xip` của Xcode cũ hơn (ví dụ Xcode 14.x cho macOS Monterey 12.x). Tuy nhiên, nó có thể không hỗ trợ iOS mới nhất (iOS 17+).

*   **Giải pháp 3: Thuê máy Mac trên Cloud**
    Sử dụng các dịch vụ như **MacinCloud** hoặc **AWS Mac Instances**. Bạn sẽ remote vào một máy Mac thật cấu hình cao, cài Xcode và build code của bạn từ đó.

## 4. Giải pháp quản lý lâu dài: Firebase App Distribution
Nếu dự án này sẽ còn phải test và demo nhiều lần trong tương lai.
*   **Cách hoạt động:** Tích hợp cả iOS và Android vào Firebase. Bạn chỉ cần đẩy app lên Firebase, hệ thống sẽ tự gửi email cho tester để tải về.
*   **Ưu điểm:** Quản lý tập trung cả 2 nền tảng.
*   **Lưu ý:** Với iOS, Firebase vẫn yêu cầu bạn phải thu thập UDID và build bằng Ad-Hoc profile hoặc Enterprise profile.

---

## 🎯 Đề xuất hành động tức thời cho bạn:

1. **Với Android:** Hãy build `.apk` ngay lập tức và gửi link qua Diawi/Google Drive. Không cần đưa lên Google Play Internal Testing trừ khi đã có sẵn tài khoản cấu hình xong.
2. **Với iOS:**
   * Nếu ĐÃ CÓ tài khoản Apple Developer: Dùng **TestFlight Internal Testing** là nhanh và ít lỗi nhất (chỉ cần lấy email Apple ID của team presale).
   * Nếu CHƯA CÓ tài khoản Apple Developer: Rất tiếc, bạn không thể cài app iOS thật lên máy (trừ khi dùng máy đã Jailbreak, hoặc cắm cáp trực tiếp vào máy Mac chạy Xcode để cài). Bạn phải mua tài khoản ngay.
   * Nếu không cài được Xcode: Dùng ngay **Codemagic** hoặc **EAS Build** để đẩy code lên cloud build tự động.