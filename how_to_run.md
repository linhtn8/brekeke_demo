# Hướng dẫn chạy dự án thủ công

Dưới đây là các bước để khởi chạy thủ công Mobile App và Signaling Server cho BAP Phone App Demo.

## 1. Chạy Backend Signaling Server

Signaling server sử dụng Node.js và WebSocket để trao đổi tín hiệu WebRTC.

**Vị trí thư mục:** `BE/signaling-server/`

**Các bước chạy:**
1. Mở terminal và di chuyển vào thư mục server:
   ```bash
   cd BE/signaling-server
   ```
2. Cài đặt các gói phụ thuộc (chỉ cần làm lần đầu tiên):
   ```bash
   npm install
   ```
3. Khởi chạy server:
   - Chạy môi trường production:
     ```bash
     npm start
     ```
   - *Hoặc* chạy môi trường development (với nodemon để tự động restart khi có thay đổi):
     ```bash
     npm run dev
     ```

## 2. Chạy Mobile App (React Native)

Mobile app được phát triển bằng React Native. Dự án hỗ trợ cả iOS và Android.

**Vị trí thư mục:** `brekekephone/`

**Yêu cầu hệ thống:**
- Node.js >= 22
- Yarn (v1.22)
- Môi trường React Native (Android Studio cho Android / Xcode cho iOS)

**Các bước chạy:**
1. Mở terminal và di chuyển vào thư mục app:
   ```bash
   cd brekekephone
   ```
2. Cài đặt các gói phụ thuộc (chỉ cần làm lần đầu tiên):
   ```bash
   yarn install
   ```
   *(Nếu chạy iOS, bạn cần cài đặt thêm Pods: `cd ios && pod install && cd ..`)*
3. Khởi động Metro Bundler:
   ```bash
   yarn rn
   ```
4. Mở một terminal mới (vẫn ở thư mục `brekekephone/`) và chạy ứng dụng trên thiết bị/máy ảo tương ứng:
   - **Để chạy trên Android:**
     ```bash
     yarn android
     ```
   - **Để chạy trên iOS:**
     ```bash
     yarn ios
     ```

## 3. Chạy App trên nền Web (React Native Web)

Dự án có cấu hình React Native Web và sử dụng `craco` / `react-scripts` để chạy trên trình duyệt.

**Vị trí thư mục:** `brekekephone/`

**Các bước chạy:**
1. Mở terminal và di chuyển vào thư mục app:
   ```bash
   cd brekekephone
   ```
2. Cài đặt các gói phụ thuộc (nếu chưa cài):
   ```bash
   yarn install
   ```
3. Khởi chạy app trên môi trường Web:
   ```bash
   yarn start
   ```
   *Lệnh này sẽ gọi `make -Bs start` và khởi động dev server bằng `craco start`, sau đó tự động mở ứng dụng trên trình duyệt web của bạn (mặc định tại `http://localhost:3000`).*

## Lưu ý chung
- Đảm bảo Signaling Server đang chạy trước khi thực hiện cuộc gọi trên Mobile App.
- Cả hai dự án đều cần phiên bản Node.js phù hợp (Server: >=14.0.0, App: >=22).
