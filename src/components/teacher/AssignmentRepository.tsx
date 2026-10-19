import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Assignment } from '../../types/index.ts';
import { MathText } from '../common/MathText.tsx';
import {
  BookOpen,
  Plus,
  FileText,
  Clock,
  Calendar,
  Send,
  Users,
  Trash2,
  CheckCircle2,
  FileCheck,
  Search,
  Check,
  Eye,
  X,
  HelpCircle,
} from 'lucide-react';

interface Props {
  onOpenCreateModal: () => void;
  onViewAnalytics: (assignmentId: string) => void;
  onViewSubmissions: (assignmentId: string) => void;
}

export const AssignmentRepository: React.FC<Props> = ({
  onOpenCreateModal,
  onViewAnalytics,
  onViewSubmissions,
}) => {
  const { assignments, updateAssignment, deleteAssignment, submissions, users } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [dispatchModalAssignment, setDispatchModalAssignment] = useState<Assignment | null>(null);
  const [previewAssignment, setPreviewAssignment] = useState<Assignment | null>(null);
  const [deleteConfirmAssignment, setDeleteConfirmAssignment] = useState<Assignment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteToast, setDeleteToast] = useState('');
  const [targetClass, setTargetClass] = useState('10A1');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  const handleDeleteQuestionFromAssignment = (qIdx: number) => {
    if (!previewAssignment) return;
    if (previewAssignment.questions.length <= 1) {
      alert('Bài tập phải giữ ít nhất 1 câu hỏi! Nếu muốn xóa toàn bộ đề, hãy bấm nút "Xóa đề thi này".');
      return;
    }
    const updatedQuestions = previewAssignment.questions.filter((_, idx) => idx !== qIdx);
    const updatedTotalPoints = updatedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);
    const updatedAssignment: Assignment = {
      ...previewAssignment,
      questions: updatedQuestions,
      totalPoints: updatedTotalPoints,
    };
    setPreviewAssignment(updatedAssignment);
    updateAssignment(updatedAssignment);
    setDeleteToast(`Đã xóa câu hỏi số ${qIdx + 1} khỏi đề thi thành công!`);
    setTimeout(() => setDeleteToast(''), 3000);
  };

  const students = users.filter((u) => u.role === 'student');

  const subjects = ['all', ...Array.from(new Set(assignments.map((a) => a.subject)))];
  const grades = ['all', ...Array.from(new Set(assignments.map((a) => a.grade)))];

  const filteredAssignments = assignments.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || a.subject === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || a.grade === selectedGrade;
    return matchesSearch && matchesSubject && matchesGrade;
  });

  const handleDispatch = (assignment: Assignment) => {
    setDispatchModalAssignment(assignment);
    setTargetClass(assignment.assignedClass || '10A1');
    setDispatchSuccess(false);
  };

  const confirmDispatch = () => {
    setDispatchSuccess(true);
    setTimeout(() => {
      setDispatchModalAssignment(null);
      setDispatchSuccess(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-xs mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Kho Đề Thi & Bài Tập Riêng Biệt</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Quản Lý & Lựa Chọn Đề Bài Tập Về Nhà
          </h1>
          <p className="text-indigo-100 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            Mỗi bài đề được lưu trữ độc lập. Giáo viên có thể upload tài liệu PDF, tự động trích xuất câu hỏi trắc nghiệm & tự luận, và giao bài tập chỉ với một cú nhấp.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreateModal}
          className="px-5 py-3 rounded-xl bg-white text-indigo-700 hover:bg-indigo-50 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Tạo & Tải Lên Đề Mới (PDF)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm bài tập theo tên bài, khối lớp, môn học, từ khóa..."
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Khối lớp:</span>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
            >
              <option value="all">Tất cả khối lớp</option>
              {grades
                .filter((g) => g !== 'all')
                .map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 whitespace-nowrap font-medium">Môn học:</span>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === 'all' ? 'Tất cả các môn' : sub}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Assignments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssignments.map((assignment) => {
          const assignSubmissions = submissions.filter((s) => s.assignmentId === assignment.id);
          const mcCount = assignment.questions.filter((q) => q.type === 'multiple_choice').length;
          const essayCount = assignment.questions.filter((q) => q.type === 'essay').length;
          const submissionCount = assignSubmissions.length;
          const totalClassStudents = students.length;

          return (
            <div
              key={assignment.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              {/* Card top */}
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/50">
                    {assignment.subject} • {assignment.grade}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{assignment.durationMinutes > 0 ? `${assignment.durationMinutes}p` : 'K.giới hạn'}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmAssignment(assignment);
                      }}
                      className="ml-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Xóa bài tập này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug group-hover:text-indigo-600 transition-colors line-clamp-2">
                  {assignment.title}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {assignment.description}
                </p>

                {/* PDF attachment indicator */}
                {assignment.pdfFileName ? (
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs text-slate-700">
                    <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span className="truncate text-[11px] font-medium">{assignment.pdfFileName}</span>
                    {assignment.pdfFileSize && (
                      <span className="text-[10px] text-slate-400 shrink-0">({assignment.pdfFileSize})</span>
                    )}
                  </div>
                ) : null}

                {/* Question composition pills */}
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

              {/* Card bottom / stats & actions */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Đã nộp: <strong className="text-slate-800">{submissionCount}/{totalClassStudents}</strong></span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Hạn: {new Date(assignment.dueDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all"
                    style={{
                      width: `${totalClassStudents > 0 ? (submissionCount / totalClassStudents) * 100 : 0}%`,
                    }}
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-5 gap-1 pt-1">
                  <button
                    type="button"
                    onClick={() => setPreviewAssignment(assignment)}
                    className="py-1.5 px-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                    title="Xem chi tiết các câu hỏi trong đề"
                  >
                    <BookOpen className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="truncate">Xem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDispatch(assignment)}
                    className="py-1.5 px-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-0.5 shadow-xs transition-colors cursor-pointer"
                    title="Giao bài tập này cho học sinh"
                  >
                    <Send className="w-3 h-3 shrink-0" />
                    <span className="truncate">Giao</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewSubmissions(assignment.id)}
                    className="py-1.5 px-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                    title="Xem các bài nộp & chấm điểm"
                  >
                    <FileCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="truncate">Chấm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onViewAnalytics(assignment.id)}
                    className="py-1.5 px-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                    title="Xem thống kê phổ điểm & tiến độ"
                  >
                    <Eye className="w-3 h-3 text-indigo-600 shrink-0" />
                    <span className="truncate">T.kê</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteConfirmAssignment(assignment)}
                    className="py-1.5 px-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold flex items-center justify-center gap-0.5 transition-colors cursor-pointer"
                    title="Xóa bài tập này"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600 shrink-0" />
                    <span className="truncate">Xóa</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Assignment Questions Modal */}
      {previewAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                  Chi Tiết Đề Bài & Câu Hỏi ({previewAssignment.questions.length} câu)
                </span>
                <h3 className="font-bold text-base text-slate-900 mt-0.5">
                  {previewAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewAssignment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-4 flex-1 text-slate-800 text-xs">
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-slate-600">
                  <strong className="text-slate-900">Môn học:</strong> {previewAssignment.subject} • {previewAssignment.grade}
                </div>
                <div className="text-slate-600">
                  <strong className="text-slate-900">Thời gian:</strong> {previewAssignment.durationMinutes} phút • <strong className="text-slate-900">Tổng điểm:</strong> {previewAssignment.totalPoints} đ
                </div>
              </div>

              {previewAssignment.questions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.type === 'multiple_choice'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                      </span>
                      <span className="font-bold text-slate-900">Câu {idx + 1}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-indigo-600 text-[11px]">{q.points} điểm</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestionFromAssignment(idx)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                        title="Xóa câu hỏi này khỏi đề thi"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="font-semibold text-slate-900 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                    <MathText text={q.content} />
                  </div>

                  {q.type === 'multiple_choice' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      {q.options?.map((opt, optIdx) => {
                        const isCorrect = q.correctOptionIndex === optIdx;
                        return (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-lg border flex items-center justify-between ${
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-800 font-semibold'
                                : 'border-slate-200 bg-slate-50 text-slate-700'
                            }`}
                          >
                            <MathText text={opt} />
                            {isCorrect && (
                              <span className="text-[10px] text-emerald-700 font-bold ml-1 shrink-0">
                                (Đáp án đúng)
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {q.explanation && (
                    <div className="p-2 bg-blue-50/60 rounded border border-blue-100 text-blue-950 text-[11px]">
                      <span className="font-bold">Giải thích:</span> <MathText text={q.explanation} />
                    </div>
                  )}

                  {q.rubric && (
                    <div className="p-2 bg-amber-50/60 rounded border border-amber-100 text-amber-950 text-[11px]">
                      <span className="font-bold">Barem rubric:</span> <MathText text={q.rubric} />
                    </div>
                  )}

                  {q.sampleAnswer && (
                    <div className="p-2 bg-emerald-50/60 rounded border border-emerald-100 text-emerald-950 text-[11px]">
                      <span className="font-bold">Đáp án mẫu:</span> <MathText text={q.sampleAnswer} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  const toDelete = previewAssignment;
                  setPreviewAssignment(null);
                  setDeleteConfirmAssignment(toDelete);
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Xóa đề thi này</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewAssignment(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {dispatchModalAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Giao Bài Tập Về Nhà
              </h3>
              <button
                onClick={() => setDispatchModalAssignment(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100 text-xs">
              <div className="font-bold text-indigo-900">{dispatchModalAssignment.title}</div>
              <div className="text-indigo-700 mt-0.5">
                {dispatchModalAssignment.subject} • {dispatchModalAssignment.questions.length} câu hỏi • Tổng {dispatchModalAssignment.totalPoints} điểm
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Chọn lớp nhận bài tập:
                </label>
                <select
                  value={targetClass}
                  onChange={(e) => setTargetClass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium text-slate-800"
                >
                  <option value="10A1">Lớp 10A1 (Toàn bộ 5 học sinh)</option>
                  <option value="10A2">Lớp 10A2</option>
                  <option value="Toàn khối 10">Toàn khối 10</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Danh sách học sinh nhận bài:
                </label>
                <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  {students.map((st) => (
                    <div key={st.id} className="flex items-center justify-between py-1 px-2 bg-white rounded border border-slate-100 text-[11px]">
                      <span className="font-medium text-slate-800">{st.fullName}</span>
                      <span className="text-slate-400">@{st.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {dispatchSuccess ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Đã giao bài tập thành công cho học sinh!
              </div>
            ) : (
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDispatchModalAssignment(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={confirmDispatch}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Xác nhận giao bài
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmAssignment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                Xác Nhận Xóa Bài Tập Về Nhà
              </h3>
              <button
                onClick={() => setDeleteConfirmAssignment(null)}
                className="text-slate-400 hover:text-slate-600 text-sm p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-rose-50/80 rounded-xl border border-rose-200/80 text-xs space-y-1">
              <div className="font-bold text-rose-950">{deleteConfirmAssignment.title}</div>
              <div className="text-rose-800">
                Môn {deleteConfirmAssignment.subject} • {deleteConfirmAssignment.grade} • {deleteConfirmAssignment.questions.length} câu hỏi
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bài tập về nhà này? Thao tác này sẽ xóa vĩnh viễn bài tập và tất cả dữ liệu bài làm/chấm điểm liên quan của học sinh khỏi hệ thống.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAssignment(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!deleteConfirmAssignment) return;
                  setIsDeleting(true);
                  await deleteAssignment(deleteConfirmAssignment.id);
                  setIsDeleting(false);
                  setDeleteConfirmAssignment(null);
                  setDeleteToast('Đã xóa bài tập về nhà thành công!');
                  setTimeout(() => setDeleteToast(''), 3000);
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {deleteToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200 border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{deleteToast}</span>
        </div>
      )}
    </div>
  );
};
