import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { CouponItem } from '../../../types';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { StatCard } from '../../ui/StatCard';
import { PageHeader } from '../../ui/PageHeader';
import { Modal } from '../../ui/Modal';
import {
  Tag,
  Plus,
  Trash2,
  Percent,
  Calendar,
  ToggleLeft,
  ToggleRight,
  Copy,
  DollarSign,
  RefreshCw,
  Sparkles,
  Ticket,
  Users,
  Check
} from 'lucide-react';

export const AdminCouponsView: React.FC = () => {
  const { language, formatMoney, addToast } = useApp();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState(15);
  const [newMaxDiscount, setNewMaxDiscount] = useState(30);
  const [newMinOrder, setNewMinOrder] = useState(10);
  const [newMaxUses, setNewMaxUses] = useState(500);
  const [newExpiry, setNewExpiry] = useState('2026-12-31');

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/coupons');
      const data = await res.json();
      if (data?.data) {
        setCoupons(data.data);
      }
    } catch (e) {
      console.error('Failed to load coupons:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim()) return;

    setCreating(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.toUpperCase(),
          discountPercent: newPercent,
          maxDiscountUsd: newMaxDiscount,
          minOrderUsd: newMinOrder,
          maxUses: newMaxUses,
          expiresAt: new Date(newExpiry).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'Tạo mã voucher thành công!');
        setShowModal(false);
        setNewCode('');
        loadCoupons();
      }
    } catch {
      addToast('error', 'Lỗi khi tạo voucher');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (item: CouponItem) => {
    try {
      const res = await fetch(`/api/admin/coupons/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('info', `Mã [${item.code}] ${!item.active ? 'kích hoạt' : 'tạm dừng'}`);
        loadCoupons();
      }
    } catch {
      addToast('error', 'Không thể đổi trạng thái voucher');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa mã giảm giá này?')) return;
    try {
      const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('warning', 'Đã xóa mã voucher.');
        loadCoupons();
      }
    } catch {
      addToast('error', 'Không thể xóa voucher');
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast('success', `Đã sao chép mã [${code}]`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter((c) => c.active).length;
  const totalRedemptions = coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0);
  const avgDiscount =
    coupons.length > 0
      ? Math.round(coupons.reduce((acc, c) => acc + c.discountPercent, 0) / coupons.length)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={language === 'vi' ? 'Quản Lý Mã Giảm Giá & Voucher Khuyến Mãi' : 'Coupons & Discount Vouchers Manager'}
        description={
          language === 'vi'
            ? 'Tạo các mã khuyến mãi áp dụng khi khách hàng đặt dịch vụ SMM hoặc thuê/gia hạn panel trên website.'
            : 'Create promotional voucher codes for SMM orders and panel rental checkouts.'
        }
        badge={
          <Badge variant="brand" pulse>
            {activeCoupons} {language === 'vi' ? 'Đang Khả Dụng' : 'Active'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              loading={loading}
              onClick={loadCoupons}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {language === 'vi' ? 'Làm Mới' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              {language === 'vi' ? 'Tạo Mã Giảm Giá Mới' : 'New Coupon'}
            </Button>
          </div>
        }
      />

      {/* 4 StatCards Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'vi' ? 'TỔNG MÃ VOUCHER' : 'TOTAL VOUCHERS'}
          value={totalCoupons}
          subtitle={language === 'vi' ? 'Toàn bộ mã đã tạo trong catalog' : 'All campaigns created'}
          icon={<Tag className="w-5 h-5 text-rose-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'ĐANG KÍCH HOẠT' : 'ACTIVE CODES'}
          value={activeCoupons}
          subtitle={language === 'vi' ? 'Khách hàng có thể áp dụng ngay' : 'Available for checkout'}
          icon={<Ticket className="w-5 h-5 text-emerald-600" />}
          highlight={activeCoupons > 0}
        />
        <StatCard
          title={language === 'vi' ? 'LƯỢT ĐÃ SỬ DỤNG' : 'TOTAL REDEMPTIONS'}
          value={totalRedemptions}
          subtitle={language === 'vi' ? 'Lần nhập mã thành công' : 'Redeemed by users'}
          icon={<Users className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'CHIẾT KHẤU TRUNG BÌNH' : 'AVG DISCOUNT'}
          value={`${avgDiscount}%`}
          subtitle={language === 'vi' ? 'Tỷ lệ giảm trung bình / mã' : 'Average rate across codes'}
          icon={<Percent className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Coupons Table Card */}
      <Card
        macChrome
        macTitle="VOUCHER_ENGINE // ACTIVE_CAMPAIGNS"
        macBadge={
          <Badge variant="rose" size="sm">
            {coupons.length} {language === 'vi' ? 'Mã Khuyến Mãi' : 'Coupons'}
          </Badge>
        }
        className="overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-mono text-[10px] uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Mã Voucher</th>
                <th className="py-3 px-4">Tỷ Lệ Giảm</th>
                <th className="py-3 px-4">Giảm Tối Đa</th>
                <th className="py-3 px-4">Đơn Tối Thiểu</th>
                <th className="py-3 px-4">Tiến Độ Sử Dụng</th>
                <th className="py-3 px-4">Hạn Sử Dụng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {coupons.map((cpn) => (
                <tr key={cpn.id} className="hover:bg-slate-50/60 transition-colors">
                  {/* Code */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-blue-600 bg-blue-50/70 border border-blue-200/80 px-2.5 py-1 rounded-full text-xs">
                        {cpn.code}
                      </span>
                      <button
                        onClick={() => copyToClipboard(cpn.code)}
                        className="p-1 rounded-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                        title="Sao chép mã"
                      >
                        {copiedCode === cpn.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Discount Rate */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono tabular-nums font-bold text-emerald-600 text-sm">
                      -{cpn.discountPercent}%
                    </span>
                  </td>

                  {/* Max Discount */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono tabular-nums text-slate-700 font-medium">
                      {formatMoney(cpn.maxDiscountUsd)}
                    </span>
                  </td>

                  {/* Min Order */}
                  <td className="py-3.5 px-4">
                    <span className="font-mono tabular-nums text-slate-700 font-medium">
                      {formatMoney(cpn.minOrderUsd)}
                    </span>
                  </td>

                  {/* Usage Progress */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono tabular-nums font-bold text-slate-900">
                        {cpn.usedCount}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums">
                        / {cpn.maxUses}
                      </span>
                    </div>
                    <div className="w-24 h-1.5 rounded-full bg-slate-100 mt-1.5 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (cpn.usedCount / cpn.maxUses) * 100)}%` }}
                      />
                    </div>
                  </td>

                  {/* Expiry Date */}
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-slate-500 font-mono tabular-nums flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{new Date(cpn.expiresAt).toLocaleDateString()}</span>
                    </span>
                  </td>

                  {/* Active Toggle */}
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(cpn)}
                      className="cursor-pointer focus-ring rounded-full"
                      title={cpn.active ? 'Bấm để tắt mã' : 'Bấm để kích hoạt mã'}
                    >
                      {cpn.active ? (
                        <div className="flex items-center justify-center gap-1 text-emerald-600 font-semibold">
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                          <Badge variant="emerald" size="sm" pulse>
                            Active
                          </Badge>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-slate-400 font-semibold">
                          <ToggleLeft className="w-6 h-6 text-slate-300" />
                          <Badge variant="slate" size="sm">
                            Off
                          </Badge>
                        </div>
                      )}
                    </button>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(cpn.id)}
                      className="p-1.5 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {coupons.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">Chưa có mã giảm giá nào</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bấm &ldquo;Tạo Mã Giảm Giá Mới&rdquo; để khởi tạo voucher đầu tiên
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Tạo Mã Giảm Giá Mới"
        subtitle="Khởi tạo mã voucher khuyến mãi nạp tiền hoặc chiết khấu đơn hàng"
        size="md"
      >
        <form onSubmit={handleCreate} className="space-y-3.5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Mã Code (Chữ in hoa)</label>
            <input
              type="text"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs font-mono font-bold text-blue-600 uppercase focus-ring transition-colors"
              placeholder="VD: VIPSUMMER20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">% Giảm Giá</label>
              <input
                type="number"
                min="1"
                max="100"
                value={newPercent}
                onChange={(e) => setNewPercent(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs font-mono tabular-nums text-slate-900 focus-ring transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Giảm Tối Đa ($ USD)</label>
              <input
                type="number"
                min="1"
                value={newMaxDiscount}
                onChange={(e) => setNewMaxDiscount(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs font-mono tabular-nums text-slate-900 focus-ring transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Đơn Tối Thiểu ($ USD)</label>
              <input
                type="number"
                min="0"
                value={newMinOrder}
                onChange={(e) => setNewMinOrder(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs font-mono tabular-nums text-slate-900 focus-ring transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Tổng Lượt Dùng</label>
              <input
                type="number"
                min="1"
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs font-mono tabular-nums text-slate-900 focus-ring transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Hạn Sử Dụng</label>
            <input
              type="date"
              value={newExpiry}
              onChange={(e) => setNewExpiry(e.target.value)}
              className="w-full px-4 py-2 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors font-mono tabular-nums"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowModal(false)}
            >
              Hủy Bỏ
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={creating}
              icon={<Plus className="w-4 h-4" />}
            >
              {creating ? 'Đang Lưu...' : 'Lưu Voucher'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
