import React, { useState, useEffect } from 'react';
import { useApp } from '../../../context/AppContext';
import { AnnouncementItem } from '../../../types';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Card } from '../../ui/Card';
import { StatCard } from '../../ui/StatCard';
import { PageHeader } from '../../ui/PageHeader';
import { Modal } from '../../ui/Modal';
import {
  Megaphone,
  Plus,
  Trash2,
  Bell,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  Info,
  CheckCircle2,
  Radio,
  Users,
  Layers,
  Calendar
} from 'lucide-react';

export const AdminAnnouncementsView: React.FC = () => {
  const { language, addToast } = useApp();
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
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

    setCreating(true);
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
        setNewType('info');
        setNewTarget('all');
        setNewIsPopup(false);
        loadAnnouncements();
      }
    } catch {
      addToast('error', 'Lỗi khi tạo thông báo');
    } finally {
      setCreating(false);
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
      addToast('error', 'Không thể thay đổi trạng thái');
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
      addToast('error', 'Không thể xóa thông báo');
    }
  };

  const totalAnnouncements = announcements.length;
  const activeAnnouncements = announcements.filter((a) => a.active).length;
  const popupAnnouncements = announcements.filter((a) => a.isPopup).length;
  const globalAnnouncements = announcements.filter((a) => a.target === 'all').length;

  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'emerald';
      case 'warning':
        return 'amber';
      case 'alert':
        return 'rose';
      default:
        return 'blue';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={language === 'vi' ? 'Quản Lý Thông Báo & Popup Khách Hàng' : 'Announcements & Modal Alerts Hub'}
        description={
          language === 'vi'
            ? 'Tạo các bản tin cập nhật máy chủ, khuyến mãi nạp tiền hoặc popup cảnh báo hiển thị trực tiếp trên Dashboard của người dùng.'
            : 'Broadcast server maintenance updates, deposit promotions, and popups to client dashboards.'
        }
        badge={
          <Badge variant="brand" pulse>
            {activeAnnouncements} {language === 'vi' ? 'Đang Phát' : 'Active'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              loading={loading}
              onClick={loadAnnouncements}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              {language === 'vi' ? 'Làm Mới' : 'Refresh'}
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus className="w-4 h-4" />}
            >
              {language === 'vi' ? 'Tạo Thông Báo Mới' : 'New Announcement'}
            </Button>
          </div>
        }
      />

      {/* 4 StatCards Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={language === 'vi' ? 'TỔNG THÔNG BÁO' : 'TOTAL ANNOUNCEMENTS'}
          value={totalAnnouncements}
          subtitle={language === 'vi' ? 'Đã khởi tạo trong hệ thống' : 'Total records created'}
          icon={<Megaphone className="w-5 h-5 text-blue-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'ĐANG PHÁT SÓNG' : 'ACTIVE BROADCASTS'}
          value={activeAnnouncements}
          subtitle={language === 'vi' ? 'Hiển thị tức thì tới người dùng' : 'Currently visible to users'}
          icon={<Radio className="w-5 h-5 text-emerald-600" />}
          highlight={activeAnnouncements > 0}
        />
        <StatCard
          title={language === 'vi' ? 'MODAL POPUP' : 'POPUP MODALS'}
          value={popupAnnouncements}
          subtitle={language === 'vi' ? 'Bật cửa sổ khi vào Dashboard' : 'Auto popup upon login'}
          icon={<Bell className="w-5 h-5 text-purple-600" />}
        />
        <StatCard
          title={language === 'vi' ? 'TOÀN HỆ THỐNG' : 'GLOBAL TARGETS'}
          value={globalAnnouncements}
          subtitle={language === 'vi' ? 'Gửi tới toàn bộ tài khoản' : 'Broadcast to all users'}
          icon={<Users className="w-5 h-5 text-amber-600" />}
        />
      </div>

      {/* Announcements Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {announcements.map((anc) => {
          const badgeVariant = getTypeBadgeVariant(anc.type);
          return (
            <Card
              key={anc.id}
              macChrome
              macTitle={`ANN_${anc.id.slice(0, 8).toUpperCase()}`}
              macBadge={
                <Badge variant={anc.active ? 'emerald' : 'slate'} pulse={anc.active} size="sm">
                  {anc.active ? 'Active' : 'Off'}
                </Badge>
              }
              className={`p-5 flex flex-col justify-between transition-all ${
                anc.active ? '' : 'opacity-70 bg-slate-50/70'
              }`}
            >
              <div className="space-y-3">
                {/* Top badges & actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant={badgeVariant} size="sm">
                      {anc.type.toUpperCase()}
                    </Badge>
                    {anc.isPopup && (
                      <Badge variant="purple" size="sm">
                        Modal Popup
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(anc)}
                      className="cursor-pointer focus-ring rounded-full"
                      title={anc.active ? 'Bấm để tắt hiển thị' : 'Bấm để bật hiển thị'}
                    >
                      {anc.active ? (
                        <ToggleRight className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-300" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(anc.id)}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Xóa vĩnh viễn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Title & Content */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 leading-snug">{anc.title}</h3>
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                    {anc.content}
                  </p>
                </div>
              </div>

              {/* Footer Meta */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono tabular-nums">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-400" />
                  <span className="uppercase font-semibold text-slate-700">{anc.target}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>{new Date(anc.createdAt).toLocaleDateString()}</span>
                </span>
              </div>
            </Card>
          );
        })}

        {announcements.length === 0 && !loading && (
          <div className="col-span-full py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Megaphone className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Chưa có thông báo nào</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Nhấn nút &ldquo;Tạo Thông Báo Mới&rdquo; để gửi tin tức hoặc phát hành popup cảnh báo tới Dashboard người dùng.
            </p>
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowCreateModal(true)}
                icon={<Plus className="w-4 h-4" />}
              >
                Tạo Thông Báo Đầu Tiên
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Soạn Thông Báo Cho Khách Hàng"
        subtitle="Phát hành thông điệp hệ thống hoặc popup tự động tới Dashboard người dùng"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Tiêu Đề Thông Báo</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors"
              placeholder="VD: Cập nhật server Anycast mới và khuyến mãi nạp ví..."
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Nội Dung Chi Tiết</label>
            <textarea
              rows={4}
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs text-slate-900 focus-ring transition-colors leading-relaxed"
              placeholder="Nhập nội dung thông điệp chi tiết gửi tới khách hàng..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Kiểu Huy Hiệu (Type)</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus-ring transition-colors"
              >
                <option value="info">Info (Xanh dương - Tin tức)</option>
                <option value="success">Success (Xanh lá - Khuyến mãi)</option>
                <option value="warning">Warning (Vàng - Bảo trì)</option>
                <option value="alert">Alert (Đỏ - Khẩn cấp)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Đối Tượng Nhận</label>
              <select
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value as any)}
                className="w-full px-4 py-2.5 rounded-full bg-slate-50/80 hover:bg-white focus:bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus-ring transition-colors"
              >
                <option value="all">Tất cả người dùng</option>
                <option value="customers">Khách hàng thông thường</option>
                <option value="agencies">Chủ Agency / Thuê Panel</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900">Hiển Thị Dưới Dạng Popup Modal</p>
              <p className="text-[11px] text-slate-500">Bật cửa sổ modal tự động khi khách vào Dashboard</p>
            </div>
            <button
              type="button"
              onClick={() => setNewIsPopup(!newIsPopup)}
              className="cursor-pointer focus-ring rounded-full"
            >
              {newIsPopup ? (
                <ToggleRight className="w-6 h-6 text-purple-600" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-300" />
              )}
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={() => setShowCreateModal(false)}
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
              {creating ? 'Đang Tạo...' : 'Phát Hành Thông Báo'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
