# Estimate: Custom UI Feature - Brekeke Phone App

**Ngày tạo:** 02/04/2026  
**Loại công việc:** Feature Development  
**Developer level:** Mid-level

---

## 📋 TỔNG QUAN

### 🎯 Mục tiêu

Phát triển tính năng **Custom UI** cho phép người dùng tự customize giao diện app bao gồm:
- Màu nền (Background color)
- Màu các nút bấm (Button colors: Primary, Warning, Danger)
- Lưu cài đặt và áp dụng toàn bộ app
- Reset về mặc định

### 📍 Vị trí

- **Nút Custom UI:** Đặt trong **Settings > Other** (PageSettingsOther), dưới chỗ chọn ngôn ngữ
- **Màn hình Custom UI:** Màn hình mới cho phép chỉnh màu sắc

### 🏗️ Kiến trúc

Tương tự như hệ thống **Language Selection** hiện có:
- Centralized store (MobX)
- AsyncStorage persistence
- Real-time update toàn app

---

## 🔧 BREAKDOWN CÔNG VIỆC

### **PHASE 1: BACKEND/STORE LAYER**

---

#### **Task 1.1: Tạo Theme Store**

**File:** `/src/stores/themeStore.ts`

**Nội dung:**
```typescript
class ThemeStore {
  @observable backgroundColor = '#FFFFFF'
  @observable primaryColor = '#609B3A'
  @observable warningColor = '#F1AF20'
  @observable dangerColor = '#DC0F39'
  @observable themeReady = false
  
  // Methods:
  - setBackgroundColor(color)
  - setPrimaryColor(color)
  - setWarningColor(color)
  - setDangerColor(color)
  - saveTheme() // Save to AsyncStorage
  - loadTheme() // Load from AsyncStorage
  - resetToDefault() // Reset về màu mặc định
  - wait() // Async load khi khởi động app
}
```

**Công việc:**
- Tạo class ThemeStore với MobX observables
- Implement tất cả methods
- AsyncStorage integration (save/load)
- Error handling
- Default values

**Effort:**

| Sub-task | Time |
|----------|------|
| Research intlStore pattern | 30 min |
| Code ThemeStore class | 90 min |
| AsyncStorage save/load | 30 min |
| Error handling | 30 min |
| Basic testing | 45 min |

**Subtotal:** **3.5 giờ**

---

#### **Task 1.2: Integrate Theme Store vào Variables**

**File:** `/src/components/variables.ts`

**Công việc:**
- Import themeStore
- Thay đổi hardcoded colors thành dynamic
- Đảm bảo backward compatibility

**Trước:**
```typescript
const v = {
  bg: 'white',
  colors: {
    primary: '#609B3A',
    warning: '#F1AF20',
    danger: '#DC0F39',
  }
}
```

**Sau:**
```typescript
const v = computed(() => ({
  bg: themeStore.backgroundColor || 'white',
  colors: {
    primary: themeStore.primaryColor || '#609B3A',
    warning: themeStore.warningColor || '#F1AF20',
    danger: themeStore.dangerColor || '#DC0F39',
  }
}))
```

**Effort:**

| Sub-task | Time |
|----------|------|
| Hiểu cấu trúc variables.ts | 30 min |
| Refactor thành dynamic | 45 min |
| Test không breaking existing | 60 min |
| Fix issues nếu có | 30 min |

**Subtotal:** **2.5 giờ**

---

### **PHASE 2: UI LAYER**

---

#### **Task 2.1: Thêm nút Custom UI vào Settings**

**File:** `/src/pages/PageSettingsOther.tsx`

**Vị trí:** Dưới LANGUAGE selector (sau dòng 202)

**Code mẫu:**
```tsx
<Field
  label={intl`CUSTOM_UI`}
  value={intl`CUSTOMIZE_COLORS`}
  onPress={this.goToCustomUI}
  icon={mdiPalette}
/>
```

**Công việc:**
- Thêm Field component
- Add navigation method `goToCustomUI`
- Add icon import (mdiPalette)
- Translation keys

**Effort:**

| Sub-task | Time |
|----------|------|
| Add Field component | 15 min |
| Add navigation logic | 15 min |
| Translation strings (en/ja) | 15 min |
| Testing | 15 min |

**Subtotal:** **1 giờ**

---

#### **Task 2.2: Tạo màn hình Custom UI**

**File:** `/src/pages/PageCustomUI.tsx` (file mới)

**Layout:**
```
┌─────────────────────────────┐
│ ← Custom UI                 │ Header
├─────────────────────────────┤
│                             │
│ BACKGROUND COLOR            │ Section
│ [Color Picker]              │
│ Current: #FFFFFF            │
│                             │
│ BUTTON COLORS               │ Section
│                             │
│ Primary                     │
│ [Color Picker]              │
│ Current: #609B3A            │
│                             │
│ Warning                     │
│ [Color Picker]              │
│ Current: #F1AF20            │
│                             │
│ Danger                      │
│ [Color Picker]              │
│ Current: #DC0F39            │
│                             │
│ ┌───────────────────────┐   │ Preview
│ │ PREVIEW              │   │
│ │ [Sample Button]      │   │
│ └───────────────────────┘   │
│                             │
│ [Reset to Default]          │ Actions
│ [Save]                      │
└─────────────────────────────┘
```

**Công việc:**
- Setup page structure với Layout
- Sections cho từng loại màu
- Wire up với themeStore
- Styling
- Validation (màu hợp lệ)

**Effort:**

| Sub-task | Time |
|----------|------|
| Setup page skeleton | 60 min |
| Build sections layout | 90 min |
| Connect to themeStore | 45 min |
| Validation logic | 30 min |
| Styling & polish | 90 min |
| Testing | 45 min |

**Subtotal:** **5.5 giờ**

---

#### **Task 2.3: Color Picker Component**

**Option A: Sử dụng Library (Recommended)**

**Library:** `react-native-color-picker` hoặc `react-native-wheel-color-picker`

**Features:**
- Wheel/slider picker
- RGB/HSL support
- Preview swatch
- Copy hex value

**Công việc:**
- Research & chọn library phù hợp
- Install & config
- Create wrapper component
- Integration vào PageCustomUI
- Styling để match design

**Effort:**

| Sub-task | Time |
|----------|------|
| Research libraries | 30 min |
| Install & setup | 30 min |
| Create ColorPickerField wrapper | 60 min |
| Integration | 45 min |
| Styling | 30 min |
| Testing | 30 min |

**Subtotal:** **3 giờ**

---

**Option B: Custom Color Picker (Build from scratch)**

**Features:**
- Predefined color palette (12-20 màu phổ biến)
- RGB sliders
- Hex input field
- Color preview

**Công việc:**
- Design UI/UX
- Build palette grid
- Build RGB sliders
- Hex input validation
- Color conversion logic

**Effort:**

| Sub-task | Time |
|----------|------|
| Design UI | 60 min |
| Build palette grid | 90 min |
| Build RGB sliders | 120 min |
| Hex input & validation | 60 min |
| Color conversion utils | 45 min |
| Styling | 60 min |
| Testing | 45 min |

**Subtotal:** **7.5 giờ**

**⚠️ Note:** Option B tốn thời gian hơn nhưng có thể customize hoàn toàn

---

#### **Task 2.4: Preview Component**

**Mục đích:** Hiển thị real-time preview của màu đang chọn

**Layout:**
```
┌─────────────────────────┐
│ PREVIEW                │
│                        │
│ [Primary Button]       │ ← Live preview
│ [Warning Button]       │
│ [Danger Button]        │
│                        │
│ Sample text on bg      │ ← Background preview
└─────────────────────────┘
```

**Công việc:**
- Design preview area
- Sample buttons với màu dynamic
- Real-time sync với themeStore
- Background color preview

**Effort:**

| Sub-task | Time |
|----------|------|
| Design preview layout | 30 min |
| Build sample components | 45 min |
| Real-time sync | 30 min |
| Styling | 30 min |
| Testing | 15 min |

**Subtotal:** **2.5 giờ**

---

### **PHASE 3: INTEGRATION & TESTING**

---

#### **Task 3.1: App Initialization**

**File:** `/src/components/App.tsx`

**Công việc:**
- Import themeStore
- Add `ctx.theme.wait()` trong initialization
- Ensure theme load before render
- Loading state handling

**Code mẫu:**
```typescript
async componentDidMount() {
  await Promise.all([
    ctx.intl.wait(),
    ctx.theme.wait(),  // ← Add this
  ])
  // ... rest of init
}
```

**Effort:**

| Sub-task | Time |
|----------|------|
| Understand App init flow | 30 min |
| Add theme loading | 30 min |
| Loading state handling | 30 min |
| Testing | 30 min |

**Subtotal:** **2 giờ**

---

#### **Task 3.2: Navigation Configuration**

**File:** `/src/components/navigationConfig.ts`

**Công việc:**
- Add PageCustomUI vào navigation config
- Define route
- Ensure deep linking works (nếu có)

**Effort:**

| Sub-task | Time |
|----------|------|
| Add navigation route | 15 min |
| Test navigation flow | 30 min |
| Fix issues | 15 min |

**Subtotal:** **1 giờ**

---

#### **Task 3.3: Testing toàn bộ app**

**Scope:** Test màu apply đúng trên tất cả 33 màn hình

**Test cases:**
1. Đổi màu background → Check tất cả screens
2. Đổi màu primary → Check buttons, highlights
3. Đổi màu warning → Check warning buttons
4. Đổi màu danger → Check danger buttons, alerts
5. Save & reload app → Màu persist đúng
6. Reset to default → Màu về mặc định
7. Edge cases: Màu invalid, extreme colors

**Effort:**

| Sub-task | Time |
|----------|------|
| Manual test 33 screens | 2.5 giờ |
| Test persistence (save/load) | 30 min |
| Test edge cases | 45 min |
| Document bugs | 30 min |
| Bug fixing | 2 giờ |

**Subtotal:** **6 giờ**

---

### **PHASE 4: POLISH & DOCUMENTATION**

---

#### **Task 4.1: UX Improvements**

**Features:**
- Loading spinner khi save
- Success toast/message khi save thành công
- Confirm dialog khi reset
- Error handling & user feedback
- Disable save button nếu không có thay đổi

**Effort:**

| Sub-task | Time |
|----------|------|
| Loading states | 30 min |
| Success feedback | 30 min |
| Confirm dialogs | 45 min |
| Error handling | 45 min |
| Testing | 30 min |

**Subtotal:** **3 giờ**

---

#### **Task 4.2: Code Review & Refactor**

**Công việc:**
- Code cleanup
- Add comments
- Remove console.logs
- Ensure code quality
- Follow project conventions

**Effort:**

| Sub-task | Time |
|----------|------|
| Self review | 45 min |
| Refactoring | 60 min |
| Testing after refactor | 30 min |

**Subtotal:** **2 giờ**

---

#### **Task 4.3: Documentation (Optional)**

**Nội dung:**
- User guide: Cách sử dụng Custom UI
- Developer docs: ThemeStore API
- Update README nếu cần

**Effort:** **1 giờ** (nếu cần)

---

## 📊 TOTAL ESTIMATE

### **Scenario 1: MVP (Minimum Viable Product)**

**Features:**
- Basic theme store (background + primary only)
- Simple settings button
- Basic custom UI page
- Color picker library (không có preview)
- Cơ bản testing

| Phase | Tasks | Time |
|-------|-------|------|
| Backend | Theme store (basic) + Integration | 4 giờ |
| UI | Settings button + Custom UI page (simple) | 4 giờ |
| UI | Color picker (library) | 2 giờ |
| Integration | App init + Navigation | 2 giờ |
| Testing | Basic testing | 3 giờ |

**Subtotal:** **15 giờ**  
**Buffer (30%):** **+5 giờ**  
**TOTAL:** **20 giờ** (~2.5 ngày)

---

### **Scenario 2: STANDARD (Recommended) ⭐**

**Features:**
- Full theme store (background + 3 button colors)
- Professional color picker (library)
- Live preview component
- Full testing trên 33 màn hình
- UX improvements (loading, success, confirm)
- Code review

| Phase | Tasks | Time |
|-------|-------|------|
| Backend | Theme store (full) + Integration | 6 giờ |
| UI | Settings button + Custom UI page | 6.5 giờ |
| UI | Color picker (library) + Preview | 5.5 giờ |
| Integration | App init + Navigation + Full testing | 9 giờ |
| Polish | UX improvements + Code review | 5 giờ |

**Subtotal:** **32 giờ**  
**Buffer (30%):** **+10 giờ**  
**TOTAL:** **42 giờ** (~5 ngày)

---

### **Scenario 3: PREMIUM (Advanced)**

**Features:**
- Advanced theme store (nhiều options hơn)
- Custom-built color picker (không dùng library)
- Advanced preview (multiple screens preview)
- Full customization (text color, icon color, spacing)
- Export/Import theme file
- Full testing + documentation

| Phase | Tasks | Time |
|-------|-------|------|
| Backend | Advanced theme store + Integration | 8 giờ |
| UI | Settings button + Advanced Custom UI page | 10 giờ |
| UI | Custom color picker + Advanced preview | 12 giờ |
| Features | Export/Import theme | 4 giờ |
| Integration | App init + Navigation + Full testing | 10 giờ |
| Polish | UX improvements + Code review + Docs | 6 giờ |

**Subtotal:** **50 giờ**  
**Buffer (30%):** **+15 giờ**  
**TOTAL:** **65 giờ** (~8 ngày)

---

## 💰 PRICING (Mid-level dev: 300-500k VND/giờ)

| Package | Hours | Price Range (VND) |
|---------|-------|-------------------|
| **MVP** | 20h | 6M - 10M |
| **Standard** ⭐ | 42h | 12.6M - 21M |
| **Premium** | 65h | 19.5M - 32.5M |

---

## ⚠️ ASSUMPTIONS (GIẢ ĐỊNH)

1. ✅ Mid-level developer đã quen với React Native + MobX
2. ✅ Có thiết kế UI/wireframe sẵn (hoặc clone từ language selector)
3. ✅ Dùng color picker library có sẵn (không build từ đầu)
4. ✅ Chỉ customize 2-4 màu (background + buttons)
5. ✅ Không cần A/B testing hoặc analytics tracking
6. ✅ Không cần multi-theme (light/dark mode)
7. ✅ Không cần share theme với users khác

---

## 🚨 RISKS (RỦI RO)

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Color picker library không tương thích React Native version | High | Medium | Test library trước khi start, có plan B |
| Performance issue khi update màu real-time | Medium | Low | Debounce/throttle color updates |
| User chọn màu có contrast thấp (không đọc được) | High | High | Add color validation, warning, contrast checker |
| Scope creep (khách muốn thêm font, spacing, etc.) | High | High | Define scope rõ ràng, tính phí cho extra features |
| Breaking existing screens | Medium | Low | Comprehensive testing, rollback plan |

---

## 📦 DELIVERABLES

### **MVP Package**
1. ✅ ThemeStore với background + primary color
2. ✅ Custom UI screen (basic)
3. ✅ Color picker integration
4. ✅ AsyncStorage persistence
5. ✅ Basic testing

### **Standard Package** ⭐
1. ✅ Full ThemeStore (4 colors)
2. ✅ Professional Custom UI screen
3. ✅ Color picker + Live preview
4. ✅ AsyncStorage persistence
5. ✅ Full testing (33 screens)
6. ✅ UX improvements (loading, success, confirm)
7. ✅ Code review & refactor

### **Premium Package**
1. ✅ Advanced ThemeStore (nhiều options)
2. ✅ Custom-built color picker
3. ✅ Advanced preview
4. ✅ Export/Import theme
5. ✅ Full testing + edge cases
6. ✅ Documentation
7. ✅ Training session (30 min)

---

## 🎯 RECOMMENDED APPROACH

### **Cho khách hàng SMB/Startup:**
→ Chọn **Standard Package** (42 giờ)

**Lý do:**
- Đầy đủ features cần thiết
- Professional UX
- Testing kỹ lưỡng
- Best value for money

### **Cho khách hàng Enterprise:**
→ Chọn **Premium Package** (65 giờ)

**Lý do:**
- Full customization
- Có thể export/share theme
- Documentation đầy đủ
- Future-proof

### **Cho POC/Demo:**
→ Chọn **MVP Package** (20 giờ)

**Lý do:**
- Nhanh, rẻ
- Validate concept
- Có thể upgrade sau

---

## 📅 TIMELINE ESTIMATE

| Package | Duration | Timeline |
|---------|----------|----------|
| **MVP** | 20h | 2.5-3 ngày |
| **Standard** | 42h | 5-6 ngày |
| **Premium** | 65h | 8-10 ngày |

**Note:** Timeline giả định 1 developer full-time (8h/ngày)

---

## 🔄 PHASED APPROACH (Alternative)

Nếu budget hạn chế, có thể chia thành phases:

### **Phase 1: Core (15 giờ - 4.5M-7.5M VND)**
- Theme store + background color only
- Basic UI
- No preview

### **Phase 2: Enhancement (15 giờ - 4.5M-7.5M VND)**
- Add button colors
- Add preview
- UX improvements

### **Phase 3: Advanced (15 giờ - 4.5M-7.5M VND)**
- Custom picker
- Export/Import
- Documentation

**Benefit:** Khách có thể test Phase 1 trước khi invest thêm

---

## 📞 NEXT STEPS

### **Pre-sales:**
1. ☐ Demo current app cho khách
2. ☐ Show mockup/wireframe Custom UI screen
3. ☐ Confirm features cần thiết
4. ☐ Chọn package (MVP/Standard/Premium)
5. ☐ Approve estimate & timeline

### **Development:**
1. ☐ Setup dev environment
2. ☐ Kickoff meeting
3. ☐ Sprint planning
4. ☐ Development (theo phases)
5. ☐ Testing & QA
6. ☐ UAT with client
7. ☐ Deployment
8. ☐ Training & handover

---

## 💡 UPSELL OPPORTUNITIES

Sau khi deliver Custom UI feature, có thể suggest thêm:

1. **Dark Mode** (+20 giờ) - Toggle light/dark theme
2. **Theme Presets** (+10 giờ) - 5-10 pre-designed themes
3. **Font Customization** (+15 giờ) - Chọn font size, font family
4. **Layout Customization** (+25 giờ) - Spacing, border radius, etc.
5. **Theme Marketplace** (+60 giờ) - Share/download themes từ community

---

## 📝 NOTES

### **Technical Notes:**
- Sử dụng MobX observable để auto-update UI khi màu thay đổi
- AsyncStorage limit: ~6MB, theme data rất nhỏ (<1KB)
- Cần test trên cả iOS và Android vì color rendering có thể khác nhau
- Consider accessibility (WCAG contrast ratio guidelines)

### **Business Notes:**
- Feature này tạo product differentiation
- User retention cao hơn khi có personalization
- Có thể monetize: Premium themes, Custom themes

---

**Prepared by:** OpenCode Assistant  
**Version:** 1.0  
**Last updated:** 02/04/2026

---

## 📎 APPENDIX

### **A. Color Picker Libraries Comparison**

| Library | Pros | Cons | Size |
|---------|------|------|------|
| react-native-color-picker | Nhiều styles, popular | Maintenance? | ~50KB |
| react-native-wheel-color-picker | Đẹp, smooth | iOS only có vấn đề | ~30KB |
| react-native-color-palette | Simple, lightweight | Limited features | ~20KB |

### **B. Sample Code Structure**

```
/src
  /stores
    themeStore.ts        ← New
  /pages
    PageCustomUI.tsx     ← New
    PageSettingsOther.tsx (modified)
  /components
    variables.ts         (modified)
    ColorPickerField.tsx ← New
    ThemePreview.tsx     ← New
```

### **C. AsyncStorage Keys**

```
theme_backgroundColor: string
theme_primaryColor: string
theme_warningColor: string
theme_dangerColor: string
```

---

**End of Document**
