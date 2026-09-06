import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Zap,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  Link2,
  Copy,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Info,
  DollarSign,
  Layers,
  Send,
  ExternalLink,
} from 'lucide-react';

interface SmmServiceItem {
  id: string | number;
  name: string;
  category: string;
  platform: 'facebook' | 'tiktok' | 'instagram' | 'youtube' | 'telegram' | 'twitter' | 'other';
  rate: number; // Price per 1,000 in currency
  min: number;
  max: number;
  speed: string;
  refill: string;
  description: string;
  badge?: string;
  status: 'active' | 'updating' | 'slow';
}

const DEFAULT_SERVICES: SmmServiceItem[] = [
  // FACEBOOK
  {
    id: 101,
    name: 'Facebook Like Bài Viết - Người dùng thật VN - Lên ngay sau 1-5p',
    category: 'Facebook Like Bài Viết',
    platform: 'facebook',
    rate: 22,
    min: 50,
    max: 100000,
    speed: '10,000 - 30,000 / ngày',
    refill: 'Bảo hành 30 ngày',
    description: 'Like từ tài khoản người dùng thật tại Việt Nam. Không tụt, phù hợp tăng tương tác bài bán hàng, profile cá nhân, fanpage.',
    badge: 'TỐC ĐỘ CAO',
    status: 'active',
  },
  {
    id: 102,
    name: 'Facebook Follow Trang Cá Nhân / Fanpage - Nick Thật Cổ - Siêu Bền',
    category: 'Facebook Follow',
    platform: 'facebook',
    rate: 45,
    min: 100,
    max: 500000,
    speed: '5,000 - 20,000 / ngày',
    refill: 'Bảo hành 60 ngày',
    description: 'Tăng lượt theo dõi cho profile cá nhân hoặc Fanpage. Nick có avatar, bài đăng hoạt động.',
    badge: 'BẢO HÀNH DÀI',
    status: 'active',
  },
  {
    id: 103,
    name: 'Facebook Cảm Xúc Bài Viết (Love, Haha, Wow, Care) - Tùy Chọn',
    category: 'Facebook Cảm Xúc',
    platform: 'facebook',
    rate: 28,
    min: 50,
    max: 50000,
    speed: '5,000 / giờ',
    refill: 'Bảo hành 30 ngày',
    description: 'Thả cảm xúc Love, Haha, Wow, Care tự nhiên theo yêu cầu.',
    status: 'active',
  },
  {
    id: 104,
    name: 'Facebook Mắt Xem Livestream - 30 Phút - Duy trì ổn định',
    category: 'Facebook Livestream',
    platform: 'facebook',
    rate: 15,
    min: 20,
    max: 5000,
    speed: 'Bắt đầu sau 30s',
    refill: 'Không tụt trong 30p',
    description: 'Tăng mắt xem trực tiếp livestream Facebook, giữ mắt đều đặn trong suốt thời gian live.',
    badge: 'CỰC NHANH',
    status: 'active',
  },

  // TIKTOK
  {
    id: 201,
    name: 'TikTok Tim / Like Video - User Thật VN - Đẩy Xu Hướng Cực Tốt',
    category: 'TikTok Like Video',
    platform: 'tiktok',
    rate: 32,
    min: 100,
    max: 500000,
    speed: '20,000 - 50,000 / ngày',
    refill: 'Bảo hành 30 ngày',
    description: 'Tim thật từ tài khoản TikTok Việt Nam, kích thích thuật toán đẩy video lên For You Page (Xu hướng).',
    badge: 'HOT TREND',
    status: 'active',
  },
  {
    id: 202,
    name: 'TikTok Follower Kênh - Nick Việt Có Tương Tác - Bật Live / Kiếm Tiền',
    category: 'TikTok Follow',
    platform: 'tiktok',
    rate: 58,
    min: 100,
    max: 200000,
    speed: '3,000 - 10,000 / ngày',
    refill: 'Bảo hành 30 ngày',
    description: 'Tăng Follower đạt mốc 1.000 follow mở live, mở TikTok Shop hoặc kiếm tiền Creator Rewards.',
    badge: 'CHUẨN SHOP',
    status: 'active',
  },
  {
    id: 203,
    name: 'TikTok View Video - Tốc Độ Ánh Sáng - Không Tụt',
    category: 'TikTok View',
    platform: 'tiktok',
    rate: 0.8,
    min: 1000,
    max: 10000000,
    speed: '1,000,000 / ngày',
    refill: 'Không tụt',
    description: 'Lượt xem video TikTok siêu tốc độ, giá cực rẻ, bắt đầu sau 10 giây.',
    badge: 'SIÊU RẺ',
    status: 'active',
  },
  {
    id: 204,
    name: 'TikTok Lưu / Favorite & Share Video - Tăng Đề Xuất',
    category: 'TikTok Save & Share',
    platform: 'tiktok',
    rate: 18,
    min: 50,
    max: 50000,
    speed: '10,000 / ngày',
    refill: 'Bảo hành 30 ngày',
    description: 'Tăng số lượt lưu yêu thích và chia sẻ video, tối ưu chỉ số SEO TikTok.',
    status: 'active',
  },

  // INSTAGRAM
  {
    id: 301,
    name: 'Instagram Like Bài Viết / Reels - Quốc Tế + Việt Nam Hỗn Hợp',
    category: 'Instagram Like',
    platform: 'instagram',
    rate: 12,
    min: 50,
    max: 1000000,
    speed: '50,000 / ngày',
    refill: 'Bảo hành 30 ngày',
    description: 'Like chất lượng cao cho ảnh, video hoặc Reels Instagram. Không yêu cầu mật khẩu.',
    status: 'active',
  },
  {
    id: 302,
    name: 'Instagram Follower - Người Dùng Thật HQ - Ổn Định Cao',
    category: 'Instagram Follow',
    platform: 'instagram',
    rate: 38,
    min: 100,
    max: 500000,
    speed: '5,000 - 15,000 / ngày',
    refill: 'Bảo hành 60 ngày',
    description: 'Tăng lượt theo dõi tài khoản Instagram chuyên nghiệp cho Influencer, Brand, KOL.',
    badge: 'HQ',
    status: 'active',
  },
  {
    id: 303,
    name: 'Instagram View Reels & Video - Khởi Động Tức Thì',
    category: 'Instagram View',
    platform: 'instagram',
    rate: 1.2,
    min: 500,
    max: 5000000,
    speed: '500,000 / ngày',
    refill: 'Không tụt',
    description: 'Tăng lượt xem video Instagram Reels, bắt đầu chạy ngay sau khi đặt đơn.',
    status: 'active',
  },

  // YOUTUBE
  {
    id: 401,
    name: 'YouTube View Video - Giữ Chân Cao (High Retention) - Đề Xuất',
    category: 'YouTube View',
    platform: 'youtube',
    rate: 48,
    min: 500,
    max: 1000000,
    speed: '5,000 - 20,000 / ngày',
    refill: 'Bảo hành 90 ngày',
    description: 'Lượt xem từ nguồn Đề xuất & Tìm kiếm tự nhiên, thời gian xem trung bình 3-7 phút, an toàn cho kênh bật kiếm tiền.',
    badge: 'AN TOÀN BKT',
    status: 'active',
  },
  {
    id: 402,
    name: 'YouTube Subscribe Kênh - Người Dùng Thật - Bật Kiếm Tiền',
    category: 'YouTube Subscribe',
    platform: 'youtube',
    rate: 320,
    min: 50,
    max: 50000,
    speed: '200 - 500 / ngày',
    refill: 'Bảo hành trọn đời',
    description: 'Tăng người đăng ký kênh YouTube thật, tốc độ tự nhiên tránh thuật toán quét hủy đăng ký.',
    badge: 'BẢO HÀNH TRỌN ĐỜI',
    status: 'active',
  },
  {
    id: 403,
    name: 'YouTube Like Video - Tốc Độ Cao - An Toàn 100%',
    category: 'YouTube Like',
    platform: 'youtube',
    rate: 35,
    min: 50,
    max: 100000,
    speed: '10,000 / ngày',
    refill: 'Bảo hành 30 ngày',
    description: 'Tăng lượt thích cho video YouTube, đẩy mạnh uy tín và tỷ lệ tương tác.',
    status: 'active',
  },
];

const PLATFORMS = [
  { id: 'all', label: 'Tất cả nền tảng', icon: '🌐' },
  { id: 'facebook', label: 'Facebook', icon: '📘', color: 'text-blue-600 border-blue-200 bg-blue-50/50' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'text-slate-900 border-slate-300 bg-slate-100/60' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: 'text-pink-600 border-pink-200 bg-pink-50/50' },
  { id: 'youtube', label: 'YouTube', icon: '▶️', color: 'text-red-600 border-red-200 bg-red-50/50' },
];

export const NewOrderPage: React.FC = () => {
  const { user, formatMoney, addToast, setCurrentRoute, language, currency } = useApp();

  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedServiceId, setSelectedServiceId] = useState<number>(101);
  const [serviceSearch, setServiceSearch] = useState<string>('');

  const [targetLink, setTargetLink] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1000);
  const [comments, setComments] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Lọc danh sách dịch vụ theo nền tảng
  const platformServices = useMemo(() => {
    return DEFAULT_SERVICES.filter(
      (s) => selectedPlatform === 'all' || s.platform === selectedPlatform
    );
  }, [selectedPlatform]);

  // Danh mục duy nhất của nền tảng hiện tại
  const availableCategories = useMemo(() => {
    const cats = Array.from(new Set(platformServices.map((s) => s.category)));
    return cats;
  }, [platformServices]);

  // Tự động chọn category đầu tiên khi đổi platform
  useEffect(() => {
    if (availableCategories.length > 0 && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory(availableCategories[0]);
    }
  }, [availableCategories, selectedCategory]);

  // Lọc dịch vụ theo category và search
  const filteredServices = useMemo(() => {
    return platformServices.filter((s) => {
      const matchCat = !selectedCategory || s.category === selectedCategory;
      const matchSearch =
        !serviceSearch ||
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        String(s.id).includes(serviceSearch);
      return matchCat && matchSearch;
    });
  }, [platformServices, selectedCategory, serviceSearch]);

  // Dịch vụ đang chọn
  const currentService = useMemo(() => {
    return (
      DEFAULT_SERVICES.find((s) => s.id === selectedServiceId) ||
      filteredServices[0] ||
      DEFAULT_SERVICES[0]
    );
  }, [selectedServiceId, filteredServices]);

  // Tính toán chi phí đơn hàng
  const totalCost = useMemo(() => {
    if (!currentService) return 0;
    const ratePerUnit = currentService.rate / 1000;
    return Number((quantity * ratePerUnit).toFixed(4));
  }, [currentService, quantity]);

  const userBalance = Number(user?.balance || 0);
  const isBalanceSufficient = userBalance >= totalCost;

  // Xử lý tạo đơn hàng
  const handlePlaceOrder = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!targetLink.trim()) {
      addToast('error', 'Vui lòng nhập Link bài viết, kênh hoặc video cần tăng!');
      return;
    }

    if (quantity < currentService.min || quantity > currentService.max) {
      addToast(
        'error',
        `Số lượng phải từ ${currentService.min.toLocaleString()} đến ${currentService.max.toLocaleString()}!`
      );
      return;
    }

    if (!isBalanceSufficient) {
      addToast(
        'error',
        `Số dư không đủ! Cần thêm ${formatMoney(totalCost - userBalance)}. Vui lòng nạp tiền.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // Giả lập lưu đơn hàng và trừ tiền
      await new Promise((resolve) => setTimeout(resolve, 600));

      const newOrderId = Math.floor(100000 + Math.random() * 900000);
      addToast(
        'success',
        `✅ Tạo đơn #${newOrderId} thành công! Hệ thống đang bắt đầu xử lý.`
      );

      // Reset form một phần
      setTargetLink('');
    } catch (err: any) {
      addToast('error', err.message || 'Tạo đơn hàng thất bại, vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut Ctrl + Enter để submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handlePlaceOrder();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [targetLink, quantity, currentService, isBalanceSufficient]);

  return (
    <div className="space-y-5 antialiased text-slate-800 pb-12">
      {/* 1. TOP HEADER BANNER: OPERATIONAL STATUS & WALLET QUICK BAR */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Bàn Làm Việc Tạo Đơn Hàng</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                LIVE 24/7
              </span>
            </h1>
            <p className="text-xs text-slate-500">
              Tăng tương tác tự động cho Facebook, TikTok, Instagram, YouTube tốc độ cao.
            </p>
          </div>
        </div>

        {/* Số dư & Nạp tiền nhanh */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <div className="text-right">
            <span className="text-[11px] font-medium text-slate-500 block">Số dư tài khoản:</span>
            <span className="text-sm font-mono font-bold text-emerald-600 tabular-nums">
              {formatMoney(userBalance)}
            </span>
          </div>
          <button
            onClick={() => setCurrentRoute('/add-funds')}
            className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>+ Nạp tiền</span>
          </button>
        </div>
      </div>

      {/* 2. PLATFORM SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {PLATFORMS.map((p) => {
          const isSelected = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                setSelectedPlatform(p.id);
                setServiceSearch('');
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all whitespace-nowrap border cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.label}</span>
              {isSelected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* 3. MAIN WORKSPACE: 2-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: ORDER TERMINAL FORM (7 Cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 tracking-wide uppercase">
              1. Cấu hình & Thông tin đơn hàng
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Phím tắt: <kbd className="px-1.5 py-0.5 bg-slate-100 border rounded text-[10px]">Ctrl + Enter</kbd>
            </span>
          </div>

          <form onSubmit={handlePlaceOrder} className="space-y-4">
            {/* Danh mục (Category) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Chọn Danh Mục Dịch Vụ:</span>
                <span className="text-[11px] text-slate-400 font-normal">
                  ({availableCategories.length} danh mục khả dụng)
                </span>
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
              >
                {availableCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Dịch vụ cụ thể (Service Selector with Search) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Chọn Dịch Vụ Cụ Thể:
                </label>
                <span className="text-[11px] text-blue-600 font-mono font-semibold">
                  Giá: {formatMoney(currentService.rate)} / 1,000
                </span>
              </div>

              {/* Tìm kiếm nhanh dịch vụ */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Gõ từ khóa tìm dịch vụ hoặc mã ID..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 rounded-lg border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(Number(e.target.value))}
                className="w-full h-11 px-3 rounded-lg border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all cursor-pointer"
              >
                {filteredServices.map((s) => (
                  <option key={s.id} value={s.id}>
                    #{s.id} - {s.name} [{formatMoney(s.rate)} / 1k]
                  </option>
                ))}
              </select>
            </div>

            {/* Link hoặc UID mục tiêu */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Liên kết (Link bài viết / Kênh / Video / Profile):</span>
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) setTargetLink(text);
                    } catch {}
                  }}
                  className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                >
                  Dán nhanh
                </button>
              </div>
              <input
                type="text"
                required
                placeholder="https://www.facebook.com/... hoặc https://www.tiktok.com/@..."
                value={targetLink}
                onChange={(e) => setTargetLink(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono placeholder:font-sans placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <p className="text-[11px] text-slate-400 leading-normal">
                💡 Đảm bảo bài viết/tài khoản ở chế độ <b>Công khai (Public)</b> trước khi gửi đơn.
              </p>
            </div>

            {/* Số lượng (Quantity) & Quick Multipliers */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">
                  Số Lượng Cần Mua:
                </label>
                <span className="text-[11px] text-slate-500 font-mono">
                  Min: {currentService.min.toLocaleString()} | Max:{' '}
                  {currentService.max.toLocaleString()}
                </span>
              </div>

              <input
                type="number"
                min={currentService.min}
                max={currentService.max}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />

              {/* Phím tắt chọn nhanh số lượng */}
              <div className="flex items-center gap-1.5 pt-1">
                {[100, 500, 1000, 5000, 10000, 50000].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuantity(num)}
                    className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                  >
                    +{num >= 1000 ? `${num / 1000}k` : num}
                  </button>
                ))}
              </div>
            </div>

            {/* TỔNG THANH TOÁN & NÚT ĐẶT ĐƠN */}
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Tổng thanh toán:</span>
                  <span className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                    {formatMoney(totalCost)}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Số dư sau khi tạo:</span>
                  <span
                    className={`text-xs font-mono font-bold tabular-nums ${
                      isBalanceSufficient ? 'text-emerald-600' : 'text-red-600'
                    }`}
                  >
                    {isBalanceSufficient
                      ? formatMoney(userBalance - totalCost)
                      : 'Không đủ số dư'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !isBalanceSufficient}
                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Đang gửi đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>TẠO ĐƠN HÀNG NGAY ({formatMoney(totalCost)})</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: SERVICE INTEL & SPECIFICATIONS (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Box chi tiết dịch vụ */}
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4 shadow-xs">
            <div className="border-b border-slate-100 pb-2.5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase">
                2. Thông số kỹ thuật dịch vụ
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                ID #{currentService.id}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[11px] font-semibold text-slate-400 block mb-0.5">Tên dịch vụ:</span>
                <p className="font-semibold text-slate-800 leading-snug">
                  {currentService.name}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-500" /> Tốc độ trung bình:
                  </span>
                  <span className="font-semibold text-slate-700 mt-0.5 block">
                    {currentService.speed}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-400 block flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" /> Chế độ bảo hành:
                  </span>
                  <span className="font-semibold text-emerald-700 mt-0.5 block">
                    {currentService.refill}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1 text-amber-800">
                  <Info className="w-3.5 h-3.5" /> Lưu ý quan trọng:
                </div>
                <p>{currentService.description}</p>
                <p className="text-[10px] text-amber-700 pt-1">
                  * Không đặt 2 đơn cùng 1 link cùng lúc. Đợi đơn cũ hoàn thành rồi mới đặt tiếp.
                </p>
              </div>
            </div>
          </div>

          {/* Hỗ trợ & Khắc phục nhanh */}
          <div className="bg-slate-900 text-white rounded-lg p-4 space-y-2 border border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">Cần hỗ trợ đơn hàng?</span>
              <span className="text-[10px] text-emerald-400 font-mono">TICKET & TELEGRAM</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Nếu đơn hàng bị chậm hoặc cần bảo hành tụt giảm, bạn có thể gửi yêu cầu hỗ trợ trực tiếp.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setCurrentRoute('/orders')}
                className="px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Tra cứu đơn đã đặt
              </button>
              <button
                onClick={() => setCurrentRoute('/support')}
                className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold transition-colors cursor-pointer"
              >
                Mở Ticket Hỗ Trợ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

