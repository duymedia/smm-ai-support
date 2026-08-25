import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { AnnouncementItem } from '../../../types';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Bell,
  ToggleLeft,
  ToggleRight,
  Eye,
  RefreshCw
} from 'lucide-react';

export const AdminAnnouncementsView: React.FC = () => {
  const { language, addToast } = useApp();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<'info' | 'success' | 'warning' | 'alert'>('info');
  const [newTarget, setNewTarget] = useState<'all' | 'customers' | 'agencies'>('all');
  const [newIsPopup, setNewIsPopup] = useState(false);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/announcements');
      const data = await res.json();
      if (data?.data) {
        setAnnouncements(data.data);
      }
    } catch (e) {
      console.error('Failed to load announcements:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          type: newType,
          target: newTarget,
          isPopup: newIsPopup,
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', data.message || 'Tạo thông báo mới thành công!');
        setShowCreateModal(false);
        setNewTitle('');
        setNewContent('');
        loadAnnouncements();
      }
    } catch {
      addToast('error', 'Lỗi khi tạo thông báo');
    }
  };

  const handleToggleActive = async (item: AnnouncementItem) => {
    try {
      const res = await fetch(`/api/admin/announcements/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('info', `Đã ${!item.active ? 'bật' : 'tắt'} thông báo: ${item.title}`);
        loadAnnouncements();
      }
    } catch {
      addToast('error', 'Failed to toggle');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Xóa thông báo này vĩnh viễn?')) return;
    try {
      const res = await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        addToast('warning', 'Đã xóa thông báo.');
        loadAnnouncements();
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
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              {language === 'vi' ? 'Quản Lý Thông Báo & Popup Khách Hàng' : 'Announcements & Modal Alerts Hub'}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            {language === 'vi'
              ? 'Tạo các bản tin cập nhật máy chủ, khuyến mãi nạp tiền hoặc popup cảnh báo hiển thị trực tiếp trên Dashboard của người dùng.'
              : 'Broadcast server maintenance updates, deposit promotions, and popups to client dashboards.'}
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tạo Thông Báo Mới</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {announcements.map((anc) => (
          <div
            key={anc.id}
            className={`p-5 rounded-2xl border transition-all ${
              anc.active ? 'bg-white border-slate-200/90 shadow-2xs' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    anc.type === 'success'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : anc.type === 'warning'
                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                      : anc.type === 'alert'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {anc.type}
                </span>
                {anc.isPopup && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Modal Popup
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleActive(anc)}
                  className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  title="Bật/Tắt hiển thị"
                >
                  {anc.active ? (
                    <ToggleRight className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(anc.id)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mt-3 leading-snug">{anc.title}</h3>
            <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">{anc.content}</p>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Đối tượng: <strong className="text-slate-700 uppercase">{anc.target}</strong></span>
              <span>{new Date(anc.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h2 className="text-base font-extrabold text-slate-900">Soạn Thông Báo Cho Khách Hàng</h2>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Tiêu Đề Thông Báo</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  placeholder="VD: Cập nhật server Anycast mới..."
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Nội Dung Chi Tiết</label>
                <textarea
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 transition-colors"
                  placeholder="Nhập nội dung thông điệp gửi tới khách hàng..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Kiểu Huy Hiệu (Type)</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    <option value="info">Info (Xanh dương)</option>
                    <option value="success">Success (Xanh lá - Khuyến mãi)</option>
                    <option value="warning">Warning (Vàng - Bảo trì)</option>
                    <option value="alert">Alert (Đỏ - Khẩn cấp)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Đối Tượng Nhận</label>
                  <select
                    value={newTarget}
                    onChange={(e: any) => setNewTarget(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 text-xs font-bold text-slate-700 focus:outline-hidden focus:border-blue-500 transition-colors"
                  >
                    <option value="all">Tất cả người dùng</option>
                    <option value="customers">Khách hàng thông thường</option>
                    <option value="agencies">Chủ Agency / Thuê Panel</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900">Hiển Thị Dưới Dạng Popup</p>
                  <p className="text-[11px] text-slate-500">Bật cửa sổ modal tự động khi khách vào Dashboard</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewIsPopup(!newIsPopup)}
                  className="cursor-pointer"
                >
                  {newIsPopup ? (
                    <ToggleRight className="w-6 h-6 text-purple-600" />
                  ) : (
                    <ToggleLeft className="w-6 h-6 text-slate-400" />
                  )}
                </button>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
                >
                  Phát Hành Thông Báo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
