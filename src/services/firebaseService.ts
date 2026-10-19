import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase.ts';
import { User, Assignment, Submission } from '../types/index.ts';
import { INITIAL_USERS, INITIAL_ASSIGNMENTS, INITIAL_SUBMISSIONS } from '../data/initialData.ts';
import { handleFirestoreError, OperationType } from '../utils/firebaseErrors.ts';

// Clean undefined properties so Firestore doesn't reject writes
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = sanitizeForFirestore(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

const COLLECTIONS = {
  USERS: 'users',
  ASSIGNMENTS: 'assignments',
  SUBMISSIONS: 'submissions',
};

/**
 * Real-time listener for Users
 */
export function subscribeToUsers(
  onData: (users: User[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, COLLECTIONS.USERS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const users: User[] = [];
      snapshot.forEach((docSnap) => {
        users.push(docSnap.data() as User);
      });
      onData(users);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.USERS);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Assignments
 */
export function subscribeToAssignments(
  onData: (assignments: Assignment[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, COLLECTIONS.ASSIGNMENTS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Assignment[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Assignment);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.ASSIGNMENTS);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for Submissions
 */
export function subscribeToSubmissions(
  onData: (submissions: Submission[]) => void,
  onError?: (err: any) => void
) {
  const colRef = collection(db, COLLECTIONS.SUBMISSIONS);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Submission[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as Submission);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, COLLECTIONS.SUBMISSIONS);
      if (onError) onError(error);
    }
  );
}

/**
 * Seed initial mock data to Firestore if database is empty
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  try {
    const userSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    if (userSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      const batch = writeBatch(db);
      for (const user of INITIAL_USERS) {
        const ref = doc(db, COLLECTIONS.USERS, user.id);
        batch.set(ref, sanitizeForFirestore(user));
      }
      await batch.commit();
    } else {
      // Ensure admin user exists with admin123
      const hasAdmin = userSnap.docs.some((d) => d.data()?.username === 'admin');
      if (!hasAdmin) {
        const adminUser = INITIAL_USERS.find((u) => u.username === 'admin') || {
          id: 'admin-1',
          username: 'admin',
          password: 'admin123',
          fullName: 'Quản Trị Viên Hệ Thống',
          role: 'admin' as const,
          email: 'admin@eduhomework.edu.vn',
          createdAt: new Date().toISOString(),
        };
        await setDoc(doc(db, COLLECTIONS.USERS, adminUser.id), sanitizeForFirestore(adminUser));
      }
    }

    const assignmentSnap = await getDocs(collection(db, COLLECTIONS.ASSIGNMENTS));
    if (assignmentSnap.empty) {
      console.log('Seeding initial assignments to Firestore...');
      const batch = writeBatch(db);
      for (const assignment of INITIAL_ASSIGNMENTS) {
        const ref = doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id);
        batch.set(ref, sanitizeForFirestore(assignment));
      }
      await batch.commit();
    }

    const submissionSnap = await getDocs(collection(db, COLLECTIONS.SUBMISSIONS));
    if (submissionSnap.empty) {
      console.log('Seeding initial submissions to Firestore...');
      const batch = writeBatch(db);
      for (const sub of INITIAL_SUBMISSIONS) {
        const ref = doc(db, COLLECTIONS.SUBMISSIONS, sub.id);
        batch.set(ref, sanitizeForFirestore(sub));
      }
      await batch.commit();
    }
  } catch (err) {
    console.error('Error during initial seed to Firestore:', err);
  }
}

/**
 * Save user to Firestore
 */
export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${user.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(docRef, sanitizeForFirestore(user), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete user from Firestore
 */
export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const path = `${COLLECTIONS.USERS}/${userId}`;
  try {
    const docRef = doc(db, COLLECTIONS.USERS, userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save assignment to Firestore
 */
export async function saveAssignmentToFirestore(assignment: Assignment): Promise<void> {
  const path = `${COLLECTIONS.ASSIGNMENTS}/${assignment.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id);
    await setDoc(docRef, sanitizeForFirestore(assignment), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete assignment from Firestore
 */
export async function deleteAssignmentFromFirestore(assignmentId: string): Promise<void> {
  const path = `${COLLECTIONS.ASSIGNMENTS}/${assignmentId}`;
  try {
    const docRef = doc(db, COLLECTIONS.ASSIGNMENTS, assignmentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Save submission to Firestore
 */
export async function saveSubmissionToFirestore(submission: Submission): Promise<void> {
  const path = `${COLLECTIONS.SUBMISSIONS}/${submission.id}`;
  try {
    const docRef = doc(db, COLLECTIONS.SUBMISSIONS, submission.id);
    await setDoc(docRef, sanitizeForFirestore(submission), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}
