import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { app, db } from './firebase';

/**
 * Autenticación de administradores con Firebase Auth.
 * Cuenta principal bootstrapped: jairoandrodriguezlo@gmail.com
 */
export const auth = getAuth(app);

const ADMINS_COLLECTION = 'admins';
export const BOOTSTRAP_ADMIN_EMAIL = 'jairoandrodriguezlo@gmail.com';

export class AdminAccessError extends Error {
  constructor() {
    super('not-admin');
    this.name = 'AdminAccessError';
  }
}

export async function isUserAdmin(user: User | null): Promise<boolean> {
  if (!user) return false;

  const email = (user.email || '').toLowerCase().trim();
  // El correo principal siempre tiene rol de administrador
  if (email === BOOTSTRAP_ADMIN_EMAIL) {
    try {
      const adminDocRef = doc(db, ADMINS_COLLECTION, user.uid);
      const snap = await getDoc(adminDocRef);
      if (!snap.exists()) {
        await setDoc(adminDocRef, {
          email: user.email,
          role: 'admin',
          createdAt: new Date().toISOString(),
          note: 'Administrador principal',
        });
      }
    } catch (err) {
      console.warn('Registro de documento de administrador:', err);
    }
    return true;
  }

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

/** Iniciar sesión con correo y contraseña. Si es la cuenta principal y aún no está registrada, la registra automáticamente. */
export async function loginAdmin(email: string, password: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    if (!(await isUserAdmin(cred.user))) {
      await signOut(auth);
      throw new AdminAccessError();
    }
  } catch (err: unknown) {
    const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code: unknown }).code) : '';
    // Si la cuenta no existe y es el correo principal del administrador, registrar automáticamente
    if (
      (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/invalid-login-credentials') &&
      cleanEmail === BOOTSTRAP_ADMIN_EMAIL
    ) {
      try {
        const newCred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        await setDoc(doc(db, ADMINS_COLLECTION, newCred.user.uid), {
          email: cleanEmail,
          role: 'admin',
          createdAt: new Date().toISOString(),
          note: 'Administrador principal inicializado',
        });
        return;
      } catch (createErr) {
        throw createErr;
      }
    }
    throw err;
  }
}

/** Iniciar sesión con Google (un solo clic) */
export async function loginAdminWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  if (!(await isUserAdmin(cred.user))) {
    await signOut(auth);
    throw new AdminAccessError();
  }
}

/** Registro explícito de un nuevo administrador */
export async function registerAdmin(email: string, password: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  await setDoc(doc(db, ADMINS_COLLECTION, cred.user.uid), {
    email: cleanEmail,
    role: 'admin',
    createdAt: new Date().toISOString(),
    note: cleanEmail === BOOTSTRAP_ADMIN_EMAIL ? 'Administrador principal' : 'Administrador registrado',
  });
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
    case 'auth/email-already-in-use':
      return 'Este correo ya tiene una cuenta creada. Usa "Iniciar sesión".';
    case 'auth/invalid-email':
      return 'El correo no tiene un formato válido.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.';
    case 'auth/network-request-failed':
      return 'Sin conexión: no se pudo contactar con Firebase.';
    case 'auth/operation-not-allowed':
      return 'El proveedor de inicio de sesión no está habilitado en Firebase Console.';
    case 'auth/weak-password':
      return 'La nueva contraseña es demasiado débil (mínimo 6 caracteres).';
    case 'auth/requires-recent-login':
      return 'Por seguridad, cierra sesión, vuelve a entrar e inténtalo otra vez.';
    case 'auth/popup-closed-by-user':
      return 'Ventana de inicio de sesión con Google cancelada.';
    default:
      return typeof err === 'object' && err !== null && 'message' in err
        ? String((err as { message: unknown }).message)
        : 'No se pudo completar la operación. Inténtalo de nuevo.';
  }
}

