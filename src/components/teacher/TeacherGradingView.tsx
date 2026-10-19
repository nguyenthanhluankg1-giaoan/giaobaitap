import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Submission, QuestionAnswer } from '../../types/index.ts';
import { MathText } from '../common/MathText.tsx';
import {
  FileCheck,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Save,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Filter,
} from 'lucide-react';

interface Props {
  initialAssignmentId?: string | null;
}

export const TeacherGradingView: React.FC<Props> = ({ initialAssignmentId }) => {
  const { assignments, submissions, gradeSubmission, users } = useApp();
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    initialAssignmentId || 'all'
  );
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);

  // Editable fields during grading
  const [editingAnswers, setEditingAnswers] = useState<Record<string, QuestionAnswer>>({});
  const [teacherFeedback, setTeacherFeedback] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Filter submissions
  const filteredSubmissions = submissions.filter((s) => {
    if (selectedAssignmentId !== 'all' && s.assignmentId !== selectedAssignmentId) {
      return false;
    }
    return true;
  });

  const openGradingModal = (sub: Submission) => {
    setGradingSubmission(sub);
    setEditingAnswers(JSON.parse(JSON.stringify(sub.answers)));
    setTeacherFeedback(sub.teacherFeedback || '');
    setSaveSuccess(false);
  };

  const handleScoreChange = (qId: string, newScore: number, maxPoints: number) => {
    const clamped = Math.max(0, Math.min(maxPoints, newScore));
    setEditingAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        score: clamped,
      },
    }));
  };

  const handleQuestionNoteChange = (qId: string, note: string) => {
    setEditingAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        teacherNote: note,
      },
    }));
  };

  const handleSaveGrading = () => {
    if (!gradingSubmission) return;
    gradeSubmission(gradingSubmission.id, editingAnswers, teacherFeedback);
    setSaveSuccess(true);
    setTimeout(() => {
      setGradingSubmission(null);
      setSaveSuccess(false);
    }, 1200);
  };

  // Get current assignment context for grading modal
  const activeAssignment = gradingSubmission
    ? assignments.find((a) => a.id === gradingSubmission.assignmentId)
    : null;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-indigo-600" />
            Chấm Điểm & Phê Nhận Xét Bài Tập Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phần trắc nghiệm được hệ thống tự động chấm 100%. Giáo viên duyệt điểm tự luận và gửi nhận xét đến học sinh.
          </p>
        </div>

        {/* Filter by assignment */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedAssignmentId}
            onChange={(e) => setSelectedAssignmentId(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 font-medium"
          >
            <option value="all">Tất cả các bài tập</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.subject})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Submissions List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Học Sinh</th>
                <th className="py-3 px-4">Tên Bài Tập</th>
                <th className="py-3 px-4">Thời Gian Nộp</th>
                <th className="py-3 px-4 text-center">Trắc Nghiệm</th>
                <th className="py-3 px-4 text-center">Tự Luận</th>
                <th className="py-3 px-4 text-center">Tổng Điểm</th>
                <th className="py-3 px-4 text-center">Trạng Thái</th>
                <th className="py-3 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    Chưa có bài nộp nào cho tiêu chí này.
                  </td>
                </tr>
              ) : (
                filteredSubmissions.map((sub) => {
                  const assign = assignments.find((a) => a.id === sub.assignmentId);
                  const isGraded = sub.status === 'graded';

                  return (
                    <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {sub.studentName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800">{sub.studentName}</div>
                            <div className="text-[11px] text-slate-400">Lớp 10A1</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {assign?.title || 'Bài tập'}
                        </div>
                        <div className="text-[11px] text-slate-400">{assign?.subject}</div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        <div>{new Date(sub.submittedAt).toLocaleDateString('vi-VN')}</div>
                        <div className="text-[11px] text-slate-400">
                          {Math.round(sub.timeSpentSeconds / 60)} phút làm bài
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-blue-600">
                        {sub.multipleChoiceScore} đ
                      </td>

                      <td className="py-3.5 px-4 text-center font-semibold text-emerald-600">
                        {sub.essayScore} đ
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-extrabold text-sm text-slate-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          {sub.totalScore}/{sub.maxScore}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
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
                              Đã phê duyệt
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              Chờ phê duyệt
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openGradingModal(sub)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold text-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>{isGraded ? 'Xem & Chỉnh sửa' : 'Chấm & Nhận xét'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Grading Modal */}
      {gradingSubmission && activeAssignment && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
              <div>
                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                  Chấm Bài & Phê Nhận Xét
                </div>
                <h3 className="font-black text-slate-900 text-base">
                  {gradingSubmission.studentName} — {activeAssignment.title}
                </h3>
              </div>
              <button
                onClick={() => setGradingSubmission(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800 text-xs">
              {/* Question list for grading */}
              <div className="space-y-4">
                {activeAssignment.questions.map((q, idx) => {
                  const studentAns = editingAnswers[q.id];
                  const isMC = q.type === 'multiple_choice';

                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-xl border ${
                        isMC ? 'border-blue-100 bg-blue-50/20' : 'border-emerald-100 bg-emerald-50/20'
                      } space-y-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isMC ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {isMC ? 'Trắc nghiệm' : 'Tự luận'}
                          </span>
                          <span className="font-bold text-slate-800">Câu {idx + 1}</span>
                          <span className="text-slate-400">• Tối đa: {q.points} điểm</span>
                        </div>

                        {/* Question score adjust */}
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-600">Điểm chấm:</span>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            max={q.points}
                            value={studentAns?.score ?? 0}
                            onChange={(e) =>
                              handleScoreChange(q.id, Number(e.target.value), q.points)
                            }
                            className="w-16 px-2 py-1 text-center font-bold bg-white border border-slate-300 rounded text-xs"
                          />
                          <span className="font-semibold text-slate-500">/ {q.points}</span>
                        </div>
                      </div>

                      {/* Question text */}
                      <div className="font-medium text-slate-800 text-xs leading-relaxed">
                        <MathText text={q.content} />
                      </div>

                      {/* Multiple Choice details */}
                      {isMC && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                            {q.options?.map((opt, optIdx) => {
                              const isSelected = studentAns?.selectedOption === optIdx;
                              const isCorrectOption = q.correctOptionIndex === optIdx;

                              let badgeClass = 'border-slate-200 bg-slate-50 text-slate-700';
                              if (isSelected && isCorrectOption) {
                                badgeClass = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                              } else if (isSelected && !isCorrectOption) {
                                badgeClass = 'border-rose-400 bg-rose-50 text-rose-800 font-bold';
                              } else if (isCorrectOption) {
                                badgeClass = 'border-emerald-300 bg-emerald-50/40 text-emerald-700';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2 rounded border flex items-center justify-between ${badgeClass}`}
                                >
                                  <MathText text={opt} />
                                  {isSelected && (
                                    <span className="text-[10px] uppercase font-bold ml-1 shrink-0">
                                      (Học sinh chọn)
                                    </span>
                                  )}
                                  {isCorrectOption && !isSelected && (
                                    <span className="text-[10px] text-emerald-600 font-semibold ml-1 shrink-0">
                                      (Đáp án đúng)
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                          {q.explanation && (
                            <div className="text-[11px] text-slate-500 pt-1">
                              <strong>Giải thích:</strong> <MathText text={q.explanation} />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Essay student response & teacher comment */}
                      {!isMC && (
                        <div className="space-y-3">
                          <div className="p-3 bg-white rounded-lg border border-emerald-200 space-y-1.5">
                            <div className="text-[11px] font-bold text-slate-600 flex items-center justify-between">
                              <span>Bài làm của học sinh:</span>
                              <span className="text-slate-400 text-[10px]">
                                {(studentAns?.essayText || '').split(/\s+/).filter(Boolean).length} từ
                              </span>
                            </div>
                            <div className="p-2.5 bg-slate-50 rounded text-slate-800 leading-relaxed whitespace-pre-wrap text-xs">
                              {studentAns?.essayText ? (
                                <MathText text={studentAns.essayText} />
                              ) : (
                                <span className="text-slate-400 italic">Học sinh không điền câu trả lời.</span>
                              )}
                            </div>
                          </div>

                          {/* Rubric reference */}
                          {q.rubric && (
                            <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200/70 text-[11px] text-amber-900">
                              <span className="font-bold">Barem chấm gợi ý:</span> <MathText text={q.rubric} />
                            </div>
                          )}

                          {/* Specific question note by teacher */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">
                              Nhận xét câu này cho học sinh:
                            </label>
                            <input
                              type="text"
                              value={studentAns?.teacherNote || ''}
                              onChange={(e) => handleQuestionNoteChange(q.id, e.target.value)}
                              placeholder="Ví dụ: Lập luận tốt, cần chú ý thêm kết luận..."
                              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Overall Teacher Feedback */}
              <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                <label className="font-bold text-xs text-indigo-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  Lời Phê & Nhận Xét Tổng Quát Của Giáo Viên (Gửi trực tiếp cho học sinh)
                </label>
                <textarea
                  rows={3}
                  value={teacherFeedback}
                  onChange={(e) => setTeacherFeedback(e.target.value)}
                  placeholder="Ghi lời khen ngợi, nhắc nhở hoặc hướng dẫn học sinh cải thiện bài làm..."
                  className="w-full px-3 py-2 border border-indigo-300 rounded-lg bg-white text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
              <button
                type="button"
                onClick={() => setGradingSubmission(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
              >
                Đóng
              </button>

              {saveSuccess ? (
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                  <Check className="w-4 h-4 text-emerald-600" />
                  Đã lưu điểm và gửi nhận xét thành công!
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSaveGrading}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-100 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Lưu Điểm & Gửi Nhận Xét Cho Học Sinh</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
