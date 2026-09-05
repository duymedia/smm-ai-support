import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { CouponItem } from '../../../types';
import {
  Tag,
  Plus,
  Trash2,
  Percent,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Copy,
  DollarSign
} from 'lucide-react';

export const AdminCouponsView: React.FC = () => {
  const { language, formatMoney, addToast } = useApp();
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
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
        addToast('success', data.message);
        setShowModal(false);
        setNewCode('');
        loadCoupons();
      }
    } catch {
      addToast('error', 'Failed to create coupon');
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
      addToast('error', 'Failed to toggle');
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
      addToast('error', 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Quản Lý Mã Giảm Giá & Voucher Khuyến Mãi' : 'Coupons & Discount Vouchers Manager'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {language === 'vi'
              ? 'Tạo các mã khuyến mãi áp dụng khi khách hàng đặt dịch vụ SMM hoặc thuê/gia hạn panel trên website.'
              : 'Create promotional voucher codes for SMM orders and panel rental checkouts.'}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Mã Giảm Giá Mới</span>
        </button>
      </div>

      {/* Coupons Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Mã Voucher</th>
                <th className="py-3 px-4">Tỷ Lệ Giảm</th>
                <th className="py-3 px-4">Giảm Tối Đa</th>
                <th className="py-3 px-4">Đơn Tối Thiểu</th>
                <th className="py-3 px-4">Lượt Đã Dùng</th>
                <th className="py-3 px-4">Hạn Dùng</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {coupons.map((cpn) => (
                <tr key={cpn.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-mono font-extrabold text-blue-600 flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{cpn.code}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-bold text-emerald-600 font-mono text-sm">-{cpn.discountPercent}%</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-slate-700">{formatMoney(cpn.maxDiscountUsd)}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="font-mono text-slate-700">{formatMoney(cpn.minOrderUsd)}</span>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900">{cpn.usedCount}</span>
                      <span className="text-[10px] text-slate-400">/ {cpn.maxUses}</span>
                    </div>
                    <div className="w-20 h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(100, (cpn.usedCount / cpn.maxUses) * 100)}%` }}
                      />
                    </div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-[11px] text-slate-500">
                      {new Date(cpn.expiresAt).toLocaleDateString()}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(cpn)}
                      className="inline-flex items-center gap-1 cursor-pointer focus:outline-hidden"
                      title="Bấm để Bật/Tắt mã giảm giá"
                    >
                      {cpn.active ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold">
                          <ToggleRight className="w-6 h-6 text-emerald-600" />
                          <span className="text-[10px] uppercase">Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 font-bold">
                          <ToggleLeft className="w-6 h-6 text-slate-300" />
                          <span className="text-[10px] uppercase">Off</span>
                        </div>
                      )}
                    </button>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleDelete(cpn.id)}
                      className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors cursor-pointer"
                      title="Xóa voucher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-extrabold text-slate-900">Tạo Mã Giảm Giá Mới</h2>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Mã Code (Chữ in hoa)</label>
                <input
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs font-mono text-blue-600 font-bold uppercase focus:outline-hidden focus:border-blue-500 transition-colors"
                  placeholder="VD: VIPSUMMER20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">% Giảm Giá</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newPercent}
                    onChange={(e) => setNewPercent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Giảm Tối Đa ($ USD)</label>
                  <input
                    type="number"
                    min="1"
                    value={newMaxDiscount}
                    onChange={(e) => setNewMaxDiscount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Đơn Tối Thiểu ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    value={newMinOrder}
                    onChange={(e) => setNewMinOrder(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tổng Lượt Dùng</label>
                  <input
                    type="number"
                    min="1"
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Hạn Sử Dụng</label>
                <input
                  type="date"
                  value={newExpiry}
                  onChange={(e) => setNewExpiry(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Lưu Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
