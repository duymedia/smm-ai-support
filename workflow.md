# NexusSMM — Workflow Chi Tiết Người Dùng & Admin

> **Stack**: Express + Prisma + MySQL (`rent_ai_suport`) + RabbitMQ + Argon2 + JWT + Vite/React

---

## 🗺️ Sơ đồ Kiến trúc Tổng quan

```mermaid
graph TD
    Browser["🌐 Browser / Client"] --> Landing["Landing Page\n/, /features, /pricing, /faq"]
    Browser --> Auth["Auth Pages\n/login /register /forgot-password /reset-password"]
    Browser --> Dashboard["Dashboard (JWT protected)\n/dashboard /panels /packages /services..."]
    Browser --> Admin["Admin Control\n/admin (role: admin / super_admin)"]

    Auth --> API_Auth["Express API /api/auth/*"]
    Dashboard --> API_User["Express API /api/user/* /api/panels/* ..."]
    Admin --> API_Admin["Express API /api/admin/*"]

    API_Auth --> Prisma["Prisma ORM"]
    API_User --> Prisma
    API_Admin --> Prisma
    Prisma --> MySQL[("MySQL\nrent_ai_suport")]

    API_Auth --> RabbitMQ["RabbitMQ\n(register job queue)"]
    API_Admin --> Gemini["Google Gemini AI\n(AI Support / Auto-Reply)"]
```

---

## 👤 PHẦN 1 — NGƯỜI DÙNG (Customer / Support)

### 1.1 Auth — Xác thực

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as Express API
    participant DB as MySQL (Prisma)
    participant MQ as RabbitMQ
    participant Mail as SMTP Mail

    User->>FE: Điền form đăng ký
    FE->>API: POST /api/auth/register
    API->>API: validateRegistrationInput()
    API->>DB: findFirst({username}) → 409 nếu trùng
    API->>DB: findFirst({email}) → 409 nếu trùng
    API->>DB: findFirst({phone}) → 409 nếu trùng
    API->>API: Đọc settings.default_language & default_currency
    API->>API: hashPassword (Argon2id)
    API->>MQ: publishRegistrationJob() [nếu MQ online]
    API->>DB: prisma.user.create()
    API-->>FE: 201 { success, data, token, message }

    User->>FE: Điền form login
    FE->>API: POST /api/auth/login
    API->>DB: findFirst({ email | username })
    API->>API: verifyPassword (Argon2id)
    API->>DB: updateMany({ lastLoginAt: now })
    API->>API: generateToken (JWT, 7 ngày)
    API->>FE: Set-Cookie jwt_token (HttpOnly)
    API-->>FE: 200 { success, data, jwt_token, message }

    User->>FE: Quên mật khẩu
    FE->>API: POST /api/auth/forgot-password { email }
    API->>DB: findFirst({ email })
    API->>API: generateSecureToken(32) → token
    API->>DB: prisma.passwordReset.create()
    API->>Mail: sendPasswordResetEmail()
    API-->>FE: 200 { success, message }

    User->>FE: Đặt lại mật khẩu
    FE->>API: POST /api/auth/reset-password { token, password }
    API->>DB: findFirst({ token, used=false, expires_at > now })
    API->>API: hashPassword (Argon2id)
    API->>DB: updateMany({ password })
    API->>DB: update({ used: true })
    API-->>FE: 200 { success, message }
```

| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/auth/register` | POST | Đăng ký, kiểm tra trùng username→email→phone |
| `/api/auth/login` | POST | Login bằng email hoặc username |
| `/api/auth/logout` | POST | Xóa cookie jwt_token |
| `/api/auth/forgot-password` | POST | Gửi email reset |
| `/api/auth/reset-password` | POST | Đặt mật khẩu mới qua token |
| `/api/auth/me` hoặc `/api/user/profile` | GET | Lấy thông tin user hiện tại |

**Fields đăng ký:**
```json
{
  "name": "Nguyen Van A",         // bắt buộc, 2-100 ký tự
  "username": "nguyenvana",       // bắt buộc, 3-30 ký tự, a-z 0-9 _
  "email": "user@gmail.com",      // bắt buộc, email hợp lệ
  "password": "MatKhau@2026",     // bắt buộc, >= 8 ký tự
  "phone": "+84988889999",        // tùy chọn, UNIQUE
  "role": "customer"              // tùy chọn: customer|admin|support|super_admin
}
```

**Response đăng ký thành công (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "role": "customer",
    "balance": 15,
    "language": "en",       ← lấy từ settings.default_language
    "currency": "USD",      ← lấy từ settings.default_currency
    "apiKey": "<64 ký tự hex random>",
    "emailVerified": true
  },
  "token": "<JWT>",
  "message": "Đăng ký thành công! Tặng ngay $15.00..."
}
```

---

### 1.2 Profile — Hồ sơ tài khoản

```mermaid
flowchart LR
    Profile(["/profile\n/account"]) --> ViewProfile["GET /api/user/profile\nXem thông tin"]
    Profile --> EditProfile["PUT /api/auth/profile\nCập nhật name, phone, timezone, language, currency"]
    Profile --> ChangePass["PUT /api/user/change-password\n{ currentPassword, newPassword }"]
    Profile --> RotateKey["POST /api/user/rotate-api-key\nSinh API key mới (64 hex)"]
```

| Endpoint | Method | Mô tả |
|---|---|---|
| `/api/user/profile` | GET | Xem profile |
| `/api/auth/profile` hoặc `/api/user/profile` | PUT | Sửa name, phone, timezone, language, currency |
| `/api/user/change-password` | PUT | Đổi mật khẩu (cần xác nhận mật khẩu hiện tại) |
| `/api/user/rotate-api-key` | POST | Tạo lại API key (64-char hex random, không có prefix) |

---

### 1.3 Dashboard — Tổng quan

**Route:** `/dashboard`  
**API:** `GET /api/dashboard/stats`

Hiển thị:
- Số dư tài khoản (balance)
- Số panel đang hoạt động
- Tổng đơn hàng
- Doanh thu tháng này
- Biểu đồ hoạt động 7 ngày
- Thông báo hệ thống
- Subscription đang chạy

---

### 1.4 Panels — Quản lý Panel SMM

```mermaid
flowchart TD
    PanelList(["/panels"]) -->|GET /api/panels| ListPanels["Danh sách Panel"]
    ListPanels --> CreatePanel["POST /api/panels\nTạo panel mới"]
    ListPanels --> PanelDetail["GET /api/panels/:id\nXem chi tiết"]

    PanelDetail --> EditPanel["PUT /api/panels/:id\nSửa thông tin"]
    PanelDetail --> DeletePanel["DELETE /api/panels/:id\nXóa panel"]
    PanelDetail --> TestDispatch["POST /api/panels/:id/test-dispatch\nTest kết nối"]
    PanelDetail --> ChangeDomain["PUT /api/panels/:id/domain\nĐổi domain"]
    PanelDetail --> RotatePanelKey["POST /api/panels/:id/rotate-key\nXoay API key"]
    PanelDetail --> ExtendPanel["POST /api/panels/:id/extend\nGia hạn"]
    PanelDetail --> ToggleAutoRenew["POST /api/panels/:id/toggle-autorenew\nBật/tắt tự động gia hạn"]
    PanelDetail --> PanelAction["POST /api/panels/:id/action\nstart / stop / restart"]
    PanelDetail --> Diagnose["POST /api/panels/:id/diagnose\nAI chẩn đoán sự cố (Gemini)"]
```

**Trạng thái panel:** `active` | `suspended` | `pending` | `expired`

---

### 1.5 Services — Dịch vụ SMM

**Route:** `/services`

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/services` | GET | Xem danh sách dịch vụ (Instagram, Facebook, TikTok...) |
| `POST /api/services` | POST | Đặt dịch vụ mới |
| `PUT /api/services/:id` | PUT | Cập nhật đơn |
| `DELETE /api/services/:id` | DELETE | Hủy dịch vụ |

---

### 1.6 Packages — Gói dịch vụ

**Route:** `/packages`  
**API:** `GET /api/packages`

Hiển thị các gói subscription với giá và tính năng. Người dùng chọn gói → chuyển sang thanh toán.

---

### 1.7 Billing — Thanh toán & Số dư

```mermaid
flowchart LR
    Billing(["/add-funds\n/subscriptions\n/transactions"]) --> AddFunds["POST /api/billing/add-funds\nNạp tiền: VietQR, USDT TRC20/ERC20, Crypto"]
    Billing --> ViewTransactions["GET /api/transactions\nLịch sử giao dịch"]
    Billing --> ViewSubs["GET /api/subscriptions\nCác gói đang đăng ký"]
    Billing --> RenewSub["POST /api/subscriptions/:id/renew\nGia hạn gói"]
    Billing --> ApplyCoupon["POST /api/public/coupons/apply\nÁp dụng mã giảm giá"]
```

**Phương thức nạp tiền:**
- 🏦 VietQR (MBBANK, tự động xác minh)
- ₿ USDT TRC20 / ERC20
- 💳 Crypto tự động xác nhận sau N blocks

---

### 1.8 Dispatch — Cấu hình Điều phối đơn

**Route:** `/dispatch`

Cấu hình cách hệ thống tự động điều phối đơn hàng sang các provider SMM.

---

### 1.9 Support — Hỗ trợ AI

```mermaid
sequenceDiagram
    actor User
    participant FE as Frontend
    participant API as Express API
    participant Gemini as Google Gemini AI

    User->>FE: Nhắn tin trong chat
    FE->>API: POST /api/support/ai/chat { message, history }
    API->>Gemini: askSmmAiAssistant(message, history)
    Gemini-->>API: AI response
    API-->>FE: { reply }

    User->>FE: Tạo ticket thủ công
    FE->>API: POST /api/support/tickets { subject, message }
    API-->>FE: { ticket }

    User->>FE: Gửi tin nhắn trong ticket
    FE->>API: POST /api/support/tickets/:id/messages { message }
    API-->>FE: { message }
```

| Endpoint | Method | Mô tả |
|---|---|---|
| `POST /api/support/ai/chat` | POST | Chat với AI (Gemini) |
| `GET /api/support/tickets` | GET | Danh sách ticket |
| `POST /api/support/tickets` | POST | Tạo ticket mới |
| `POST /api/support/tickets/:id/messages` | POST | Gửi tin nhắn trong ticket |

---

### 1.10 Notifications — Thông báo

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/notifications` | GET | Lấy danh sách thông báo |
| `PUT /api/notifications/read-all` | PUT | Đánh dấu tất cả đã đọc |

---

## 🛡️ PHẦN 2 — ADMIN (`role: admin` hoặc `super_admin`)

**Route:** `/admin`  
**Component:** `AdminControlPage.tsx`

### 2.1 Admin Tabs Overview

```mermaid
graph LR
    Admin["AdminControlPage\n/admin"] --> T1["📊 Overview\nTổng quan hệ thống"]
    Admin --> T2["📦 Orders\nQuản lý đơn hàng"]
    Admin --> T3["🖥️ Panels\nQuản lý toàn bộ panel"]
    Admin --> T4["🔌 Providers\nNhà cung cấp SMM"]
    Admin --> T5["⚡ Services\nDịch vụ & giá bulk"]
    Admin --> T6["👥 Users\nQuản lý người dùng"]
    Admin --> T7["📦 Packages\nGói subscription"]
    Admin --> T8["🎨 Site Config\nCấu hình giao diện"]
    Admin --> T9["📢 Announcements\nThông báo hệ thống"]
    Admin --> T10["🎫 Coupons\nMã giảm giá"]
    Admin --> T11["🤖 AI Config\nCấu hình AI Gemini"]
    Admin --> T12["📋 Logs\nNhật ký hoạt động"]
```

---

### 2.2 Overview — Tổng quan hệ thống

| Endpoint | Mô tả |
|---|---|
| `GET /api/admin/stats` | Thống kê: tổng user, doanh thu, đơn hàng, tỉ lệ thành công |
| `GET /api/admin/overview` | Chi tiết: biểu đồ, top users, top panels, alerts |

---

### 2.3 Orders — Quản lý đơn hàng

```mermaid
flowchart LR
    Orders["GET /api/admin/orders\nDanh sách đơn"] --> Retry["POST /api/admin/orders/:id/retry\nThử lại đơn lỗi"]
    Orders --> CancelRefund["POST /api/admin/orders/:id/cancel-refund\nHủy & hoàn tiền"]
    Orders --> UpdateStatus["PUT /api/admin/orders/:id/status\nCập nhật trạng thái thủ công"]
```

**Trạng thái đơn:** `pending` | `processing` | `completed` | `failed` | `cancelled`

---

### 2.4 Users — Quản lý người dùng

```mermaid
flowchart LR
    Users["GET /api/admin/users\nDanh sách user + search + filter"] --> AdjBalance["POST /api/admin/users/:id/adjust-balance\n{ amount, type: 'add'|'deduct', reason }"]
    Users --> ChangeRole["PUT /api/admin/users/:id/role\n{ role: 'customer'|'admin'|'support'|'super_admin' }"]
```

**Khả năng:**
- Xem toàn bộ danh sách user (có phân trang, tìm kiếm)
- Điều chỉnh số dư (cộng/trừ, ghi lý do)
- Thay đổi role của user
- Xem lịch sử đăng nhập (`lastLoginAt`)

---

### 2.5 Panels — Quản lý Panel (Admin)

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/admin/panels` | GET | Xem tất cả panel của mọi user |
| `POST /api/admin/panels/create` | POST | Admin tạo panel cho user bất kỳ |
| `PUT /api/admin/panels/:id` | PUT | Sửa panel |
| `POST /api/admin/panels/:id/extend` | POST | Gia hạn panel |
| `DELETE /api/admin/panels/:id` | DELETE | Xóa panel |

---

### 2.6 Providers — Nhà cung cấp SMM

```mermaid
flowchart LR
    Providers["GET /api/admin/providers\nDanh sách provider"] --> AddProvider["POST /api/admin/providers\nThêm provider mới\n{ name, apiUrl, apiKey, markup }"]
    Providers --> PingProvider["POST /api/admin/providers/:id/ping\nKiểm tra kết nối API"]
    Providers --> DeleteProvider["DELETE /api/admin/providers/:id\nXóa provider"]
```

---

### 2.7 Services — Dịch vụ & Giá (Admin)

| Endpoint | Method | Mô tả |
|---|---|---|
| `POST /api/admin/services/bulk-price` | POST | Cập nhật giá hàng loạt theo % markup |

---

### 2.8 Packages — Gói Subscription (Admin)

| Endpoint | Method | Mô tả |
|---|---|---|
| `PUT /api/admin/packages/:id` | PUT | Sửa thông tin gói (giá, tính năng, thời hạn) |

---

### 2.9 Site Config — Cấu hình giao diện

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/admin/site-config` | GET | Lấy cấu hình site |
| `PUT /api/admin/site-config` | PUT | Cập nhật: logo, màu sắc, tên site, SEO, custom CSS |
| `GET /api/public/site-config` | GET | Lấy cấu hình (public, không cần auth) |

---

### 2.10 Announcements — Thông báo hệ thống

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/admin/announcements` | GET | Danh sách thông báo |
| `POST /api/admin/announcements` | POST | Tạo thông báo mới |
| `PUT /api/admin/announcements/:id` | PUT | Sửa thông báo |
| `DELETE /api/admin/announcements/:id` | DELETE | Xóa thông báo |
| `GET /api/public/announcements` | GET | Public endpoint (banner hiển thị cho mọi user) |

---

### 2.11 Coupons — Mã giảm giá

```mermaid
flowchart LR
    Coupons["GET /api/admin/coupons"] --> CreateCoupon["POST /api/admin/coupons\n{ code, discountType, discountValue, maxUses, expiresAt }"]
    Coupons --> UpdateCoupon["PUT /api/admin/coupons/:id"]
    Coupons --> DeleteCoupon["DELETE /api/admin/coupons/:id"]
    ApplyCoupon["POST /api/public/coupons/apply\nUser áp dụng mã"] --> ValidateCoupon["Kiểm tra: còn hạn, còn lượt, chưa dùng"]
```

**Loại giảm giá:** `percent` (%) | `fixed` (số tiền cố định)

---

### 2.12 System Settings — Cài đặt hệ thống

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/admin/system/settings` | GET | Đọc settings |
| `PUT /api/admin/system/settings` | PUT | Cập nhật: SMTP, tỉ giá, cổng thanh toán, default_language, default_currency... |
| `POST /api/admin/system/purge-cache` | POST | Xóa cache hệ thống |
| `POST /api/admin/system/sync-all-providers` | POST | Đồng bộ dịch vụ từ tất cả provider |

**Các cài đặt quan trọng trong `settings` table:**

| Trường | Mô tả |
|---|---|
| `default_language` | Ngôn ngữ mặc định khi đăng ký user mới |
| `default_currency` | Tiền tệ mặc định khi đăng ký user mới |
| `usd_to_vnd_rate` | Tỉ giá USD/VND |
| `min_deposit_usd` | Nạp tối thiểu (USD) |
| `allow_user_registration` | Bật/tắt đăng ký |
| `maintenance_mode` | Bật/tắt bảo trì |
| `vietqr_bank_code` | Mã ngân hàng VietQR |
| `vietqr_account_number` | Số tài khoản |
| `smtp_host/port/username/password` | Cấu hình email |

---

### 2.13 AI Config — Cấu hình Gemini AI

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/admin/ai-config` | GET | Xem cấu hình AI |
| `PUT /api/admin/ai-config` | PUT | Cập nhật: model, system_prompt, temperature, max_daily_tokens |

**Models hỗ trợ:** `gemini-2.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`

---

### 2.14 Audit Logs — Nhật ký hoạt động

| Endpoint | Method | Mô tả |
|---|---|---|
| `GET /api/admin/audit-logs` | GET | Xem log: USER_REGISTER, LOGIN, PANEL_CREATE, BALANCE_ADJUST... |

---

## 🗄️ PHẦN 3 — DATABASE SCHEMA

```mermaid
erDiagram
    users {
        int id PK "AUTO_INCREMENT"
        varchar name
        varchar username UK
        varchar email UK
        varchar phone UK
        varchar password
        enum role "customer|admin|support|super_admin"
        decimal balance
        varchar language "lấy từ settings.default_language"
        varchar currency "lấy từ settings.default_currency"
        varchar api_key UK "64-char hex random"
        tinyint email_verified
        tinyint two_factor_enabled
        enum status "active|banned|suspended"
        timestamp last_login_at
        timestamp created_at
    }

    password_resets {
        int id PK "AUTO_INCREMENT"
        varchar email
        varchar token UK
        timestamp expires_at
        tinyint used
        timestamp created_at
    }

    settings {
        int id PK "AUTO_INCREMENT"
        varchar default_language "en"
        varchar default_currency "USD"
        varchar site_name
        decimal usd_to_vnd_rate
        varchar smtp_host
        varchar vietqr_bank_code
        tinyint maintenance_mode
        tinyint allow_user_registration
    }
```

---

## 🔐 PHẦN 4 — BẢO MẬT

```mermaid
flowchart LR
    Request["HTTP Request"] --> RateLimit["Rate Limiter\nUpstash + In-Memory fallback"]
    RateLimit --> JWT["JWT Middleware\n requireAuth()"]
    JWT --> Route["Route Handler"]
    Route --> Argon2["Argon2id\nhash/verify password"]
    Route --> Prisma["Prisma ORM\nMySQL queries"]

    JWT -->|"Invalid token"| 401["401 Unauthorized"]
    RateLimit -->|"Too many"| 429["429 Too Many Requests"]
```

| Cơ chế | Công nghệ |
|---|---|
| Hash mật khẩu | `@node-rs/argon2` (Argon2id) |
| JWT Token | `jsonwebtoken`, 7 ngày, HttpOnly Cookie |
| Rate Limiting | Upstash Redis + In-Memory fallback |
| API Key | 64-char hex random (không có prefix cố định) |
| Queue dedup | RabbitMQ (fallback: direct execution) |
| DB ORM | Prisma v6.4.1 → MySQL |

---

## 📋 PHẦN 5 — LUỒNG HOÀN CHỈNH KHI ĐĂNG KÝ

```mermaid
flowchart TD
    A["POST /api/auth/register\n{ name, username, email, password, phone, role }"] --> B["validateRegistrationInput()\nkiểm tra format"]
    B -->|"Invalid"| E1["400 Bad Request\n{ success: false, message }"]
    B -->|"Valid"| C["Đọc settings\ndefault_language, default_currency"]
    C --> D1["findFirst({username})\nKiểm tra username"]
    D1 -->|"Trùng"| E2["409 { success: false, message: 'username đã tồn tại' }"]
    D1 -->|"OK"| D2["findFirst({email})\nKiểm tra email"]
    D2 -->|"Trùng"| E3["409 { success: false, message: 'email đã tồn tại' }"]
    D2 -->|"OK"| D3["findFirst({phone})\nKiểm tra phone (nếu có)"]
    D3 -->|"Trùng"| E4["409 { success: false, message: 'phone đã tồn tại' }"]
    D3 -->|"OK"| F["hashPassword (Argon2id)"]
    F --> G["publishRegistrationJob()\n→ RabbitMQ (nếu online)"]
    G --> H["executeUserCreation()\nprisma.user.create()"]
    H --> I["generateToken (JWT 7 ngày)\nSet-Cookie jwt_token (HttpOnly)"]
    I --> J["201 { success: true, data, token, message }"]
```

---

## PHẦN 6 — REST API IMPLEMENTATION CHECKLIST

Backend Express hiện tổ chức theo tài nguyên REST: resource dùng danh từ số nhiều, HTTP method biểu diễn thao tác, route handler xử lý request/response và Prisma là nguồn dữ liệu duy nhất. Không dùng dữ liệu seed/static trong `src/server/db.ts`.

- Auth: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, `POST /api/auth/logout`, `GET /api/auth/me`.
- User, panels, services, billing, support, notifications và admin đều dùng route theo resource.
- Route bảo mật phải gọi `requireAuth`; route admin phải kiểm tra `admin|super_admin`.
- Request body phải validate trước khi gọi Prisma; response thống nhất `{ success, data?, message? }`.
- JWT chỉ lưu trong HttpOnly cookie `jwt_token`; password dùng Argon2id; login/register/reset có rate limit.
- File `panel/postman.txt` chứa mẫu request cho toàn bộ route hiện có, dùng biến `{{baseUrl}}` và cookie đăng nhập.

### Chạy và kiểm tra
```bash
cd panel
npm run lint
npm run dev
```
Sau khi đăng nhập trong Postman, bật cookie jar để các request protected tự gửi `jwt_token`. Thay `:id` bằng ID thực tế trả về từ API trước đó.
