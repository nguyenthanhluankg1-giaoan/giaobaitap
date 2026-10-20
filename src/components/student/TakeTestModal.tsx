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
  Type,
  Plus,
  Minus,
} from 'lucide-react';

interface Props {
  assignment: Assignment;
  isOpen: boolean;
  onClose: () => void;
  onFinished: () => void;
}

type FontSize = 'normal' | 'large' | 'xlarge';
const FONT_SIZE_KEY = 'eduhomework_student_font_size';

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

  // Large font preference for students on mobile
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    try {
      const s = localStorage.getItem(FONT_SIZE_KEY) as FontSize;
      return s === 'normal' || s === 'large' || s === 'xlarge' ? s : 'large';
    } catch {
      return 'large';
    }
  });

  const handleSetFontSize = (size: FontSize) => {
    setFontSize(size);
    try {
      localStorage.setItem(FONT_SIZE_KEY, size);
    } catch {}
  };

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

  const handleInsertQuickMath = (symbol: string) => {
    if (!currentQ) return;
    const current = answers[currentQ.id]?.essayText || '';
    handleEssayTextChange(currentQ.id, current ? `${current} ${symbol}` : symbol);
  };

  const answeredCount = assignment.questions.filter((q) => {
    const a = answers[q.id];
    if (q.type === 'multiple_choice') return a?.selectedOption !== undefined;
    return a?.essayText && a.essayText.trim().length > 0;
  }).length;

  const isCurrentAnswered =
    currentQ &&
    (currentQ.type === 'multiple_choice'
      ? answers[currentQ.id]?.selectedOption !== undefined
      : Boolean(answers[currentQ.id]?.essayText && answers[currentQ.id]?.essayText?.trim().length));

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

  // Dynamic Typography sizes based on user preference
  const fontClassStem =
    fontSize === 'xlarge'
      ? 'text-lg sm:text-2xl leading-relaxed font-bold'
      : fontSize === 'large'
      ? 'text-base sm:text-xl leading-relaxed font-bold'
      : 'text-sm sm:text-lg leading-relaxed font-semibold';

  const fontClassOption =
    fontSize === 'xlarge'
      ? 'text-base sm:text-xl font-medium'
      : fontSize === 'large'
      ? 'text-sm sm:text-lg font-medium'
      : 'text-xs sm:text-base font-medium';

  const fontClassBadge =
    fontSize === 'xlarge'
      ? 'w-10 h-10 text-base font-black'
      : fontSize === 'large'
      ? 'w-9 h-9 text-sm font-black'
      : 'w-8 h-8 text-xs font-black';

  const fontClassEssay =
    fontSize === 'xlarge'
      ? 'text-base sm:text-xl'
      : fontSize === 'large'
      ? 'text-sm sm:text-lg'
      : 'text-xs sm:text-base';

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-hidden">
      {/* Container: Fullscreen 100dvh on mobile, max-height modal on desktop */}
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[95vh] sm:max-w-3xl sm:rounded-2xl shadow-2xl flex flex-col border-0 sm:border border-slate-200 overflow-hidden relative">
        
        {/* 1. STICKY TOP HEADER - Pinned securely, never lost */}
        <div className="sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 shrink-0">
              {assignment.subject}
            </span>
            <div className="truncate min-w-0">
              <h2 className="font-bold text-xs sm:text-sm text-white truncate leading-tight">
                {assignment.title}
              </h2>
              <span className="text-[10px] sm:text-xs text-slate-400 block truncate">
                Lớp {assignment.assignedClass || 'Học sinh'} • {totalQuestions} câu hỏi
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Font size controller (A- / A / A+) */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => handleSetFontSize('normal')}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                  fontSize === 'normal'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cỡ chữ Vừa"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('large')}
                className={`px-1.5 py-0.5 rounded text-xs font-bold transition-colors cursor-pointer ${
                  fontSize === 'large'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cỡ chữ Lớn"
              >
                A+
              </button>
              <button
                type="button"
                onClick={() => handleSetFontSize('xlarge')}
                className={`px-1.5 py-0.5 rounded text-sm font-black transition-colors cursor-pointer ${
                  fontSize === 'xlarge'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cỡ chữ Rất Lớn (Dễ đọc nhất)"
              >
                A++
              </button>
            </div>

            {/* Countdown timer badge */}
            <div
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl font-mono text-xs sm:text-sm font-black border transition-all ${
                isLowTime
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600 animate-pulse'
                  : 'bg-slate-800 text-amber-400 border-slate-700'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            {/* Exit button */}
            <button
              onClick={() => {
                if (confirm('Bạn có muốn tạm dừng và thoát không? Tiến độ làm bài sẽ không được lưu.')) {
                  onClose();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Thoát khỏi bài tập"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. STICKY SUB-TOOLBAR - Question Carousel & Progress (Always docked) */}
        <div className="sticky top-[45px] sm:top-[52px] z-20 bg-slate-50 px-3 sm:px-6 py-2 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0 shadow-2xs">
          {/* Question Navigator Carousel */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar flex-1">
            {assignment.questions.map((q, idx) => {
              const a = answers[q.id];
              const isAnswered =
                q.type === 'multiple_choice'
                  ? a?.selectedOption !== undefined
                  : Boolean(a?.essayText && a.essayText.trim().length > 0);
              const isCurrent = idx === currentQuestionIdx;

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-2xs ${
                    isCurrent
                      ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white shadow-sm scale-105'
                      : isAnswered
                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
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
            className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Xem danh sách toàn bộ câu hỏi"
          >
            <Grid className="w-4 h-4 text-indigo-600" />
            <span className="hidden sm:inline font-bold">Ma trận</span>
            <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
              {answeredCount}/{totalQuestions}
            </span>
          </button>
        </div>

        {/* 3. SCROLLABLE QUESTION AREA - Only this section scrolls */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-6 text-slate-800 space-y-4 touch-pan-y"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentQ && (
            <div className="space-y-4 max-w-2xl mx-auto pb-4">
              {/* Question metadata badge */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
                      currentQ.type === 'multiple_choice'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {currentQ.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                  </span>
                  <span className="font-black text-base sm:text-lg text-slate-900">
                    Câu {currentQuestionIdx + 1} / {totalQuestions}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-black text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
                    {currentQ.points} điểm
                  </span>
                </div>
              </div>

              {/* Question stem with Big Typography */}
              <div className={`${fontClassStem} text-slate-950 bg-slate-50/95 p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs`}>
                <MathText text={currentQ.content} />
              </div>

              {/* Options for Multiple Choice */}
              {currentQ.type === 'multiple_choice' && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-600">
                    <span>👉 Chạm để chọn 1 đáp án đúng:</span>
                    {answers[currentQ.id]?.selectedOption !== undefined && (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-4 h-4 text-emerald-600" />
                        Đã chọn câu trả lời
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {currentQ.options?.map((option, optIdx) => {
                      const isSelected = answers[currentQ.id]?.selectedOption === optIdx;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`w-full min-h-[54px] p-3.5 sm:p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer active:scale-[0.99] ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-950 ring-2 ring-indigo-500/40 shadow-xs'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 pr-2 flex-1">
                            <span
                              className={`${fontClassBadge} rounded-xl flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'border border-slate-300 text-slate-700 bg-slate-100'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <div className={`${fontClassOption} leading-relaxed select-none`}>
                              <MathText text={cleanOptionText(option)} />
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="w-6 h-6 text-indigo-600 shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Textarea for Essay */}
              {currentQ.type === 'essay' && (
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm font-bold text-slate-700">
                    <span>✍️ Soạn thảo bài làm tự luận của em:</span>
                    <span className="text-slate-500 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {(answers[currentQ.id]?.essayText || '').split(/\s+/).filter(Boolean).length} từ
                    </span>
                  </div>

                  {/* Quick math symbol toolbar for phone typing */}
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1 no-scrollbar bg-slate-100 p-2 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 shrink-0 mr-1">Chèn nhanh:</span>
                    {['+', '-', '×', '÷', '=', 'x²', '√', '1/2', 'cm²', 'm²', 'ha', 'kg'].map((sym) => (
                      <button
                        key={sym}
                        type="button"
                        onClick={() => handleInsertQuickMath(sym)}
                        className="px-2 py-1 bg-white hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-800 border border-slate-300 shrink-0 shadow-2xs cursor-pointer active:scale-95"
                      >
                        {sym}
                      </button>
                    ))}
                  </div>

                  <textarea
                    rows={6}
                    value={answers[currentQ.id]?.essayText || ''}
                    onChange={(e) => handleEssayTextChange(currentQ.id, e.target.value)}
                    placeholder="Em hãy viết bài làm cẩn thận tại đây, trình bày chi tiết các bước suy luận và đáp số..."
                    className={`w-full p-3.5 sm:p-4 border border-slate-300 rounded-2xl ${fontClassEssay} leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white font-medium shadow-2xs`}
                  />

                  {currentQ.rubric && (
                    <div className="p-3 bg-amber-50/90 rounded-xl text-amber-950 border border-amber-200/90 text-xs sm:text-sm leading-relaxed">
                      <strong className="font-bold text-amber-900">💡 Gợi ý yêu cầu:</strong> {currentQ.rubric}
                    </div>
                  )}
                </div>
              )}

              {/* POST-ANSWER INLINE NEXT STEP PROMPT - Immediate button to advance */}
              {isCurrentAnswered && (
                <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center gap-2.5 text-emerald-900 text-xs sm:text-sm font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      {currentQ.type === 'multiple_choice'
                        ? `Đã chọn đáp án ${String.fromCharCode(65 + (answers[currentQ.id]?.selectedOption ?? 0))}`
                        : 'Đã hoàn thành câu tự luận này'}
                    </span>
                  </div>

                  {currentQuestionIdx < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-indigo-200 transition-all cursor-pointer"
                    >
                      <span>Sang Câu Tiếp Theo ({currentQuestionIdx + 2}/{totalQuestions})</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConfirmSubmit(true)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-md shadow-emerald-200 transition-all cursor-pointer"
                    >
                      <span>Đã xong câu cuối • Nộp bài ngay</span>
                      <Send className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}

              {/* Mobile swipe helper text */}
              <div className="text-center text-[11px] text-slate-400 pt-2 block sm:hidden">
                💡 Vuốt màn hình sang trái / phải để chuyển nhanh giữa các câu hỏi
              </div>
            </div>
          )}
        </div>

        {/* 4. STICKY BOTTOM NAVIGATION BAR - Always docked at bottom, never disappears */}
        <div className="sticky bottom-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] flex items-center justify-between gap-2 shrink-0">
          {/* Previous Question Button */}
          <button
            type="button"
            disabled={currentQuestionIdx === 0}
            onClick={() => setCurrentQuestionIdx((p) => Math.max(0, p - 1))}
            className="px-3 py-2.5 sm:px-4 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 border border-slate-300 rounded-xl hover:bg-slate-200 disabled:opacity-30 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95 shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Câu trước</span>
            <span className="sm:hidden">Trước</span>
          </button>

          {/* Current Question Indicator */}
          <div className="text-center hidden xs:block">
            <span className="text-xs sm:text-sm font-black text-slate-800">
              Câu {currentQuestionIdx + 1} / {totalQuestions}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 block">
              Đã làm {answeredCount}/{totalQuestions} câu
            </span>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Prominent Next Question Button */}
            {currentQuestionIdx < totalQuestions - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentQuestionIdx((p) => Math.min(totalQuestions - 1, p + 1))}
                className="px-4 py-2.5 sm:px-5 text-xs sm:text-sm font-black text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            {/* Submit Homework Button */}
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="px-3.5 py-2.5 sm:px-5 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer min-h-[44px] active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Nộp Bài</span>
            </button>
          </div>
        </div>

        {/* 5. QUESTION MATRIX DRAWER MODAL (Mobile Bottom Sheet) */}
        {showMatrixDrawer && (
          <div className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-5 space-y-4 border border-slate-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Grid className="w-5 h-5 text-indigo-600" />
                  <span>Ma Trận Câu Hỏi ({answeredCount}/{totalQuestions} câu)</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMatrixDrawer(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Progress Summary bar */}
              <div className="bg-slate-100 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">Tiến độ làm bài:</span>
                <span className="text-emerald-700">
                  {Math.round((answeredCount / (totalQuestions || 1)) * 100)}% ({answeredCount}/{totalQuestions})
                </span>
              </div>

              {/* Grid of question buttons */}
              <div className="grid grid-cols-5 gap-2.5 max-h-[50vh] overflow-y-auto p-1">
                {assignment.questions.map((q, idx) => {
                  const a = answers[q.id];
                  const isAnswered =
                    q.type === 'multiple_choice'
                      ? a?.selectedOption !== undefined
                      : Boolean(a?.essayText && a.essayText.trim().length > 0);
                  const isCurrent = idx === currentQuestionIdx;

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentQuestionIdx(idx);
                        setShowMatrixDrawer(false);
                      }}
                      className={`p-3 rounded-2xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                        isCurrent
                          ? 'ring-2 ring-indigo-600 bg-indigo-600 text-white shadow-sm'
                          : isAnswered
                          ? 'bg-emerald-500 text-white font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      <span className="text-base font-black">{idx + 1}</span>
                      <span className="text-[10px] font-semibold opacity-90">
                        {isAnswered ? 'Đã làm' : 'Chưa'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setShowMatrixDrawer(false)}
                className="w-full py-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs sm:text-sm text-slate-700 cursor-pointer"
              >
                Đóng ma trận
              </button>
            </div>
          </div>
        )}

        {/* 6. CONFIRM SUBMIT DIALOG */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-60 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 text-center space-y-4 border border-slate-200 animate-in fade-in zoom-in-95 duration-100">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="font-black text-lg text-slate-900">Xác Nhận Nộp Bài Tập?</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Em đã hoàn thành <strong className="text-emerald-700 font-bold">{answeredCount}/{totalQuestions}</strong> câu hỏi.
                {answeredCount < totalQuestions && (
                  <span className="block text-rose-600 mt-2 font-bold bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    ⚠️ Em vẫn còn {totalQuestions - answeredCount} câu chưa làm. Em có chắc muốn nộp luôn không?
                  </span>
                )}
              </p>
              <div className="flex items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300 cursor-pointer"
                >
                  Kiểm tra lại
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={doSubmit}
                  className="px-5 py-2.5 text-xs sm:text-sm font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-200 flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <span>{isSubmitting ? 'Đang nộp...' : 'Đồng ý nộp bài'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
