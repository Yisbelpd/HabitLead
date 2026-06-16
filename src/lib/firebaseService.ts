import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  getDocFromServer,
  type Firestore 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize the Firebase App & Services statically to ensure simple/clean integration
const app = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// 1. Validation check during boot (as mandated by system guidelines)
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Please check your Firebase configuration or network status.");
    }
  }
}
testConnection();

// 2. Standardized Firestore Error Logging (Mandated by System Skill)
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  console.error('[FireStore Security Violation / Operation Failed]:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

// 3. Application Interfaces
export interface UserProfile {
  name: string;
  role: 'user' | 'admin';
  createdAt: any; // Server timestamp
}

export interface PrivatePII {
  email: string;
}

export interface ProgressRecord {
  date: string; // Format: YYYY-MM-DD
  completedHabits: string[];
  badges: string[];
  currentStreak: number;
  userId: string;
}

// 4. Secure API Services

/**
 * Perform login using standard Popup flow as recommended under AI Studio iframe constraints.
 */
export async function loginWithGoogle(): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

/**
 * Register a user with email and password, then set up Firestore profile.
 */
export async function registerWithEmailAndPassword(email: string, password: string, name: string): Promise<FirebaseUser> {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const user = credential.user;
    
    // Update local Firebase Auth user displayName
    await updateProfile(user, { displayName: name });
    
    // Provision user properties safely in Firestore
    await setupUserInFirestore(user, name);
    
    return user;
  } catch (error) {
    console.error("Registration with email & password failed:", error);
    throw error;
  }
}

/**
 * Log in a user with email and password.
 */
export async function loginWithEmailAndPassword(email: string, password: string): Promise<FirebaseUser> {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    return credential.user;
  } catch (error) {
    console.error("Login with email & password failed:", error);
    throw error;
  }
}

/**
 * Handle user signout
 */
export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

/**
 * Register a user's safe profile and isolate standard Gmail/Email PII under a private subcollection.
 * This satisfies the "User and Admin partition" and "PII protection rules".
 */
export async function setupUserInFirestore(
  user: FirebaseUser,
  name: string,
  role: 'user' | 'admin' = 'user'
): Promise<void> {
  // A. Publicly accessible metadata profile (usable by managers, colleagues, or admins)
  const userProfilePath = `users/${user.uid}`;
  try {
    const profileRef = doc(db, 'users', user.uid);
    // Check if profile already exists to prevent overwriting 'createdAt' or fields
    const docSnap = await getDoc(profileRef);
    if (!docSnap.exists()) {
      const payload: UserProfile = {
        name: name,
        role: role,
        createdAt: serverTimestamp() // Validates our rules' temporal integrity rule
      };
      await setDoc(profileRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userProfilePath);
  }

  // B. Isolated personal sensitive data (Protected PII under Split Collection style)
  const userSensitivePath = `users/${user.uid}/private/sensitive`;
  try {
    const sensitiveRef = doc(db, 'users', user.uid, 'private', 'sensitive');
    const docSnap = await getDoc(sensitiveRef);
    if (!docSnap.exists()) {
      const payload: PrivatePII = {
        email: user.email || ''
      };
      await setDoc(sensitiveRef, payload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userSensitivePath);
  }
}

/**
 * Safely fetches the public/operational portion of a user's workspace profile.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const profilePath = `users/${userId}`;
  try {
    const profileRef = doc(db, 'users', userId);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, profilePath);
    return null;
  }
}

/**
 * Securely writes a daily wellness progress check-in record.
 */
export async function recordDailyProgress(
  userId: string,
  record: Omit<ProgressRecord, 'userId'>
): Promise<void> {
  const docId = record.date; // Use date (YYYY-MM-DD) as natural hard identifier to avoid duplicates
  const progressPath = `users/${userId}/progress_history/${docId}`;
  
  try {
    const recordRef = doc(db, 'users', userId, 'progress_history', docId);
    const payload: ProgressRecord = {
      ...record,
      userId: userId // Fulfills matching ID verification
    };
    await setDoc(recordRef, payload);
    console.log(`[Firebase Service]: Progress logged successfully for ${record.date}.`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, progressPath);
  }
}

/**
 * Queries and fetches all progress records for a user.
 * Restricted to the owner of the logs, or the admin portal role.
 */
export async function fetchProgressHistory(userId: string): Promise<ProgressRecord[]> {
  const progressPath = `users/${userId}/progress_history`;
  try {
    const colRef = collection(db, 'users', userId, 'progress_history');
    const snap = await getDocs(colRef);
    const results: ProgressRecord[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as ProgressRecord);
    });
    // Sort descending by date
    return results.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, progressPath);
    return [];
  }
}
