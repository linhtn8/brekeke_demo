# Estimate: Đổi Màu & Đổi Logo - Brekeke Phone App

**Ngày tạo:** 02/04/2026  
**Loại công việc:** One-time change (Thay đổi 1 lần)  
**Developer level:** Mid-level

---

## 📋 TỔNG QUAN

Công việc bao gồm:
1. **Đổi màu chủ đạo:** Xanh lá (#609B3A) → Vàng (hoặc màu khác theo yêu cầu)
2. **Đổi logo:** Thay logo mới cho toàn bộ app (35+ files)

---

## 🎨 PHẦN 1: ĐỔI MÀU (GREEN → YELLOW)

### 🎯 Phạm vi ảnh hưởng
- **Tổng số màn hình:** 33 màn hình
- **Hệ thống màu:** Centralized theme system

### 📂 Files cần sửa

#### ✅ **File chính (Must-do)**

**1. `/src/components/variables.ts`** - Theme configuration
```typescript
// Dòng cần sửa:
primary: '#609B3A',  // Green (cũ)
→
primary: '#FFCC00',  // Yellow (mới)
```
**Effort:** 5 phút

**2. `/src/components/BrekekeGradient.tsx`** - Login screen gradient
- Gradient sử dụng `v.colors.primaryFn(0.2)`
- Tự động update khi đổi primary color
**Effort:** 0 phút (auto update)

#### ⚠️ **Files có hardcoded colors (Should-do)**

**3. `/src/components/App.tsx:296`** - Loading screen
```typescript
// Màu cũ từ design (không dùng v.colors.primary)
backgroundColor: '#74bf53'  // Light green
→
backgroundColor: '#FFD700'  // Light yellow
```
**Effort:** 5 phút

**4. `/src/components/VideoViewItem.tsx:95`** - Video border color
```typescript
borderColor: '#4cc5de',  // Cyan/blue
→
borderColor: '#FFCC00',  // Yellow (nếu cần đổi)
```
**Effort:** 5 phút (optional)

### 🧪 Testing

**Test checklist:**
- [ ] Login screen - Gradient background đúng màu
- [ ] Call screens - Nút gọi, giữ, chuyển máy
- [ ] Chat screens - Tin nhắn gửi đi
- [ ] Contact screens - Icon trạng thái
- [ ] Settings screens - Toggle switches, buttons
- [ ] Buttons - Primary, Warning, Danger
- [ ] Loading screen - Màu background

**Effort:** 30-45 phút

### ⏱️ Total Effort - Đổi màu

| Task | Time |
|------|------|
| Sửa variables.ts | 5 min |
| Sửa hardcoded colors | 10 min |
| Full testing (33 màn hình) | 45 min |
| **TOTAL** | **1 giờ** |

**With buffer (20%):** **1.2 giờ**

---

## 🖼️ PHẦN 2: ĐỔI LOGO

### 📊 Tổng số files cần thay

**Total:** 35+ logo/icon files

### 📂 Breakdown chi tiết

#### **1. Source Assets (2 files)**
**Location:** `/src/assets/`

| File | Size | Usage | Effort |
|------|------|-------|--------|
| `logo.png` | 180×180px | Web landing page, base for app icons | 10 min |
| `brand.png` | 504×179px | Brand name logo (wide format) | 10 min |

**Subtotal:** 20 phút

---

#### **2. iOS App Icons (13 files)**
**Location:** `/ios/BrekekePhone/Images.xcassets/AppIcon.appiconset/`

| File | Size | Device/Context | Effort |
|------|------|----------------|--------|
| icon20.png | 20×20px | iPad notification | 2 min |
| icon29.png | 29×29px | Settings @1x | 2 min |
| icon40.png | 40×40px | Spotlight @2x | 2 min |
| icon58.png | 58×58px | Settings @2x | 2 min |
| icon60.png | 60×60px | Notification @3x | 2 min |
| icon76.png | 76×76px | iPad @1x | 2 min |
| icon80.png | 80×80px | Spotlight @2x | 2 min |
| icon87.png | 87×87px | Settings @3x | 2 min |
| icon120.png | 120×120px | Home screen @2x/@3x | 2 min |
| icon152.png | 152×152px | iPad @2x | 2 min |
| icon167.png | 167×167px | iPad Pro @2x | 2 min |
| icon180.png | 180×180px | Home screen @3x | 2 min |
| **icon-appstore.png** | 1024×1024px | **App Store listing** | 5 min |

**Subtotal:** 30 phút

---

#### **3. iOS Launch Screen (3 files)**
**Location:** `/ios/BrekekePhone/Images.xcassets/LaunchScreenLogo.imageset/`

| File | Size | Scale | Effort |
|------|------|-------|--------|
| LaunchScreen.png | 168×129px | @1x | 5 min |
| LaunchScreen@2x.png | 336×258px | @2x | 5 min |
| LaunchScreen@3x.png | 504×387px | @3x | 5 min |

**Subtotal:** 15 phút

---

#### **4. Android App Icons (5 files)**
**Location:** `/android/app/src/main/res/mipmap-*/ic_launcher.png`

| Density | Size (approx) | Device | Effort |
|---------|---------------|--------|--------|
| mdpi | 48×48px | Baseline | 2 min |
| hdpi | 72×72px | 1.5x | 2 min |
| xhdpi | 96×96px | 2x | 2 min |
| xxhdpi | 144×144px | 3x | 2 min |
| xxxhdpi | 192×192px | 4x | 2 min |

**Subtotal:** 10 phút

---

#### **5. Android Launch Screen (5 files)**
**Location:** `/android/app/src/main/res/mipmap-*/launch_screen.png`

| Density | Size (approx) | Device | Effort |
|---------|---------------|--------|--------|
| mdpi | - | Baseline | 5 min |
| hdpi | - | 1.5x | 5 min |
| xhdpi | - | 2x | 5 min |
| xxhdpi | - | 3x | 5 min |
| xxxhdpi | 672×516px | 4x | 5 min |

**Subtotal:** 25 phút

---

#### **6. Avatar Placeholders (Optional - 7+ files)**
**Location:** `/android/app/src/main/res/mipmap-*/`

| File | Usage | Effort/density |
|------|-------|----------------|
| default_avatar.png | Default user avatar | 2 min × 5 = 10 min |
| avatar_failed.png | Failed avatar fallback | 2 min × 5 = 10 min |

**Subtotal:** 20 phút (nếu cần thay đổi)

---

### 🎨 Công việc bổ sung

#### **A. Export logo variants (nếu khách chưa cung cấp đủ sizes)**

**Công cụ:** Photoshop/Figma/Sketch

| Task | Time |
|------|------|
| Resize logo thành 13 iOS sizes | 20 min |
| Resize logo thành 5 Android sizes | 10 min |
| Export splash screen variants (8 files) | 15 min |
| Quality check tất cả exports | 10 min |

**Subtotal:** 55 phút (~1 giờ)

---

#### **B. Update code references (if needed)**

**Thường không cần** vì chỉ thay file, giữ nguyên tên.

Nếu đổi tên file:
- Update imports trong `App.web.tsx`
- Update `Contents.json` (iOS)
- Update `AndroidManifest.xml` (nếu cần)

**Effort:** 15-30 phút (nếu cần)

---

### 🧪 Testing

**Test checklist:**
- [ ] iOS simulator - App icon hiển thị đúng
- [ ] Android emulator - App icon hiển thị đúng
- [ ] iOS splash screen - Logo đúng khi mở app
- [ ] Android splash screen - Logo đúng khi mở app
- [ ] Web landing page - Logo + brand name
- [ ] Avatar placeholders (nếu đổi)
- [ ] Build thành công (iOS + Android)

**Device testing:**
- [ ] iPhone (test ít nhất 1 thiết bị thật)
- [ ] Android (test ít nhất 1 thiết bị thật)

**Effort:** 30-45 phút

---

### ⏱️ Total Effort - Đổi logo

| Task | Time |
|------|------|
| Replace source assets | 20 min |
| Replace iOS app icons | 30 min |
| Replace iOS launch screen | 15 min |
| Replace Android app icons | 10 min |
| Replace Android launch screen | 25 min |
| **Subtotal (có sẵn assets)** | **100 min (~1.7 giờ)** |
| Export logo variants (nếu cần) | +60 min |
| Testing on devices | 45 min |
| **TOTAL** | **2.5-3.5 giờ** |

**With buffer (20%):** **3-4 giờ**

---

## 💰 TỔNG HỢP ESTIMATE

### **Option 1: Quick Update (Có sẵn logo đủ sizes)**

```
✅ Đổi màu (sửa code + test):          1.2 giờ
✅ Đổi logo (replace files + test):    3.0 giờ
───────────────────────────────────────────────
TOTAL:                                 4.2 giờ
```

**Rounded:** **4-5 giờ** (nửa ngày làm việc)

---

### **Option 2: Standard (Cần export logo variants)**

```
✅ Đổi màu (full + fix hardcoded):     1.5 giờ
✅ Export logo variants:               1.0 giờ
✅ Đổi logo (replace + test):          3.0 giờ
✅ Full QA testing:                    1.0 giờ
───────────────────────────────────────────────
TOTAL:                                 6.5 giờ
```

**Rounded:** **6-7 giờ** (1 ngày làm việc)

---

### **Option 3: Complete (Full package + Store assets)**

```
✅ Đổi màu + fix all hardcoded:        2.0 giờ
✅ Design/Export logo variants:        1.5 giờ
✅ Đổi logo (all files):               3.5 giờ
✅ Full QA testing (devices):          2.0 giờ
✅ Update App Store/Play Store:        1.0 giờ
✅ Documentation:                      0.5 giờ
───────────────────────────────────────────────
TOTAL:                                10.5 giờ
```

**Rounded:** **10-12 giờ** (1.5 ngày làm việc)

---

## ⚠️ ASSUMPTIONS (GIẢ ĐỊNH)

1. ✅ Khách hàng cung cấp logo mới (vector format: AI/SVG/PDF)
2. ✅ Logo đã được thiết kế phù hợp với app icon (square format)
3. ✅ Không cần redesign logo
4. ✅ Màu mới đã được confirm (hex code cụ thể)
5. ✅ Không thay đổi layout/UI, chỉ màu và logo
6. ✅ Mid-level developer đã quen với React Native
7. ✅ Có môi trường dev sẵn (iOS + Android)

---

## 🚨 RISKS (RỦI RO)

| Risk | Impact | Mitigation |
|------|--------|------------|
| Logo không phù hợp format app icon | High | Request logo square format trước khi bắt đầu |
| Màu mới contrast thấp (không đọc được text) | Medium | Test accessibility trước khi deploy |
| Build iOS/Android fail sau khi đổi assets | Low | Test build ngay sau khi replace files |
| Khách yêu cầu revisions | Medium | Confirm màu + logo trước, limit 2 rounds revision |

---

## 📦 DELIVERABLES

1. ✅ Source code đã update màu mới
2. ✅ Tất cả logo files đã thay thế (35+ files)
3. ✅ App build thành công (iOS + Android)
4. ✅ Testing report (screenshot 33 màn hình với màu mới)
5. ✅ Assets backup (logo cũ để rollback nếu cần)

---

## 💡 KHUYẾN NGHỊ

### **Cho khách hàng:**

**Chuẩn bị trước khi bắt đầu:**
1. Cung cấp logo vector (AI/SVG/PDF) - square format
2. Confirm hex code màu chính xác (VD: #FFCC00)
3. Approve mockup/sample trước khi apply toàn bộ

**Timeline realistic:**
- Quick update: 0.5-1 ngày
- Standard: 1-1.5 ngày
- Complete: 2 ngày

### **Pricing (Mid-level dev rate: 300-500k/giờ)**

| Package | Hours | Price Range (VND) |
|---------|-------|-------------------|
| Quick Update | 4-5h | 1.2M - 2.5M |
| Standard | 6-7h | 1.8M - 3.5M |
| Complete | 10-12h | 3.0M - 6.0M |

---

## 📞 NEXT STEPS

1. ☐ Khách confirm màu mới (hex code)
2. ☐ Khách gửi logo mới (vector format)
3. ☐ Chọn package (Quick/Standard/Complete)
4. ☐ Approve estimate
5. ☐ Schedule development
6. ☐ Kickoff meeting

---

**Prepared by:** OpenCode Assistant  
**Version:** 1.0  
**Last updated:** 02/04/2026
