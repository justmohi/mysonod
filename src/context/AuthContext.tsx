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
  updateDoc,
  onSnapshot 
} from 'firebase/firestore';
import type { UserProfile, Transaction } from '../types';
import { cleanDataForFirestore } from '../utils/firestore';

export const PRIMARY_ADMIN_EMAIL = 'mohistudio95@gmail.com';

/**
 * Checks whether an email address matches the designated admin email
 */
export const isAuthorizedAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.trim().toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase();
};

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  toggleAdminMode: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Real wallet balance: New users start at 0.00. Balance is only added upon admin approval of top-ups.
const INITIAL_STARTER_BALANCE = 0.00;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        try {
          // Check if email address is mohistudio95@gmail.com
          const isTargetAdmin = isAuthorizedAdminEmail(user.email);
          const targetRole: 'admin' | 'user' = isTargetAdmin ? 'admin' : 'user';

          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            // New user registration or first login (Starts with real 0.00 BDT)
            const newProfile: UserProfile = {
              id: user.uid,
              name: user.displayName || user.email?.split('@')[0] || (isTargetAdmin ? 'ইউপি প্রশাসক' : 'নাগরিক সেবাগ্রহীতা'),
              email: user.email || '',
              phone: user.phoneNumber || '',
              balance: INITIAL_STARTER_BALANCE,
              role: targetRole,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            await setDoc(userDocRef, cleanDataForFirestore(newProfile));
            setUserProfile(newProfile);
          } else {
            const existingData = userSnap.data() as UserProfile;
            // CRUCIAL: Save/Update this role in the user's document inside Firebase Firestore (users collection)
            if (existingData.role !== targetRole) {
              await updateDoc(userDocRef, {
                role: targetRole,
                updatedAt: new Date().toISOString()
              });
              existingData.role = targetRole;
            }
            setUserProfile(existingData);
          }

          // Real-time listener for balance & role updates
          unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              const expectedRole = isAuthorizedAdminEmail(data.email || user.email) ? 'admin' : 'user';
              if (data.role !== expectedRole) {
                data.role = expectedRole;
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
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (name: string, email: string, password: string, phone?: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const isTargetAdmin = isAuthorizedAdminEmail(email);
    const targetRole: 'admin' | 'user' = isTargetAdmin ? 'admin' : 'user';

    const newProfile: UserProfile = {
      id: cred.user.uid,
      name,
      email,
      phone: phone || '',
      balance: INITIAL_STARTER_BALANCE,
      role: targetRole,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', cred.user.uid), cleanDataForFirestore(newProfile));

    // Initial bonus transaction
    await setDoc(doc(db, 'transactions', `tx_welcome_${cred.user.uid}`), cleanDataForFirestore({
      id: `tx_welcome_${cred.user.uid}`,
      userId: cred.user.uid,
      type: 'welcome_bonus',
      amount: INITIAL_STARTER_BALANCE,
      balanceAfter: INITIAL_STARTER_BALANCE,
      description: 'স্বাগতম বোনাস (ডিজিটাল সেন্টার জয়েনিং ব্যালেন্স)',
      referenceId: 'WELCOME-2026',
      createdAt: new Date().toISOString()
    }));

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
    // Only authorized admin (mohistudio95@gmail.com) can preview citizen view vs admin view
    if (!currentUser || !isAuthorizedAdminEmail(currentUser.email)) return;
    const newRole = userProfile?.role === 'admin' ? 'user' : 'admin';
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, { role: newRole, updatedAt: new Date().toISOString() });
    setUserProfile(prev => prev ? { ...prev, role: newRole } : null);
  };

  // Full Admin access granted ONLY if email is mohistudio95@gmail.com
  const isAdmin = isAuthorizedAdminEmail(currentUser?.email) && userProfile?.role === 'admin';

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isAdmin,
      login,
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
