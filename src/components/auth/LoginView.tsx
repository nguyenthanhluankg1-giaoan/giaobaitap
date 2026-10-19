import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  GraduationCap,
  KeyRound,
  User as UserIcon,
  ShieldCheck,
  BookOpenCheck,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export const LoginView: React.FC = () => {
  const { login, users } = useApp();
  const [activeTab, setActiveTab] = useState<'teacher' | 'student'>('teacher');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();

    if (!trimmedUsername) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }

    // Check account role to ensure proper tab usage
    const targetUser = users.find(
      (u) => u.username.toLowerCase() === trimmedUsername.toLowerCase()
    );

    if (targetUser) {
      if (activeTab === 'teacher' && targetUser.role === 'student') {
        setError('Tài khoản học sinh vui lòng chuyển sang mục "Dành Cho Học Sinh".');
        return;
      }
      if (activeTab === 'student' && (targetUser.role === 'teacher' || targetUser.role === 'admin')) {
        setError('Tài khoản Giáo viên / Admin vui lòng chuyển sang mục "Dành Cho Giáo Viên & Quản Trị".');
        return;
      }
    }

    const defaultPwd = trimmedUsername.toLowerCase() === 'admin' ? 'admin123' : '123';
    const success = login(trimmedUsername, trimmedPassword || defaultPwd);

    if (!success) {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-blue-50/40 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200">
          <GraduationCap className="w-9 h-9" />
        </div>
        <h2 className="mt-4 text-3xl font-extrabold text-slate-900 tracking-tight">
          EduHomework
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Cổng thông tin giao bài tập, chấm điểm tự động & quản lý giáo viên, học sinh
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Dữ liệu đồng bộ trực tiếp với Google Firebase (Firestore)
          </span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {/* Merged Role Selector Tabs: Giáo Viên & Quản Trị vs Học Sinh */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs sm:text-sm">
            <button
              type="button"
              onClick={() => {
                setActiveTab('teacher');
                setError('');
                setUsername('');
                setPassword('');
              }}
              className={`py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'teacher'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Dành Cho Giáo Viên & Quản Trị</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('student');
                setError('');
                setUsername('');
                setPassword('');
              }}
              className={`py-2.5 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpenCheck className="w-4 h-4" />
              <span>Dành Cho Học Sinh</span>
            </button>
          </div>

          {/* Role Description Banner */}
          <div
            className={`p-3.5 rounded-xl mb-6 text-xs flex items-start gap-2.5 ${
              activeTab === 'teacher'
                ? 'bg-indigo-50 border border-indigo-200 text-indigo-950'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-950'
            }`}
          >
            {activeTab === 'teacher' ? (
              <>
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-indigo-900">Mục Giáo Viên & Quản Trị Viên:</span> Đăng nhập để soạn bài từ PDF, giao bài tập, chấm điểm tự động, xem thống kê tiến độ hoặc quản lý hệ thống & cấp tài khoản giáo viên/học sinh.
                  <div className="text-[11px] text-indigo-700 font-medium mt-1">
                    (Tài khoản Admin: <span className="font-mono font-bold">admin</span> / <span className="font-mono font-bold">admin123</span>)
                  </div>
                </div>
              </>
            ) : (
              <>
                <BookOpenCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold text-emerald-900">Mục Học Sinh:</span> Đăng nhập bằng tài khoản mà thầy cô đã cung cấp để vào làm bài tập về nhà, nộp bài trực tuyến và xem lại lời phê chi tiết cùng điểm số.
                </div>
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form manual login */}
          <form onSubmit={handleManualLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={
                    activeTab === 'teacher'
                      ? 'Ví dụ: gv_nguyenmai hoặc admin'
                      : 'Ví dụ: hs_khoi'
                  }
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu của bạn"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 px-4 rounded-xl text-white font-medium text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                activeTab === 'teacher'
                  ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100'
              }`}
            >
              <span>
                Đăng nhập {activeTab === 'teacher' ? 'Giáo Viên / Quản Trị Viên' : 'Học Sinh'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
