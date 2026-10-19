import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Assignment, Submission, QuestionAnswer } from '../types/index.ts';
import { INITIAL_USERS, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from '../data/initialData.ts';
import { gradeMultipleChoice, autoGradeEssay, calculateSubmissionTotals } from '../utils/grading.ts';
import { testConnection } from '../firebase.ts';
import {
  subscribeToUsers,
  subscribeToAssignments,
  subscribeToSubmissions,
  seedFirestoreIfEmpty,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveAssignmentToFirestore,
  deleteAssignmentFromFirestore,
  saveSubmissionToFirestore,
} from '../services/firebaseService.ts';

interface AppContextType {
  currentUser: User | null;
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  firebaseConnected: boolean;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  switchUser: (user: User) => void;
  createTeacher: (teacher: {
    username: string;
    fullName: string;
    password?: string;
    classId?: string;
    teachingSubject?: string;
    phone?: string;
    email?: string;
  }) => Promise<User>;
  deleteTeacher: (teacherId: string) => Promise<void>;
  createStudent: (student: {
    username: string;
    fullName: string;
    password?: string;
    classId?: string;
    phone?: string;
    email?: string;
  }) => Promise<User>;
  deleteStudent: (studentId: string) => Promise<void>;
  addAssignment: (assignment: Assignment) => Promise<void>;
  updateAssignment: (assignment: Assignment) => Promise<void>;
  deleteAssignment: (assignmentId: string) => Promise<void>;
  submitHomework: (
    assignmentId: string,
    rawAnswers: Record<string, { selectedOption?: number; essayText?: string }>,
    timeSpentSeconds: number
  ) => Promise<Submission>;
  gradeSubmission: (
    submissionId: string,
    answers: Record<string, QuestionAnswer>,
    teacherFeedback: string
  ) => Promise<void>;
  resetToSampleData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const CURRENT_USER_KEY = 'eduhomework_current_user_id_v4';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [assignments, setAssignments] = useState<Assignment[]>(INITIAL_ASSIGNMENTS);
  const [submissions, setSubmissions] = useState<Submission[]>(INITIAL_SUBMISSIONS);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const currentId = localStorage.getItem(CURRENT_USER_KEY);
      if (currentId) {
        const found = INITIAL_USERS.find((u) => u.id === currentId);
        if (found) return found;
      }
      return INITIAL_USERS.find((u) => u.role === 'teacher') || INITIAL_USERS[0] || null;
    } catch {
      return INITIAL_USERS[0] || null;
    }
  });

  // Track current user in localStorage for session persistence
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, currentUser.id);
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  }, [currentUser]);

  // Connect to Firestore and start real-time listeners
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeAssignments: (() => void) | undefined;
    let unsubscribeSubmissions: (() => void) | undefined;

    async function initFirebase() {
      const connected = await testConnection();
      setFirebaseConnected(connected);

      // Seed if Firestore has no documents yet
      await seedFirestoreIfEmpty();

      // Listen to real-time changes from Firestore
      unsubscribeUsers = subscribeToUsers((freshUsers) => {
        if (freshUsers.length > 0) {
          setUsers(freshUsers);
          // Keep current user updated if info changed
          setCurrentUser((curr) => {
            if (!curr) return curr;
            const updated = freshUsers.find((u) => u.id === curr.id);
            return updated || curr;
          });
        }
      });

      unsubscribeAssignments = subscribeToAssignments((freshAssignments) => {
        if (freshAssignments.length > 0) {
          setAssignments(freshAssignments);
        }
      });

      unsubscribeSubmissions = subscribeToSubmissions((freshSubmissions) => {
        setSubmissions(freshSubmissions);
      });
    }

    initFirebase();

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAssignments) unsubscribeAssignments();
      if (unsubscribeSubmissions) unsubscribeSubmissions();
    };
  }, []);

  const login = (username: string, password: string = '123'): boolean => {
    const user = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );
    if (!user) return false;
    if (user.password && user.password !== password.trim()) return false;
    setCurrentUser(user);
    return true;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUser = (user: User) => {
    setCurrentUser(user);
  };

  const createTeacher = async (data: {
    username: string;
    fullName: string;
    password?: string;
    classId?: string;
    teachingSubject?: string;
    phone?: string;
    email?: string;
  }): Promise<User> => {
    const newTeacher: User = {
      id: `teacher-${Date.now()}`,
      username: data.username.trim().toLowerCase(),
      password: data.password?.trim() || '123',
      fullName: data.fullName.trim(),
      role: 'teacher',
      classId: data.classId?.trim() || '10A1',
      teachingSubject: data.teachingSubject?.trim() || 'Toán học',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newTeacher]);
    await saveUserToFirestore(newTeacher);
    return newTeacher;
  };

  const deleteTeacher = async (teacherId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== teacherId));
    if (currentUser?.id === teacherId) {
      const admin = users.find((u) => u.role === 'admin') || users[0];
      setCurrentUser(admin || null);
    }
    await deleteUserFromFirestore(teacherId);
  };

  const createStudent = async (data: {
    username: string;
    fullName: string;
    password?: string;
    classId?: string;
    phone?: string;
    email?: string;
  }): Promise<User> => {
    const newStudent: User = {
      id: `student-${Date.now()}`,
      username: data.username.trim().toLowerCase(),
      password: data.password?.trim() || '123',
      fullName: data.fullName.trim(),
      role: 'student',
      classId: data.classId?.trim() || '10A1',
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      createdAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newStudent]);
    await saveUserToFirestore(newStudent);
    return newStudent;
  };

  const deleteStudent = async (studentId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== studentId));
    setSubmissions((prev) => prev.filter((s) => s.studentId !== studentId));
    if (currentUser?.id === studentId) {
      const teacher = users.find((u) => u.role === 'teacher');
      setCurrentUser(teacher || null);
    }
    await deleteUserFromFirestore(studentId);
  };

  const addAssignment = async (newAssignment: Assignment) => {
    setAssignments((prev) => [newAssignment, ...prev]);
    await saveAssignmentToFirestore(newAssignment);
  };

  const updateAssignment = async (updated: Assignment) => {
    setAssignments((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    await saveAssignmentToFirestore(updated);
  };

  const deleteAssignment = async (assignmentId: string) => {
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
    setSubmissions((prev) => prev.filter((s) => s.assignmentId !== assignmentId));
    await deleteAssignmentFromFirestore(assignmentId);
  };

  const submitHomework = async (
    assignmentId: string,
    rawAnswers: Record<string, { selectedOption?: number; essayText?: string }>,
    timeSpentSeconds: number
  ): Promise<Submission> => {
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment || !currentUser) {
      throw new Error('Assignment or user not found');
    }

    const processedAnswers: Record<string, QuestionAnswer> = {};

    for (const q of assignment.questions) {
      const raw = rawAnswers[q.id];
      if (q.type === 'multiple_choice') {
        const mcResult = gradeMultipleChoice(q, raw?.selectedOption);
        processedAnswers[q.id] = {
          questionId: q.id,
          selectedOption: raw?.selectedOption,
          score: mcResult.score,
          autoScore: mcResult.score,
          isCorrect: mcResult.isCorrect,
        };
      } else {
        const essayResult = autoGradeEssay(q, raw?.essayText || '');
        processedAnswers[q.id] = {
          questionId: q.id,
          essayText: raw?.essayText || '',
          score: essayResult.score,
          autoScore: essayResult.score,
          teacherNote: essayResult.autoFeedback,
        };
      }
    }

    const totals = calculateSubmissionTotals(assignment.questions, processedAnswers);

    const submission: Submission = {
      id: `sub-${Date.now()}-${currentUser.id}`,
      assignmentId,
      studentId: currentUser.id,
      studentName: currentUser.fullName,
      submittedAt: new Date().toISOString(),
      answers: processedAnswers,
      multipleChoiceScore: totals.multipleChoiceScore,
      essayScore: totals.essayScore,
      totalScore: totals.totalScore,
      maxScore: totals.maxScore,
      status: 'submitted',
      teacherFeedback: `Hệ thống đã tự động chấm phần trắc nghiệm và đánh giá ban đầu phần tự luận. Điểm tạm tính: ${totals.totalScore}/${totals.maxScore}. Đang chờ giáo viên rà soát chi tiết.`,
      timeSpentSeconds,
    };

    setSubmissions((prev) => {
      const filtered = prev.filter(
        (s) => !(s.assignmentId === assignmentId && s.studentId === currentUser.id)
      );
      return [submission, ...filtered];
    });

    await saveSubmissionToFirestore(submission);
    return submission;
  };

  const gradeSubmission = async (
    submissionId: string,
    answers: Record<string, QuestionAnswer>,
    teacherFeedback: string
  ) => {
    const sub = submissions.find((s) => s.id === submissionId);
    if (!sub) return;
    const assignment = assignments.find((a) => a.id === sub.assignmentId);
    const questions = assignment ? assignment.questions : [];
    const totals = calculateSubmissionTotals(questions, answers);

    const updatedSub: Submission = {
      ...sub,
      answers,
      multipleChoiceScore: totals.multipleChoiceScore,
      essayScore: totals.essayScore,
      totalScore: totals.totalScore,
      status: 'graded',
      gradedAt: new Date().toISOString(),
      teacherFeedback,
    };

    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? updatedSub : s))
    );

    await saveSubmissionToFirestore(updatedSub);
  };

  const resetToSampleData = async () => {
    setUsers(INITIAL_USERS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setSubmissions(INITIAL_SUBMISSIONS);
    const teacher = INITIAL_USERS.find((u) => u.role === 'teacher');
    setCurrentUser(teacher || null);
    localStorage.removeItem(CURRENT_USER_KEY);
    await seedFirestoreIfEmpty();
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        assignments,
        submissions,
        firebaseConnected,
        login,
        logout,
        switchUser,
        createTeacher,
        deleteTeacher,
        createStudent,
        deleteStudent,
        addAssignment,
        updateAssignment,
        deleteAssignment,
        submitHomework,
        gradeSubmission,
        resetToSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
