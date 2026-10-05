import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer,
  type Firestore
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage: FirebaseStorage = getStorage(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Separate Firebase Auth instance used only by the primary admin to create operator accounts.
// It does not replace the currently signed-in admin session.
const operatorAccountApp = initializeApp(firebaseConfig, 'operator-account-creator');
export const operatorAuth = getAuth(operatorAccountApp);

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
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  return errInfo;
}

// Connection test as required by Firebase skill
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client is offline or initializing.");
    }
    return false;
  }
}

export async function createOperatorAuthAccount(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const credential = await createUserWithEmailAndPassword(
    operatorAuth,
    normalizedEmail,
    password
  );
  await signOut(operatorAuth).catch(() => undefined);
  return credential.user;
}

export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  onAuthStateChanged,
  type FirebaseUser 
};
