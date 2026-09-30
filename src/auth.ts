import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { app, db } from './firebase';

/**
 * Autenticación de administradores con Firebase Auth (correo + contraseña).
 *
 * Quién es administrador lo decide Firestore, no el navegador: una cuenta es admin si existe el
 * documento `admins/{uid}` (se crea a mano en la consola de Firebase). Las reglas de Firestore
 * (firestore.rules) aplican exactamente la misma condición para permitir escrituras.
 */
export const auth = getAuth(app);

const ADMINS_COLLECTION = 'admins';

export class AdminAccessError extends Error {
  constructor() {
    super('not-admin');
    this.name = 'AdminAccessError';
  }
}

async function isUserAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;
  try {
    const snap = await getDoc(doc(db, ADMINS_COLLECTION, user.uid));
    return snap.exists();
  } catch (err) {
    console.warn('No se pudo verificar el rol de administrador:', err);
    return false;
  }
}

/** Notifica cada vez que cambia la sesión: true solo si hay sesión Y la cuenta está autorizada. */
export function subscribeAdminStatus(onChange: (isAdmin: boolean) => void): () => void {
  let cancelled = false;
  const unsubscribe = onAuthStateChanged(auth, async user => {
    const admin = await isUserAdmin(user);
    if (!cancelled) onChange(admin);
  });
  return () => {
    cancelled = true;
    unsubscribe();
  };
}

export async function loginAdmin(email: string, password: string): Promise<void> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  if (!(await isUserAdmin(cred.user))) {
    await signOut(auth);
    throw new AdminAccessError();
  }
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

/** Cambia la contraseña de la cuenta activa. Devuelve un mensaje de error, o null si salió bien. */
export async function changeAdminPassword(currentPassword: string, newPassword: string): Promise<string | null> {
  const user = auth.currentUser;
  if (!user || !user.email) return 'No hay una sesión de administrador activa.';
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    await updatePassword(user, newPassword);
    return null;
  } catch (err) {
    return authErrorMessage(err);
  }
}

export function authErrorMessage(err: unknown): string {
  if (err instanceof AdminAccessError) {
    return 'Esta cuenta inició sesión, pero no está autorizada como administrador.';
  }
  const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-login-credentials':
      return 'Correo o contraseña incorrectos.';
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'Sin conexión: no se pudo contactar con Firebase.';
    case 'auth/operation-not-allowed':
      return 'El inicio de sesión con correo y contraseña no está habilitado en Firebase.';
    case 'auth/weak-password':
      return 'La nueva contraseña es demasiado débil (mínimo 6 caracteres).';
    case 'auth/requires-recent-login':
      return 'Por seguridad, cierra sesión, vuelve a entrar e inténtalo otra vez.';
    default:
      return 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
}
