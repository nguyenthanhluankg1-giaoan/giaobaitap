import React, { useState } from 'react';
import { useApp } from '../../context/AppContext.tsx';
import {
  UserPlus,
  Users,
  Copy,
  Check,
  Trash2,
  Key,
  Phone,
  Mail,
  Shield,
  Search,
  LogIn,
  ExternalLink,
} from 'lucide-react';

export const StudentManager: React.FC = () => {
  const { users, createStudent, deleteStudent, switchUser } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123');
  const [classId, setClassId] = useState('10A1');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  const students = users.filter((u) => u.role === 'student');

  const filteredStudents = students.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.classId && s.classId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!fullName.trim() || !username.trim()) {
      setFormError('Vui lòng nhập đầy đủ Họ tên và Tên đăng nhập.');
      return;
    }

    // Check duplicate username
    const exists = users.some(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (exists) {
      setFormError('Tên đăng nhập này đã tồn tại, vui lòng chọn tên khác.');
      return;
    }

    createStudent({
      fullName: fullName.trim(),
      username: username.trim().toLowerCase(),
      password: password.trim() || '123',
      classId: classId.trim() || '10A1',
      phone: phone.trim(),
      email: email.trim(),
    });

    setFormSuccess(`Đã tạo tài khoản cho học sinh "${fullName}" thành công!`);
    setFullName('');
    setUsername('');
    setPassword('123');
    setPhone('');
    setEmail('');
  };

  const copyCredentials = (studentName: string, un: string, pw?: string) => {
    const text = `Tài khoản học tập EduHomework:\nHọc sinh: ${studentName}\nTên đăng nhập: ${un}\nMật khẩu: ${pw || '123'}`;
    navigator.clipboard.writeText(text);
    setCopiedId(un);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Quản Lý & Cấp Tài Khoản Cho Học Sinh
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Giáo viên tạo tài khoản đăng nhập để học sinh vào học, nộp bài tập và xem nhận xét.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200/60">
            Tổng số: {students.length} học sinh
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Create Student Account */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Tạo Tài Khoản Học Sinh Mới</h3>
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

          <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  // Suggest username
                  if (!username) {
                    const clean = e.target.value
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]/g, '');
                    if (clean) setUsername(`hs_${clean}`);
                  }
                }}
                placeholder="Ví dụ: Hoàng Đình Nam"
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
                  placeholder="hs_dinhnam"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mật khẩu
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
                  Lớp học
                </label>
                <input
                  type="text"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  placeholder="10A1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  SĐT Phụ huynh
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0988..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Email thông báo (tùy chọn)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="phuhuynh@gmail.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-100 flex items-center justify-center gap-2 transition-all mt-4 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Cấp Tài Khoản Mới Cho Học Sinh</span>
            </button>
          </form>
        </div>

        {/* Right Column: Students Table & Quick Actions */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between overflow-hidden">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm học sinh theo tên, tài khoản, lớp..."
                className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <span className="text-xs text-slate-400 shrink-0">
              {filteredStudents.length} kết quả
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Họ và Tên</th>
                  <th className="py-2.5 px-4">Tài Khoản / MK</th>
                  <th className="py-2.5 px-4 text-center">Lớp</th>
                  <th className="py-2.5 px-4 text-right">Sao chép & Thử nghiệm</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                          {st.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{st.fullName}</div>
                          <div className="text-[10px] text-slate-400">
                            {st.phone || 'Chưa cập nhật SĐT'}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-slate-800 font-bold">@{st.username}</div>
                      <div className="text-slate-400 text-[10px]">MK: {st.password || '123'}</div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold text-[10px]">
                        {st.classId || '10A1'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Copy credential button */}
                        <button
                          type="button"
                          onClick={() => copyCredentials(st.fullName, st.username, st.password)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 text-xs flex items-center gap-1"
                          title="Sao chép tên đăng nhập và mật khẩu gửi học sinh"
                        >
                          {copiedId === st.username ? (
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

                        {/* Switch user button to test */}
                        <button
                          type="button"
                          onClick={() => switchUser(st)}
                          className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-200 text-xs flex items-center gap-1 font-medium"
                          title="Đăng nhập thử với tư cách học sinh này"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span className="text-[10px] hidden sm:inline">Vào học</span>
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xóa tài khoản "${st.fullName}" không?`)) {
                              deleteStudent(st.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                          title="Xóa tài khoản"
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
    </div>
  );
};
