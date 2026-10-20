import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Assignment, Submission } from '../../types/index.ts';
import { TakeTestModal } from './TakeTestModal.tsx';
import { ViewResultModal } from './ViewResultModal.tsx';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Play,
  FileCheck,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, assignments, submissions } = useApp();
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');

  const [takingAssignment, setTakingAssignment] = useState<Assignment | null>(null);
  const [viewingResult, setViewingResult] = useState<{
    assignment: Assignment;
    submission: Submission;
  } | null>(null);
  const [deletedToast, setDeletedToast] = useState<string | null>(null);

  // Real-time auto-close if the assignment currently being worked on is deleted by the teacher
  React.useEffect(() => {
    if (takingAssignment) {
      const stillExists = assignments.some(
        (a) => a.id === takingAssignment.id && (a as any).status !== 'deleted' && !(a as any).isDeleted
      );
      if (!stillExists) {
        setTakingAssignment(null);
        setDeletedToast(
          `Bài tập "${takingAssignment.title}" vừa được Giáo viên thu hồi/xóa khỏi hệ thống. Bài thi đã tự động đóng lại.`
        );
        setTimeout(() => setDeletedToast(null), 6000);
      }
    }
  }, [assignments, takingAssignment]);

  // Real-time auto-close if the viewing result modal assignment was deleted
  React.useEffect(() => {
    if (viewingResult) {
      const stillExists = assignments.some(
        (a) => a.id === viewingResult.assignment.id && (a as any).status !== 'deleted' && !(a as any).isDeleted
      );
      if (!stillExists) {
        setViewingResult(null);
        setDeletedToast(
          `Bài tập "${viewingResult.assignment.title}" đã được Giáo viên xóa khỏi hệ thống.`
        );
        setTimeout(() => setDeletedToast(null), 5000);
      }
    }
  }, [assignments, viewingResult]);

  if (!currentUser) return null;

  // Student's submissions
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser.id);

  // Categorize assignments (filtering out any deleted assignments)
  const completedAssignments: Array<{ assignment: Assignment; submission: Submission }> = [];
  const pendingAssignments: Assignment[] = [];

  assignments.forEach((assignment) => {
    if ((assignment as any).status === 'deleted' || (assignment as any).isDeleted) return;
    const sub = mySubmissions.find((s) => s.assignmentId === assignment.id);
    if (sub) {
      completedAssignments.push({ assignment, submission: sub });
    } else {
      pendingAssignments.push(assignment);
    }
  });

  // Calculate student average
  const totalMyScore = completedAssignments.reduce((acc, c) => acc + c.submission.totalScore, 0);
  const totalMyMax = completedAssignments.reduce((acc, c) => acc + c.submission.maxScore, 0);
  const avgScore =
    totalMyMax > 0 ? (Math.round((totalMyScore / totalMyMax) * 100) / 10).toFixed(1) : '—';

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Student Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl font-black ring-4 ring-white/10 shrink-0">
            {currentUser.fullName.charAt(0)}
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold backdrop-blur-xs mb-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Cổng Học Sinh • Lớp {currentUser.classId || '10A1'}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Xin chào, {currentUser.fullName}!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
              Tài khoản: <strong className="text-white">@{currentUser.username}</strong>. Hãy hoàn thành các bài tập đúng hạn để nhận điểm cao và lời phê từ thầy cô nhé.
            </p>
          </div>
        </div>

        {/* Student summary metrics */}
        <div className="flex items-center gap-2 bg-black/15 p-3 rounded-xl backdrop-blur-xs shrink-0 text-center">
          <div className="px-3">
            <div className="text-[11px] text-emerald-100">Cần làm</div>
            <div className="text-xl font-black text-amber-300">{pendingAssignments.length}</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="px-3">
            <div className="text-[11px] text-emerald-100">Đã nộp</div>
            <div className="text-xl font-black text-white">{completedAssignments.length}</div>
          </div>
          <div className="w-px h-8 bg-white/20" />
          <div className="px-3">
            <div className="text-[11px] text-emerald-100">Điểm TB</div>
            <div className="text-xl font-black text-white">{avgScore}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Bài Tập Cần Làm</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">
            {pendingAssignments.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('completed')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'completed'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-100'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã Hoàn Thành & Lời Phê</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">
            {completedAssignments.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Pending Homework */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          {pendingAssignments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-base">Tuyệt vời!</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Em đã hoàn thành tất cả các bài tập về nhà được giao hiện tại. Hãy nghỉ ngơi hoặc xem lại các bài đã làm nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pendingAssignments.map((assignment) => {
                const mcCount = assignment.questions.filter((q) => q.type === 'multiple_choice').length;
                const essayCount = assignment.questions.filter((q) => q.type === 'essay').length;

                return (
                  <div
                    key={assignment.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                          {assignment.subject} • {assignment.grade}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{assignment.durationMinutes > 0 ? `${assignment.durationMinutes} phút` : 'K.giới hạn'}</span>
                        </div>
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-emerald-700 transition-colors">
                        {assignment.title}
                      </h3>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {assignment.description}
                      </p>

                      <div className="flex items-center gap-2 pt-1 text-xs">
                        <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium text-[11px]">
                          {mcCount} Trắc nghiệm
                        </span>
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium text-[11px]">
                          {essayCount} Tự luận
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 ml-auto">
                          {assignment.totalPoints} điểm
                        </span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setTakingAssignment(assignment)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-100 flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Làm bài ngay</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Completed Homework */}
      {activeTab === 'completed' && (
        <div className="space-y-4">
          {completedAssignments.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <p className="text-xs text-slate-500">Chưa có bài tập nào được nộp.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {completedAssignments.map(({ assignment, submission }) => {
                const isGraded = submission.status === 'graded';
                const pct = Math.round((submission.totalScore / submission.maxScore) * 100);

                return (
                  <div
                    key={submission.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700">
                          {assignment.subject}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isGraded
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {isGraded ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Đã có nhận xét
                            </>
                          ) : (
                            'Đã nộp • Chờ duyệt'
                          )}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug">
                            {assignment.title}
                          </h3>
                          <div className="text-[11px] text-slate-500 mt-1">
                            Nộp lúc: {new Date(submission.submittedAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>

                        {/* Score badge */}
                        <div className="text-right shrink-0">
                          <div className="text-2xl font-black text-indigo-700">
                            {submission.totalScore}
                            <span className="text-xs text-slate-400 font-semibold">
                              /{submission.maxScore}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                            {pct}% điểm
                          </span>
                        </div>
                      </div>

                      {/* Teacher's note highlight snippet */}
                      {submission.teacherFeedback && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1 text-xs">
                          <div className="flex items-center gap-1.5 text-amber-900 font-bold text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5 text-amber-600" />
                            <span>Lời phê từ Giáo viên:</span>
                          </div>
                          <p className="text-slate-700 italic line-clamp-2 leading-relaxed">
                            "{submission.teacherFeedback}"
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">
                        TN: <strong>{submission.multipleChoiceScore}đ</strong> • TL: <strong>{submission.essayScore}đ</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => setViewingResult({ assignment, submission })}
                        className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Xem Lại Bài & Lời Phê</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {takingAssignment && (
        <TakeTestModal
          assignment={takingAssignment}
          isOpen={!!takingAssignment}
          onClose={() => setTakingAssignment(null)}
          onFinished={() => {
            const finishedAssignment = takingAssignment;
            setTakingAssignment(null);
            setActiveTab('completed');
            // View result right away
            const updatedSub = submissions.find((s) => s.assignmentId === finishedAssignment.id);
            if (updatedSub) {
              setViewingResult({ assignment: finishedAssignment, submission: updatedSub });
            }
          }}
        />
      )}

      {viewingResult && (
        <ViewResultModal
          assignment={viewingResult.assignment}
          submission={viewingResult.submission}
          isOpen={!!viewingResult}
          onClose={() => setViewingResult(null)}
        />
      )}

      {/* Floating Notice when Teacher deletes an assignment in real-time */}
      {deletedToast && (
        <div className="fixed bottom-5 right-5 left-5 sm:left-auto z-50 bg-slate-900/95 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex-1 text-xs">
            <div className="font-bold text-amber-300">Thông báo từ Giáo viên</div>
            <div className="text-slate-200 mt-0.5">{deletedToast}</div>
          </div>
          <button
            type="button"
            onClick={() => setDeletedToast(null)}
            className="p-1 text-slate-400 hover:text-white rounded-lg text-xs"
          >
            Đóng
          </button>
        </div>
      )}
    </div>
  );
};
