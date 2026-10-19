import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Assignment, Question } from '../../types/index.ts';
import { MathText } from '../common/MathText.tsx';
import { cleanOptionText } from '../../utils/mathUtils.ts';
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
  Grid,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
  const [showMatrixDrawer, setShowMatrixDrawer] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Swipe gesture support on mobile
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

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
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
      setTimeout(() => {
        setIsSubmitting(false);
        onFinished();
      }, 500);
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

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && currentQuestionIdx < totalQuestions - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else if (isRightSwipe && currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const isLowTime = assignment.durationMinutes > 0 && timeLeft < 300;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Container: Fullscreen on mobile, rounded modal on desktop */}
      <div className="bg-white w-full h-full sm:h-auto sm:max-h-[94vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-200 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
        
        {/* Compact Mobile Header */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 shrink-0">
              {assignment.subject}
            </span>
            <div className="truncate min-w-0">
              <h2 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                {assignment.title}
              </h2>
              <span className="text-[10px] sm:text-xs text-slate-400 block truncate">
                Lớp {assignment.assignedClass} • {totalQuestions} câu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Countdown timer badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-xs font-black border transition-all ${
                isLowTime
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
                  : 'bg-slate-800 text-amber-400 border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            <button
              onClick={() => {
                if (confirm('Bạn có muốn tạm dừng và thoát không? Tiến độ làm bài sẽ không được lưu.')) {
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Thoát"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress & Question Selector Bar */}
        <div className="bg-slate-50 px-3 sm:px-6 py-2 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          {/* Question Navigator Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar flex-1">
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
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white shadow-xs'
                      : isAnswered
                      ? 'bg-emerald-500 text-white font-bold'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Matrix Drawer Trigger Button */}
          <button
            type="button"
            onClick={() => setShowMatrixDrawer(true)}
            className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs shrink-0 flex items-center gap-1 cursor-pointer"
            title="Xem ma trận toàn bộ câu hỏi"
          >
            <Grid className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Ma trận</span>
            <span className="text-[11px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-black border border-emerald-200">
              {answeredCount}/{totalQuestions}
            </span>
          </button>
        </div>

        {/* Question View Area with Touch Swipe Support */}
        <div
          className="flex-1 overflow-y-auto p-3.5 sm:p-6 text-slate-800 space-y-4 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentQ && (
            <div className="space-y-3.5 max-w-2xl mx-auto">
              {/* Question metadata badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                      currentQ.type === 'multiple_choice'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {currentQ.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                  </span>
                  <span className="font-black text-sm text-slate-900">
                    Câu {currentQuestionIdx + 1} / {totalQuestions}
                  </span>
                </div>
                <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {currentQ.points} điểm
                </span>
              </div>

              {/* Question stem */}
              <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed bg-slate-50/90 p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
                <MathText text={currentQ.content} />
              </div>

              {/* Options for Multiple Choice */}
              {currentQ.type === 'multiple_choice' && (
                <div className="space-y-2 pt-1">
                  <div className="text-xs font-semibold text-slate-500">
                    Chọn 1 đáp án đúng:
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {currentQ.options?.map((option, optIdx) => {
                      const isSelected = answers[currentQ.id]?.selectedOption === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`w-full min-h-[48px] p-3 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-950 ring-2 ring-indigo-500/30 font-semibold shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-3 pr-2">
                            <span
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black border shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'border-slate-300 text-slate-600 bg-slate-100'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <div className="leading-snug">
                              <MathText text={cleanOptionText(option)} />
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Textarea for Essay */}
              {currentQ.type === 'essay' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                    <span>Soạn thảo bài làm tự luận:</span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {(answers[currentQ.id]?.essayText || '').split(/\s+/).filter(Boolean).length} từ
                    </span>
                  </div>
                  <textarea
                    rows={5}
                    value={answers[currentQ.id]?.essayText || ''}
                    onChange={(e) => handleEssayTextChange(currentQ.id, e.target.value)}
                    placeholder="Nhập nội dung bài làm của em tại đây, trình bày các bước suy luận và đáp số..."
                    className="w-full p-3 sm:p-3.5 border border-slate-300 rounded-xl text-xs sm:text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium shadow-2xs"
                  />
                  {currentQ.rubric && (
                    <div className="p-2.5 bg-amber-50/80 rounded-lg text-amber-900 border border-amber-200/80 text-[11px] leading-relaxed">
                      <strong className="font-bold">Gợi ý yêu cầu:</strong> {currentQ.rubric}
                    </div>
                  )}
                </div>
              )}

              {/* Swipe instruction hint on mobile */}
              <div className="text-center text-[11px] text-slate-400 pt-2 block sm:hidden">
                💡 Vuốt sang trái / phải để chuyển nhanh câu hỏi
              </div>
            </div>
          )}
        </div>

        {/* Sticky Mobile Navigation & Submit Action Bar */}
        <div className="px-3 sm:px-6 py-2.5 sm:py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
            className="px-3 py-2 sm:px-4 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 disabled:opacity-30 transition-all flex items-center gap-1 cursor-pointer min-h-[40px]"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Câu trước</span>
            <span className="sm:hidden">Trước</span>
          </button>

          <div className="flex items-center gap-2">
            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                className="px-3.5 py-2 sm:px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer min-h-[40px]"
              >
                <span className="sm:hidden">Tiếp</span>
                <span className="hidden sm:inline">Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="px-4 py-2 sm:px-5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer min-h-[40px]"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Nộp Bài</span>
            </button>
          </div>
        </div>

        {/* Question Matrix Bottom Drawer Modal (Mobile) */}
        {showMatrixDrawer && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4 border border-slate-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-600" />
                  <span>Ma Trận Câu Hỏi ({answeredCount}/{totalQuestions} đã làm)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMatrixDrawer(false)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-5 gap-2 max-h-[50vh] overflow-y-auto p-1">
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
                      onClick={() => {
                        setCurrentQuestionIdx(idx);
                        setShowMatrixDrawer(false);
                      }}
                      className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isCurrent
                          ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white'
                          : isAnswered
                          ? 'bg-emerald-500 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <span className="text-sm font-black">{idx + 1}</span>
                      <span className="text-[9px] font-medium opacity-90">
                        {isAnswered ? 'Đã làm' : 'Chưa làm'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowMatrixDrawer(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700 cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {/* Confirm Submit Dialog */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-5 text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900">Xác Nhận Nộp Bài Tập?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Em đã hoàn thành <strong className="text-emerald-700 font-bold">{answeredCount}/{totalQuestions}</strong> câu hỏi.
                {answeredCount < totalQuestions && (
                  <span className="block text-rose-600 mt-1 font-bold">
                    ⚠️ Vẫn còn {totalQuestions - answeredCount} câu chưa hoàn thành.
                  </span>
                )}
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer"
                >
                  Kiểm tra lại
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={doSubmit}
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 flex items-center gap-1 cursor-pointer"
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
