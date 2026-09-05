-- ========================================================
-- NexusSMM SaaS Platform - Clean Database Schema Dump
-- Engine: MySQL 8.0+ / MariaDB 10.4+
-- Charset: utf8mb4 / utf8mb4_unicode_ci
-- ========================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET FOREIGN_KEY_CHECKS = 0;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- 1. Table structure for `currencies`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `currencies`;
CREATE TABLE `currencies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(10) NOT NULL,
  `name` varchar(100) NOT NULL,
  `symbol` varchar(10) NOT NULL,
  `symbol_position` varchar(10) NOT NULL DEFAULT 'left',
  `rate` decimal(18,6) NOT NULL DEFAULT 1.000000,
  `thousand_separator` varchar(5) NOT NULL DEFAULT ',',
  `decimal_separator` varchar(5) NOT NULL DEFAULT '.',
  `decimal_digits` int(11) NOT NULL DEFAULT 2,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `auto_sync` tinyint(1) NOT NULL DEFAULT 1,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `last_sync_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `currencies_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial default currencies
INSERT INTO `currencies` (`id`, `code`, `name`, `symbol`, `symbol_position`, `rate`, `thousand_separator`, `decimal_separator`, `decimal_digits`, `is_default`, `auto_sync`, `active`, `sort_order`, `last_sync_at`, `created_at`, `updated_at`) VALUES
(1, 'USD', 'Đô la Mỹ (USD)', '$', 'left', 1.000000, ',', '.', 2, 1, 0, 1, 0, NULL, NOW(3), NOW(3)),
(2, 'VND', 'Việt Nam Đồng (VND)', '₫', 'right', 25400.000000, ',', '.', 0, 0, 1, 1, 1, NOW(3), NOW(3), NOW(3)),
(3, 'EUR', 'Đồng Euro (EUR)', '€', 'left', 0.920000, ',', '.', 2, 0, 1, 1, 2, NULL, NOW(3), NOW(3)),
(4, 'GBP', 'Bảng Anh (GBP)', '£', 'left', 0.790000, ',', '.', 2, 0, 1, 1, 3, NULL, NOW(3), NOW(3)),
(5, 'JPY', 'Yên Nhật (JPY)', '¥', 'left', 154.500000, ',', '.', 0, 0, 1, 1, 4, NULL, NOW(3), NOW(3)),
(6, 'KRW', 'Won Hàn Quốc (KRW)', '₩', 'left', 1380.000000, ',', '.', 0, 0, 1, 1, 5, NULL, NOW(3), NOW(3)),
(7, 'CNY', 'Nhân Dân Tệ (CNY)', '¥', 'left', 7.250000, ',', '.', 2, 0, 1, 1, 6, NULL, NOW(3), NOW(3)),
(8, 'THB', 'Baht Thái (THB)', '฿', 'left', 36.500000, ',', '.', 2, 0, 1, 1, 7, NULL, NOW(3), NOW(3)),
(9, 'BRL', 'Real Brazil (BRL)', 'R$', 'left', 5.450000, ',', '.', 2, 0, 1, 1, 8, NULL, NOW(3), NOW(3)),
(10, 'INR', 'Rupee Ấn Độ (INR)', '₹', 'left', 83.500000, ',', '.', 2, 0, 1, 1, 9, NULL, NOW(3), NOW(3)),
(11, 'RUB', 'Rúp Nga (RUB)', '₽', 'right', 90.000000, ',', '.', 2, 0, 1, 1, 10, NULL, NOW(3), NOW(3));

-- --------------------------------------------------------
-- 2. Table structure for `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `username` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'customer',
  `balance` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `avatar` varchar(500) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `telegram_contact` varchar(100) DEFAULT NULL,
  `transfer_code` varchar(100) DEFAULT NULL,
  `timezone` varchar(100) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh (GMT+7)',
  `language` varchar(10) NOT NULL DEFAULT 'vi',
  `currency` varchar(10) NOT NULL DEFAULT 'USD',
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_secret` varchar(100) DEFAULT NULL,
  `api_key` varchar(128) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 1,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `last_login_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`),
  UNIQUE KEY `users_email_key` (`email`),
  UNIQUE KEY `users_phone_key` (`phone`),
  UNIQUE KEY `users_api_key_key` (`api_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default Initial Administrator account (password: admin123)
INSERT INTO `users` (`id`, `name`, `username`, `email`, `password`, `role`, `balance`, `avatar`, `phone`, `telegram_contact`, `transfer_code`, `timezone`, `language`, `currency`, `two_factor_enabled`, `two_factor_secret`, `api_key`, `email_verified`, `status`, `last_login_at`, `created_at`, `updated_at`) VALUES
(1, 'Administrator', 'admin', 'admin@nexussmm.io', '$argon2id$v=19$m=19456,t=2,p=1$PfXLvDCPNJ3yIIn9KNRFPg$1rjWxZuSrf7yoVUFs3r0Q8XYcXQSsbFzAxunHSjBdrA', 'admin', 0.0000, NULL, NULL, '@nexussmm_admin', 'ADMIN TRANSFER', 'Asia/Ho_Chi_Minh (GMT+7)', 'vi', 'USD', 0, NULL, 'c101a1c9d2202a4cb82e567662b001f66e9c85f1ee270127b0173c59a4ce34b5', 1, 'active', NOW(3), NOW(3), NOW(3));

-- --------------------------------------------------------
-- 3. Table structure for `login_sessions`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `login_sessions`;
CREATE TABLE `login_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` char(64) NOT NULL,
  `user_agent` varchar(500) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `last_active_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `expires_at` datetime(3) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `revoked_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `login_sessions_token_hash_key` (`token_hash`),
  KEY `login_sessions_user_id_revoked_at_expires_at_idx` (`user_id`,`revoked_at`,`expires_at`),
  CONSTRAINT `login_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 4. Table structure for `packages`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `packages`;
CREATE TABLE `packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `name` varchar(120) NOT NULL,
  `tagline` text DEFAULT NULL,
  `badge` varchar(60) DEFAULT NULL,
  `is_popular` tinyint(1) NOT NULL DEFAULT 0,
  `weekly_price` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `monthly_price` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `yearly_price` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`features`)),
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `packages_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Core package templates
INSERT INTO `packages` (`id`, `code`, `name`, `tagline`, `badge`, `is_popular`, `weekly_price`, `monthly_price`, `yearly_price`, `features`, `active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'pkg-starter', 'Gói Khởi Nghiệp (Starter)', 'Phù hợp người mới bắt đầu làm dịch vụ SMM', 'Tiết Kiệm', 0, 5.0000, 15.0000, 150.0000, '[\"1 SMM Panel Độc Quyền\",\"Kết Nối Tối Đa 5 Nhà Cung Cấp API\",\"Tự Động Đồng Bộ Đơn Hàng\",\"Hỗ Trợ SSL Cloudflare Miễn Phí\",\"Hỗ Trợ Kỹ Thuật 24/7\"]', 1, 1, NOW(3), NOW(3)),
(2, 'pkg-pro', 'Gói Chuyên Nghiệp (Pro)', 'Dành cho nhà phát triển và đại lý trung bình', 'Phổ Biến Nhất', 1, 10.0000, 30.0000, 300.0000, '[\"3 SMM Panels Không Giới Hạn\",\"Kết Nối Không Giới Hạn API Providers\",\"Hệ Thống Phân Phối Đơn Hàng Thông Minh (Smart Dispatch)\",\"Auto Sync & Re-order Tự Động\",\"Tùy Chỉnh Giao Diện & Tên Miền Riêng\",\"Ưu Tiên Xử Lý Vé Hỗ Trợ\"]', 1, 2, NOW(3), NOW(3)),
(3, 'pkg-business', 'Gói Doanh Nghiệp (Enterprise)', 'Hạ tầng mở rộng tốc độ cao cho đại lý lớn', 'Mạnh Mẽ', 0, 20.0000, 60.0000, 600.0000, '[\"10 SMM Panels Riêng Biệt\",\"Xử Lý Hơn 100,000 Đơn/Ngày\",\"Tích Hợp Trợ Lý AI Chăm Sóc Khách Hàng (Gemini 2.5)\",\"Cổng Thanh Toán Tự Động VietQR & Crypto\",\"Dedicated Worker Queue (RabbitMQ)\",\"Hỗ Trợ Kỹ Thuật Riêng 1-1\"]', 1, 3, NOW(3), NOW(3)),
(4, 'pkg-vip', 'Gói Đối Tác VIP (Custom Fleet)', 'Toàn quyền điều khiển hạ tầng và máy chủ độc quyền', 'VIP', 0, 50.0000, 150.0000, 1500.0000, '[\"Không Giới Hạn Số Lượng Panels\",\"Băng Thông & Máy Chủ Riêng Biệt\",\"Đồng Bộ Đa Tiền Tệ Tự Động Toàn Cầu\",\"Tính Năng Cân Bằng Tải Tự Động\",\"Bảo Hiểm SLA Uptime 99.99%\"]', 1, 4, NOW(3), NOW(3));

-- --------------------------------------------------------
-- 5. Table structure for `orders`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `package_id` int(11) DEFAULT NULL,
  `billing_cycle` varchar(20) DEFAULT NULL,
  `total` decimal(15,4) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `expires_at` datetime(3) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `orders_user_id_created_at_idx` (`user_id`,`created_at`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_expires_at_idx` (`expires_at`),
  KEY `orders_package_id_fkey` (`package_id`),
  CONSTRAINT `orders_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 6. Table structure for `panels`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `panels`;
CREATE TABLE `panels` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `package_id` int(11) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `admin_username` varchar(100) DEFAULT NULL,
  `admin_password` varchar(255) DEFAULT NULL,
  `admin_two_factor_secret` varchar(255) DEFAULT NULL,
  `cookie` text DEFAULT NULL,
  `balance` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `currency` varchar(10) NOT NULL DEFAULT 'USD',
  `status` varchar(50) NOT NULL DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `expires_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `panels_user_id_status_idx` (`user_id`,`status`),
  KEY `panels_domain_idx` (`domain`),
  KEY `panels_order_id_idx` (`order_id`),
  KEY `panels_package_id_idx` (`package_id`),
  CONSTRAINT `panels_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `panels_package_id_fkey` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `panels_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 7. Table structure for `panel_dispatch_configs`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `panel_dispatch_configs`;
CREATE TABLE `panel_dispatch_configs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `panel_id` int(11) NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT 1,
  `method` varchar(20) NOT NULL DEFAULT 'ticket',
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `panel_dispatch_configs_panel_id_key` (`panel_id`),
  CONSTRAINT `panel_dispatch_configs_panel_id_fkey` FOREIGN KEY (`panel_id`) REFERENCES `panels` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 8. Table structure for `password_resets`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `password_resets`;
CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime(3) NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `password_resets_token_key` (`token`),
  KEY `idx_password_resets_email` (`email`),
  KEY `idx_password_resets_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 9. Table structure for `payment_gateways`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `payment_gateways`;
CREATE TABLE `payment_gateways` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'vietqr',
  `currency` varchar(10) NOT NULL DEFAULT 'VND',
  `logo_url` varchar(500) DEFAULT NULL,
  `bank_code` varchar(50) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `account_holder` varchar(255) DEFAULT NULL,
  `crypto_type` varchar(50) DEFAULT NULL,
  `crypto_network` varchar(50) DEFAULT NULL,
  `wallet_address` varchar(255) DEFAULT NULL,
  `memo_tag` varchar(100) DEFAULT NULL,
  `api_key` varchar(255) DEFAULT NULL,
  `secret_key` varchar(255) DEFAULT NULL,
  `merchant_id` varchar(100) DEFAULT NULL,
  `qr_code_url` varchar(500) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `exchange_rate_usd_to_vnd` decimal(15,2) NOT NULL DEFAULT 25400.00,
  `bonus_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `webhook_secret` varchar(255) DEFAULT NULL,
  `webhook_url` varchar(500) DEFAULT NULL,
  `instructions` text DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Default payment gateway templates
INSERT INTO `payment_gateways` (`id`, `name`, `type`, `currency`, `logo_url`, `bank_code`, `bank_name`, `account_number`, `account_holder`, `crypto_type`, `crypto_network`, `wallet_address`, `memo_tag`, `api_key`, `secret_key`, `merchant_id`, `qr_code_url`, `notes`, `exchange_rate_usd_to_vnd`, `bonus_percentage`, `webhook_secret`, `webhook_url`, `instructions`, `active`, `sort_order`, `created_at`, `updated_at`) VALUES
(1, 'Chuyển Khoản Ngân Hàng (VietQR 24/7)', 'vietqr', 'VND', NULL, 'MBBANK', 'Ngân Hàng TMCP Quân Đội (MB)', '', '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Hệ thống tự động quét và cộng tiền tức thì.', 25400.00, 0.00, NULL, NULL, 'Vui lòng quét mã QR hoặc chuyển khoản chính xác nội dung hiển thị.', 1, 1, NOW(3), NOW(3)),
(2, 'Binance Pay / Crypto USD', 'crypto', 'USD', NULL, NULL, NULL, NULL, NULL, 'BINANCE_PAY', 'BSC', '', NULL, NULL, NULL, NULL, NULL, 'Thanh toán trực tiếp qua Binance Pay hoặc Web3 Wallet.', 25400.00, 5.00, NULL, NULL, 'Chuyển đúng mạng lưới USDT (BEP20 / TRC20).', 1, 2, NOW(3), NOW(3)),
(3, 'USDT TRC20 / ERC20 Tự Động', 'crypto', 'USD', NULL, NULL, NULL, NULL, NULL, 'USDT_TRC20', 'TRON', '', NULL, NULL, NULL, NULL, NULL, 'Tự động kiểm tra sau 3 confirmations trên Blockchain.', 25400.00, 0.00, NULL, NULL, 'Gửi USDT vào đúng địa chỉ ví TRC20.', 1, 3, NOW(3), NOW(3));

-- --------------------------------------------------------
-- 10. Table structure for `settings`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `settings`;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `default_language` varchar(10) NOT NULL DEFAULT 'vi',
  `default_currency` varchar(10) NOT NULL DEFAULT 'USD',
  `site_name` varchar(255) NOT NULL DEFAULT 'NexusSMM SaaS Platform',
  `site_tagline` text DEFAULT 'Nền tảng Quản lý & Tự Động Hóa Dịch Vụ SMM Chuyên Nghiệp',
  `site_logo_url` varchar(500) DEFAULT NULL,
  `favicon_url` varchar(500) DEFAULT NULL,
  `primary_brand_color` varchar(50) NOT NULL DEFAULT '#2563eb',
  `support_email` varchar(255) DEFAULT 'support@nexussmm.io',
  `support_telegram` varchar(255) DEFAULT '@nexussmm_support',
  `support_hotline` varchar(100) DEFAULT NULL,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` int(11) NOT NULL DEFAULT 587,
  `smtp_username` varchar(255) DEFAULT NULL,
  `smtp_password` varchar(255) DEFAULT NULL,
  `smtp_encryption` varchar(50) NOT NULL DEFAULT 'tls',
  `smtp_from_email` varchar(255) DEFAULT NULL,
  `smtp_from_name` varchar(255) DEFAULT 'NexusSMM Support',
  `allow_user_registration` tinyint(1) NOT NULL DEFAULT 1,
  `allow_free_trial_panel` tinyint(1) NOT NULL DEFAULT 1,
  `free_trial_duration_days` int(11) NOT NULL DEFAULT 7,
  `free_trial_max_per_user` int(11) NOT NULL DEFAULT 1,
  `free_trial_start_date` datetime(3) DEFAULT NULL,
  `free_trial_end_date` datetime(3) DEFAULT NULL,
  `free_trial_package_id` int(11) DEFAULT NULL,
  `free_trial_require_verification` tinyint(1) NOT NULL DEFAULT 0,
  `allow_guest_service_viewing` tinyint(1) NOT NULL DEFAULT 1,
  `enable_live_chat_widget` tinyint(1) NOT NULL DEFAULT 1,
  `header_announcement_bar` text DEFAULT NULL,
  `header_announcement_active` tinyint(1) NOT NULL DEFAULT 0,
  `footer_copyright` text DEFAULT '© 2026 NexusSMM Platform. All Rights Reserved.',
  `seo_meta_title` varchar(255) DEFAULT 'NexusSMM - Thuê Panel & Tự Động Hóa Dịch Vụ Mạng Xã Hội',
  `seo_meta_keywords` text DEFAULT 'smm panel, thue smm panel, dich vu mang xa hoi, auto dispatch',
  `seo_meta_description` text DEFAULT 'Nền tảng cung cấp hạ tầng SMM Panel tốc độ cao, kết nối API nhà cung cấp tự động.',
  `seo_canonical_url` varchar(500) DEFAULT NULL,
  `seo_og_title` varchar(255) DEFAULT 'NexusSMM - Giải Pháp SMM Toàn Diện',
  `seo_og_description` text DEFAULT 'Khởi tạo SMM Panel của riêng bạn chỉ trong vài phút.',
  `seo_og_image_url` varchar(500) DEFAULT NULL,
  `seo_og_type` varchar(100) DEFAULT 'website',
  `seo_twitter_card` varchar(100) DEFAULT 'summary_large_image',
  `seo_twitter_site` varchar(100) DEFAULT NULL,
  `seo_twitter_creator` varchar(100) DEFAULT NULL,
  `seo_robots_indexing` varchar(255) DEFAULT 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
  `seo_sitemap_url` varchar(500) DEFAULT NULL,
  `seo_structured_data_json` longtext DEFAULT NULL,
  `seo_google_site_verification` varchar(255) DEFAULT NULL,
  `seo_bing_site_verification` varchar(255) DEFAULT NULL,
  `seo_google_analytics_id` varchar(100) DEFAULT NULL,
  `custom_css` text DEFAULT NULL,
  `custom_header_scripts` text DEFAULT NULL,
  `custom_body_scripts` text DEFAULT NULL,
  `maintenance_mode` tinyint(1) NOT NULL DEFAULT 0,
  `auto_dispatch_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `auto_provisioning_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `auto_banking_sync` tinyint(1) NOT NULL DEFAULT 1,
  `usd_to_vnd_rate` decimal(12,2) NOT NULL DEFAULT 25400.00,
  `min_deposit_usd` decimal(10,2) NOT NULL DEFAULT 5.00,
  `vietqr_bank_code` varchar(100) DEFAULT NULL,
  `vietqr_account_number` varchar(100) DEFAULT NULL,
  `vietqr_account_holder` varchar(255) DEFAULT NULL,
  `vietqr_auto_verify` tinyint(1) NOT NULL DEFAULT 1,
  `usdt_trc20_address` varchar(255) DEFAULT NULL,
  `usdt_erc20_address` varchar(255) DEFAULT NULL,
  `crypto_auto_confirm_blocks` int(11) NOT NULL DEFAULT 3,
  `sync_interval` int(11) NOT NULL DEFAULT 3,
  `auto_refund_on_error` tinyint(1) NOT NULL DEFAULT 1,
  `low_balance_alert_threshold` decimal(10,2) NOT NULL DEFAULT 50.00,
  `default_profit_margin` decimal(5,2) NOT NULL DEFAULT 25.00,
  `auto_retry_stalled_orders` tinyint(1) NOT NULL DEFAULT 1,
  `filter_sensitive_keywords` tinyint(1) NOT NULL DEFAULT 1,
  `webhook_url` varchar(500) DEFAULT NULL,
  `webhook_secret` varchar(255) DEFAULT NULL,
  `gemini_model` varchar(100) NOT NULL DEFAULT 'gemini-2.5-flash',
  `system_prompt` text DEFAULT NULL,
  `auto_ticket_reply_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `auto_dns_diagnostic` tinyint(1) NOT NULL DEFAULT 1,
  `auto_margin_optimizer` tinyint(1) NOT NULL DEFAULT 1,
  `max_daily_ai_tokens` int(11) NOT NULL DEFAULT 500000,
  `temperature` decimal(3,2) NOT NULL DEFAULT 0.70,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Initial Settings Row
INSERT INTO `settings` (`id`, `default_language`, `default_currency`, `site_name`, `site_tagline`, `primary_brand_color`, `allow_user_registration`, `allow_free_trial_panel`, `free_trial_duration_days`, `free_trial_max_per_user`, `allow_guest_service_viewing`, `enable_live_chat_widget`, `maintenance_mode`, `auto_dispatch_enabled`, `auto_provisioning_enabled`, `auto_banking_sync`, `usd_to_vnd_rate`, `min_deposit_usd`, `vietqr_auto_verify`, `crypto_auto_confirm_blocks`, `sync_interval`, `auto_refund_on_error`, `low_balance_alert_threshold`, `default_profit_margin`, `auto_retry_stalled_orders`, `filter_sensitive_keywords`, `gemini_model`, `auto_ticket_reply_enabled`, `auto_dns_diagnostic`, `auto_margin_optimizer`, `max_daily_ai_tokens`, `temperature`, `created_at`, `updated_at`) VALUES
(1, 'vi', 'USD', 'NexusSMM Enterprise', 'Nền tảng Tự Động Hóa & Quản Trị Panel SMM 24/7', '#2563eb', 1, 1, 7, 1, 1, 1, 0, 1, 1, 1, 25400.00, 5.00, 1, 3, 3, 1, 50.00, 25.00, 1, 1, 'gemini-2.5-flash', 1, 1, 1, 500000, 0.70, NOW(3), NOW(3));

-- --------------------------------------------------------
-- 11. Table structure for `support_tickets`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `support_tickets`;
CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `category` varchar(100) NOT NULL DEFAULT 'general',
  `priority` varchar(50) NOT NULL DEFAULT 'normal',
  `status` varchar(50) NOT NULL DEFAULT 'open',
  `related_panel_id` int(11) DEFAULT NULL,
  `ai_summary` text DEFAULT NULL,
  `last_replied_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `support_tickets_code_key` (`code`),
  KEY `support_tickets_user_id_status_idx` (`user_id`,`status`),
  KEY `support_tickets_status_idx` (`status`),
  KEY `support_tickets_created_at_idx` (`created_at`),
  CONSTRAINT `support_tickets_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 12. Table structure for `support_ticket_messages`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `support_ticket_messages`;
CREATE TABLE `support_ticket_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `sender_id` int(11) DEFAULT NULL,
  `sender_name` varchar(255) NOT NULL,
  `sender_role` varchar(50) NOT NULL DEFAULT 'customer',
  `content` text NOT NULL,
  `is_ai_generated` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `support_ticket_messages_ticket_id_created_at_idx` (`ticket_id`,`created_at`),
  KEY `support_ticket_messages_sender_id_fkey` (`sender_id`),
  CONSTRAINT `support_ticket_messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `support_ticket_messages_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 13. Table structure for `transactions`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `transactions`;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `code` varchar(64) NOT NULL,
  `user_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `amount` decimal(15,4) NOT NULL,
  `balance_before` decimal(15,4) NOT NULL,
  `balance_after` decimal(15,4) NOT NULL,
  `description` text NOT NULL,
  `payment_method` varchar(100) DEFAULT NULL,
  `reference_code` varchar(100) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'completed',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `transactions_code_key` (`code`),
  KEY `transactions_user_id_created_at_idx` (`user_id`,`created_at`),
  KEY `transactions_type_idx` (`type`),
  KEY `transactions_status_idx` (`status`),
  CONSTRAINT `transactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;