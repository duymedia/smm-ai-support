import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sparkles, X, Megaphone } from 'lucide-react';

export const AnnouncementMarquee: React.FC = () => {
  const { siteConfig, language } = useApp();
  const [dismissed, setDismissed] = useState(false);

  const isActive = Boolean(siteConfig?.headerAnnouncementActive && siteConfig?.headerAnnouncementBar);

  if (!isActive || dismissed) return null;

  return (
    <div
      style={{
        background: 'linear-gradient(90deg, #1e293b, #0f172a, #1e293b)',
        borderBottom: '1px solid rgba(59, 130, 246, 0.25)'
      }}
      className="w-full text-white text-xs py-2 px-3 sm:px-4 relative z-40 overflow-hidden shadow-xs flex items-center justify-between"
    >
      <div className="flex items-center gap-2.5 overflow-hidden flex-1 mr-2">
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-extrabold uppercase tracking-wider shrink-0">
          <Megaphone className="w-3 h-3 text-blue-400 animate-bounce" />
          <span>{language === 'vi' ? 'Thông Báo' : 'Notice'}</span>
        </div>

        <div className="overflow-hidden whitespace-nowrap w-full">
          <div className="inline-block animate-marquee pl-4 hover:pause">
            <span className="font-semibold text-slate-200 text-xs sm:text-sm tracking-wide">
              {siteConfig?.headerAnnouncementBar}
            </span>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setDismissed(true)}
        className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer"
        title="Đóng thông báo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

