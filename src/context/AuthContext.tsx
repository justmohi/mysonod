import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  signInWithPopup, 
  googleProvider,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  type FirebaseUser
} from '../firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot 
} from 'firebase/firestore';
import type { UserProfile, Transaction } from '../types';
import { cleanDataForFirestore } from '../utils/firestore';

export const PRIMARY_ADMIN_EMAIL = 'mohistudio95@gmail.com';

export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
};

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isStaff: boolean;
  isPrimaryAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  loginOperator: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  toggleAdminMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const INITIAL_STARTER_BALANCE = 0.00;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      // Do not block the whole portal on a Firestore profile read.
      // Previously, loading stayed true until getDoc()/setDoc() completed.
      // If Firestore/network was slow or temporarily stalled, the user saw
      // the MySonod loading screen indefinitely even though Firebase Auth
      // had already finished restoring the session.
      setLoading(false);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          const isTargetAdmin = isAuthorizedAdminEmail(user.email);
          const userSnap = await getDoc(userDocRef);

          if (!userSnap.exists()) {
            const newProfile: UserProfile = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || (isTargetAdmin ? 'ইউপি প্রশাসক' : 'নাগরিক সেবাগ্রহীতা'),
              email: user.email || '',
              phone: user.phoneNumber || '',
              balance: INITIAL_STARTER_BALANCE,
              role: isTargetAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(userDocRef, cleanDataForFirestore(newProfile));
            setUserProfile(newProfile);
          } else {
            const existingData = userSnap.data() as UserProfile;
            // Never downgrade an existing operator account to user.
            if (isTargetAdmin && existingData.role !== 'admin') {
              existingData.role = 'admin';
              existingData.updatedAt = new Date().toISOString();
              await setDoc(userDocRef, cleanDataForFirestore(existingData), { merge: true });
            }
            setUserProfile(existingData);
          }

          unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              // The primary admin is always admin. Other roles come from Firestore.
              if (isAuthorizedAdminEmail(data.email || user.email)) {
                data.role = 'admin';
              }
              setUserProfile(data);
            }
          }, (err) => {
            handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
          });

        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const loginAdmin = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!isAuthorizedAdminEmail(normalizedEmail)) {
      throw new Error('এই লগইনটি শুধু Primary Admin-এর জন্য।');
    }

    await signInWithEmailAndPassword(auth, normalizedEmail, password);
  };

  const loginOperator = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
    const snap = await getDoc(doc(db, 'users', credential.user.uid));

    if (!isAuthorizedAdminEmail(normalizedEmail) && (!snap.exists() || snap.data().role !== 'operator')) {
      await signOut(auth);
      throw new Error('এই অ্যাকাউন্টটি ইউনিয়ন উদ্যোক্তা অ্যাকাউন্ট নয়।');
    }
  };

  const signup = async (name: string, email: string, password: string, phone?: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    if (isAuthorizedAdminEmail(normalizedEmail)) {
      throw new Error('Primary admin account cannot be created through public registration.');
    }

    const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
    const newProfile: UserProfile = {
      id: cred.user.uid,
      name,
      email: normalizedEmail,
      phone: phone || '',
      balance: INITIAL_STARTER_BALANCE,
      role: 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'users', cred.user.uid), cleanDataForFirestore(newProfile));

    const welcomeTransaction: Transaction = {
      id: `tx_welcome_${cred.user.uid}`,
      userId: cred.user.uid,
      type: 'welcome_bonus',
      amount: INITIAL_STARTER_BALANCE,
      balanceAfter: INITIAL_STARTER_BALANCE,
      description: 'স্বাগতম বোনাস (ডিজিটাল সেন্টার জয়েনিং ব্যালেন্স)',
      referenceId: 'WELCOME-2026',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'transactions', welcomeTransaction.id), cleanDataForFirestore(welcomeTransaction));

    setUserProfile(newProfile);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const toggleAdminMode = async () => {
    if (!currentUser || !isAuthorizedAdminEmail(currentUser.email) || !userProfile) return;
    const newRole = userProfile.role === 'admin' ? 'user' : 'admin';
    const userDocRef = doc(db, 'users', currentUser.uid);
    await setDoc(userDocRef, { role: newRole, updatedAt: new Date().toISOString() }, { merge: true });
    setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
  };

  const isPrimaryAdmin = isAuthorizedAdminEmail(currentUser?.email);
  const isAdmin = isPrimaryAdmin && userProfile?.role === 'admin';
  const isOperator = !isAdmin && userProfile?.role === 'operator';
  const isStaff = isAdmin || isOperator;

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isAdmin,
      isOperator,
      isStaff,
      isPrimaryAdmin,
      login,
      loginAdmin,
      loginOperator,
      signup,
      loginWithGoogle,
      logout,
      toggleAdminMode
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
