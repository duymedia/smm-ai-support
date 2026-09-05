import React, { useState, useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Quote,
  Code,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link,
  Unlink,
  Highlighter,
  ChevronDown,
  Undo,
  Redo,
  RemoveFormatting,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Nhập nội dung...',
  minHeight = '140px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isCodeView, setIsCodeView] = useState(false);
  const [htmlCode, setHtmlCode] = useState(value || '');
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [bgColorPickerOpen, setBgColorPickerOpen] = useState(false);
  const [alignDropdownOpen, setAlignDropdownOpen] = useState(false);
  const [formatDropdownOpen, setFormatDropdownOpen] = useState(false);
  const [fontSizeDropdownOpen, setFontSizeDropdownOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('Normal');
  const [selectedFontSize, setSelectedFontSize] = useState('Normal');

  // Sync initial and external changes to editor
  useEffect(() => {
    setHtmlCode(value || '');
    if (editorRef.current && !isCodeView) {
      if (editorRef.current.innerHTML !== (value || '')) {
        editorRef.current.innerHTML = value || '';
      }
    }
  }, [value, isCodeView]);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlCode(html);
      onChange(html);
    }
  };

  const exec = (command: string, arg: string | undefined = undefined) => {
    if (isCodeView) return;
    document.execCommand(command, false, arg);
    handleInput();
  };

  const handleInsertLink = () => {
    const url = prompt('Nhập địa chỉ liên kết (URL):', 'https://');
    if (url && url.trim() !== '' && url !== 'https://') {
      exec('createLink', url.trim());
    }
  };

  const TEXT_COLORS = [
    '#000000', '#334155', '#475569', '#64748b', '#2563eb',
    '#4f46e5', '#7c3aed', '#059669', '#d97706', '#dc2626',
    '#e11d48', '#0891b2', '#ffffff'
  ];

  const BG_COLORS = [
    'transparent', '#f1f5f9', '#dbeafe', '#ede9fe', '#dcfce7',
    '#fef3c7', '#fee2e2', '#ffe4e6', '#cffafe', '#334155'
  ];

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
      {/* TOOLBAR HEADER - FULL FEATURED */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50/90 border-b border-slate-200 text-slate-700 select-none">
        {/* 1. Basic Style Actions */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => exec('bold')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="In đậm (Bold - Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => exec('italic')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="In nghiêng (Italic - Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => exec('underline')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Gạch chân (Underline - Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Gạch ngang (Strikethrough)"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Blockquote & Code View */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => exec('formatBlock', 'blockquote')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Trích dẫn (Blockquote)"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (isCodeView) {
                if (editorRef.current) {
                  editorRef.current.innerHTML = htmlCode;
                }
              }
              setIsCodeView(!isCodeView);
            }}
            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
              isCodeView ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-100 hover:text-slate-900'
            }`}
            title="Xem mã nguồn HTML (Source Code)"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Lists */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Danh sách dấu chấm (Bullet List)"
          >
            <List className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Danh sách số (Numbered List)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* 4. Alignments Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setAlignDropdownOpen(!alignDropdownOpen);
              setColorPickerOpen(false);
              setBgColorPickerOpen(false);
              setFormatDropdownOpen(false);
              setFontSizeDropdownOpen(false);
            }}
            className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:bg-slate-100 text-xs font-semibold cursor-pointer"
            title="Căn lề (Alignment)"
          >
            <AlignLeft className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {alignDropdownOpen && (
            <div className="absolute left-0 mt-1 w-32 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 flex flex-col">
              <button
                type="button"
                onClick={() => {
                  exec('justifyLeft');
                  setAlignDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-left"
              >
                <AlignLeft className="w-3.5 h-3.5" />
                <span>Căn trái</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('justifyCenter');
                  setAlignDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-left"
              >
                <AlignCenter className="w-3.5 h-3.5" />
                <span>Căn giữa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('justifyRight');
                  setAlignDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-left"
              >
                <AlignRight className="w-3.5 h-3.5" />
                <span>Căn phải</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('justifyFull');
                  setAlignDropdownOpen(false);
                }}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 cursor-pointer text-left"
              >
                <AlignJustify className="w-3.5 h-3.5" />
                <span>Căn đều</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. Text Color (A) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setColorPickerOpen(!colorPickerOpen);
              setBgColorPickerOpen(false);
              setAlignDropdownOpen(false);
              setFormatDropdownOpen(false);
              setFontSizeDropdownOpen(false);
            }}
            className="flex items-center gap-1 px-2 py-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:bg-slate-100 text-xs font-black cursor-pointer"
            title="Màu chữ (Text Color)"
          >
            <span className="text-sm leading-none border-b-2 border-blue-600 font-serif">A</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {colorPickerOpen && (
            <div className="absolute left-0 mt-1 p-2 bg-white rounded-xl border border-slate-200 shadow-xl z-30 grid grid-cols-4 gap-1.5 w-40">
              {TEXT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    exec('foreColor', c);
                    setColorPickerOpen(false);
                  }}
                  style={{ backgroundColor: c }}
                  className="w-7 h-7 rounded-lg border border-slate-300 shadow-2xs hover:scale-110 transition-transform cursor-pointer"
                />
              ))}
            </div>
          )}
        </div>

        {/* 6. Background Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setBgColorPickerOpen(!bgColorPickerOpen);
              setColorPickerOpen(false);
              setAlignDropdownOpen(false);
              setFormatDropdownOpen(false);
              setFontSizeDropdownOpen(false);
            }}
            className="p-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:bg-slate-100 cursor-pointer"
            title="Màu nền / Highlight (Background Color)"
          >
            <Highlighter className="w-4 h-4 text-amber-600" />
          </button>

          {bgColorPickerOpen && (
            <div className="absolute left-0 mt-1 p-2 bg-white rounded-xl border border-slate-200 shadow-xl z-30 grid grid-cols-4 gap-1.5 w-40">
              {BG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    exec('hiliteColor', c);
                    setBgColorPickerOpen(false);
                  }}
                  style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                  className="w-7 h-7 rounded-lg border border-slate-300 shadow-2xs hover:scale-110 transition-transform cursor-pointer relative"
                  title={c}
                >
                  {c === 'transparent' && <span className="text-[9px] text-red-500 font-bold">✕</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 7. Format Paragraph / Headings */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setFormatDropdownOpen(!formatDropdownOpen);
              setFontSizeDropdownOpen(false);
              setColorPickerOpen(false);
              setBgColorPickerOpen(false);
              setAlignDropdownOpen(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:bg-slate-100 text-xs font-semibold cursor-pointer min-w-[85px] justify-between"
          >
            <span className="truncate">{selectedFormat}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {formatDropdownOpen && (
            <div className="absolute left-0 mt-1 w-36 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 flex flex-col">
              <button
                type="button"
                onClick={() => {
                  exec('formatBlock', 'p');
                  setSelectedFormat('Normal');
                  setFormatDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-xs text-left hover:bg-slate-50 cursor-pointer"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('formatBlock', 'h2');
                  setSelectedFormat('Heading 1');
                  setFormatDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-sm font-bold text-left hover:bg-slate-50 cursor-pointer"
              >
                Heading 1
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('formatBlock', 'h3');
                  setSelectedFormat('Heading 2');
                  setFormatDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-bold text-left hover:bg-slate-50 cursor-pointer"
              >
                Heading 2
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('formatBlock', 'h4');
                  setSelectedFormat('Heading 3');
                  setFormatDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-left hover:bg-slate-50 cursor-pointer"
              >
                Heading 3
              </button>
            </div>
          )}
        </div>

        {/* 8. Font Size Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setFontSizeDropdownOpen(!fontSizeDropdownOpen);
              setFormatDropdownOpen(false);
              setColorPickerOpen(false);
              setBgColorPickerOpen(false);
              setAlignDropdownOpen(false);
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs hover:bg-slate-100 text-xs font-semibold cursor-pointer min-w-[85px] justify-between"
          >
            <span className="truncate">{selectedFontSize}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {fontSizeDropdownOpen && (
            <div className="absolute left-0 mt-1 w-32 bg-white rounded-xl border border-slate-200 shadow-xl py-1 z-30 flex flex-col">
              <button
                type="button"
                onClick={() => {
                  exec('fontSize', '2');
                  setSelectedFontSize('Small');
                  setFontSizeDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-[11px] text-left hover:bg-slate-50 cursor-pointer"
              >
                Small
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('fontSize', '3');
                  setSelectedFontSize('Normal');
                  setFontSizeDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-xs text-left hover:bg-slate-50 cursor-pointer"
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('fontSize', '4');
                  setSelectedFontSize('Medium');
                  setFontSizeDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-sm text-left hover:bg-slate-50 cursor-pointer font-medium"
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => {
                  exec('fontSize', '5');
                  setSelectedFontSize('Large');
                  setFontSizeDropdownOpen(false);
                }}
                className="px-3 py-1.5 text-base text-left hover:bg-slate-50 cursor-pointer font-bold"
              >
                Large
              </button>
            </div>
          )}
        </div>

        {/* 9. Link & Remove Formatting */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={handleInsertLink}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-blue-600 transition-colors cursor-pointer"
            title="Chèn liên kết (Link)"
          >
            <Link className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => exec('unlink')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Gỡ liên kết (Unlink)"
          >
            <Unlink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => exec('removeFormat')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Xóa toàn bộ định dạng (Clear Formatting)"
          >
            <RemoveFormatting className="w-4 h-4" />
          </button>
        </div>

        {/* 10. Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-white p-0.5 rounded-lg border border-slate-200/80 shadow-2xs ml-auto">
          <button
            type="button"
            onClick={() => exec('undo')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Hoàn tác (Undo - Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            className="p-1.5 rounded-md hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer"
            title="Làm lại (Redo - Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* EDITOR CONTENT AREA */}
      {isCodeView ? (
        <textarea
          rows={6}
          value={htmlCode}
          onChange={(e) => {
            setHtmlCode(e.target.value);
            onChange(e.target.value);
          }}
          style={{ minHeight }}
          className="w-full p-4 font-mono text-xs text-slate-800 bg-slate-900 text-slate-100 focus:outline-hidden resize-y"
          placeholder="Mã HTML thô..."
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          style={{ minHeight }}
          className="w-full p-4 text-xs sm:text-sm text-slate-800 focus:outline-hidden overflow-y-auto leading-relaxed prose prose-sm max-w-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
          data-placeholder={placeholder}
        />
      )}
    </div>
  );
};

