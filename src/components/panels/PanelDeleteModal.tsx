import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, AlertTriangle, Server } from 'lucide-react';
import { SmmPanel } from '../../types';
import { Modal } from '../ui/Modal';

interface PanelDeleteModalProps {
  panel: SmmPanel;
  onClose: () => void;
  onDeleted?: () => void;
}

export const PanelDeleteModal: React.FC<PanelDeleteModalProps> = ({ panel, onClose, onDeleted }) => {
  const { deletePanel, t, language } = useApp();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    const ok = await deletePanel(panel.id);
    setLoading(false);
    if (ok) {
      if (onDeleted) onDeleted();
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={t('panels.deleteConfirmTitle')}
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-700">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{language === 'vi' ? 'Cảnh báo xóa Panel' : 'Critical Action'}</span>
          </div>
          <p className="leading-relaxed text-rose-800">
            {t('panels.deleteConfirm')}
          </p>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Tên Panel:' : 'Panel Name:'}</span>
            <span className="font-bold text-slate-900">{panel.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Tên miền:' : 'Domain:'}</span>
            <code className="font-mono text-indigo-600">{panel.customDomain || panel.domain}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-semibold">{language === 'vi' ? 'Tổng đơn hàng:' : 'Total Orders:'}</span>
            <span className="font-bold text-slate-900">{(panel.totalOrders || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{loading ? t('common.loading') : (language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
