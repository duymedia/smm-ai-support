CREATE DATABASE IF NOT EXISTS `rent_ai_suport` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `rent_ai_suport`;

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) DEFAULT NULL,
  `role` ENUM('customer', 'admin', 'support', 'super_admin') NOT NULL DEFAULT 'customer',
  `balance` DECIMAL(15, 4) NOT NULL DEFAULT 0.0000,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `phone` VARCHAR(50) DEFAULT NULL,
  `telegram_contact` VARCHAR(100) DEFAULT NULL,
  `timezone` VARCHAR(100) DEFAULT 'Asia/Ho_Chi_Minh (GMT+7)',
  `language` VARCHAR(10) NOT NULL DEFAULT 'en',
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `two_factor_enabled` TINYINT(1) NOT NULL DEFAULT 0,
  `two_factor_secret` VARCHAR(100) DEFAULT NULL,
  `api_key` VARCHAR(128) DEFAULT NULL,
  `email_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('active', 'banned', 'suspended') NOT NULL DEFAULT 'active',
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_users_username` (`username`),
  UNIQUE KEY `uk_users_email` (`email`),
  UNIQUE KEY `uk_users_phone` (`phone`),
  UNIQUE KEY `uk_users_api_key` (`api_key`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_status` (`status`),
  KEY `idx_users_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `packages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `tagline` TEXT DEFAULT NULL,
  `badge` VARCHAR(60) DEFAULT NULL,
  `is_popular` TINYINT(1) NOT NULL DEFAULT 0,
  `weekly_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
  `monthly_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
  `yearly_price` DECIMAL(15,4) NOT NULL DEFAULT 0.0000,
  `features` JSON NOT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_packages_code` (`code`),
  KEY `idx_packages_catalogue` (`active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- Một user có thể có nhiều lịch sử thuê gói; mỗi bản ghi lưu snapshot giá đã thu,
-- không bị thay đổi khi admin sửa giá catalogue.
-- Mỗi lần user mua/gia hạn gói là một order bất biến để đối soát thanh toán.
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `package_id` INT DEFAULT NULL,
  `billing_cycle` VARCHAR(20) DEFAULT NULL,
  `total` DECIMAL(15,4) NOT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `metadata` JSON DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_orders_user_created` (`user_id`, `created_at`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_expires_at` (`expires_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Catalogue gói dịch vụ catalogue mặc định (chỉ chèn nếu chưa tồn tại code).
INSERT IGNORE INTO `packages` (`code`,`name`,`tagline`,`badge`,`is_popular`,`weekly_price`,`monthly_price`,`yearly_price`,`features`,`sort_order`) VALUES
('starter','Starter','Perfect for freelancers and beginners getting started with SMM services',NULL,0,9.9900,29.9900,239.9900,'{"panelsCount":1,"maxOrdersPerMonth":1000,"servicesLimit":50,"uptimeSla":"99.5%","supportLevel":"Standard","apiAccess":true}',1),
('professional','Professional','Ideal for growing agencies managing multiple clients and providers','Most Popular',1,19.9900,59.9900,479.9900,'{"panelsCount":3,"maxOrdersPerMonth":10000,"servicesLimit":200,"uptimeSla":"99.9%","supportLevel":"Priority 24/7","apiAccess":true}',2),
('agency','Agency','Built for scaling agencies with high-volume orders and custom branding',NULL,0,39.9900,119.9900,959.9900,'{"panelsCount":10,"maxOrdersPerMonth":50000,"servicesLimit":500,"uptimeSla":"99.95%","supportLevel":"Priority 24/7","apiAccess":true}',3),
('enterprise','Enterprise','Unlimited power for enterprises requiring dedicated infrastructure and VIP support','Best Value',0,99.9900,299.9900,2399.9900,'{"panelsCount":"Unlimited","maxOrdersPerMonth":"Unlimited","servicesLimit":"Unlimited","uptimeSla":"99.99%","supportLevel":"Dedicated VIP","apiAccess":true}',4);

CREATE TABLE IF NOT EXISTS `password_resets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  `used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_password_resets_token` (`token`),
  KEY `idx_password_resets_email` (`email`),
  KEY `idx_password_resets_expires` (`expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `login_sessions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `token_hash` CHAR(64) NOT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `ip_address` VARCHAR(100) DEFAULT NULL,
  `location` VARCHAR(255) DEFAULT NULL,
  `last_active_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_login_sessions_token_hash` (`token_hash`),
  KEY `idx_login_sessions_user` (`user_id`, `revoked_at`, `expires_at`),
  CONSTRAINT `fk_login_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `settings` (
  `id` INT NOT NULL AUTO_INCREMENT,

  -- 1. THƯƠNG HIỆU & THÔNG TIN LIÊN HỆ (BRANDING & CONTACT)
  `site_name` VARCHAR(255) NOT NULL DEFAULT 'NexusSMM Enterprise',
  `site_tagline` VARCHAR(255) DEFAULT NULL,
  `site_logo_url` VARCHAR(500) DEFAULT '/logo.svg',
  `favicon_url` VARCHAR(500) DEFAULT '/favicon.ico',
  `primary_brand_color` VARCHAR(50) DEFAULT '#2563eb',
  `support_email` VARCHAR(255) DEFAULT 'support@nexussmm.io',
  `support_telegram` VARCHAR(100) DEFAULT NULL,
  `support_hotline` VARCHAR(50) DEFAULT NULL,
  `footer_copyright` VARCHAR(500) DEFAULT '© 2026 NexusSMM Enterprise Inc. All rights reserved.',

  -- 2. ĐỊA PHƯƠNG HÓA & TIỀN TỆ (LOCALIZATION & CURRENCY)
  `default_language` VARCHAR(10) NOT NULL DEFAULT 'vi',
  `default_currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `usd_to_vnd_rate` DECIMAL(12, 2) NOT NULL DEFAULT 25400.00,

  -- 3. QUYỀN TRUY CẬP & TÍNH NĂNG NỀN TẢNG (ACCESS & FEATURE FLAGS)
  `allow_user_registration` TINYINT(1) NOT NULL DEFAULT 1,
  `allow_free_trial_panel` TINYINT(1) NOT NULL DEFAULT 1,
  `free_trial_duration_days` INT NOT NULL DEFAULT 7,
  `free_trial_max_per_user` INT NOT NULL DEFAULT 1,
  `free_trial_start_date` TIMESTAMP NULL DEFAULT NULL,
  `free_trial_end_date` TIMESTAMP NULL DEFAULT NULL,
  `free_trial_package_id` INT DEFAULT NULL,
  `free_trial_require_verification` TINYINT(1) NOT NULL DEFAULT 0,
  `allow_guest_service_viewing` TINYINT(1) NOT NULL DEFAULT 1,
  `enable_live_chat_widget` TINYINT(1) NOT NULL DEFAULT 1,
  `maintenance_mode` TINYINT(1) NOT NULL DEFAULT 0,

  -- 4. THÔNG BÁO ĐẦU TRANG (ANNOUNCEMENT BAR)
  `header_announcement_bar` TEXT DEFAULT NULL,
  `header_announcement_active` TINYINT(1) NOT NULL DEFAULT 1,

  -- 5. CẤU HÌNH CHUẨN SEO TOÀN DIỆN (TECHNICAL & SOCIAL META SEO)
  `seo_meta_title` VARCHAR(255) DEFAULT NULL,
  `seo_meta_keywords` TEXT DEFAULT NULL,
  `seo_meta_description` TEXT DEFAULT NULL,
  `seo_canonical_url` VARCHAR(500) DEFAULT NULL,
  `seo_og_title` VARCHAR(255) DEFAULT NULL,
  `seo_og_description` TEXT DEFAULT NULL,
  `seo_og_image_url` VARCHAR(500) DEFAULT NULL,
  `seo_og_type` VARCHAR(50) DEFAULT 'website',
  `seo_twitter_card` VARCHAR(50) DEFAULT 'summary_large_image',
  `seo_twitter_site` VARCHAR(100) DEFAULT NULL,
  `seo_twitter_creator` VARCHAR(100) DEFAULT NULL,
  `seo_robots_indexing` VARCHAR(100) DEFAULT 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  `seo_sitemap_url` VARCHAR(500) DEFAULT NULL,
  `seo_structured_data_json` LONGTEXT DEFAULT NULL,
  `seo_google_site_verification` VARCHAR(255) DEFAULT NULL,
  `seo_bing_site_verification` VARCHAR(255) DEFAULT NULL,
  `seo_google_analytics_id` VARCHAR(100) DEFAULT NULL,

  -- 6. MÃ NHÚNG TÙY CHỈNH & GIAO DIỆN (CUSTOM SCRIPTS & CSS)
  `custom_css` TEXT DEFAULT NULL,
  `custom_header_scripts` TEXT DEFAULT NULL,
  `custom_body_scripts` TEXT DEFAULT NULL,

  -- 7. CẤU HÌNH GỬI EMAIL TỰ ĐỘNG (TRANSACTIONAL SMTP)
  `smtp_host` VARCHAR(255) DEFAULT NULL,
  `smtp_port` INT DEFAULT 587,
  `smtp_username` VARCHAR(255) DEFAULT NULL,
  `smtp_password` VARCHAR(255) DEFAULT NULL,
  `smtp_encryption` ENUM('tls', 'ssl', 'none') DEFAULT 'tls',
  `smtp_from_email` VARCHAR(255) DEFAULT 'noreply@nexussmm.io',
  `smtp_from_name` VARCHAR(255) DEFAULT 'NexusSMM Enterprise',

  -- 8. CỔNG THANH TOÁN, VIETQR & TIỀN ĐIỆN TỬ (PAYMENTS & BANKING)
  `min_deposit_usd` DECIMAL(10, 2) NOT NULL DEFAULT 5.00,
  `auto_banking_sync` TINYINT(1) NOT NULL DEFAULT 1,
  `vietqr_bank_code` VARCHAR(50) DEFAULT NULL,
  `vietqr_account_number` VARCHAR(50) DEFAULT NULL,
  `vietqr_account_holder` VARCHAR(255) DEFAULT NULL,
  `vietqr_auto_verify` TINYINT(1) NOT NULL DEFAULT 1,
  `usdt_trc20_address` VARCHAR(100) DEFAULT NULL,
  `usdt_erc20_address` VARCHAR(100) DEFAULT NULL,
  `crypto_auto_confirm_blocks` INT NOT NULL DEFAULT 3,

  -- 9. ĐIỀU PHỐI ĐƠN HÀNG SMM & BẢO VỆ HỆ THỐNG (DISPATCH & ENGINE)
  `auto_dispatch_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `auto_provisioning_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `sync_interval` INT NOT NULL DEFAULT 3,
  `auto_refund_on_error` TINYINT(1) NOT NULL DEFAULT 1,
  `low_balance_alert_threshold` DECIMAL(10, 2) NOT NULL DEFAULT 50.00,
  `default_profit_margin` DECIMAL(5, 2) NOT NULL DEFAULT 25.00,
  `auto_retry_stalled_orders` TINYINT(1) NOT NULL DEFAULT 1,
  `filter_sensitive_keywords` TINYINT(1) NOT NULL DEFAULT 1,
  `webhook_url` VARCHAR(500) DEFAULT NULL,
  `webhook_secret` VARCHAR(255) DEFAULT NULL,

  -- 10. TRỢ LÝ AI & VẬN HÀNH TỰ ĐỘNG (AI COPILOT & AUTOMATION)
  `gemini_model` VARCHAR(100) DEFAULT 'gemini-2.5-flash',
  `system_prompt` TEXT DEFAULT NULL,
  `auto_ticket_reply_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `auto_dns_diagnostic` TINYINT(1) NOT NULL DEFAULT 1,
  `auto_margin_optimizer` TINYINT(1) NOT NULL DEFAULT 1,
  `max_daily_ai_tokens` INT NOT NULL DEFAULT 500000,
  `temperature` DECIMAL(3, 2) NOT NULL DEFAULT 0.70,

  -- 11. THỜI GIAN KHỞI TẠO & CẬP NHẬT (TIMESTAMPS)
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- BẢNG QUẢN LÝ CỔNG THANH TOÁN (PAYMENT GATEWAYS & BANKING / CRYPTO)
-- =========================================================================
CREATE TABLE IF NOT EXISTS `payment_gateways` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'vietqr', -- 'vietqr' | 'crypto'
  `bank_code` VARCHAR(50) DEFAULT NULL,
  `bank_name` VARCHAR(255) DEFAULT NULL,
  `account_number` VARCHAR(100) DEFAULT NULL,
  `account_holder` VARCHAR(255) DEFAULT NULL,
  `crypto_type` VARCHAR(50) DEFAULT NULL,
  `crypto_network` VARCHAR(50) DEFAULT NULL,
  `wallet_address` VARCHAR(255) DEFAULT NULL,
  `memo_tag` VARCHAR(100) DEFAULT NULL,
  `exchange_rate_usd_to_vnd` DECIMAL(15, 2) NOT NULL DEFAULT 25400.00,
  `bonus_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 0.00,
  `webhook_secret` VARCHAR(255) DEFAULT NULL, 
  `webhook_url` VARCHAR(500) DEFAULT NULL,
  `instructions` TEXT DEFAULT NULL,
  `active` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_gateways_type_active` (`type`, `active`),
  KEY `idx_gateways_sort` (`sort_order`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- BẢNG QUẢN LÝ SMM PANELS (SMM PANELS TABLE)
-- =========================================================================
CREATE TABLE IF NOT EXISTS `panels` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `order_id` INT DEFAULT NULL,
  `package_id` INT DEFAULT NULL,
  `name` VARCHAR(255) NOT NULL,
  `domain` VARCHAR(255) NOT NULL,
  `api_key` VARCHAR(255) DEFAULT NULL,
  `balance` DECIMAL(15, 4) NOT NULL DEFAULT 0.0000,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `notes` TEXT DEFAULT NULL,
  `expires_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_panels_user_status` (`user_id`, `status`),
  KEY `idx_panels_order_id` (`order_id`),
  KEY `idx_panels_package_id` (`package_id`),
  KEY `idx_panels_domain` (`domain`),
  CONSTRAINT `fk_panels_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_panels_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_panels_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- BẢNG QUẢN LÝ LỊCH SỬ GIAO DỊCH & BIẾN ĐỘNG SỐ DƯ VÍ (TRANSACTIONS TABLE)
-- =========================================================================
CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `user_id` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `amount` DECIMAL(15, 4) NOT NULL,
  `balance_before` DECIMAL(15, 4) NOT NULL,
  `balance_after` DECIMAL(15, 4) NOT NULL,
  `description` TEXT NOT NULL,
  `payment_method` VARCHAR(100) DEFAULT NULL,
  `reference_code` VARCHAR(100) DEFAULT NULL,
  `status` VARCHAR(30) NOT NULL DEFAULT 'completed',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_transactions_code` (`code`),
  KEY `idx_transactions_user_created` (`user_id`, `created_at`),
  KEY `idx_transactions_type` (`type`),
  KEY `idx_transactions_status` (`status`),
  CONSTRAINT `fk_transactions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- BẢNG QUẢN LÝ YÊU CẦU HỖ TRỢ & TICKETS (SUPPORT TICKETS TABLE)
-- =========================================================================
CREATE TABLE IF NOT EXISTS `support_tickets` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(64) NOT NULL,
  `user_id` INT NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL DEFAULT 'general',
  `priority` VARCHAR(50) NOT NULL DEFAULT 'normal',
  `status` VARCHAR(50) NOT NULL DEFAULT 'open',
  `related_panel_id` INT DEFAULT NULL,
  `ai_summary` TEXT DEFAULT NULL,
  `last_replied_at` TIMESTAMP NULL DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_support_tickets_code` (`code`),
  KEY `idx_support_tickets_user_status` (`user_id`, `status`),
  KEY `idx_support_tickets_status` (`status`),
  KEY `idx_support_tickets_created` (`created_at`),
  CONSTRAINT `fk_support_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- BẢNG QUẢN LÝ TIN NHẮN TRONG TICKET (SUPPORT TICKET MESSAGES TABLE)
-- =========================================================================
CREATE TABLE IF NOT EXISTS `support_ticket_messages` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `ticket_id` INT NOT NULL,
  `sender_id` INT DEFAULT NULL,
  `sender_name` VARCHAR(255) NOT NULL,
  `sender_role` VARCHAR(50) NOT NULL DEFAULT 'customer',
  `content` TEXT NOT NULL,
  `is_ai_generated` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_messages_ticket_created` (`ticket_id`, `created_at`),
  CONSTRAINT `fk_ticket_messages_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ticket_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


