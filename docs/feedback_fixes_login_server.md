## 1. Logo phản ánh trên icon nhưng tên vẫn hiện chữ "BrekekePhoneDev"
- **Trạng thái:** ✅ Đã xử lý ở Phase trước.

## 2. Vào màn hình login chữ "BAP Phone" bị logo mới đè lên và cắt mất một nửa
- **Nguyên nhân:** Khung chứa Logo mới đẩy text xuống theo kiểu flow mặc định, nhưng text title lại thiếu wrapper cố định kích thước khiến UI hiển thị sai trên màn hình thật của iPhone.
- **Trạng thái:** ✅ Đã xử lý lại cho triệt để.
- **Giải pháp:** Đã tăng thêm thuộc tính `minHeight: 180` và `justifyContent: 'center'` cho khối `demoLogoContainer`, đồng thời giảm một chút `marginTop` của phần text để chúng không bị xếp lồng chéo lên nhau. Lần này chạy lại Simulator sẽ hết bị đứt ngang chữ.

## 3. Lỗi BE Server báo "No user online" khi dùng Mobile Simulator
- **Nguyên nhân:** Bắt nguồn từ việc cấu hình WebSocket URL trong Mobile app bị trỏ nhầm IP. Trước đây, trong file `src/config/demoConfig.ts`, trường `signalingServerUrl` được trỏ vào IP `172.65.1.240`.
IP này có vẻ là máy ở network công ty hoặc cũ, không phải là `localhost` / `192.168.x.x` của máy Mac hiện tại. Khi Web chạy, do truy cập chung local/tunnel thì có thể ăn, nhưng Mobile Simulator thì không kết nối được tới `172.65.1.240` -> Dẫn đến Backend `server.js` không nhận được kết nối WebSocket từ iPhone Simulator.
- **Trạng thái:** ✅ Đã xử lý.
- **Giải pháp:** Đã sửa cứng lại `signalingServerUrl: 'ws://192.168.1.11:8080'` trong `src/config/demoConfig.ts` (192.168.1.11 là địa chỉ IP wifi hiện tại của máy Mac này qua lệnh `ifconfig`). Lúc này khi bấm Login "101" trên iOS Simulator, App sẽ gọi được tới `ws://192.168.1.11:8080` do Node.js đang chạy để bắn event đăng ký user. Backend sẽ log được User online bình thường y hệt như Web.
