import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { AssignmentRepository } from './AssignmentRepository.tsx';
import { TeacherGradingView } from './TeacherGradingView.tsx';
import { ClassAnalyticsView } from './ClassAnalyticsView.tsx';
import { StudentManager } from './StudentManager.tsx';
import { CreateAssignmentModal } from './CreateAssignmentModal.tsx';
import { ApiKeyModal } from '../common/ApiKeyModal.tsx';
import {
  BookOpen,
  FileCheck,
  BarChart3,
  Users,
  Plus,
  Sparkles,
  Layers,
  Key,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const { currentUser, submissions, assignments } = useApp();
  const [activeTab, setActiveTab] = useState<'assignments' | 'grading' | 'analytics' | 'students'>(
    'assignments'
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [selectedAssignmentForAnalytics, setSelectedAssignmentForAnalytics] = useState<string | null>(null);
  const [selectedAssignmentForGrading, setSelectedAssignmentForGrading] = useState<string | null>(null);

  const hasCustomKey = typeof window !== 'undefined' && !!localStorage.getItem('custom_gemini_api_key');

  // Submissions count needing review
  const pendingCount = submissions.filter((s) => s.status === 'submitted').length;

  const handleOpenAnalytics = (assignmentId: string) => {
    setSelectedAssignmentForAnalytics(assignmentId);
    setActiveTab('analytics');
  };

  const handleOpenGrading = (assignmentId: string) => {
    setSelectedAssignmentForGrading(assignmentId);
    setActiveTab('grading');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'assignments'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Kho Đề & Giao Bài</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">
              {assignments.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grading')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'grading'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>Chấm Điểm & Phê Nhận Xét</span>
            {pendingCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 bg-amber-400 text-slate-900 font-black rounded-full animate-pulse">
                {pendingCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Thống Kê Tiến Độ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('students')}
            className={`py-2 px-3.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Quản Lý Học Sinh</span>
          </button>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsApiKeyModalOpen(true)}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
              hasCustomKey
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Cấu hình Google Gemini API Key để soạn đề bằng AI"
          >
            <Key className="w-3.5 h-3.5 text-amber-500" />
            <span>{hasCustomKey ? '🟢 Gemini API Key (Cá nhân)' : '🔑 Dán Gemini API Key'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold text-xs shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>+ Tạo Đề Mới Từ PDF</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'assignments' && (
        <AssignmentRepository
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onViewAnalytics={handleOpenAnalytics}
          onViewSubmissions={handleOpenGrading}
        />
      )}

      {activeTab === 'grading' && (
        <TeacherGradingView initialAssignmentId={selectedAssignmentForGrading} />
      )}

      {activeTab === 'analytics' && (
        <ClassAnalyticsView selectedAssignmentId={selectedAssignmentForAnalytics} />
      )}

      {activeTab === 'students' && <StudentManager />}

      {/* Create Assignment Modal */}
      <CreateAssignmentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => setActiveTab('assignments')}
      />

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
};
