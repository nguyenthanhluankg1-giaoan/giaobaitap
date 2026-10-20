import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Assignment, Submission, QuestionAnswer } from '../types/index.ts';
import { INITIAL_USERS, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from '../data/initialData.ts';
import { gradeMultipleChoice, autoGradeEssay, calculateSubmissionTotals } from '../utils/grading.ts';
import { testConnection } from '../firebase.ts';
import {
  subscribeToUsers,
  subscribeToAssignments,
  subscribeToSubmissions,
  subscribeToDeletedAssignments,
  recordDeletedAssignmentInFirestore,
  seedFirestoreIfEmpty,
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveAssignmentToFirestore,
  deleteAssignmentFromFirestore,
  saveSubmissionToFirestore,
} from '../services/firebaseService.ts';
import { broadcastSyncEvent, subscribeToSyncEvents } from '../utils/syncChannel.ts';

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

const CURRENT_USER_KEY = 'eduhomework_current_user_id_v5';
const CURRENT_USER_OBJ_KEY = 'eduhomework_current_user_obj_v5';
const LOCAL_USERS_KEY = 'eduhomework_users_v5';
const DELETED_USERS_KEY = 'eduhomework_deleted_users_v5';
const LOCAL_ASSIGNMENTS_KEY = 'eduhomework_assignments_v5';
const DELETED_ASSIGNMENTS_KEY = 'eduhomework_deleted_assignments_v5';
const LOCAL_SUBMISSIONS_KEY = 'eduhomework_submissions_v5';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const storedDeleted = localStorage.getItem(DELETED_USERS_KEY);
      const deletedUserIds = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];

      const stored = localStorage.getItem(LOCAL_USERS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as User[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((u) => !deletedUserIds.includes(u.id));
        }
      }
      return INITIAL_USERS.filter((u) => !deletedUserIds.includes(u.id));
    } catch {
      return INITIAL_USERS;
    }
  });

  // Initialize assignments with localStorage cache and deleted IDs filter
  const [assignments, setAssignments] = useState<Assignment[]>(() => {
    try {
      const storedDeleted = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
      const deletedIds = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];

      const stored = localStorage.getItem(LOCAL_ASSIGNMENTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Assignment[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((a) => !deletedIds.includes(a.id));
        }
      }
      return INITIAL_ASSIGNMENTS.filter((a) => !deletedIds.includes(a.id));
    } catch {
      return INITIAL_ASSIGNMENTS;
    }
  });

  const [submissions, setSubmissions] = useState<Submission[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_SUBMISSIONS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Submission[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  });

  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const currentId = localStorage.getItem(CURRENT_USER_KEY);
      if (!currentId || currentId === 'LOGGED_OUT') {
        return null;
      }

      // 1. Try reading full user object saved in localStorage
      const storedUserObj = localStorage.getItem(CURRENT_USER_OBJ_KEY);
      if (storedUserObj) {
        const parsed = JSON.parse(storedUserObj) as User;
        if (parsed && parsed.id === currentId) return parsed;
      }

      // 2. Try looking up current user ID in local users or initial users
      const storedUsers = localStorage.getItem(LOCAL_USERS_KEY);
      const usersList: User[] = storedUsers ? JSON.parse(storedUsers) : INITIAL_USERS;
      const found =
        usersList.find((u) => u.id === currentId) || INITIAL_USERS.find((u) => u.id === currentId);
      if (found) return found;

      return null;
    } catch {
      return null;
    }
  });

  // Track current user in localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(CURRENT_USER_KEY, currentUser.id);
      localStorage.setItem(CURRENT_USER_OBJ_KEY, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(CURRENT_USER_OBJ_KEY);
    }
  }, [currentUser]);

  // Persist users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);

  // Persist assignments to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(assignments));
    } catch (e) {
      console.error('Failed to save assignments to localStorage', e);
    }
  }, [assignments]);

  // Persist submissions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(submissions));
    } catch (e) {
      console.error('Failed to save submissions to localStorage', e);
    }
  }, [submissions]);

  // Listen to BroadcastChannel and window storage events for instantaneous cross-tab synchronization
  useEffect(() => {
    const unsubscribeSync = subscribeToSyncEvents((event) => {
      if (event.type === 'ASSIGNMENT_DELETED') {
        const deletedId = event.assignmentId;
        setAssignments((prev) => prev.filter((a) => a.id !== deletedId));
        setSubmissions((prev) => prev.filter((s) => s.assignmentId !== deletedId));
        try {
          const stored = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
          const currentDeleted = stored ? (JSON.parse(stored) as string[]) : [];
          if (!currentDeleted.includes(deletedId)) {
            currentDeleted.push(deletedId);
            localStorage.setItem(DELETED_ASSIGNMENTS_KEY, JSON.stringify(currentDeleted));
          }
        } catch {}
      }
    });

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === DELETED_ASSIGNMENTS_KEY && e.newValue) {
        try {
          const deletedIds = JSON.parse(e.newValue) as string[];
          if (Array.isArray(deletedIds)) {
            setAssignments((prev) => prev.filter((a) => !deletedIds.includes(a.id)));
            setSubmissions((prev) => prev.filter((s) => !deletedIds.includes(s.assignmentId)));
          }
        } catch {}
      } else if (e.key === LOCAL_ASSIGNMENTS_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue) as Assignment[];
          const storedDeleted = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
          const deletedIds = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];
          if (Array.isArray(parsed)) {
            setAssignments(parsed.filter((a) => !deletedIds.includes(a.id) && (a as any).status !== 'deleted'));
          }
        } catch {}
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribeSync();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Connect to Firestore and start real-time listeners
  useEffect(() => {
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeAssignments: (() => void) | undefined;
    let unsubscribeSubmissions: (() => void) | undefined;
    let unsubscribeDeletedAssignments: (() => void) | undefined;

    async function initFirebase() {
      const connected = await testConnection();
      setFirebaseConnected(connected);

      // Seed if Firestore has no documents yet
      await seedFirestoreIfEmpty();

      // Listen to real-time changes from Firestore for Deleted Assignments registry
      unsubscribeDeletedAssignments = subscribeToDeletedAssignments((freshDeletedIds) => {
        if (freshDeletedIds && freshDeletedIds.length > 0) {
          try {
            const storedDeleted = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
            const currentDeleted = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];
            const mergedDeleted = Array.from(new Set([...currentDeleted, ...freshDeletedIds]));
            localStorage.setItem(DELETED_ASSIGNMENTS_KEY, JSON.stringify(mergedDeleted));

            setAssignments((prev) => {
              const filtered = prev.filter((a) => !mergedDeleted.includes(a.id));
              try {
                localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(filtered));
              } catch {}
              return filtered;
            });

            setSubmissions((prev) => {
              const filtered = prev.filter((s) => !mergedDeleted.includes(s.assignmentId));
              try {
                localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(filtered));
              } catch {}
              return filtered;
            });
          } catch {}
        }
      });

      // Listen to real-time changes from Firestore
      unsubscribeUsers = subscribeToUsers((freshUsers) => {
        if (freshUsers.length > 0) {
          try {
            const storedDeleted = localStorage.getItem(DELETED_USERS_KEY);
            const deletedUserIds = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];

            setUsers((prev) => {
              const map = new Map<string, User>();
              for (const u of INITIAL_USERS) {
                if (!deletedUserIds.includes(u.id)) map.set(u.id, u);
              }
              for (const u of prev) {
                if (!deletedUserIds.includes(u.id)) map.set(u.id, u);
              }
              for (const u of freshUsers) {
                if (!deletedUserIds.includes(u.id)) map.set(u.id, u);
              }
              const merged = Array.from(map.values());
              try {
                localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          } catch {
            setUsers(freshUsers);
          }

          setCurrentUser((curr) => {
            const savedId = localStorage.getItem(CURRENT_USER_KEY);
            const targetId = curr?.id || savedId;
            if (targetId && targetId !== 'LOGGED_OUT') {
              const updated = freshUsers.find((u) => u.id === targetId);
              if (updated) return updated;
            }
            return curr;
          });
        }
      });

      unsubscribeAssignments = subscribeToAssignments((freshAssignments) => {
        try {
          const storedDeleted = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
          const deletedIds = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];

          setAssignments((prev) => {
            // Check for in-flight locally created assignments (within 15s) that haven't landed yet
            const inFlightLocal = prev.filter(
              (a) =>
                (a as any)._localPendingSync &&
                Date.now() - (a as any)._localPendingSync < 15000 &&
                !deletedIds.includes(a.id) &&
                (a as any).status !== 'deleted'
            );

            // Authoritative list is freshAssignments from Firestore
            const map = new Map<string, Assignment>();

            // 1. Add all active assignments from Firestore (excluding deletedIds and status === 'deleted')
            for (const a of freshAssignments) {
              if (!deletedIds.includes(a.id) && (a as any).status !== 'deleted' && !(a as any).isDeleted) {
                map.set(a.id, a);
              }
            }

            // 2. Keep local in-flight creations that haven't synced to Firestore yet
            for (const a of inFlightLocal) {
              if (!map.has(a.id) && !deletedIds.includes(a.id)) {
                map.set(a.id, a);
              }
            }

            const merged = Array.from(map.values());
            merged.sort(
              (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
            );

            try {
              localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(merged));
            } catch {}

            return merged;
          });
        } catch {
          if (freshAssignments.length > 0) {
            setAssignments(freshAssignments.filter((a) => (a as any).status !== 'deleted'));
          }
        }
      });

      unsubscribeSubmissions = subscribeToSubmissions((freshSubmissions) => {
        try {
          const storedDeleted = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
          const deletedIds = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];

          setSubmissions((prev) => {
            const map = new Map<string, Submission>();
            for (const s of prev) {
              if (!deletedIds.includes(s.assignmentId)) map.set(s.id, s);
            }
            for (const s of freshSubmissions) {
              if (!deletedIds.includes(s.assignmentId)) map.set(s.id, s);
            }
            const merged = Array.from(map.values());
            merged.sort(
              (a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime()
            );
            try {
              localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        } catch {
          setSubmissions(freshSubmissions);
        }
      });
    }

    initFirebase();

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAssignments) unsubscribeAssignments();
      if (unsubscribeSubmissions) unsubscribeSubmissions();
      if (unsubscribeDeletedAssignments) unsubscribeDeletedAssignments();
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
    try {
      localStorage.setItem(CURRENT_USER_KEY, 'LOGGED_OUT');
      localStorage.removeItem(CURRENT_USER_OBJ_KEY);
    } catch {}
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

    setUsers((prev) => {
      const next = [...prev, newTeacher];
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    await saveUserToFirestore(newTeacher);
    return newTeacher;
  };

  const deleteTeacher = async (teacherId: string) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== teacherId);
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const stored = localStorage.getItem(DELETED_USERS_KEY);
      const deleted = stored ? (JSON.parse(stored) as string[]) : [];
      if (!deleted.includes(teacherId)) {
        deleted.push(teacherId);
        localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(deleted));
      }
    } catch {}

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

    setUsers((prev) => {
      const next = [...prev, newStudent];
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    await saveUserToFirestore(newStudent);
    return newStudent;
  };

  const deleteStudent = async (studentId: string) => {
    setUsers((prev) => {
      const next = prev.filter((u) => u.id !== studentId);
      try {
        localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    try {
      const stored = localStorage.getItem(DELETED_USERS_KEY);
      const deleted = stored ? (JSON.parse(stored) as string[]) : [];
      if (!deleted.includes(studentId)) {
        deleted.push(studentId);
        localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(deleted));
      }
    } catch {}

    setSubmissions((prev) => {
      const next = prev.filter((s) => s.studentId !== studentId);
      try {
        localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    if (currentUser?.id === studentId) {
      const teacher = users.find((u) => u.role === 'teacher');
      setCurrentUser(teacher || null);
    }
    await deleteUserFromFirestore(studentId);
  };

  const addAssignment = async (newAssignment: Assignment) => {
    const stampedAssignment: Assignment = {
      ...newAssignment,
      ...({ _localPendingSync: Date.now() } as any),
    };
    setAssignments((prev) => {
      const next = [stampedAssignment, ...prev.filter((a) => a.id !== newAssignment.id)];
      try {
        localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    await saveAssignmentToFirestore(newAssignment);
  };

  const updateAssignment = async (updated: Assignment) => {
    setAssignments((prev) => {
      const next = prev.map((a) => (a.id === updated.id ? updated : a));
      try {
        localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
    await saveAssignmentToFirestore(updated);
  };

  const deleteAssignment = async (assignmentId: string) => {
    // 0. Instantly broadcast to all other open tabs/windows
    broadcastSyncEvent({ type: 'ASSIGNMENT_DELETED', assignmentId });

    // 1. Update assignments state & localStorage
    setAssignments((prev) => {
      const next = prev.filter((a) => a.id !== assignmentId);
      try {
        localStorage.setItem(LOCAL_ASSIGNMENTS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 2. Add to deleted IDs registry in localStorage
    try {
      const storedDeleted = localStorage.getItem(DELETED_ASSIGNMENTS_KEY);
      const deletedIds = storedDeleted ? (JSON.parse(storedDeleted) as string[]) : [];
      if (!deletedIds.includes(assignmentId)) {
        deletedIds.push(assignmentId);
        localStorage.setItem(DELETED_ASSIGNMENTS_KEY, JSON.stringify(deletedIds));
      }
    } catch {}

    setSubmissions((prev) => {
      const next = prev.filter((s) => s.assignmentId !== assignmentId);
      try {
        localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    // 3. Delete from Firestore and notify all real-time connected devices
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
      const next = [submission, ...filtered];
      try {
        localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
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

    setSubmissions((prev) => {
      const next = prev.map((s) => (s.id === submissionId ? updatedSub : s));
      try {
        localStorage.setItem(LOCAL_SUBMISSIONS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    await saveSubmissionToFirestore(updatedSub);
  };

  const resetToSampleData = async () => {
    try {
      localStorage.removeItem(DELETED_ASSIGNMENTS_KEY);
      localStorage.removeItem(LOCAL_ASSIGNMENTS_KEY);
      localStorage.removeItem(LOCAL_SUBMISSIONS_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(CURRENT_USER_OBJ_KEY);
      localStorage.removeItem(LOCAL_USERS_KEY);
      localStorage.removeItem(DELETED_USERS_KEY);
    } catch {}
    setUsers(INITIAL_USERS);
    setAssignments(INITIAL_ASSIGNMENTS);
    setSubmissions(INITIAL_SUBMISSIONS);
    const teacher = INITIAL_USERS.find((u) => u.role === 'teacher');
    setCurrentUser(teacher || null);
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
