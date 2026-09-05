import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Server,
  Globe,
  Key,
  FileText,
  RefreshCw,
  Package as PackageIcon,
} from 'lucide-react';
import { SmmPanel } from '../../types';
import { Modal } from '../ui/Modal';
import { Select2 } from '../ui/Select2';

interface PanelEditModalProps {
  panel: SmmPanel;
  activeRentedOrders?: any[];
  cataloguePackages?: any[];
  onClose: () => void;
  onSaved?: () => void;
}

export const PanelEditModal: React.FC<PanelEditModalProps> = ({
  panel,
  activeRentedOrders = [],
  cataloguePackages = [],
  onClose,
  onSaved,
}) => {
  const { updatePanel, t, language } = useApp();

  const [loading, setLoading] = useState(false);

  // Editable fields: name, domain, apiKey, packageId/orderId, notes
  const [name, setName] = useState(panel.name || '');
  const [domain, setDomain] = useState(panel.domain || '');
  const [apiKey, setApiKey] = useState(panel.apiKey || '');
  const [adminUsername, setAdminUsername] = useState(panel.adminUsername || '');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminTwoFactorSecret, setAdminTwoFactorSecret] = useState('');
  const [notes, setNotes] = useState(panel.notes || '');

  // Package & Order selection
  const initialOrderId = panel.orderId ? String(panel.orderId) : '';
  const initialPackageId = panel.packageId ? String(panel.packageId) : (panel.planId || '');
  const [selectedPlanOption, setSelectedPlanOption] = useState<string>(
    initialOrderId ? `order_${initialOrderId}` : (initialPackageId ? `pkg_${initialPackageId}` : '')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let resolvedOrderId: number | null = null;
    let resolvedPackageId: string | number | null = null;

    if (selectedPlanOption.startsWith('order_')) {
      resolvedOrderId = Number(selectedPlanOption.replace('order_', ''));
      const linkedOrd = activeRentedOrders.find((o) => String(o.id) === String(resolvedOrderId));
      if (linkedOrd?.packageId) resolvedPackageId = linkedOrd.packageId;
    } else if (selectedPlanOption.startsWith('pkg_')) {
      const rawPkgVal = selectedPlanOption.replace('pkg_', '');
      resolvedPackageId = !isNaN(Number(rawPkgVal)) ? Number(rawPkgVal) : rawPkgVal;
    }

    const ok = await updatePanel(panel.id, {
      name: name.trim(),
      domain: domain.trim().toLowerCase(),
        apiKey: apiKey.trim(),
      adminUsername: adminUsername.trim(),
      ...(adminPassword ? { adminPassword } : {}),
      ...(adminTwoFactorSecret ? { adminTwoFactorSecret: adminTwoFactorSecret.trim() } : {}),
      notes: notes.trim(),
      orderId: resolvedOrderId || undefined,
      packageId: resolvedPackageId as any,
    });

    setLoading(false);
    if (ok) {
      if (onSaved) onSaved();
      onClose();
    }
  };

  // Build package & order dropdown options
  const packageSelectOptions = [
    ...(activeRentedOrders.length > 0
      ? activeRentedOrders.map((o) => {
          const isTrial = o.metadata?.isFreeTrial || Number(o.total) === 0 || o.package?.code === 'free-trial';
          const planTitle = o.metadata?.planName || o.package?.name || (isTrial ? 'Gói trải nghiệm 0 VNĐ' : 'Gói thuê SMM Panel');
          const expStr = o.expiresAt ? new Date(o.expiresAt).toLocaleDateString() : 'Vĩnh viễn';
          return {
            value: `order_${o.id}`,
            label: `[Gói đã thuê] ${planTitle} (Hạn: ${expStr}) - ${Number(o.total) === 0 ? '0 VNĐ' : `$${Number(o.total)}`}`,
          };
        })
      : []),
    ...cataloguePackages.map((pkg) => {
      const monthly = Number(pkg.monthlyPrice || pkg.pricing?.monthly || 0);
      return {
        value: `pkg_${pkg.id || pkg.code}`,
        label: `[Gói hệ thống] ${pkg.name} (${monthly === 0 ? '0 VNĐ' : `$${monthly}/tháng`})`,
      };
    }),
  ];

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={language === 'vi' ? `Chỉnh sửa thông tin panel: ${panel.name}` : `Edit panel: ${panel.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
        {/* 1. Chọn Gói Dịch Vụ / Gói Cước */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 flex items-center gap-1.5">
            <PackageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'vi' ? 'Gói cước dịch vụ của panel *' : 'Panel subscription plan *'}</span>
          </label>
          <Select2
            value={selectedPlanOption || (packageSelectOptions[0]?.value || '')}
            onChange={(val) => setSelectedPlanOption(val)}
            options={packageSelectOptions}
          />
        </div>

        <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
          <p className="font-bold text-amber-800">{language === 'vi' ? 'Thông tin tài khoản Admin Panel' : 'Panel Admin credentials'}</p>
          <input value={adminUsername} onChange={e => setAdminUsername(e.target.value)} placeholder="Admin username" className="w-full px-3 py-2 rounded-xl border bg-white" />
          <input type="password" value={adminPassword} onChange={e => setAdminPassword(e.target.value)} placeholder={language === 'vi' ? 'Mật khẩu mới (để trống nếu không đổi)' : 'New password (leave blank to keep)'} className="w-full px-3 py-2 rounded-xl border bg-white" />
          <input value={adminTwoFactorSecret} onChange={e => setAdminTwoFactorSecret(e.target.value)} placeholder="2FA secret (TOTP)" className="w-full px-3 py-2 rounded-xl border bg-white font-mono" />
        </div>

        {/* 2. Tên SMM Panel */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'vi' ? 'Tên SMM panel *' : 'SMM Panel name *'}</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ví dụ: ApexBoost Global Hub"
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all font-medium"
          />
        </div>

        {/* 3. Tên miền (Domain) */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-blue-600" />
            <span>{language === 'vi' ? 'Tên miền (domain) *' : 'Domain *'}</span>
          </label>
          <input
            type="text"
            required
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="domain.com hoặc panel.nexussmm.store"
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-blue-600 font-bold focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* 4. API Key */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-600" />
            <span>{language === 'vi' ? 'API Key (Key kết nối của panel)' : 'API Key'}</span>
          </label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={language === 'vi' ? 'Nhập mã API Key kết nối SMM Panel của bạn...' : 'Enter your SMM Panel API Key...'}
            className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
          <p className="text-[10px] text-slate-400">
            {language === 'vi'
              ? 'Khóa API Key của panel dùng để kết nối và điều phối đơn hàng tự động.'
              : 'API Key used for automated external order fulfillment.'}
          </p>
        </div>

        {/* 5. Ghi chú */}
        <div className="space-y-1.5">
          <label className="block font-bold text-slate-700 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'vi' ? 'Ghi chú quản trị' : 'Notes'}</span>
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={language === 'vi' ? 'Ghi chú phục vụ theo dõi và quản lý...' : 'Optional management notes...'}
            className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all"
          />
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
          >
            {language === 'vi' ? 'Hủy' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>{language === 'vi' ? 'Lưu thay đổi' : 'Save changes'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
