import React, { useState, useEffect } from 'react';
import { testGeminiApiKey } from '../../utils/aiGenerator.ts';
import { Key, CheckCircle2, AlertCircle, ExternalLink, X, Eye, EyeOff, Sparkles, Trash2, RefreshCw } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onKeySaved?: () => void;
}

export const ApiKeyModal: React.FC<Props> = ({ isOpen, onClose, onKeySaved }) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedKey = localStorage.getItem('custom_gemini_api_key') || '';
      setApiKey(storedKey);
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    const trimmed = apiKey.trim();
    if (!trimmed) {
      localStorage.removeItem('custom_gemini_api_key');
      setTestResult({ success: false, message: 'Đã xóa API key cá nhân.' });
      if (onKeySaved) onKeySaved();
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const res = await testGeminiApiKey(trimmed);
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      localStorage.setItem('custom_gemini_api_key', trimmed);
      if (onKeySaved) onKeySaved();
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('custom_gemini_api_key');
    setApiKey('');
    setTestResult({ success: true, message: 'Đã xóa API Key cá nhân thành công.' });
    if (onKeySaved) onKeySaved();
  };

  const hasKeyStored = !!localStorage.getItem('custom_gemini_api_key');

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Cấu Hình Google Gemini API Key</h3>
              <p className="text-xs text-slate-500">Dán API Key cá nhân để sử dụng AI soạn câu hỏi tự động</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-slate-800 text-xs">
          {/* Status Badge */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="font-semibold text-slate-600">Trạng thái kết nối API:</span>
            {hasKeyStored ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Đã lưu API Key cá nhân
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Dùng hệ thống mặc định
              </span>
            )}
          </div>

          {/* Input field */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Nhập Google Gemini API Key (Bắt đầu bằng AIzaSy...):
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                title={showKey ? 'Ẩn key' : 'Hiện key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * API Key của bạn được lưu an toàn trực tiếp trên trình duyệt web cá nhân (localStorage) và chỉ sử dụng để tạo đề thi với Google Gemini.
            </p>
          </div>

          {/* Direct link to get key */}
          <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="text-[11px] text-indigo-900">
              Chưa có API Key? Bạn có thể tạo miễn phí từ Google:
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-xs transition-all shrink-0 cursor-pointer"
            >
              <span>Lấy API Key ↗</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Test result message */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2 text-xs leading-relaxed ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>{testResult.message}</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {hasKeyStored ? (
            <button
              type="button"
              onClick={handleClearKey}
              className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa API Key</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleSaveAndTest}
              disabled={isTesting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kiểm tra kết nối...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Lưu & Kiểm Tra API Key</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
