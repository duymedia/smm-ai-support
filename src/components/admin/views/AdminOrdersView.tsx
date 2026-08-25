import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { MasterOrder } from '../../../types';
import {
  ShoppingBag,
  Search,
  RefreshCw,
  RotateCcw,
  Undo2,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ExternalLink,
  DollarSign,
  TrendingUp
} from 'lucide-react';

export const AdminOrdersView: React.FC = () => {
  const { language, formatMoney, addToast } = useApp();
  const [orders, setOrders] = useState<MasterOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/orders');
      const data = await res.json();
      if (data?.data) {
        setOrders(data.data);
      }
    } catch (e) {
      console.error('Failed to load master orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleRetryOrder = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/retry`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'Đã gửi lại đơn tới NCC thành công');
        loadOrders();
      }
    } catch {
      addToast('error', 'Không thể đẩy lại đơn hàng');
    }
  };

  const handleCancelAndRefund = async (orderId: string) => {
    if (!window.confirm('Hủy đơn hàng này và hoàn tiền về ví người dùng?')) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/cancel-refund`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('warning', data.message || 'Đã hủy đơn và hoàn tiền');
        loadOrders();
      }
    } catch {
      addToast('error', 'Không thể hoàn tiền đơn hàng');
    }
  };

  const handleMarkCompleted = async (orderId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `Đơn #${orderId} đã được đánh dấu hoàn thành`);
        loadOrders();
      }
    } catch {
      addToast('error', 'Lỗi cập nhật trạng thái');
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.targetLink.toLowerCase().includes(search.toLowerCase()) ||
      o.userName.toLowerCase().includes(search.toLowerCase()) ||
      o.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      o.serviceName.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchCategory = categoryFilter === 'all' || o.category === categoryFilter;
    return matchSearch && matchStatus && matchCategory;
  });

  const totalCharge = filteredOrders.reduce((acc, o) => acc + o.charge, 0);
  const totalCost = filteredOrders.reduce((acc, o) => acc + o.cost, 0);
  const totalProfit = totalCharge - totalCost;

  return (
    <div className="space-y-4">
      {/* Top Header Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center font-bold shadow-2xs">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                {language === 'vi' ? 'Quản Lý Đơn Hàng' : 'Master Orders'}
              </h1>
              <p className="text-xs text-slate-500">
                {language === 'vi'
                  ? 'Theo dõi realtime đơn hàng và thao tác đẩy lại, hoàn tất hoặc hoàn tiền.'
                  : 'Real-time master order queue with one-click retry, complete, and refund.'}
              </p>
            </div>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">{language === 'vi' ? 'Doanh thu:' : 'Revenue:'}</span>
            <span className="text-xs font-bold text-emerald-600 font-mono">{formatMoney(totalCharge)}</span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">{language === 'vi' ? 'Lợi nhuận:' : 'Profit:'}</span>
            <span className="text-xs font-bold text-blue-600 font-mono">+{formatMoney(totalProfit)}</span>
          </div>

          <button
            onClick={loadOrders}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition-colors cursor-pointer"
            title={language === 'vi' ? 'Làm mới danh sách' : 'Refresh list'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 bg-white border border-slate-200/90 p-3 rounded-2xl shadow-2xs">
        <div className="sm:col-span-6 relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'vi' ? 'Tìm theo Mã đơn, Link, Email...' : 'Search order ID, link, email...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8.5 pr-3 py-1.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-blue-500 transition-colors"
          >
            <option value="all">{language === 'vi' ? 'Tất cả trạng thái' : 'All status'}</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="partial">Partial</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs font-medium text-slate-700 focus:outline-hidden focus:border-blue-500 transition-colors"
          >
            <option value="all">{language === 'vi' ? 'Tất cả danh mục' : 'All platforms'}</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
            <option value="Telegram">Telegram</option>
            <option value="Facebook">Facebook</option>
          </select>
        </div>
      </div>

      {/* Orders Master Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3.5">{language === 'vi' ? 'Đơn hàng & Khách' : 'Order & Client'}</th>
                <th className="py-2.5 px-3.5">{language === 'vi' ? 'Dịch vụ & Link' : 'Service & URL'}</th>
                <th className="py-2.5 px-3.5">{language === 'vi' ? 'Số lượng' : 'Quantity'}</th>
                <th className="py-2.5 px-3.5">{language === 'vi' ? 'Thu / Gốc' : 'Charge / Cost'}</th>
                <th className="py-2.5 px-3.5">{language === 'vi' ? 'Nhà cung cấp' : 'Provider'}</th>
                <th className="py-2.5 px-3.5">{language === 'vi' ? 'Trạng thái' : 'Status'}</th>
                <th className="py-2.5 px-3.5 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    {language === 'vi' ? 'Không tìm thấy đơn hàng nào phù hợp.' : 'No matching orders found.'}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3.5">
                      <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        <span className="text-blue-600">#{ord.id}</span>
                        <span className="text-[10px] text-slate-400 font-sans font-normal">({ord.panelName})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">{ord.userName}</div>
                      <div className="text-[10px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()} {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-semibold text-slate-800 max-w-xs truncate">{ord.serviceName}</div>
                      <a
                        href={ord.targetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline max-w-xs truncate mt-0.5"
                      >
                        <span className="truncate">{ord.targetLink}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-mono font-bold text-slate-900">{ord.quantity.toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">
                        {language === 'vi' ? `Bắt đầu: ${ord.startCount}` : `Start: ${ord.startCount}`}
                      </div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-mono font-bold text-emerald-600">{formatMoney(ord.charge)}</div>
                      <div className="text-[10px] font-mono text-slate-400">Gốc: {formatMoney(ord.cost)}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      <div className="font-medium text-slate-800">{ord.providerName}</div>
                      <div className="text-[10px] font-mono text-slate-400">#{ord.providerOrderId}</div>
                    </td>

                    <td className="py-3 px-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide inline-flex items-center gap-1 ${
                          ord.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : ord.status === 'processing'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : ord.status === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {ord.status === 'completed' && <CheckCircle2 className="w-2.5 h-2.5" />}
                        {ord.status === 'processing' && <Clock className="w-2.5 h-2.5 animate-spin" />}
                        {ord.status === 'pending' && <AlertCircle className="w-2.5 h-2.5" />}
                        {ord.status === 'canceled' && <XCircle className="w-2.5 h-2.5" />}
                        <span>{ord.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Action 1: Đẩy Lại (Retry dispatch) */}
                        <button
                          type="button"
                          onClick={() => handleRetryOrder(ord.id)}
                          className="w-7 h-7 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                          title={language === 'vi' ? 'Đẩy lại đơn tới NCC' : 'Retry Dispatch to Provider'}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Action 2: Hoàn Tất (Mark complete) */}
                        {ord.status !== 'completed' && ord.status !== 'canceled' && (
                          <button
                            type="button"
                            onClick={() => handleMarkCompleted(ord.id)}
                            className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                            title={language === 'vi' ? 'Đánh dấu hoàn tất' : 'Mark Completed'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Action 3: Hoàn Tiền (Refund) */}
                        {ord.status !== 'canceled' && (
                          <button
                            type="button"
                            onClick={() => handleCancelAndRefund(ord.id)}
                            className="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 flex items-center justify-center transition-all cursor-pointer shadow-2xs hover:scale-105"
                            title={language === 'vi' ? 'Hủy đơn & hoàn tiền' : 'Cancel & Refund'}
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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

