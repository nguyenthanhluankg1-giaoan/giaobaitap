import React from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Assignment, Submission } from '../../types/index.ts';
import { MathText } from '../common/MathText.tsx';
import {
  Award,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  BookOpen,
  X,
  FileText,
  Sparkles,
} from 'lucide-react';

interface Props {
  assignment: Assignment;
  submission: Submission;
  isOpen: boolean;
  onClose: () => void;
}

export const ViewResultModal: React.FC<Props> = ({
  assignment,
  submission,
  isOpen,
  onClose,
}) => {
  const { users } = useApp();
  if (!isOpen) return null;

  const teacher = users.find((u) => u.role === 'teacher');
  const percentage = Math.round((submission.totalScore / submission.maxScore) * 100);

  let gradeLabel = 'Cần cố gắng';
  let gradeColor = 'from-rose-500 to-amber-500';
  if (percentage >= 90) {
    gradeLabel = 'Xuất sắc';
    gradeColor = 'from-emerald-500 to-teal-600';
  } else if (percentage >= 80) {
    gradeLabel = 'Giỏi';
    gradeColor = 'from-blue-500 to-indigo-600';
  } else if (percentage >= 65) {
    gradeLabel = 'Khá';
    gradeColor = 'from-indigo-500 to-purple-600';
  } else if (percentage >= 50) {
    gradeLabel = 'Trung bình';
    gradeColor = 'from-amber-500 to-orange-500';
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Award className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kết Quả Bài Làm & Nhận Xét Của Giáo Viên
              </h2>
              <p className="text-xs text-slate-500">{assignment.title}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800 text-xs">
          {/* Score Header Card */}
          <div className={`p-6 rounded-2xl bg-gradient-to-r ${gradeColor} text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
                Xếp loại: {gradeLabel}
              </span>
              <h3 className="text-2xl sm:text-3xl font-black mt-1">
                {submission.totalScore} / {submission.maxScore} Điểm
              </h3>
              <p className="text-white/80 text-xs mt-0.5">
                Đạt {percentage}% tổng điểm • Thời gian làm: {Math.round(submission.timeSpentSeconds / 60)} phút
              </p>
            </div>

            <div className="flex items-center gap-3 bg-black/15 p-3 rounded-xl backdrop-blur-xs">
              <div className="text-center px-2">
                <div className="text-[11px] text-white/80">Trắc nghiệm</div>
                <div className="text-lg font-bold">{submission.multipleChoiceScore} đ</div>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="text-center px-2">
                <div className="text-[11px] text-white/80">Tự luận</div>
                <div className="text-lg font-bold">{submission.essayScore} đ</div>
              </div>
            </div>
          </div>

          {/* Teacher Feedback Card (Core Requirement) */}
          <div className="bg-amber-50/80 border-2 border-amber-200/80 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                  {teacher?.fullName?.charAt(0) || 'G'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    <span>{teacher?.fullName || 'Giáo viên phụ trách'}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                      Giáo viên bộ môn
                    </span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    {submission.gradedAt
                      ? `Đã nhận xét lúc ${new Date(submission.gradedAt).toLocaleDateString('vi-VN')}`
                      : 'Đang hoàn tất nhận xét'}
                  </span>
                </div>
              </div>
              <MessageSquare className="w-5 h-5 text-amber-600" />
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-amber-200 text-slate-800 text-xs sm:text-sm leading-relaxed shadow-xs">
              {submission.teacherFeedback ? (
                <p className="whitespace-pre-wrap">{submission.teacherFeedback}</p>
              ) : (
                <p className="text-slate-400 italic">Giáo viên đang hoàn tất lời phê.</p>
              )}
            </div>
          </div>

          {/* Question by question detailed review */}
          <div className="space-y-4">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Xem Lại Chi Tiết Từng Câu Hỏi & Lời Giải
            </h3>

            {assignment.questions.map((q, idx) => {
              const ans = submission.answers[q.id];
              const isMC = q.type === 'multiple_choice';
              const isCorrect = isMC ? ans?.isCorrect : (ans?.score || 0) >= q.points * 0.5;

              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold ${
                          isCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      >
                        {isCorrect ? '✓' : '✕'}
                      </span>
                      <span className="font-bold text-slate-800">Câu {idx + 1}</span>
                      <span className="text-[11px] text-slate-400">
                        ({isMC ? 'Trắc nghiệm' : 'Tự luận'})
                      </span>
                    </div>

                    <div className="font-bold text-xs">
                      <span className={isCorrect ? 'text-emerald-600' : 'text-rose-600'}>
                        {ans?.score || 0}
                      </span>{' '}
                      / {q.points} điểm
                    </div>
                  </div>

                  <div className="font-medium text-slate-900 text-xs leading-relaxed">
                    <MathText text={q.content} />
                  </div>

                  {/* Multiple Choice Review */}
                  {isMC && (
                    <div className="space-y-1.5 pt-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        {q.options?.map((opt, optIdx) => {
                          const isStudentSelected = ans?.selectedOption === optIdx;
                          const isCorrectOpt = q.correctOptionIndex === optIdx;

                          let style = 'border-slate-200 bg-slate-50 text-slate-700';
                          if (isStudentSelected && isCorrectOpt) {
                            style = 'border-emerald-500 bg-emerald-50 text-emerald-800 font-bold';
                          } else if (isStudentSelected && !isCorrectOpt) {
                            style = 'border-rose-400 bg-rose-50 text-rose-800 font-bold';
                          } else if (isCorrectOpt) {
                            style = 'border-emerald-400 bg-emerald-50/50 text-emerald-800 font-semibold';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded border flex items-center justify-between ${style}`}
                            >
                              <MathText text={opt} />
                              {isStudentSelected && (
                                <span className="text-[10px] ml-1 uppercase font-bold shrink-0">
                                  (Em đã chọn)
                                </span>
                              )}
                              {isCorrectOpt && !isStudentSelected && (
                                <span className="text-[10px] text-emerald-600 font-bold ml-1 shrink-0">
                                  (Đáp án đúng)
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-lg text-blue-950 text-[11px] leading-relaxed mt-2">
                          <span className="font-bold">Lời giải thích:</span> <MathText text={q.explanation} />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Essay Review */}
                  {!isMC && (
                    <div className="space-y-2 pt-1">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[11px] font-bold text-slate-600 mb-1">
                          Bài làm của em:
                        </div>
                        <div className="whitespace-pre-wrap text-slate-800 text-xs leading-relaxed">
                          {ans?.essayText ? (
                            <MathText text={ans.essayText} />
                          ) : (
                            <span className="italic text-slate-400">Không có câu trả lời.</span>
                          )}
                        </div>
                      </div>

                      {/* Teacher specific note */}
                      {ans?.teacherNote && (
                        <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px]">
                          <strong>Nhận xét từ giáo viên:</strong> {ans.teacherNote}
                        </div>
                      )}

                      {/* Sample answer */}
                      {q.sampleAnswer && (
                        <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200/70 text-emerald-950 text-[11px] leading-relaxed">
                          <strong>Đáp án mẫu tham khảo:</strong> <MathText text={q.sampleAnswer} />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
          >
            Đã xem xong
          </button>
        </div>
      </div>
    </div>
  );
};
