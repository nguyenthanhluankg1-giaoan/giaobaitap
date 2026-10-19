import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { Assignment, Question } from '../../types/index.ts';
import { generateQuestionsFromDoc } from '../../utils/aiGenerator.ts';
import { cleanQuestionMath, cleanMathNotation } from '../../utils/mathUtils.ts';
import { MathText } from '../common/MathText.tsx';
import { ApiKeyModal } from '../common/ApiKeyModal.tsx';
import {
  X,
  Upload,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Clock,
  Calendar,
  Save,
  BookOpen,
  Info,
  Check,
  Calculator,
  Eye,
  Key,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const CreateAssignmentModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const { addAssignment } = useApp();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('Lớp 10');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [assignedClass, setAssignedClass] = useState('10A1');

  // PDF upload state
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState('');
  const [pdfContentExcerpt, setPdfContentExcerpt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Question counts configuration
  const [mcCount, setMcCount] = useState<number>(4);
  const [essayCount, setEssayCount] = useState<number>(2);

  // Gemini API Key modal state
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const hasCustomKey = typeof window !== 'undefined' && !!localStorage.getItem('custom_gemini_api_key');

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generationError, setGenerationError] = useState('');

  // Math & Formula toolbar state
  const [showMathToolbar, setShowMathToolbar] = useState(true);
  const [activeTarget, setActiveTarget] = useState<{
    qIndex: number;
    field: 'content' | 'opt' | 'explanation';
    optIndex?: number;
  } | null>(null);
  const [mathToast, setMathToast] = useState<string | null>(null);

  const COMMON_MATH_SYMBOLS = [
    { label: 'N*', latex: '$\\mathbb{N}^*$', desc: 'Tập số tự nhiên khác 0 (N*)' },
    { label: 'N', latex: '$\\mathbb{N}$', desc: 'Tập số tự nhiên (N)' },
    { label: 'Z', latex: '$\\mathbb{Z}$', desc: 'Tập số nguyên (Z)' },
    { label: 'Q', latex: '$\\mathbb{Q}$', desc: 'Tập số hữu tỉ (Q)' },
    { label: 'R', latex: '$\\mathbb{R}$', desc: 'Tập số thực (R)' },
    { label: '∈ (thuộc)', latex: '$\\in$', desc: 'Ký hiệu Thuộc' },
    { label: '∉ (k.thuộc)', latex: '$\\notin$', desc: 'Ký hiệu Không thuộc' },
    { label: '⊂ (con)', latex: '$\\subset$', desc: 'Tập con' },
    { label: '∩ (giao)', latex: '$\\cap$', desc: 'Giao của 2 tập hợp' },
    { label: '∪ (hợp)', latex: '$\\cup$', desc: 'Hợp của 2 tập hợp' },
    { label: '≤', latex: '$\\le$', desc: 'Nhỏ hơn hoặc bằng' },
    { label: '≥', latex: '$\\ge$', desc: 'Lớn hơn hoặc bằng' },
    { label: '≠', latex: '$\\neq$', desc: 'Khác' },
    { label: '√x', latex: '$\\sqrt{x}$', desc: 'Căn bậc hai' },
    { label: 'a/b', latex: '$\\frac{a}{b}$', desc: 'Phân số' },
    { label: 'x²', latex: '$x^2$', desc: 'Bình phương' },
    { label: 'x₁', latex: '$x_1$', desc: 'Chỉ số dưới' },
    { label: 'Δ', latex: '$\\Delta$', desc: 'Biệt thức Delta' },
    { label: '±', latex: '$\\pm$', desc: 'Cộng trừ' },
    { label: '∞', latex: '$\\infty$', desc: 'Vô cực' },
  ];

  const handleInsertSymbol = (symbolLatex: string) => {
    if (activeTarget !== null && questions[activeTarget.qIndex]) {
      if (activeTarget.field === 'content') {
        const cur = questions[activeTarget.qIndex].content;
        handleUpdateMCQuestion(activeTarget.qIndex, 'content', cur ? `${cur} ${symbolLatex}` : symbolLatex);
      } else if (activeTarget.field === 'opt' && activeTarget.optIndex !== undefined) {
        const cur = questions[activeTarget.qIndex].options?.[activeTarget.optIndex] || '';
        handleUpdateOption(activeTarget.qIndex, activeTarget.optIndex, cur ? `${cur} ${symbolLatex}` : symbolLatex);
      } else if (activeTarget.field === 'explanation') {
        const cur = questions[activeTarget.qIndex].explanation || '';
        handleUpdateMCQuestion(activeTarget.qIndex, 'explanation', cur ? `${cur} ${symbolLatex}` : symbolLatex);
      }
      setMathToast(`Đã chèn ký hiệu ${symbolLatex}`);
    } else {
      navigator.clipboard?.writeText(symbolLatex);
      setMathToast(`Đã sao chép ${symbolLatex} (hãy nhấp chuột vào ô cần điền rồi bấm chèn)`);
    }
    setTimeout(() => setMathToast(null), 2500);
  };

  if (!isOpen) return null;

  // Handle PDF file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setPdfFileSize(`${sizeInMb} MB`);

    // Auto-fill title from file name if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' ');
      setTitle(cleanName);
    }

    // Read excerpt
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      // Excerpt preview (sample text or simulated text if binary)
      const excerpt = text.length > 300 ? text.substring(0, 300) + '...' : text;
      setPdfContentExcerpt(
        excerpt.trim() || `Tài liệu PDF: ${file.name} đã được tải lên thành công. Sẵn sàng phân tích nội dung.`
      );
    };
    reader.readAsText(file.slice(0, 5000));
  };

  // Sample quick PDF templates for testing
  const handleApplySampleDoc = (
    sampleType: 'toan3' | 'tv4' | 'kh5' | 'toan' | 'van' | 'anh' | 'ly'
  ) => {
    if (sampleType === 'toan3') {
      setTitle('Toán Lớp 3: Bảng Nhân Chia & Giải Bài Toán Có Lời Văn');
      setSubject('Toán học');
      setGrade('Lớp 3');
      setAssignedClass('3A1');
      setPdfFileName('SGK_Toan3_BangNhanChia_LoiVan.pdf');
      setPdfFileSize('1.5 MB');
      setPdfContentExcerpt(
        'Bài tập ôn luyện Toán lớp 3: Các phép tính cộng trừ nhân chia trong phạm vi 100.000, tính chu vi hình chữ nhật, hình vuông và bài toán rút về đơn vị hai bước tính.'
      );
    } else if (sampleType === 'tv4') {
      setTitle('Tiếng Việt Lớp 4: Luyện Từ Và Câu & Miêu Tả Ngắn');
      setSubject('Ngữ văn');
      setGrade('Lớp 4');
      setAssignedClass('4A2');
      setPdfFileName('TiengViet4_LuyenTuVaCau.pdf');
      setPdfFileSize('2.1 MB');
      setPdfContentExcerpt(
        'Nhận biết danh từ, động từ, tính từ. Đặt câu cảm, câu hỏi và câu kể. Viết đoạn văn ngắn từ 3 đến 5 câu miêu tả loài cây hoặc con vật quen thuộc gần gũi.'
      );
    } else if (sampleType === 'kh5') {
      setTitle('Khoa Học Lớp 5: Sử Dụng Năng Lượng & Bảo Vệ Môi Trường');
      setSubject('Sinh học');
      setGrade('Lớp 5');
      setAssignedClass('5B1');
      setPdfFileName('KhoaHoc5_SuDungNangLuong.pdf');
      setPdfFileSize('2.0 MB');
      setPdfContentExcerpt(
        'Tìm hiểu về năng lượng mặt trời, gió, nước chảy. Sự biến đổi chất từ dạng này sang dạng khác và quy tắc tiết kiệm điện năng sinh hoạt trong gia đình.'
      );
    } else if (sampleType === 'toan') {
      setTitle('Chuyên đề: Hàm số bậc hai & Ứng dụng thực tiễn');
      setSubject('Toán học');
      setGrade('Lớp 10');
      setAssignedClass('10A1');
      setPdfFileName('SGK_Toan10_HamSoBacHai.pdf');
      setPdfFileSize('3.2 MB');
      setPdfContentExcerpt(
        'Khảo sát sự biến thiên và vẽ đồ thị hàm số y = ax² + bx + c (a ≠ 0). Tọa độ đỉnh I(-b/2a; -Δ/4a), trục đối xứng x = -b/2a. Ứng dụng mô hình hóa bài toán tầm xa vật ném và thiết kế cổng vòm parabol.'
      );
    } else if (sampleType === 'van') {
      setTitle('Văn học Trung đại: Tác gia Nguyễn Trãi & Tác phẩm');
      setSubject('Ngữ văn');
      setGrade('Lớp 10');
      setAssignedClass('10A1');
      setPdfFileName('Tai_Lieu_NguVan10_NguyenTrai.pdf');
      setPdfFileSize('2.5 MB');
      setPdfContentExcerpt(
        'Nguyễn Trãi - người anh hùng dân tộc, danh nhân văn hóa thế giới. Sự nghiệp văn học phong phú bao gồm quân trung từ mệnh tập, đại cáo bình ngô, ức trai thi tập và quốc âm thi tập với tư tưởng nhân nghĩa cốt ở yên dân.'
      );
    } else if (sampleType === 'anh') {
      setTitle('Global Warming & Environmental Protection');
      setSubject('Tiếng Anh');
      setGrade('Lớp 10');
      setAssignedClass('10A1');
      setPdfFileName('English10_Unit9_ProtectingEnvironment.pdf');
      setPdfFileSize('1.9 MB');
      setPdfContentExcerpt(
        'Greenhouse effect, carbon footprint, deforestation and renewable energy. Discussing individual responsibilities to preserve natural biodiversity and reduce plastic waste.'
      );
    } else {
      setTitle('Định luật II Newton và Lực Ma sát');
      setSubject('Vật lý');
      setGrade('Lớp 10');
      setAssignedClass('10A1');
      setPdfFileName('VatLy10_DongLucHoc_Newton.pdf');
      setPdfFileSize('2.8 MB');
      setPdfContentExcerpt(
        'Gia tốc của một vật cùng hướng với lực tác dụng lên vật. Độ lớn của gia tốc tỉ lệ thuận với độ lớn của lực và tỉ lệ nghịch với khối lượng của vật: F = m*a.'
      );
    }
  };

  // Trigger AI Question Generator
  const handleGenerateQuestions = async () => {
    if (!title.trim()) {
      setGenerationError('Vui lòng nhập tên bài tập trước khi tạo câu hỏi.');
      return;
    }
    setGenerationError('');
    setIsGenerating(true);

    try {
      const generated = await generateQuestionsFromDoc({
        title,
        subject,
        grade,
        pdfContent: pdfContentExcerpt,
        pdfFileName,
        mcCount: Number(mcCount) || 0,
        essayCount: Number(essayCount) || 0,
      });
      setQuestions(generated);
    } catch (err) {
      setGenerationError('Có lỗi khi tạo câu hỏi. Đã chuyển sang bộ câu hỏi mẫu chuẩn.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Question manipulation
  const handleUpdateMCQuestion = (
    index: number,
    field: string,
    value: string | number
  ) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, text: string) => {
    setQuestions((prev) => {
      const next = [...prev];
      const opts = [...(next[qIndex].options || [])];
      opts[optIndex] = text;
      next[qIndex] = { ...next[qIndex], options: opts };
      return next;
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = (type: 'multiple_choice' | 'essay') => {
    const newQ: Question =
      type === 'multiple_choice'
        ? {
            id: `q-manual-${Date.now()}`,
            type: 'multiple_choice',
            content: 'Nhập nội dung câu hỏi trắc nghiệm...',
            options: ['A. Đáp án 1', 'B. Đáp án 2', 'C. Đáp án 3', 'D. Đáp án 4'],
            correctOptionIndex: 0,
            points: 1.5,
            explanation: 'Giải thích đáp án...',
          }
        : {
            id: `q-manual-${Date.now()}`,
            type: 'essay',
            content: 'Nhập nội dung yêu cầu câu hỏi tự luận...',
            points: 2.0,
            rubric: 'Tiêu chí chấm điểm và các bước đánh giá...',
            sampleAnswer: 'Đáp án mẫu gợi ý...',
            keywords: ['từ khóa 1', 'từ khóa 2'],
          };

    setQuestions((prev) => [...prev, newQ]);
  };

  const handleSanitizeAllQuestions = () => {
    setQuestions((prev) => prev.map((q) => cleanQuestionMath(q)));
    setMathToast('Đã tự động làm sạch ký tự $45\\;678$ trên toàn bộ các câu hỏi!');
    setTimeout(() => setMathToast(null), 3000);
  };

  // Calculate total points
  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 0), 0);

  // Save assignment to repository
  const handleSaveAssignment = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài tập!');
      return;
    }
    if (questions.length === 0) {
      alert('Bài tập cần có ít nhất 1 câu hỏi! Hãy nhấn nút "Tự Động Sinh Câu Hỏi từ PDF" hoặc thêm câu hỏi thủ công.');
      return;
    }

    const sanitizedQuestions = questions.map((q) => cleanQuestionMath(q));

    const newAssignment: Assignment = {
      id: `assign-${Date.now()}`,
      title: title.trim(),
      subject,
      grade,
      description: description.trim() || `Bài tập về nhà môn ${subject} - ${grade}`,
      pdfFileName: pdfFileName || undefined,
      pdfFileSize: pdfFileSize || undefined,
      pdfContentExcerpt: pdfContentExcerpt || undefined,
      durationMinutes,
      dueDate: new Date(dueDate).toISOString(),
      assignedTo: ['all'],
      assignedClass,
      questions: sanitizedQuestions,
      totalPoints,
      createdAt: new Date().toISOString(),
      status: 'published',
    };

    addAssignment(newAssignment);
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Tạo Bài Tập Mới & Sinh Đề Tự Động Từ PDF
              </h2>
              <p className="text-xs text-slate-500">
                Lưu trữ bài đề riêng biệt vào kho đề để dễ dàng lựa chọn giao cho học sinh
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-slate-800 text-sm">
          {/* Section 1: Basic Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                1. Thông Tin Bài Học & Đề Bài
              </span>
              <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                <span>Điền mẫu nhanh:</span>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Tiểu học:</span>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('toan3')}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-amber-700 hover:bg-amber-50 font-medium cursor-pointer"
                >
                  Toán 3
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('tv4')}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-emerald-700 hover:bg-emerald-50 font-medium cursor-pointer"
                >
                  Tiếng Việt 4
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('kh5')}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-sky-700 hover:bg-sky-50 font-medium cursor-pointer"
                >
                  Khoa học 5
                </button>
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 ml-1">THPT:</span>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('toan')}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-indigo-600 hover:bg-indigo-50 font-medium cursor-pointer"
                >
                  Toán 10
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('van')}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-emerald-600 hover:bg-emerald-50 font-medium cursor-pointer"
                >
                  Văn 10
                </button>
                <button
                  type="button"
                  onClick={() => handleApplySampleDoc('anh')}
                  className="px-2 py-0.5 bg-white border border-slate-200 rounded text-blue-600 hover:bg-blue-50 font-medium cursor-pointer"
                >
                  Anh 10
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên bài tập cần tạo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập Bảng nhân 7, Bài tập Tiếng Việt 4 hoặc Phương trình Vi-ét..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Môn học
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white"
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Ngữ văn">Ngữ văn (Tiếng Việt)</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                  <option value="Vật lý">Vật lý / Khoa học</option>
                  <option value="Hóa học">Hóa học</option>
                  <option value="Sinh học">Sinh học / Tự nhiên Xã hội</option>
                  <option value="Lịch sử">Lịch sử & Địa lý</option>
                  <option value="Địa lý">Địa lý</option>
                  <option value="Tin học">Tin học</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Khối lớp
                </label>
                <select
                  value={grade}
                  onChange={(e) => {
                    const newGrade = e.target.value;
                    setGrade(newGrade);
                    if (newGrade === 'Lớp 1') setAssignedClass('1A1');
                    else if (newGrade === 'Lớp 2') setAssignedClass('2A1');
                    else if (newGrade === 'Lớp 3') setAssignedClass('3A1');
                    else if (newGrade === 'Lớp 4') setAssignedClass('4A1');
                    else if (newGrade === 'Lớp 5') setAssignedClass('5A1');
                    else if (newGrade === 'Lớp 6') setAssignedClass('6A1');
                    else if (newGrade === 'Lớp 7') setAssignedClass('7A1');
                    else if (newGrade === 'Lớp 8') setAssignedClass('8A1');
                    else if (newGrade === 'Lớp 9') setAssignedClass('9A1');
                    else if (newGrade === 'Lớp 10') setAssignedClass('10A1');
                    else if (newGrade === 'Lớp 11') setAssignedClass('11A1');
                    else if (newGrade === 'Lớp 12') setAssignedClass('12A1');
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm bg-white font-medium"
                >
                  <optgroup label="🌱 Khối Cấp 1 (Tiểu học)">
                    <option value="Lớp 1">Lớp 1 (Tiểu học)</option>
                    <option value="Lớp 2">Lớp 2 (Tiểu học)</option>
                    <option value="Lớp 3">Lớp 3 (Tiểu học)</option>
                    <option value="Lớp 4">Lớp 4 (Tiểu học)</option>
                    <option value="Lớp 5">Lớp 5 (Tiểu học)</option>
                  </optgroup>
                  <optgroup label="🌿 Khối Cấp 2 (THCS)">
                    <option value="Lớp 6">Lớp 6 (THCS)</option>
                    <option value="Lớp 7">Lớp 7 (THCS)</option>
                    <option value="Lớp 8">Lớp 8 (THCS)</option>
                    <option value="Lớp 9">Lớp 9 (THCS)</option>
                  </optgroup>
                  <optgroup label="🎓 Khối Cấp 3 (THPT)">
                    <option value="Lớp 10">Lớp 10 (THPT)</option>
                    <option value="Lớp 11">Lớp 11 (THPT)</option>
                    <option value="Lớp 12">Lớp 12 (THPT)</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Hạn nộp bài
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lớp được giao
                </label>
                <input
                  type="text"
                  value={assignedClass}
                  onChange={(e) => setAssignedClass(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú / Yêu cầu gửi học sinh
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Yêu cầu học sinh làm cẩn thận, trình bày rõ các bước tự luận..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Section 2: PDF Upload & Automatic Question Extraction */}
          <div className="bg-indigo-50/40 p-4 rounded-xl border border-indigo-200/80 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs uppercase text-indigo-700 tracking-wider flex items-center gap-1.5">
                <Upload className="w-4 h-4" />
                2. Cấu Hình Số Lượng & Upload Tài Liệu Sinh Đề AI
              </span>

              <button
                type="button"
                onClick={() => setIsApiKeyModalOpen(true)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                  hasCustomKey
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                }`}
                title="Cấu hình Google Gemini API Key để AI sinh câu hỏi"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>{hasCustomKey ? '🟢 Đã cài API Key cá nhân' : '🔑 Dán Gemini API Key'}</span>
              </button>
            </div>

            {/* Question count configuration card */}
            <div className="bg-white p-3.5 rounded-xl border border-indigo-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Cấu hình số lượng câu hỏi AI tạo theo yêu cầu:</span>
                </label>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold">
                  Tổng cộng: {Number(mcCount || 0) + Number(essayCount || 0)} câu ({mcCount} trắc nghiệm, {essayCount} tự luận)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* MCQ count input */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Số câu trắc nghiệm (MCQ):</span>
                    <span className="text-[10px] text-slate-500 font-medium">(0 - 50 câu)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMcCount((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      value={mcCount}
                      onChange={(e) => setMcCount(Math.max(0, Math.min(50, parseInt(e.target.value) || 0)))}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setMcCount((prev) => Math.min(50, prev + 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      +
                    </button>

                    <div className="flex items-center gap-1 ml-auto">
                      {[4, 8, 10, 15, 20].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setMcCount(num)}
                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                            mcCount === num
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Essay count input */}
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">Số câu tự luận (Essay):</span>
                    <span className="text-[10px] text-slate-500 font-medium">(0 - 20 câu)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEssayCount((prev) => Math.max(0, prev - 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={essayCount}
                      onChange={(e) => setEssayCount(Math.max(0, Math.min(20, parseInt(e.target.value) || 0)))}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-center text-xs font-bold bg-white focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => setEssayCount((prev) => Math.min(20, prev + 1))}
                      className="w-7 h-7 rounded bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer shadow-2xs"
                    >
                      +
                    </button>

                    <div className="flex items-center gap-1 ml-auto">
                      {[0, 2, 3, 5, 10].map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setEssayCount(num)}
                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded cursor-pointer transition-colors ${
                            essayCount === num
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Drop area */}
              <label className="border-2 border-dashed border-indigo-300 hover:border-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-white/70 hover:bg-white transition-colors group">
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-indigo-700">
                  Nhấp để tải file PDF hoặc kéo thả vào đây
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Hỗ trợ tài liệu SGK, đề thi mẫu, tóm tắt bài giảng (PDF, TXT)
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded File Status */}
              <div className="bg-white p-3.5 rounded-xl border border-indigo-100 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-500 mb-1">Tài liệu đính kèm:</div>
                  {pdfFileName ? (
                    <div className="flex items-center gap-2 p-2 bg-indigo-50 rounded-lg border border-indigo-200/60">
                      <FileText className="w-6 h-6 text-indigo-600 shrink-0" />
                      <div className="truncate">
                        <div className="font-bold text-xs text-slate-800 truncate">{pdfFileName}</div>
                        <div className="text-[10px] text-indigo-600 font-medium">{pdfFileSize} • Đã sẵn sàng</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic p-2 border border-dashed border-slate-200 rounded-lg">
                      Chưa chọn file PDF (Có thể dùng bài mẫu hoặc nhập nội dung)
                    </div>
                  )}

                  {pdfContentExcerpt && (
                    <p className="mt-2 text-[11px] text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-semibold">Trích xuất:</span> {pdfContentExcerpt}
                    </p>
                  )}
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating}
                    className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-indigo-200 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <span>
                      {isGenerating
                        ? 'Đang phân tích PDF & sinh câu hỏi...'
                        : `Sinh AI ${mcCount} Trắc Nghiệm & ${essayCount} Tự Luận`}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {generationError && (
              <p className="text-xs text-rose-600 font-medium">{generationError}</p>
            )}
          </div>

          {/* Section 3: Questions List & Live Editor */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <span>3. Danh Sách Câu Hỏi Của Đề Bài</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs">
                    {questions.length} câu
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Tự động chia tách trắc nghiệm (A, B, C, D) & tự luận. Tích hợp KaTeX hiển thị chuẩn xác ký hiệu Toán học & Khoa học.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowMathToolbar(!showMathToolbar)}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
                    showMathToolbar
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                  title="Bật/Tắt thanh ký hiệu toán học"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Ký hiệu Toán</span>
                </button>
                <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                  Tổng điểm: {totalPoints.toFixed(1)} đ
                </span>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('multiple_choice')}
                  className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Trắc nghiệm
                </button>
                <button
                  type="button"
                  onClick={() => handleAddQuestion('essay')}
                  className="px-2.5 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tự luận
                </button>
              </div>
            </div>

            {/* Math Symbols Quick Palette */}
            {showMathToolbar && (
              <div className="p-3 bg-gradient-to-r from-slate-50 to-indigo-50/40 rounded-xl border border-indigo-100/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                    Bảng Chèn Nhanh Ký Hiệu & Tập Hợp Toán Học (KaTeX):
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Nhấp vào ký hiệu để chèn trực tiếp vào ô đang soạn
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSanitizeAllQuestions}
                    className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer mr-1 shrink-0"
                    title="Tự động bọc phân số trong $...$ và loại bỏ ký tự $45\;678$ rườm rà trên toàn bộ câu hỏi"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{"Sửa lỗi Phân số (\\frac{a}{b}) & Chuẩn hóa số"}</span>
                  </button>

                  {COMMON_MATH_SYMBOLS.map((sym, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleInsertSymbol(sym.latex)}
                      className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold shadow-2xs transition-all flex items-center justify-center min-w-[36px] cursor-pointer"
                      title={`${sym.desc} (${sym.latex})`}
                    >
                      <span className="font-bold">{sym.label}</span>
                    </button>
                  ))}
                </div>

                {mathToast && (
                  <div className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                    ✓ {mathToast}
                  </div>
                )}
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-700 mb-1">
                  Chưa có câu hỏi nào trong bài tập này
                </h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
                  Nhấn vào nút <span className="font-semibold text-indigo-600">"Tự Động Sinh Câu Hỏi từ PDF & Đề Bài"</span> phía trên để hệ thống tự động trích xuất các câu trắc nghiệm và tự luận chất lượng cao.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateQuestions}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 transition-colors shadow-xs"
                >
                  Sinh câu hỏi ngay bây giờ
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q, qIndex) => (
                  <div
                    key={q.id || qIndex}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
                    {/* Question Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            q.type === 'multiple_choice'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {q.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'}
                        </span>
                        <span className="font-bold text-xs text-slate-700">Câu {qIndex + 1}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <label className="text-xs text-slate-500">Điểm:</label>
                          <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            max="10"
                            value={q.points}
                            onChange={(e) =>
                              handleUpdateMCQuestion(qIndex, 'points', Number(e.target.value))
                            }
                            className="w-16 px-2 py-0.5 border border-slate-200 rounded text-xs font-bold text-center"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIndex)}
                          className="text-slate-400 hover:text-rose-600 p-1 rounded"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question Content Editor & Live Math Preview */}
                    <div className="space-y-1.5">
                      <textarea
                        rows={2}
                        value={q.content}
                        onFocus={() => setActiveTarget({ qIndex, field: 'content' })}
                        onChange={(e) =>
                          handleUpdateMCQuestion(qIndex, 'content', e.target.value)
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                        placeholder="Nội dung câu hỏi (hỗ trợ gõ công thức Toán học như $\mathbb{N}^*$, $x \ge 0$, $\sqrt{x}$...)"
                      />

                      {/* Live preview for question content */}
                      {q.content && (
                        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 flex items-center gap-1">
                            <Eye className="w-3 h-3 text-indigo-500" />
                            <span>Hiển thị thực tế:</span>
                          </div>
                          <MathText text={q.content} className="font-medium text-slate-900" />
                        </div>
                      )}
                    </div>

                    {/* Multiple choice options */}
                    {q.type === 'multiple_choice' && (
                      <div className="space-y-2 pt-1">
                        <div className="text-[11px] font-semibold text-slate-500">
                          Các đáp án lựa chọn (Nhấp vào hình tròn để chọn đáp án đúng):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.options || []).map((opt, optIndex) => {
                            const isCorrect = q.correctOptionIndex === optIndex;
                            return (
                              <div
                                key={optIndex}
                                className={`flex flex-col gap-1 p-2 rounded-lg border transition-all ${
                                  isCorrect
                                    ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500/30'
                                    : 'border-slate-200 bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleUpdateMCQuestion(qIndex, 'correctOptionIndex', optIndex)
                                    }
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                                      isCorrect
                                        ? 'bg-emerald-600 border-emerald-600 text-white'
                                        : 'border-slate-300 bg-white hover:border-slate-400'
                                    }`}
                                    title="Đặt làm đáp án đúng"
                                  >
                                    {isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                  <input
                                    type="text"
                                    value={opt}
                                    onFocus={() => setActiveTarget({ qIndex, field: 'opt', optIndex })}
                                    onChange={(e) =>
                                      handleUpdateOption(qIndex, optIndex, e.target.value)
                                    }
                                    placeholder={`Đáp án ${String.fromCharCode(65 + optIndex)}...`}
                                    className="w-full bg-white px-2 py-1 border border-slate-200 rounded text-xs focus:ring-1 focus:ring-indigo-500"
                                  />
                                </div>
                                {/* Live math preview for option */}
                                {opt && (
                                  <div className="text-[11px] text-slate-700 pl-7 flex items-center gap-1 font-medium">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Xem:</span>
                                    <MathText text={opt} />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        <div className="pt-1 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">
                            Lời giải thích / Đáp án chi tiết:
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ''}
                            onFocus={() => setActiveTarget({ qIndex, field: 'explanation' })}
                            onChange={(e) =>
                              handleUpdateMCQuestion(qIndex, 'explanation', e.target.value)
                            }
                            placeholder="Giải thích vì sao đáp án này đúng để học sinh xem lại sau khi nộp bài..."
                            className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-xs bg-slate-50"
                          />
                          {q.explanation && (
                            <div className="p-2 bg-blue-50/60 rounded border border-blue-100 text-xs text-blue-950">
                              <MathText text={q.explanation} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Essay rubrics & sample answer */}
                    {q.type === 'essay' && (
                      <div className="space-y-2 pt-1 bg-emerald-50/30 p-3 rounded-lg border border-emerald-100">
                        <div>
                          <label className="text-[11px] font-semibold text-emerald-800 block mb-0.5">
                            Tiêu chí chấm điểm & Barem rubric:
                          </label>
                          <textarea
                            rows={2}
                            value={q.rubric || ''}
                            onChange={(e) =>
                              handleUpdateMCQuestion(qIndex, 'rubric', e.target.value)
                            }
                            placeholder="Hướng dẫn chấm điểm cho câu hỏi tự luận..."
                            className="w-full px-2.5 py-1.5 border border-emerald-200 rounded text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-emerald-800 block mb-0.5">
                            Đáp án mẫu tham khảo:
                          </label>
                          <textarea
                            rows={2}
                            value={q.sampleAnswer || ''}
                            onChange={(e) =>
                              handleUpdateMCQuestion(qIndex, 'sampleAnswer', e.target.value)
                            }
                            placeholder="Đáp án mẫu chuẩn để học sinh đối chiếu sau khi chấm..."
                            className="w-full px-2.5 py-1.5 border border-emerald-200 rounded text-xs bg-white"
                          />
                          {q.sampleAnswer && (
                            <div className="p-2 bg-white rounded border border-emerald-200 text-xs text-emerald-950 mt-1">
                              <MathText text={q.sampleAnswer} />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleSaveAssignment}
            className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-200 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Lưu Vào Kho Đề & Sẵn Sàng Giao Bài</span>
          </button>
        </div>
      </div>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
      />
    </div>
  );
};
