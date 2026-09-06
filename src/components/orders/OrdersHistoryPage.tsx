import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Copy,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface OrderItem {
  id: number | string;
  serviceId: number;
  serviceName: string;
  platform: 'facebook' | 'tiktok' | 'instagram' | 'youtube' | 'telegram' | 'other';
  link: string;
  charge: number;
  quantity: number;
  startCount: number;
  remains: number;
  status: 'completed' | 'processing' | 'pending' | 'in_progress' | 'canceled' | 'partial';
  createdAt: string;
}

const MOCK_ORDERS: OrderItem[] = [
  {
    id: 91024,
    serviceId: 201,
    serviceName: 'TikTok Tim / Like Video - User Thật VN',
    platform: 'tiktok',
    link: 'https://www.tiktok.com/@duymedia/video/74789123019',
    charge: 32000,
    quantity: 1000,
    startCount: 450,
    remains: 0,
    status: 'completed',
    createdAt: '2026-09-06 08:30:12',
  },
  {
    id: 91023,
    serviceId: 101,
    serviceName: 'Facebook Like Bài Viết - Người dùng thật VN',
    platform: 'facebook',
    link: 'https://www.facebook.com/duymedia2004/posts/192830192',
    charge: 44000,
    quantity: 2000,
    startCount: 120,
    remains: 350,
    status: 'processing',
    createdAt: '2026-09-06 07:15:40',
  },
  {
    id: 91022,
    serviceId: 401,
    serviceName: 'YouTube View Video - Giữ Chân Cao (High Retention)',
    platform: 'youtube',
    link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    charge: 96000,
    quantity: 2000,
    startCount: 8900,
    remains: 0,
    status: 'completed',
    createdAt: '2026-09-05 21:10:00',
  },
  {
    id: 91021,
    serviceId: 302,
    serviceName: 'Instagram Follower - Người Dùng Thật HQ',
    platform: 'instagram',
    link: 'https://www.instagram.com/quocduy_media/',
    charge: 38000,
    quantity: 1000,
    startCount: 1250,
    remains: 1000,
    status: 'pending',
    createdAt: '2026-09-05 18:42:15',
  },
];

export const OrdersHistoryPage: React.FC = () => {
  const { formatMoney, addToast, setCurrentRoute } = useApp();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');
  const [orders, setOrders] = useState<OrderItem[]>(MOCK_ORDERS);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchSearch =
        !search ||
        String(o.id).includes(search) ||
        o.serviceName.toLowerCase().includes(search.toLowerCase()) ||
        o.link.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'active' &&
          (o.status === 'processing' || o.status === 'pending' || o.status === 'in_progress')) ||
        o.status === selectedStatus;

      const matchPlatform = selectedPlatform === 'all' || o.platform === selectedPlatform;

      return matchSearch && matchStatus && matchPlatform;
    });
  }, [orders, search, selectedStatus, selectedPlatform]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast('success', `Đã copy ${label} vào bộ nhớ tạm.`);
  };

  const handleRefill = (orderId: string | number) => {
    addToast('success', `Đã gửi yêu cầu bảo hành nạp bù cho đơn #${orderId}.`);
  };

  const getStatusBadge = (status: OrderItem['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Hoàn thành</span>
          </span>
        );
      case 'processing':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
            <span>Đang chạy</span>
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3 text-amber-600" />
            <span>Chờ xử lý</span>
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Đã hủy</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 antialiased text-slate-800 pb-12">
      {/* 1. TOP HEADER & METRICS */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Quản Lý Đơn Hàng</span>
            <span className="text-xs font-mono font-normal text-slate-400">
              ({filteredOrders.length} đơn hàng)
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi tiến độ, số lượng đã chạy và yêu cầu bảo hành nạp bù tự động.
          </p>
        </div>

        <button
          onClick={() => setCurrentRoute('/new-order')}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>+ Tạo Đơn Mới</span>
        </button>
      </div>

      {/* 2. FILTER TABS & SEARCH BAR */}
      <div className="bg-white border border-slate-200 rounded-lg p-3 space-y-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'active', label: 'Đang chạy' },
              { id: 'completed', label: 'Hoàn thành' },
              { id: 'pending', label: 'Chờ xử lý' },
              { id: 'canceled', label: 'Đã hủy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  selectedStatus === tab.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã đơn, tên dịch vụ hoặc link..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 bg-slate-50/50 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. DENSE OPERATIONAL DATA TABLE */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Mã đơn</th>
                <th className="py-2.5 px-3">Thời gian</th>
                <th className="py-2.5 px-3">Dịch vụ & Nền tảng</th>
                <th className="py-2.5 px-3">Liên kết (Link)</th>
                <th className="py-2.5 px-3 text-right">Số lượng</th>
                <th className="py-2.5 px-3 text-right">Ban đầu</th>
                <th className="py-2.5 px-3 text-right">Giá tiền</th>
                <th className="py-2.5 px-3 text-center">Trạng thái</th>
                <th className="py-2.5 px-3 text-center">Tác vụ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-xs">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* ID */}
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                      #{o.id}
                    </td>

                    {/* Time */}
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {o.createdAt}
                    </td>

                    {/* Service Name */}
                    <td className="py-2.5 px-3 max-w-xs truncate" title={o.serviceName}>
                      <span className="font-semibold text-slate-800 block truncate">
                        {o.serviceName}
                      </span>
                    </td>

                    {/* Link */}
                    <td className="py-2.5 px-3 max-w-xs">
                      <div className="flex items-center gap-1.5 font-mono text-slate-600">
                        <span className="truncate max-w-[140px] block">{o.link}</span>
                        <button
                          onClick={() => copyToClipboard(o.link, 'Link')}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Copy Link"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {o.quantity.toLocaleString()}
                    </td>

                    {/* Start Count */}
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500 tabular-nums">
                      {o.startCount.toLocaleString()}
                    </td>

                    {/* Charge */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                      {formatMoney(o.charge)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {getStatusBadge(o.status)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleRefill(o.id)}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded text-[10px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Gửi yêu cầu bảo hành nạp bù nếu tụt số lượng"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Bảo hành</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

