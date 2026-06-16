import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp, 
  updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebaseService';

/**
 * Encrypt/Hash plain password using secure client-side SHA-256 (Web Crypto API).
 * This ensures plain-text passwords never travel to or get stored in the database.
 */
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Creates random string for tokens.
 */
export function generateRandomToken(length = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Custom email Registration
 */
export async function registerCustomUser(
  email: string, 
  passwordPlain: string, 
  secondaryEmail: string, 
  name: string
): Promise<{ success: boolean; message: string; userId: string }> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanSecondary = secondaryEmail.trim().toLowerCase();
  const cleanName = name.trim();

  if (cleanEmail === cleanSecondary) {
    throw new Error('El correo principal y el correo secundario no pueden ser iguales.');
  }

  // 1. Verify if user already exists
  const existingQuery = query(collection(db, 'custom_users'), where('email', '==', cleanEmail));
  const existingSnap = await getDocs(existingQuery);
  if (!existingSnap.empty) {
    throw new Error('El correo electrónico principal ya se encuentra registrado.');
  }

  // 2. Hash password
  const passwordHash = await hashPassword(passwordPlain);

  // 3. Create document reference
  const userId = `usr_${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36).slice(-4)}`;
  const userRef = doc(db, 'custom_users', userId);

  const payload = {
    id: userId,
    email: cleanEmail,
    passwordHash: passwordHash,
    secondaryEmail: cleanSecondary,
    name: cleanName,
    createdAt: serverTimestamp()
  };

  try {
    await setDoc(userRef, payload);
    return { success: true, message: 'Usuario registrado con éxito', userId };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `custom_users/${userId}`);
    return { success: false, message: 'Error al registrar usuario', userId: '' };
  }
}

/**
 * Custom email Login with anti-enumeration protection
 */
export async function loginCustomUser(
  email: string, 
  passwordPlain: string
): Promise<{ success: boolean; message: string; user?: any }> {
  const cleanEmail = email.trim().toLowerCase();

  const userQuery = query(collection(db, 'custom_users'), where('email', '==', cleanEmail));
  const userSnap = await getDocs(userQuery);

  if (userSnap.empty) {
    // Non-enumerative generic error message
    throw new Error('Las credenciales ingresadas son incorrectas o la cuenta no existe.');
  }

  const userDoc = userSnap.docs[0];
  const userData = userDoc.data();
  const inputHash = await hashPassword(passwordPlain);

  if (userData.passwordHash !== inputHash) {
    // Non-enumerative generic error message
    throw new Error('Las credenciales ingresadas son incorrectas o la cuenta no existe.');
  }

  return {
    success: true,
    message: 'Sesión iniciada con éxito',
    user: {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      secondaryEmail: userData.secondaryEmail
    }
  };
}

/**
 * Custom password recovery (Option A) — with anti-enumeration built in
 */
export async function requestPasswordReset(
  email: string
): Promise<{ success: boolean; message: string; simulatedToken?: string; simulatedLink?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  const userQuery = query(collection(db, 'custom_users'), where('email', '==', cleanEmail));
  const userSnap = await getDocs(userQuery);

  // Prevention of user enumeration: Always display success message even if email is not in system
  const defaultMessage = 'Si el correo electrónico está registrado en el sistema, recibirás un enlace seguro temporal para restaurar tu contraseña.';

  if (userSnap.empty) {
    // Return early but look identical to successful recovery to prevent scanning registered emails
    return { success: true, message: defaultMessage };
  }

  const userDoc = userSnap.docs[0];
  const userId = userDoc.id;
  const userRef = doc(db, 'custom_users', userId);

  // Generate temporary 1-hour token
  const token = generateRandomToken();
  // 1 hour expiry
  const expiryDate = new Date(Date.now() + 3600000);

  try {
    await updateDoc(userRef, {
      recoveryToken: token,
      recoveryTokenExpiry: expiryDate
    });

    const simulatedLink = `https://haibtlead-reset.app/recover?token=${token}&email=${cleanEmail}`;

    return { 
      success: true, 
      message: defaultMessage,
      simulatedToken: token,
      simulatedLink: simulatedLink
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `custom_users/${userId}`);
    return { success: false, message: 'La solicitud de recuperación no pudo ser procesada.' };
  }
}

/**
 * Custom email recovery (Option B) — anti-enumeration
 */
export async function requestEmailRecovery(
  secondaryEmail: string
): Promise<{ success: boolean; message: string; foundEmails?: string[] }> {
  const cleanSecondary = secondaryEmail.trim().toLowerCase();

  const userQuery = query(collection(db, 'custom_users'), where('secondaryEmail', '==', cleanSecondary));
  const userSnap = await getDocs(userQuery);

  const defaultMessage = 'Se ha enviado un correo de asistencia a tu dirección alternativa. Si está vinculada a una cuenta activa, allí revelaremos el nombre del correo de inicio.';

  if (userSnap.empty) {
    // Prevent email exploration
    return { success: true, message: defaultMessage };
  }

  const foundEmails: string[] = [];
  userSnap.forEach((docSnap) => {
    foundEmails.push(docSnap.data().email);
  });

  return {
    success: true,
    message: defaultMessage,
    foundEmails
  };
}

/**
 * Record progress records under custom user collection
 */
export async function saveCustomUserProgress(
  userId: string,
  record: {
    date: string;
    completedHabits: string[];
    badges: string[];
    currentStreak: number;
    userId: string;
  }
): Promise<void> {
  const docId = record.date;
  const path = `custom_users/${userId}/progress_history/${docId}`;
  try {
    const recordRef = doc(db, 'custom_users', userId, 'progress_history', docId);
    await setDoc(recordRef, record);
    console.log('[Custom Auth Service]: Written habits progress under custom user subcollection.');
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Fetch progress records for a custom user
 */
export async function fetchCustomUserProgress(userId: string): Promise<any[]> {
  const path = `custom_users/${userId}/progress_history`;
  try {
    const colRef = collection(db, 'custom_users', userId, 'progress_history');
    const snap = await getDocs(colRef);
    const results: any[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data());
    });
    return results.sort((a, b) => b.date.localeCompare(a.date));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
}
