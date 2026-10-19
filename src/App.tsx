import React from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { LoginView } from './components/auth/LoginView.tsx';
import { TeacherDashboard } from './components/teacher/TeacherDashboard.tsx';
import { StudentDashboard } from './components/student/StudentDashboard.tsx';
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();

  if (!currentUser) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800">
      <Navbar />

      <main className="flex-1 pb-16">
        {currentUser.role === 'admin' ? (
          <AdminDashboard />
        ) : currentUser.role === 'teacher' ? (
          <TeacherDashboard />
        ) : (
          <StudentDashboard />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-slate-800 font-bold">EduHomework</strong> — Hệ thống giao bài tập về nhà & chấm điểm tự động thông minh
          </div>
          <div className="text-[11px] text-slate-400">
            Hỗ trợ tạo đề trắc nghiệm & tự luận từ PDF • Phân quyền Giáo viên & Học sinh
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
