import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeMultipleChoice, autoGradeEssay, calculateSubmissionTotals, calculateClassStatistics } from './grading.ts';
import type { Question, Assignment, Submission } from '../types/index.ts';

test('gradeMultipleChoice correctly identifies right and wrong answers', () => {
  const q: Question = {
    id: 'q1',
    type: 'multiple_choice',
    content: '1 + 1 bằng mấy?',
    options: ['A. 1', 'B. 2', 'C. 3', 'D. 4'],
    correctOptionIndex: 1, // B
    points: 1.5,
  };

  const correctResult = gradeMultipleChoice(q, 1);
  assert.equal(correctResult.isCorrect, true);
  assert.equal(correctResult.score, 1.5);

  const wrongResult = gradeMultipleChoice(q, 0);
  assert.equal(wrongResult.isCorrect, false);
  assert.equal(wrongResult.score, 0);

  const unattempted = gradeMultipleChoice(q, undefined);
  assert.equal(unattempted.isCorrect, false);
  assert.equal(unattempted.score, 0);
});

test('autoGradeEssay scores based on content and keywords', () => {
  const essayQ: Question = {
    id: 'q2',
    type: 'essay',
    content: 'Nêu ý nghĩa của cuộc khởi nghĩa Lam Sơn.',
    points: 3.0,
    keywords: ['Lê Lợi', 'Nguyễn Trãi', 'độc lập', 'chủ quyền'],
  };

  // Good response with keywords
  const goodText = 'Cuộc khởi nghĩa Lam Sơn do Lê Lợi lãnh đạo cùng quân sư Nguyễn Trãi đã đánh tan quân Minh xâm lược, giành lại nền độc lập và chủ quyền thiêng liêng cho dân tộc.';
  const res = autoGradeEssay(essayQ, goodText);
  assert.ok(res.score >= 2.0, `Score should be at least 2.0, got ${res.score}`);

  // Empty response
  const emptyRes = autoGradeEssay(essayQ, '');
  assert.equal(emptyRes.score, 0);
});

test('calculateSubmissionTotals correctly tallies MC and Essay parts', () => {
  const questions: Question[] = [
    {
      id: 'q1',
      type: 'multiple_choice',
      content: 'Q1',
      correctOptionIndex: 0,
      points: 2,
    },
    {
      id: 'q2',
      type: 'essay',
      content: 'Q2',
      points: 3,
    },
  ];

  const answers = {
    q1: { questionId: 'q1', selectedOption: 0, score: 2, isCorrect: true },
    q2: { questionId: 'q2', essayText: 'My essay answer', score: 2.5 },
  };

  const totals = calculateSubmissionTotals(questions, answers);
  assert.equal(totals.multipleChoiceScore, 2);
  assert.equal(totals.essayScore, 2.5);
  assert.equal(totals.totalScore, 4.5);
  assert.equal(totals.maxScore, 5);
  assert.equal(totals.percentage, 90);
  assert.equal(totals.classification, 'Xuất sắc');
});

test('calculateClassStatistics handles zero and multiple submissions', () => {
  const assignment: Assignment = {
    id: 'a1',
    title: 'Bài tập 1',
    subject: 'Toán',
    grade: '10',
    description: 'Mô tả',
    durationMinutes: 45,
    dueDate: '2026-12-31',
    assignedTo: ['all'],
    assignedClass: '10A1',
    totalPoints: 10,
    createdAt: '2026-10-18',
    status: 'published',
    questions: [
      { id: 'q1', type: 'multiple_choice', content: 'Q1', correctOptionIndex: 0, points: 5 },
      { id: 'q2', type: 'essay', content: 'Q2', points: 5 },
    ],
  };

  // Zero submissions
  const statsEmpty = calculateClassStatistics(assignment, [], 10);
  assert.equal(statsEmpty.submittedCount, 0);
  assert.equal(statsEmpty.submissionRate, 0);

  // With submissions
  const subs: Submission[] = [
    {
      id: 's1',
      assignmentId: 'a1',
      studentId: 'st1',
      studentName: 'An',
      submittedAt: '2026-10-18',
      answers: {
        q1: { questionId: 'q1', selectedOption: 0, score: 5, isCorrect: true },
        q2: { questionId: 'q2', score: 4 },
      },
      multipleChoiceScore: 5,
      essayScore: 4,
      totalScore: 9,
      maxScore: 10,
      status: 'graded',
      timeSpentSeconds: 1200,
    },
    {
      id: 's2',
      assignmentId: 'a1',
      studentId: 'st2',
      studentName: 'Bình',
      submittedAt: '2026-10-18',
      answers: {
        q1: { questionId: 'q1', selectedOption: 1, score: 0, isCorrect: false },
        q2: { questionId: 'q2', score: 3 },
      },
      multipleChoiceScore: 0,
      essayScore: 3,
      totalScore: 3,
      maxScore: 10,
      status: 'graded',
      timeSpentSeconds: 1500,
    },
  ];

  const stats = calculateClassStatistics(assignment, subs, 4);
  assert.equal(stats.submittedCount, 2);
  assert.equal(stats.submissionRate, 50); // 2 out of 4 is 50%
  assert.equal(stats.averageScore, 6.0); // (9 + 3)/2 = 6
  assert.equal(stats.highestScore, 9);
  assert.equal(stats.lowestScore, 3);
  assert.equal(stats.questionAccuracy[0].accuracyRate, 50); // 1 out of 2 got q1 right
});
