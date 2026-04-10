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

**Lưu ý khi tắt server:**
Bấm `Ctrl + C` ở terminal để dừng. Tuy nhiên nếu dùng `npm run dev` (nodemon), đôi khi tiến trình Node bị kẹt chạy ngầm và vẫn tiếp tục in log. Mở một terminal mới và dùng một trong hai cách sau để tắt triệt để:
- **Cách 1** (Diệt tất cả tiến trình Node đang chạy - Lưu ý: có thể ảnh hưởng nếu đang chạy cả app React Native):
  ```bash
  killall node
  ```
- **Cách 2** (Tìm và tắt chính xác theo cổng, ví dụ server chạy ở port 3000):
  ```bash
  lsof -i :3000
  # Tìm số ở cột PID (VD: 12345) rồi chạy lệnh:
  kill -9 <PID>
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


## Android
Kiểm tra trên máy tính của bạn, tôi nhận thấy hiện tại chưa có Android Studio và Android SDK nào được cài đặt (thư mục ~/Library/Android không tồn tại). 
Để giả lập Android và chạy dự án React Native trên Mac, bạn cần sử dụng Android Studio (công cụ chính chủ của Google). Việc cài đặt cần giao diện đồ họa (GUI), vì vậy bạn hãy làm theo các bước thật chi tiết dưới đây:
Bước 1: Tải và cài đặt Android Studio
1. Truy cập trang chủ: Download Android Studio (https://developer.android.com/studio) và tải bản cho Mac (lưu ý chọn đúng chip Intel hoặc Apple Silicon/M1/M2 tùy máy bạn).
2. Tải xong, mở file .dmg và kéo thả biểu tượng Android Studio vào thư mục Applications.
3. Mở Android Studio lên. Trong quá trình thiết lập ban đầu (Setup Wizard), hãy cứ bấm Next và chọn cài đặt Standard.
4. Quan trọng: Đảm bảo rằng mục Android Virtual Device (AVD) đã được tích chọn để nó tải hệ điều hành giả lập về máy. Sau đó bấm Finish và đợi nó tải/cài đặt bộ SDK (sẽ mất khoảng 5-10 phút).
Bước 2: Tạo và bật Máy ảo Android (Emulator)
1. Tại màn hình chính của Android Studio (Welcome to Android Studio), nhìn lên góc phải trên cùng (hoặc click vào nút "More Actions" / dấu 3 chấm) -> Chọn Virtual Device Manager.
2. Bấm nút Create Device (Tạo thiết bị mới).
3. Chọn một điện thoại bất kỳ (ví dụ: Pixel 7 hoặc Pixel 6) -> Bấm Next.
4. Ở phần System Image (Hệ điều hành), tải xuống phiên bản mới nhất (ví dụ: UpsideDownCake (API 34) hoặc Tiramisu (API 33)) -> Bấm Next -> Finish.
5. Bấm nút Play (▶️) hình tam giác màu xanh để khởi động chiếc điện thoại ảo lên. Hãy giữ điện thoại ảo này luôn mở.
Bước 3: Cấu hình biến môi trường cho Terminal
Để Terminal và React Native nhận diện được máy ảo, bạn cần thêm đường dẫn SDK. Hãy mở một Terminal mới và chạy lệnh sau để thêm biến môi trường vào file cấu hình (cho Zsh):
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc
source ~/.zshrc
Bước 4: Chạy ứng dụng trên giả lập
1. Đảm bảo điện thoại ảo (Emulator) đang mở màn hình sáng.
2. Tại Terminal, chuyển vào thư mục brekekephone:
      cd brekekephone
   3. Xóa cache cũ cho chắc chắn:
      yarn rn --reset-cache
   4. Mở một Tab Terminal khác, chạy lệnh sau để build và cài app vào máy ảo Android:
      yarn android
   
Khi quá trình build Gradle hoàn tất (thường mất 2-3 phút cho lần đầu tiên), ứng dụng BAP Demo màu xanh dương sẽ bật lên trên giả lập Android của bạn. Hệ thống WebRTC sẽ hoạt động cực kỳ mượt mà trên nền tảng này!