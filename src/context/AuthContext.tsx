import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = () => setError(null);

  // Sync user document to Firestore
  const syncUserToFirestore = async (firebaseUser: User, name?: string) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        await setDoc(userRef, {
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: name || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '블로그 작성자',
          photoURL: firebaseUser.photoURL || '',
          createdAt: new Date().toISOString(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err: any) {
      console.warn('Note syncing user profile to Firestore:', err?.message || err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserToFirestore(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setError(null);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      if (result.user && name) {
        await updateProfile(result.user, { displayName: name });
      }
      await syncUserToFirestore(result.user, name);
    } catch (err: any) {
      console.error('SignUp Error:', err);
      let msg = '회원가입 실패: ';
      if (err.code === 'auth/email-already-in-use') {
        msg += '이미 사용 중인 이메일 주소입니다.';
      } else if (err.code === 'auth/weak-password') {
        msg += '비밀번호는 최소 6자리 이상이어야 합니다.';
      } else if (err.code === 'auth/invalid-email') {
        msg += '유효하지 않은 이메일 형식입니다.';
      } else {
        msg += err.message || '오류가 발생했습니다.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await syncUserToFirestore(result.user);
    } catch (err: any) {
      console.error('SignIn Error:', err);
      let msg = '로그인 실패: ';
      if (
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/invalid-credential'
      ) {
        msg += '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else {
        msg += err.message || '로그인 중 오류가 발생했습니다.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncUserToFirestore(result.user);
    } catch (err: any) {
      console.error('Google SignIn Error:', err);
      let msg = '구글 로그인 실패: ';
      if (err.code === 'auth/popup-closed-by-user') {
        msg += '로그인 창이 닫혔습니다.';
      } else {
        msg += err.message || '구글 로그인 중 오류가 발생했습니다.';
      }
      setError(msg);
      throw new Error(msg);
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Logout Error:', err);
      setError('로그아웃 중 오류가 발생했습니다.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        logout,
        error,
        clearError,
      }}
    >
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
