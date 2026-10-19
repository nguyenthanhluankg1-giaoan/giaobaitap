import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  ShieldCheck,
  UserPlus,
  Users,
  GraduationCap,
  BookOpen,
  Copy,
  Check,
  Trash2,
  LogIn,
  Search,
  Filter,
  Key,
  Phone,
  Mail,
  Award,
  BarChart3,
  Sparkles,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { users, assignments, submissions, createTeacher, deleteTeacher, switchUser } = useApp();
  const [activeTab, setActiveTab] = useState<'teachers' | 'students' | 'assignments'>('teachers');
  const [searchTerm, setSearchTerm] = useState('');

  // Form states for creating teacher
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [teachingSubject, setTeachingSubject] = useState('Toán học');
  const [classId, setClassId] = useState('10A1');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const teachers = users.filter((u) => u.role === 'teacher');
  const students = users.filter((u) => u.role === 'student');

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.teachingSubject && t.teachingSubject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!fullName.trim() || !username.trim()) {
      setFormError('Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập giáo viên.');
      return;
    }

    const exists = users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      setFormError('Tên đăng nhập này đã được sử dụng, vui lòng chọn tên khác.');
      return;
    }

    createTeacher({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim() || '123',
      teachingSubject,
      classId: classId.trim() || '10A1',
      phone: phone.trim(),
      email: email.trim(),
    });

    setFormSuccess(`Đã tạo tài khoản Giáo viên "${fullName}" thành công!`);
    setFullName('');
    setUsername('');
    setPassword('123');
    setPhone('');
    setEmail('');
  };

  const copyCredentials = (teacherName: string, un: string, pw?: string, subject?: string) => {
    const text = `Tài khoản Giáo viên EduHomework:\nGiáo viên: ${teacherName}\nMôn giảng dạy: ${subject || 'Chưa phân công'}\nTên đăng nhập: ${un}\nMật khẩu: ${pw || '123'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(un);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Admin Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-white text-2xl font-black shrink-0">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[11px] font-bold border border-indigo-500/30 mb-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>Cổng Quản Trị Viên (Admin) • Toàn quyền hệ thống</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Quản Lý Hệ Thống & Cấp Tài Khoản Giáo Viên
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
              Tài khoản hiện tại: <strong className="text-white">@admin</strong> (Mật khẩu: <span className="font-mono text-indigo-300">admin123</span>). Quản trị giáo viên, học sinh và kho bài tập.
            </p>
          </div>
        </div>

        {/* Global stats metrics */}
        <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/10 shrink-0 text-center">
          <div className="px-3">
            <div className="text-[11px] text-slate-400">Giáo viên</div>
            <div className="text-xl font-black text-indigo-400">{teachers.length}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="px-3">
            <div className="text-[11px] text-slate-400">Học sinh</div>
            <div className="text-xl font-black text-emerald-400">{students.length}</div>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="px-3">
            <div className="text-[11px] text-slate-400">Bài tập</div>
            <div className="text-xl font-black text-white">{assignments.length}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('teachers')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'teachers'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Quản Lý Giáo Viên</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">
            {teachers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('students')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Học Sinh</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">
            {students.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assignments')}
          className={`py-2 px-4 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
            activeTab === 'assignments'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Kho Đề Hệ Thống</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-white/20 rounded-full">
            {assignments.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Manage & Create Teachers */}
      {activeTab === 'teachers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Create Teacher Account */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 text-sm">Tạo Tài Khoản Giáo Viên Mới</h3>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg font-medium">
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleCreateTeacher} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Họ và tên giáo viên <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    if (!username) {
                      const clean = e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '');
                      if (clean) setUsername(`gv_${clean}`);
                    }
                  }}
                  placeholder="Ví dụ: Thầy Trần Anh Dũng"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên đăng nhập <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="gv_anhdung"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mật khẩu ban đầu
                  </label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="123"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Môn giảng dạy
                  </label>
                  <select
                    value={teachingSubject}
                    onChange={(e) => setTeachingSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                  >
                    <option value="Toán học">Toán học</option>
                    <option value="Ngữ văn">Ngữ văn</option>
                    <option value="Tiếng Anh">Tiếng Anh</option>
                    <option value="Vật lý">Vật lý</option>
                    <option value="Hóa học">Hóa học</option>
                    <option value="Sinh học">Sinh học</option>
                    <option value="Lịch sử">Lịch sử</option>
                    <option value="Địa lý">Địa lý</option>
                    <option value="Tin học">Tin học</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Lớp phụ trách
                  </label>
                  <input
                    type="text"
                    value={classId}
                    onChange={(e) => setClassId(e.target.value)}
                    placeholder="10A1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="giaovien@edu.vn"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Cấp Tài Khoản Cho Giáo Viên</span>
              </button>
            </form>
          </div>

          {/* List of Teachers */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm giáo viên theo tên, môn học, tài khoản..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <span className="text-xs text-slate-400 shrink-0 font-medium">
                {filteredTeachers.length} giáo viên
              </span>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Giáo Viên</th>
                    <th className="py-2.5 px-4">Tài Khoản / MK</th>
                    <th className="py-2.5 px-4 text-center">Môn Giảng Dạy</th>
                    <th className="py-2.5 px-4 text-center">Lớp</th>
                    <th className="py-2.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
                            {t.fullName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{t.fullName}</div>
                            <div className="text-[10px] text-slate-400">{t.email || t.phone || 'Chưa cập nhật liên hệ'}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono text-[11px]">
                        <div className="text-slate-800 font-bold">@{t.username}</div>
                        <div className="text-slate-400 text-[10px]">MK: {t.password || '123'}</div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold text-[10px] border border-indigo-200/50">
                          {t.teachingSubject || 'Bộ môn'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-slate-700 text-[11px]">
                          {t.classId || '10A1'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Copy credentials */}
                          <button
                            type="button"
                            onClick={() => copyCredentials(t.fullName, t.username, t.password, t.teachingSubject)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                            title="Sao chép tên đăng nhập & mật khẩu"
                          >
                            {copiedId === t.username ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-[10px] text-emerald-600 font-bold">Đã chép</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[10px] hidden sm:inline">Gửi thông tin</span>
                              </>
                            )}
                          </button>

                          {/* Login as teacher */}
                          <button
                            type="button"
                            onClick={() => switchUser(t)}
                            className="p-1.5 text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 text-xs flex items-center gap-1 font-medium"
                            title="Đăng nhập thử với tài khoản giáo viên này"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden sm:inline">Vào dạy</span>
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Bạn có chắc muốn xóa tài khoản giáo viên "${t.fullName}" không?`)) {
                                deleteTeacher(t.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Xóa giáo viên"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Students List */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Toàn Bộ Học Sinh Trong Hệ Thống ({students.length} học sinh)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Họ và tên</th>
                  <th className="py-2.5 px-4">Tài khoản</th>
                  <th className="py-2.5 px-4 text-center">Lớp</th>
                  <th className="py-2.5 px-4">Liên hệ phụ huynh</th>
                  <th className="py-2.5 px-4 text-right">Đăng nhập thử</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-900">{st.fullName}</td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">@{st.username}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-bold text-[10px]">
                        {st.classId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">{st.phone || st.email || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => switchUser(st)}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 inline-flex items-center gap-1"
                      >
                        <LogIn className="w-3 h-3" />
                        <span>Vào học sinh</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Assignments Repository */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              Tất Cả Bài Tập Trong Hệ Thống ({assignments.length} bài)
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-slate-400 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Tên bài tập</th>
                  <th className="py-2.5 px-4">Môn học / Lớp</th>
                  <th className="py-2.5 px-4 text-center">Số câu</th>
                  <th className="py-2.5 px-4 text-center">Điểm tối đa</th>
                  <th className="py-2.5 px-4 text-center">Số bài đã nộp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {assignments.map((a) => {
                  const subsCount = submissions.filter((s) => s.assignmentId === a.id).length;
                  return (
                    <tr key={a.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-bold text-slate-900">{a.title}</td>
                      <td className="py-3 px-4 text-slate-600">
                        {a.subject} • {a.grade}
                      </td>
                      <td className="py-3 px-4 text-center">{a.questions.length} câu</td>
                      <td className="py-3 px-4 text-center font-bold text-indigo-600">{a.totalPoints} đ</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                          {subsCount} bài nộp
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
