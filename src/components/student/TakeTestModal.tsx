import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Assignment } from '../../types/index.ts';
import { MathText } from '../common/MathText.tsx';
import confetti from 'canvas-confetti';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  X,
  FileText,
  HelpCircle,
} from 'lucide-react';

interface Props {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
}

export const TakeTestModal: React.FC<Props> = ({
  assignment,
  isOpen,
  onClose,
  onFinished,
}) => {
  const { submitHomework } = useApp();

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { selectedOption?: number; essayText?: string }>
  >({});
  const [timeLeft, setTimeLeft] = useState(
    assignment.durationMinutes > 0 ? assignment.durationMinutes * 60 : 3600
  );
  const [timeSpent, setTimeSpent] = useState(0);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
      if (assignment.durationMinutes > 0) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, assignment.durationMinutes]);

  if (!isOpen) return null;

  const currentQ = assignment.questions[currentQuestionIdx];
  const totalQuestions = assignment.questions.length;

  const handleSelectOption = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        selectedOption: optIdx,
      },
    }));
  };

  const handleEssayTextChange = (qId: string, text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...prev[qId],
        essayText: text,
      },
    }));
  };

  const answeredCount = assignment.questions.filter((q) => {
    const a = answers[q.id];
    if (q.type === 'multiple_choice') return a?.selectedOption !== undefined;
    return a?.essayText && a.essayText.trim().length > 0;
  }).length;

  const handleAutoSubmit = () => {
    doSubmit();
  };

  const doSubmit = () => {
    setIsSubmitting(true);
    try {
      submitHomework(assignment.id, answers, timeSpent);
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setIsSubmitting(false);
        onFinished();
      }, 600);
    } catch (e) {
      console.error(e);
      setIsSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[96vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
        {/* Test Header */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              {assignment.subject}
            </span>
            <div className="truncate max-w-sm sm:max-w-md">
              <h2 className="font-bold text-sm truncate">{assignment.title}</h2>
              <span className="text-[11px] text-slate-400">
                Lớp {assignment.assignedClass} • {totalQuestions} câu hỏi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Countdown timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-xl text-amber-400 border border-slate-700 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <button
              onClick={() => {
                if (confirm('Bạn có muốn tạm dừng và thoát không? Tiến độ hiện tại chưa được nộp.')) {
                  onClose();
                }
              }}
              className="text-slate-400 hover:text-white p-1"
              title="Thoát"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Question Navigator */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Question buttons navigator */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            {assignment.questions.map((q, idx) => {
              const a = answers[q.id];
              const isAnswered =
                q.type === 'multiple_choice'
                  ? a?.selectedOption !== undefined
                  : a?.essayText && a.essayText.trim().length > 0;
              const isCurrent = idx === currentQuestionIdx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div className="text-xs text-slate-600 font-semibold flex items-center gap-2">
            <span>Tiến độ:</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {answeredCount}/{totalQuestions} câu đã làm
            </span>
          </div>
        </div>

        {/* Question Area */}
        <div className="overflow-y-auto p-6 flex-1 text-slate-800 space-y-5">
          {currentQ && (
            <div className="space-y-4">
              {/* Question metadata badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      currentQ.type === 'multiple_choice'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {currentQ.type === 'multiple_choice' ? 'Câu hỏi Trắc nghiệm' : 'Câu hỏi Tự luận'}
                  </span>
                  <span className="font-black text-sm text-slate-900">
                    Câu {currentQuestionIdx + 1} / {totalQuestions}
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {currentQ.points} điểm
                </span>
              </div>

              {/* Question stem */}
              <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <MathText text={currentQ.content} />
              </div>

              {/* Options for Multiple Choice */}
              {currentQ.type === 'multiple_choice' && (
                <div className="space-y-2.5 pt-2">
                  <div className="text-xs font-semibold text-slate-500">
                    Chọn một đáp án đúng nhất:
                  </div>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentQ.options?.map((option, optIdx) => {
                      const isSelected = answers[currentQ.id]?.selectedOption === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/70 text-indigo-900 ring-2 ring-indigo-500/30'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600'
                                  : 'border-slate-300 text-slate-500 bg-slate-50'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <MathText text={option} />
                          </div>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Textarea for Essay */}
              {currentQ.type === 'essay' && (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Soạn thảo câu trả lời tự luận:</span>
                    <span className="text-slate-400">
                      {((answers[currentQ.id]?.essayText || '').split(/\s+/).filter(Boolean).length)} từ
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={answers[currentQ.id]?.essayText || ''}
                    onChange={(e) => handleEssayTextChange(currentQ.id, e.target.value)}
                    placeholder="Nhập nội dung bài làm của em tại đây, trình bày đầy đủ các bước lập luận, chứng minh và kết luận..."
                    className="w-full p-3.5 border border-slate-300 rounded-xl text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                  />
                  {currentQ.rubric && (
                    <div className="p-3 bg-slate-100 rounded-lg text-slate-600 text-[11px] leading-relaxed">
                      <strong>Gợi ý yêu cầu:</strong> {currentQ.rubric}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation & Submit */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
            className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Câu trước</span>
          </button>

          <div className="flex items-center gap-2">
            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>Câu tiếp theo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp Bài</span>
            </button>
          </div>
        </div>

        {/* Confirm Submit Dialog */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Xác Nhận Nộp Bài Tập?</h3>
              <p className="text-xs text-slate-600">
                Em đã hoàn thành <strong className="text-emerald-700">{answeredCount}/{totalQuestions}</strong> câu hỏi.
                {answeredCount < totalQuestions && (
                  <span className="block text-rose-600 mt-1 font-semibold">
                    (Vẫn còn {totalQuestions - answeredCount} câu chưa trả lời)
                  </span>
                )}
              </p>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Kiểm tra lại
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={doSubmit}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <span>{isSubmitting ? 'Đang nộp...' : 'Đồng ý nộp'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
