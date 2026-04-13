# Feedback Fixes (Phase 3 Updates)

## 1. Logo phản ánh trên icon nhưng tên vẫn hiện chữ "BrekekePhoneDev"
- **Nguyên nhân:** Tên hiển thị của app (App Name) trên iOS được quản lý bởi trường `CFBundleDisplayName` trong file cấu hình `ios/BrekekePhone/Info.plist`. Thay đổi Bundle ID không tự động thay đổi App Name.
- **Trạng thái:** ✅ Đã xử lý.
- **Giải pháp:** Đã đổi `<string>Brekeke Phone Dev</string>` thành `<string>BAP Phone</string>` trong file `Info.plist`.

## 2. Vào màn hình login chữ "BAP Phone" bị logo mới đè lên và cắt mất một nửa
- **Nguyên nhân:** Logo mới có khung hình (tỉ lệ) khác với logic text mặc định, phần CSS `demoLogoContainer` và `demoTitle` ở `PageAccountSignIn.tsx` có `marginTop` quá hẹp khiến text bị tràn lấn vào vùng hiển thị ảnh logo (đặc biệt khi logo có transparent background/khung vuông to).
- **Trạng thái:** ✅ Đã xử lý.
- **Giải pháp:** Đã tăng khoảng cách `marginTop` của `demoTitle` từ `15` lên `25` và tinh chỉnh `marginBottom` của vùng container để ảnh và chữ giãn ra, hiển thị rõ ràng không bị đè lên nhau.

## 3. Các màn hình bên trong sau khi login có logo ngay chỗ footer -> Xoá đi
- **Nguyên nhân:** Trong lúc implement Demo Mode ở Phase 1/2, có chèn một logo "BAP" mờ (watermark) dưới góc màn hình (`DemoLogoFooter`) vào file `App.tsx` (tại lớp Root) nên nó sẽ hiện ở mọi màn hình bên trong (Contact, Manage Call...).
- **Trạng thái:** ✅ Đã xử lý.
- **Giải pháp:** Đã tiến hành xoá logic render `<BapLogo size={60} />` và `DemoLogoFooter` ra khỏi thư mục gốc `src/components/App.tsx`. Giao diện sau login sẽ trống và sạch giống như app gốc.
