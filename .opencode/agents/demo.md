## KẾ HOẠCH TRIỂN KHAI BẢN DEMO (TESTFLIGHT)

### Mục tiêu: 
Showcase khả năng tùy biến thương hiệu (Branding) và trải nghiệm sử dụng (UX) cho khách hàng BAP.

### Quy trình kỹ thuật:
1. **Frontend Mocking:**
   - Hard-code dữ liệu cấu hình BAP (Logo URL, Màu sắc) trong App.
   - Sử dụng thư viện âm thanh để phát tiếng chuông gọi đi mà không cần tín hiệu SIP.
2. **Contact Data:**
   - Sử dụng mảng JSON giả lập: `[{name: "Manager 01", phone: "101"}, {name: "Staff 02", phone: "102"}]`.
3. **Build & Distribution:**
   - Sử dụng Xcode để Archive và upload lên App Store Connect.
   - Mời khách hàng qua email thông qua trình quản lý TestFlight.

### Ưu điểm:
- Không cần Brekeke License.
- Không phụ thuộc đường truyền mạng/VoIP Server.
- Chạy mượt mà 100% trên thiết bị thật của khách hàng.