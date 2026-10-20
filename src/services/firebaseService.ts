import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  writeBatch,
  arrayUnion,
  query,
  where,
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
  DELETED_RECORDS: 'deleted_records',
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
    // 1. Fetch any already deleted assignment IDs so we never resurrect them
    let deletedAssignmentIds: string[] = [];
    try {
      const deletedSnap = await getDoc(doc(db, COLLECTIONS.DELETED_RECORDS, 'assignments'));
      if (deletedSnap.exists()) {
        const data = deletedSnap.data();
        if (Array.isArray(data?.ids)) {
          deletedAssignmentIds = data.ids;
        }
      }
    } catch {}

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
        if (!deletedAssignmentIds.includes(assignment.id)) {
          const ref = doc(db, COLLECTIONS.ASSIGNMENTS, assignment.id);
          batch.set(ref, sanitizeForFirestore(assignment));
        }
      }
      await batch.commit();
    }

    const submissionSnap = await getDocs(collection(db, COLLECTIONS.SUBMISSIONS));
    if (submissionSnap.empty) {
      console.log('Seeding initial submissions to Firestore...');
      const batch = writeBatch(db);
      for (const sub of INITIAL_SUBMISSIONS) {
        if (!deletedAssignmentIds.includes(sub.assignmentId)) {
          const ref = doc(db, COLLECTIONS.SUBMISSIONS, sub.id);
          batch.set(ref, sanitizeForFirestore(sub));
        }
      }
      await batch.commit();
    }
  } catch (err) {
    console.error('Error during initial seed to Firestore:', err);
  }
}

/**
 * Record deleted assignment ID in Firestore so all devices/students receive realtime deletion notice
 */
export async function recordDeletedAssignmentInFirestore(assignmentId: string): Promise<void> {
  const path = `${COLLECTIONS.DELETED_RECORDS}/assignments`;
  try {
    const docRef = doc(db, COLLECTIONS.DELETED_RECORDS, 'assignments');
    await setDoc(
      docRef,
      {
        ids: arrayUnion(assignmentId),
        lastDeletedId: assignmentId,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn('Notice when saving deleted assignment id to Firestore:', error);
  }
}

/**
 * Real-time listener for Deleted Assignments registry across all devices
 */
export function subscribeToDeletedAssignments(
  onData: (deletedIds: string[]) => void,
  onError?: (err: any) => void
) {
  const docRef = doc(db, COLLECTIONS.DELETED_RECORDS, 'assignments');
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const ids = (docSnap.data()?.ids as string[]) || [];
        onData(ids);
      } else {
        onData([]);
      }
    },
    (error) => {
      console.warn('Realtime listener for deleted assignments notice:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Delete all submissions associated with an assignment from Firestore
 */
export async function deleteSubmissionsForAssignmentFromFirestore(assignmentId: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTIONS.SUBMISSIONS),
      where('assignmentId', '==', assignmentId)
    );
    const snaps = await getDocs(q);
    if (!snaps.empty) {
      const batch = writeBatch(db);
      snaps.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Notice deleting submissions for assignment:', err);
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
 * Delete assignment from Firestore with cascading deletion of submissions and realtime deleted broadcast
 */
export async function deleteAssignmentFromFirestore(assignmentId: string): Promise<void> {
  const path = `${COLLECTIONS.ASSIGNMENTS}/${assignmentId}`;
  try {
    // 1. Immediately record in global deleted registry so real-time listeners trigger everywhere
    await recordDeletedAssignmentInFirestore(assignmentId);

    // 2. Cascade delete all related student submissions from Firestore
    await deleteSubmissionsForAssignmentFromFirestore(assignmentId);

    // 3. Delete assignment document itself
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
