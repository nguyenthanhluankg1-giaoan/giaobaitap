import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  GraduationCap,
  LogOut,
  UserCheck,
  RotateCcw,
  Sparkles,
  ChevronDown,
  BookOpen,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, users, logout, switchUser, resetToSampleData } = useApp();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  const admins = users.filter((u) => u.role === 'admin');
  const teachers = users.filter((u) => u.role === 'teacher');
  const students = users.filter((u) => u.role === 'student');

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">EduHomework</span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                AI Powered
              </span>
              <span className="text-[10px] font-medium flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Firebase Firestore
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">Hệ thống giao bài tập & chấm điểm • Lưu trữ Google Firebase</p>
          </div>
        </div>

        {/* User profile & Switcher */}
        {currentUser ? (
          <div className="flex items-center gap-3">
            {/* Quick Demo Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors border border-slate-200"
                title="Chuyển đổi nhanh vai trò để kiểm thử"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden md:inline">Đổi tài khoản thử nghiệm</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showSwitchMenu && (
                <div
                  className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-[85vh] overflow-y-auto"
                  onClick={() => setShowSwitchMenu(false)}
                >
                  {/* Giáo Viên & Quản Trị Viên section */}
                  <div className="px-3 py-1.5 text-[11px] font-bold text-indigo-700 uppercase tracking-wider bg-indigo-50/70 flex items-center justify-between">
                    <span>Giáo Viên & Quản Trị Viên</span>
                  </div>
                  {admins.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => switchUser(a)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-purple-50/70 ${
                        currentUser.id === a.id ? 'bg-purple-50 text-purple-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-[10px]">
                          AD
                        </div>
                        <div>
                          <div>{a.fullName} <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded font-bold">Admin</span></div>
                          <div className="text-[10px] text-slate-400">@{a.username}</div>
                        </div>
                      </div>
                      {currentUser.id === a.id && <UserCheck className="w-4 h-4 text-purple-600" />}
                    </button>
                  ))}
                  {teachers.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => switchUser(t)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-indigo-50/70 ${
                        currentUser.id === t.id ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                          GV
                        </div>
                        <div>
                          <div>{t.fullName}</div>
                          <div className="text-[10px] text-slate-400">@{t.username} • {t.teachingSubject || 'Bộ môn'}</div>
                        </div>
                      </div>
                      {currentUser.id === t.id && <UserCheck className="w-4 h-4 text-indigo-600" />}
                    </button>
                  ))}

                  <div className="border-t border-slate-100 my-1.5" />

                  <div className="px-3 py-1.5 text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50/50">
                    Học Sinh (Làm bài, nộp bài, xem điểm)
                  </div>
                  {students.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => switchUser(s)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-emerald-50/70 ${
                        currentUser.id === s.id ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-[10px]">
                          HS
                        </div>
                        <div>
                          <div>{s.fullName}</div>
                          <div className="text-[10px] text-slate-400">@{s.username} • Lớp {s.classId}</div>
                        </div>
                      </div>
                      {currentUser.id === s.id && <UserCheck className="w-4 h-4 text-emerald-600" />}
                    </button>
                  ))}

                  <div className="border-t border-slate-100 my-1.5" />
                  <button
                    onClick={resetToSampleData}
                    className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Khôi phục dữ liệu mẫu ban đầu
                  </button>
                </div>
              )}
            </div>

            {/* Current user badge */}
            <div className="flex items-center gap-3 pl-2 sm:border-l sm:border-slate-200">
              <div
                className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-sm ring-2 ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-700 ring-purple-200'
                    : currentUser.role === 'teacher'
                    ? 'bg-indigo-600 ring-indigo-100'
                    : 'bg-emerald-600 ring-emerald-100'
                }`}
              >
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1.5">
                  {currentUser.fullName}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-700'
                        : currentUser.role === 'teacher'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {currentUser.role === 'admin'
                      ? 'Admin'
                      : currentUser.role === 'teacher'
                      ? 'Giáo viên'
                      : 'Học sinh'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentUser.role === 'admin'
                    ? 'Quản trị hệ thống'
                    : currentUser.role === 'teacher'
                    ? 'Bộ môn ' + (currentUser.teachingSubject || 'Toán học')
                    : 'Lớp ' + (currentUser.classId || '10A1')}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                title="Đăng xuất"
                aria-label="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Chưa đăng nhập</span>
          </div>
        )}
      </div>
    </header>
  );
};
