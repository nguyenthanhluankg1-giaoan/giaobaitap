import type { Assignment, Question, QuestionAnswer, Submission } from '../types/index.ts';

/**
 * Grades a single multiple choice question.
 */
export function gradeMultipleChoice(
  question: Question,
  selectedIndex?: number
): { isCorrect: boolean; score: number } {
  if (selectedIndex === undefined || selectedIndex === null) {
    return { isCorrect: false, score: 0 };
  }
  const isCorrect = selectedIndex === question.correctOptionIndex;
  return {
    isCorrect,
    score: isCorrect ? question.points : 0,
  };
}

/**
 * Heuristic auto-grader for essay answers based on length, keywords, and semantic structure.
 * Gives initial scores which teachers can adjust anytime.
 */
export function autoGradeEssay(
  question: Question,
  text: string = ''
): { score: number; autoFeedback: string } {
  const trimmed = text.trim();
  if (!trimmed) {
    return {
      score: 0,
      autoFeedback: 'Học sinh chưa trả lời câu hỏi này.',
    };
  }

  const maxPoints = question.points || 2;
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;

  let keywordMatches = 0;
  const keywords = question.keywords || [];
  if (keywords.length > 0) {
    const lowerText = trimmed.toLowerCase();
    keywords.forEach((kw) => {
      if (lowerText.includes(kw.toLowerCase())) {
        keywordMatches++;
      }
    });
  }

  // Calculate score ratio based on keyword match & substantial elaboration
  let ratio = 0;
  if (keywords.length > 0) {
    const keywordRatio = keywordMatches / keywords.length;
    const lengthFactor = Math.min(1, wordCount / 40); // 40 words is reasonable elaboration
    ratio = keywordRatio * 0.7 + lengthFactor * 0.3;
  } else {
    // If no explicit keywords, base on depth and structure
    if (wordCount >= 50) ratio = 0.85;
    else if (wordCount >= 25) ratio = 0.7;
    else if (wordCount >= 10) ratio = 0.5;
    else ratio = 0.3;
  }

  // Clamp ratio between 0.2 (attempted) and 1.0
  ratio = Math.min(1, Math.max(0.2, ratio));
  const rawScore = Math.round(maxPoints * ratio * 2) / 2; // round to nearest 0.5
  const finalScore = Math.min(maxPoints, rawScore);

  let autoFeedback = '';
  if (finalScore >= maxPoints * 0.85) {
    autoFeedback = 'Câu trả lời đầy đủ ý, lập luận rõ ràng và bao quát đúng trọng tâm.';
  } else if (finalScore >= maxPoints * 0.6) {
    autoFeedback = 'Đã nắm được ý chính cơ bản, cần triển khai chi tiết và dẫn chứng rõ hơn.';
  } else {
    autoFeedback = 'Bài làm còn sơ sài, cần bám sát yêu cầu đề bài và bổ sung thêm nội dung.';
  }

  return { score: finalScore, autoFeedback };
}

/**
 * Calculates submission totals, breakdown and performance classification.
 */
export function calculateSubmissionTotals(
  questions: Question[],
  answers: Record<string, QuestionAnswer>
): {
  multipleChoiceScore: number;
  essayScore: number;
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: string;
} {
  let multipleChoiceScore = 0;
  let essayScore = 0;
  let maxScore = 0;

  for (const q of questions) {
    maxScore += q.points;
    const ans = answers[q.id];
    if (ans) {
      if (q.type === 'multiple_choice') {
        multipleChoiceScore += ans.score || 0;
      } else {
        essayScore += ans.score || 0;
      }
    }
  }

  const totalScore = Math.round((multipleChoiceScore + essayScore) * 10) / 10;
  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

  let classification = 'Chưa đạt';
  if (percentage >= 90) classification = 'Xuất sắc';
  else if (percentage >= 80) classification = 'Giỏi';
  else if (percentage >= 65) classification = 'Khá';
  else if (percentage >= 50) classification = 'Trung bình';
  else classification = 'Cần cố gắng';

  return {
    multipleChoiceScore,
    essayScore,
    totalScore,
    maxScore,
    percentage,
    classification,
  };
}

/**
 * Aggregates statistics for an assignment across all submissions.
 */
export function calculateClassStatistics(
  assignment: Assignment,
  submissions: Submission[],
  totalStudentsCount: number
) {
  const submittedCount = submissions.length;
  const submissionRate =
    totalStudentsCount > 0 ? Math.round((submittedCount / totalStudentsCount) * 100) : 0;

  if (submittedCount === 0) {
    return {
      submissionRate: 0,
      submittedCount: 0,
      totalStudentsCount,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      scoreDistribution: { excellent: 0, good: 0, average: 0, weak: 0 },
      questionAccuracy: assignment.questions.map((q) => ({
        questionId: q.id,
        content: q.content,
        type: q.type,
        correctCount: 0,
        totalAttempts: 0,
        accuracyRate: 0,
      })),
    };
  }

  let totalScoreSum = 0;
  let highestScore = 0;
  let lowestScore = assignment.totalPoints;
  const distribution = { excellent: 0, good: 0, average: 0, weak: 0 };

  submissions.forEach((sub) => {
    totalScoreSum += sub.totalScore;
    if (sub.totalScore > highestScore) highestScore = sub.totalScore;
    if (sub.totalScore < lowestScore) lowestScore = sub.totalScore;

    const pct = assignment.totalPoints > 0 ? (sub.totalScore / assignment.totalPoints) * 100 : 0;
    if (pct >= 85) distribution.excellent++;
    else if (pct >= 70) distribution.good++;
    else if (pct >= 50) distribution.average++;
    else distribution.weak++;
  });

  const averageScore = Math.round((totalScoreSum / submittedCount) * 10) / 10;

  // Question by question accuracy
  const questionAccuracy = assignment.questions.map((q) => {
    let correctCount = 0;
    let totalAttempts = 0;

    submissions.forEach((sub) => {
      const ans = sub.answers[q.id];
      if (ans) {
        totalAttempts++;
        if (q.type === 'multiple_choice' && ans.isCorrect) {
          correctCount++;
        } else if (q.type === 'essay' && ans.score >= q.points * 0.5) {
          correctCount++;
        }
      }
    });

    const accuracyRate =
      totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;

    return {
      questionId: q.id,
      content: q.content,
      type: q.type,
      correctCount,
      totalAttempts,
      accuracyRate,
    };
  });

  return {
    submissionRate,
    submittedCount,
    totalStudentsCount,
    averageScore,
    highestScore,
    lowestScore: lowestScore === assignment.totalPoints && submittedCount === 0 ? 0 : lowestScore,
    scoreDistribution: distribution,
    questionAccuracy,
  };
}
