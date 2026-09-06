import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Trash2, AlertTriangle } from 'lucide-react';
import { SmmPanel } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

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
        <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200/80 text-rose-900 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-rose-700">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{language === 'vi' ? 'Cảnh báo xóa Panel' : 'Critical Action'}</span>
          </div>
          <p className="leading-relaxed text-rose-800">
            {t('panels.deleteConfirm')}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">{language === 'vi' ? 'Tên Panel:' : 'Panel Name:'}</span>
            <span className="font-bold text-slate-900">{panel.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">{language === 'vi' ? 'Tên miền:' : 'Domain:'}</span>
            <code className="font-mono tabular-nums text-blue-600 font-semibold">{panel.customDomain || panel.domain}</code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">{language === 'vi' ? 'Tổng đơn hàng:' : 'Total Orders:'}</span>
            <span className="font-mono tabular-nums font-bold text-slate-900">{(panel.totalOrders || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDelete}
            loading={loading}
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            {language === 'vi' ? 'Xác nhận xóa' : 'Confirm Delete'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
