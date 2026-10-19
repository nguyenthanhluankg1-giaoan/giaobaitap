export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  password?: string;
  fullName: string;
  role: UserRole;
  classId?: string;
  teachingSubject?: string;
  avatar?: string;
  email?: string;
  phone?: string;
  createdAt: string;
}

export type QuestionType = 'multiple_choice' | 'essay';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[]; // 4 options for multiple choice
  correctOptionIndex?: number; // 0, 1, 2, 3
  points: number;
  rubric?: string; // Hướng dẫn / tiêu chí chấm tự luận
  sampleAnswer?: string; // Đáp án mẫu
  explanation?: string; // Lời giải chi tiết
  keywords?: string[]; // Từ khóa chính để chấm tự động tự luận
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  grade: string;
  description: string;
  pdfFileName?: string;
  pdfFileSize?: string;
  pdfContentExcerpt?: string;
  durationMinutes: number; // Thời gian làm bài (phút), 0 = không giới hạn
  dueDate: string; // ISO date string
  assignedTo: string[]; // student ids or ['all']
  assignedClass: string;
  questions: Question[];
  totalPoints: number;
  createdAt: string;
  status: 'published' | 'draft';
}

export interface QuestionAnswer {
  questionId: string;
  selectedOption?: number; // 0..3 for multiple_choice
  essayText?: string; // text for essay
  score: number; // Final score for this question
  autoScore?: number; // Initial auto score
  isCorrect?: boolean; // For multiple choice
  teacherNote?: string; // Nhận xét riêng từng câu từ giáo viên
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  answers: Record<string, QuestionAnswer>;
  multipleChoiceScore: number;
  essayScore: number;
  totalScore: number;
  maxScore: number;
  status: 'submitted' | 'graded';
  gradedAt?: string;
  teacherFeedback?: string; // Lời phê / nhận xét tổng thể từ giáo viên
  timeSpentSeconds: number;
}
