import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Search, Check } from 'lucide-react';

export interface Select2Option {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  icon?: any;
  image?: string;
}

interface Select2Props {
  value: string;
  options: Select2Option[];
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
}

export const Select2: React.FC<Select2Props> = ({
  value,
  options = [],
  onChange,
  label,
  placeholder = 'Chọn một tùy chọn...',
  className = '',
  buttonClassName = '',
  disabled = false,
}) => {
  const safeOptions = Array.isArray(options) ? options : [];
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 0,
    openUpward: false,
  });

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuHeight = Math.min(safeOptions.length * 40 + 50, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUp = spaceBelow < menuHeight && rect.top > menuHeight;

    setCoords({
      top: shouldOpenUp ? Math.max(10, rect.top - menuHeight - 4) : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      openUpward: shouldOpenUp,
    });
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const onScrollOrResize = () => updatePosition();
      window.addEventListener('scroll', onScrollOrResize, true);
      window.addEventListener('resize', onScrollOrResize);
      return () => {
        window.removeEventListener('scroll', onScrollOrResize, true);
        window.removeEventListener('resize', onScrollOrResize);
      };
    }
  }, [isOpen, safeOptions.length]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const selectedOption = safeOptions.find((o) => o.value === value) || safeOptions[0];
  const filteredOptions = safeOptions.filter((o) =>
    (o.label || '').toLowerCase().includes(search.toLowerCase())
  );

  const SelectedIcon = selectedOption?.icon;

  return (
    <div className={`relative w-full ${className}`}>
      {label && <label className="block font-bold text-slate-700 mb-1 text-xs">{label}</label>}

      {/* Select2 Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all text-left text-xs font-semibold cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.image ? (
            <img
              src={selectedOption.image}
              alt=""
              className="w-5 h-5 rounded-full object-contain shrink-0 bg-white border border-slate-200 shadow-2xs"
              onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
            />
          ) : SelectedIcon ? (
            <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <SelectedIcon className="w-3 h-3" />
            </div>
          ) : null}
          <span className="text-slate-900 font-bold block truncate leading-tight">
            {selectedOption?.label || placeholder}
          </span>
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {/* Portal Menu mounted to document.body */}
      {isOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'fixed',
              top: coords.top,
              left: coords.left,
              width: coords.width,
              zIndex: 999999,
            }}
            className="bg-white rounded-xl border border-slate-200 shadow-xl py-1 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto"
          >
            {/* Search Box in Select2 if options > 3 */}
            {options.length > 3 && (
              <div className="px-2.5 pb-1.5 mb-1 border-b border-slate-100">
                <div className="relative">
                  <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-full pl-7 pr-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:outline-hidden focus:border-blue-500"
                    autoFocus
                  />
                </div>
              </div>
            )}

            <div className="px-1 space-y-0.5">
              {filteredOptions.length === 0 ? (
                <div className="p-2.5 text-center text-xs text-slate-400">Không tìm thấy lựa chọn</div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === value;
                  const OptIcon = opt.icon;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                        setSearch('');
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isSelected
                          ? 'bg-blue-50 text-blue-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50 font-medium'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {opt.image ? (
                          <img
                            src={opt.image}
                            alt=""
                            className="w-5 h-5 rounded-full object-contain shrink-0 bg-white border border-slate-200 shadow-2xs"
                            onError={(e) => ((e.target as HTMLElement).style.display = 'none')}
                          />
                        ) : OptIcon ? (
                          <div
                            className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                              isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            <OptIcon className="w-3 h-3" />
                          </div>
                        ) : null}
                        <div className="min-w-0">
                          <span className="block truncate leading-tight">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="block text-[10px] text-slate-400 truncate mt-0.5">{opt.sublabel}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {opt.badge && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isSelected ? 'bg-blue-200 text-blue-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {opt.badge}
                          </span>
                        )}
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
