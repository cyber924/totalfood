import React, { useState } from 'react';
import { X, ShieldCheck, Flame, Database, CheckCircle2, Lock, Mail, Sparkles } from 'lucide-react';

interface FirebaseAuthNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseAuthNoticeModal: React.FC<FirebaseAuthNoticeModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [simulatedLogin, setSimulatedLogin] = useState(false);

  if (!isOpen) return null;

  const handleSimulateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setSimulatedLogin(true);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-amber-200">
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
            <span>파이어베이스(Firebase) 로드맵 안내</span>
          </div>
          <h3 className="text-xl font-extrabold text-white">로그인 인증 & 파이어베이스 DB 연동</h3>
          <p className="text-xs text-orange-100 mt-1">
            메인 디자인과 제미나이 AI 블로그 생성이 우선 적용되었습니다!
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Status Checklist */}
          <div className="space-y-2 bg-amber-50/60 p-4 rounded-xl border border-amber-200/80 text-xs">
            <div className="flex items-center justify-between text-emerald-700 font-bold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> 1단계: 메인 UI 디자인 & 제미나이 AI 맛집 엔진
              </span>
              <span className="bg-emerald-100 px-2 py-0.5 rounded text-[10px]">완료 (LIVE)</span>
            </div>
            <div className="flex items-center justify-between text-amber-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Database className="w-4 h-4 text-amber-600" /> 2단계: Firebase Authentication (구글/이메일 로그인)
              </span>
              <span className="bg-amber-100 px-2 py-0.5 rounded text-[10px]">다음 단계 예약</span>
            </div>
            <div className="flex items-center justify-between text-amber-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600" /> 3단계: Cloud Firestore DB (사용자별 블로그 저장)
              </span>
              <span className="bg-amber-100 px-2 py-0.5 rounded text-[10px]">다음 단계 예약</span>
            </div>
          </div>

          {/* Login Interface Simulation */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <h4 className="font-bold text-sm text-gray-900 flex items-center justify-between">
              <span>로그인 UI 미리보기</span>
              <span className="text-[11px] text-gray-400 font-normal">Firebase Auth Mock</span>
            </h4>

            {simulatedLogin ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                <Sparkles className="w-8 h-8 text-emerald-600 mx-auto" />
                <h5 className="font-bold text-emerald-950 text-sm">임시 로그인 완료 상태</h5>
                <p className="text-xs text-emerald-800">
                  {email || 'user@example.com'} 님으로 세션이 생성되었습니다. (Firebase DB 활성화 시 Firestore와 자동 연동됩니다)
                </p>
                <button
                  type="button"
                  onClick={() => setSimulatedLogin(false)}
                  className="text-xs text-emerald-700 underline font-semibold mt-1"
                >
                  로그아웃 테스트
                </button>
              </div>
            ) : (
              <form onSubmit={handleSimulateLogin} className="space-y-3">
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
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
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
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-gray-300 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs transition-colors shadow-2xs"
                >
                  로그인 테스트 체험하기
                </button>
              </form>
            )}
          </div>

          <div className="pt-2 text-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs sm:text-sm font-bold transition-colors shadow-sm"
            >
              메인 디자인 & 블로그 생성기 계속 이용하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
