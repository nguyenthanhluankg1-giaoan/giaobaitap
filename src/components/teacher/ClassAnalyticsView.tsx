import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import { calculateClassStatistics } from '../../utils/grading.ts';
import {
  TrendingUp,
  Award,
  Users,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface Props {
  selectedAssignmentId?: string | null;
}

export const ClassAnalyticsView: React.FC<Props> = ({ selectedAssignmentId: initialId }) => {
  const { assignments, submissions, users } = useApp();
  const [activeAssignmentId, setActiveAssignmentId] = useState<string>(
    initialId || (assignments[0]?.id || '')
  );

  const students = users.filter((u) => u.role === 'student');
  const currentAssignment = assignments.find((a) => a.id === activeAssignmentId) || assignments[0];

  if (!currentAssignment) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
        Chưa có bài tập nào để thống kê.
      </div>
    );
  }

  const assignmentSubmissions = submissions.filter((s) => s.assignmentId === currentAssignment.id);
  const stats = calculateClassStatistics(currentAssignment, assignmentSubmissions, students.length);

  // Identify questions with lowest accuracy rate
  const questionsNeedingAttention = [...stats.questionAccuracy]
    .sort((a, b) => a.accuracyRate - b.accuracyRate)
    .filter((q) => q.totalAttempts > 0);

  return (
    <div className="space-y-6">
      {/* Header and Assignment picker */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            Thống Kê Tiến Độ & Kết Quả Học Tập Chi Tiết
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Phân tích tỷ lệ nộp bài, phổ điểm, ma trận câu hỏi và học sinh cần hỗ trợ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Chọn bài tập:</span>
          <select
            value={currentAssignment.id}
            onChange={(e) => setActiveAssignmentId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-200 rounded-lg bg-white text-indigo-700 focus:outline-none"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title} ({a.subject})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Submission Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Tỷ Lệ Nộp Bài</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{stats.submissionRate}%</span>
            <span className="text-xs text-slate-500 font-medium">
              ({stats.submittedCount}/{stats.totalStudentsCount} học sinh)
            </span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all"
              style={{ width: `${stats.submissionRate}%` }}
            />
          </div>
        </div>

        {/* Card 2: Average Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Điểm Trung Bình</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.submittedCount > 0 ? stats.averageScore : '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {currentAssignment.totalPoints} đ
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 font-medium">
            {stats.averageScore >= 8 ? 'Đạt loại Giỏi' : stats.averageScore >= 6.5 ? 'Đạt loại Khá' : 'Cần củng cố thêm'}
          </p>
        </div>

        {/* Card 3: Highest Score */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Điểm Cao Nhất</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">
              {stats.submittedCount > 0 ? stats.highestScore : '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              / {currentAssignment.totalPoints} đ
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Thấp nhất: <strong className="text-slate-700">{stats.submittedCount > 0 ? stats.lowestScore : '—'}</strong> đ
          </p>
        </div>

        {/* Card 4: Questions to Reteach */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Cảnh Báo Giảng Lại</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600">
              {questionsNeedingAttention.filter((q) => q.accuracyRate < 60).length}
            </span>
            <span className="text-xs text-slate-500 font-medium">câu dưới 60% đúng</span>
          </div>
          <p className="text-[11px] text-rose-600 font-medium">
            Giáo viên nên giải đáp trên lớp
          </p>
        </div>
      </div>

      {/* Grid: Score distribution & Question accuracy */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution (Phổ điểm) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              Phổ Điểm Toàn Lớp (Phân Bố Kết Quả)
            </h3>
            <span className="text-xs text-slate-400">
              {stats.submittedCount} bài đã nộp
            </span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {/* Xuất sắc */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-emerald-700">Xuất sắc (8.5 - 10.0 đ)</span>
                <span className="text-slate-700">{stats.scoreDistribution.excellent} HS</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${stats.submittedCount > 0 ? (stats.scoreDistribution.excellent / stats.submittedCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Giỏi & Khá */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-blue-700">Giỏi / Khá (7.0 - 8.4 đ)</span>
                <span className="text-slate-700">{stats.scoreDistribution.good} HS</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${stats.submittedCount > 0 ? (stats.scoreDistribution.good / stats.submittedCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Trung bình */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-amber-700">Trung bình (5.0 - 6.9 đ)</span>
                <span className="text-slate-700">{stats.scoreDistribution.average} HS</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${stats.submittedCount > 0 ? (stats.scoreDistribution.average / stats.submittedCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Cần cố gắng */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="text-rose-700">Cần cố gắng (Dưới 5.0 đ)</span>
                <span className="text-slate-700">{stats.scoreDistribution.weak} HS</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full"
                  style={{
                    width: `${stats.submittedCount > 0 ? (stats.scoreDistribution.weak / stats.submittedCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Question accuracy matrix */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Tỷ Lệ Trả Lời Đúng Từng Câu Hỏi
            </h3>
            <span className="text-xs text-slate-400">
              {stats.questionAccuracy.length} câu
            </span>
          </div>

          <div className="space-y-3 pt-1 text-xs max-h-64 overflow-y-auto pr-1">
            {stats.questionAccuracy.map((qa, index) => {
              const isLow = qa.accuracyRate < 60;
              return (
                <div
                  key={qa.questionId}
                  className={`p-3 rounded-xl border ${
                    isLow ? 'border-rose-200 bg-rose-50/40' : 'border-slate-200 bg-slate-50/50'
                  } space-y-1.5`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">
                      Câu {index + 1} ({qa.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Tự luận'})
                    </span>
                    <span
                      className={`font-black text-xs px-2 py-0.5 rounded-md ${
                        isLow
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {qa.accuracyRate}% đúng ({qa.correctCount}/{qa.totalAttempts})
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-1">{qa.content}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Student List in Class and Performance */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            Bảng Điểm Danh Sách Học Sinh Lớp 10A1
          </h3>
          <span className="text-xs text-slate-500">{students.length} học sinh</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-white text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Họ và tên</th>
                <th className="py-2.5 px-4">Tài khoản</th>
                <th className="py-2.5 px-4 text-center">Trạng thái làm bài</th>
                <th className="py-2.5 px-4 text-center">Thời gian làm</th>
                <th className="py-2.5 px-4 text-center">Điểm số</th>
                <th className="py-2.5 px-4 text-center">Xếp loại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((st) => {
                const sub = assignmentSubmissions.find((s) => s.studentId === st.id);
                const hasSubmitted = !!sub;

                let gradeLabel = 'Chưa làm';
                let gradeClass = 'bg-slate-100 text-slate-500';
                if (hasSubmitted) {
                  const pct = (sub.totalScore / sub.maxScore) * 100;
                  if (pct >= 90) {
                    gradeLabel = 'Xuất sắc';
                    gradeClass = 'bg-emerald-100 text-emerald-800';
                  } else if (pct >= 80) {
                    gradeLabel = 'Giỏi';
                    gradeClass = 'bg-blue-100 text-blue-800';
                  } else if (pct >= 65) {
                    gradeLabel = 'Khá';
                    gradeClass = 'bg-indigo-100 text-indigo-800';
                  } else {
                    gradeLabel = 'Trung bình';
                    gradeClass = 'bg-amber-100 text-amber-800';
                  }
                }

                return (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-800">{st.fullName}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      @{st.username}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          hasSubmitted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {hasSubmitted ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Đã nộp bài
                          </>
                        ) : (
                          'Chưa nộp'
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {hasSubmitted ? `${Math.round(sub.timeSpentSeconds / 60)} phút` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasSubmitted ? (
                        <span className="font-black text-slate-900 text-xs">
                          {sub.totalScore}/{sub.maxScore}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${gradeClass}`}>
                        {gradeLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
