import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Database,
  CheckCircle2,
  Lock,
  Mail,
  User as UserIcon,
  Sparkles,
  LogOut,
  AlertCircle,
  ArrowRight,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface FirebaseAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseAuthModal: React.FC<FirebaseAuthModalProps> = ({ isOpen, onClose }) => {
  const { user, signUpWithEmail, signInWithEmail, signInWithGoogle, logout, error, clearError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleModeSwitch = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    clearError();
    setSuccessMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    try {
      if (mode === 'signup') {
        if (!displayName.trim()) {
          throw new Error('이름(닉네임)을 입력해주세요.');
        }
        await signUpWithEmail(email, password, displayName);
        setSuccessMessage('회원가입이 완료되어 로그인되었습니다!');
      } else {
        await signInWithEmail(email, password);
        setSuccessMessage('성공적으로 로그인되었습니다.');
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      // Error is caught and stored in AuthContext or thrown
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      await signInWithGoogle();
      setSuccessMessage('구글 계정으로 로그인되었습니다.');
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-amber-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 p-5 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-extrabold mb-2 backdrop-blur-md">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Firebase Auth & Firestore DB Live</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">
            {user ? '내 계정 & DB 상태' : mode === 'signin' ? '로그인' : '회원가입'}
          </h3>
          <p className="text-xs text-orange-100 mt-1">
            {user
              ? 'Firebase 인증 및 Cloud Firestore 데이터베이스가 실시간 연동 중입니다.'
              : '로그인 후 작성한 블로그 글을 파이어베이스 DB에 안전하게 보관하세요.'}
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Active Firebase Connection Badge */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span>Firestore DB 실시간 연동 활성화</span>
            </div>
            <span className="bg-emerald-200/80 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              CONNECTED
            </span>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* User Logged In State */}
          {user ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="profile"
                    className="w-12 h-12 rounded-full border border-orange-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-orange-400 to-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                    {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-gray-900 truncate">
                    {user.displayName || '블로그 작성자'}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-0.5 flex items-center gap-1">
                    <Check className="w-3 h-3" /> 파이어베이스 UID: {user.uid.substring(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-gray-600 bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/60">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-orange-600" /> Cloud Firestore 데이터 동기화
                </p>
                <p>
                  로그인 상태에서 맛집 블로그 포스트를 저장하거나 삭제하면 Firestore 데이터베이스 컬렉션(
                  <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">saved_posts</code>)에 즉시 자동 동기화됩니다.
                </p>
              </div>

              <button
                onClick={logout}
                className="w-full py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>로그아웃</span>
              </button>
            </div>
          ) : (
            /* Auth Form Mode */
            <div className="space-y-4">
              {/* Mode Toggle Tabs */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signin')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('signup')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    mode === 'signup'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  회원가입
                </button>
              </div>

              {/* Google OAuth Quick Sign In */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs border border-gray-300 rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-98"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google 계정으로 1초 로그인</span>
              </button>

              <div className="relative flex items-center justify-center">
                <hr className="w-full border-gray-200" />
                <span className="absolute bg-white px-3 text-[11px] text-gray-400 font-medium">
                  또는 이메일로 {mode === 'signin' ? '로그인' : '회원가입'}
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">이름 / 닉네임</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        placeholder="홍길동"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-orange-400 outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">이메일 주소</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      placeholder="blogger@naver.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-orange-400 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">비밀번호</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      required
                      placeholder="6자리 이상 비밀번호"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-gray-300 bg-white focus:ring-2 focus:ring-orange-400 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
                >
                  <span>{mode === 'signin' ? '로그인하기' : '회원가입 완료'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
