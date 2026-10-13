import React from 'react';
import { Utensils, ShieldCheck, Flame, History, LogIn, User as UserIcon, Database, Video, Sparkles, Layers, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenAuthNotice: () => void;
  onOpenShorts: () => void;
  onOpenSns: () => void;
  onOpenAdmin?: () => void;
  savedCount: number;
  activeTab: 'generator' | 'webzine' | 'trends';
  onChangeTab: (tab: 'generator' | 'webzine' | 'trends') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenHistory, 
  onOpenAuthNotice, 
  onOpenShorts, 
  onOpenSns, 
  onOpenAdmin, 
  savedCount,
  activeTab,
  onChangeTab
}) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-orange-200">
            <Utensils className="w-4.5 h-4.5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 bg-clip-text text-transparent">
                맛집 AI
              </span>
              <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                PRO 3.6
              </span>
            </div>
            <p className="text-[10px] text-gray-500 -mt-1.5 hidden sm:block">
              AI 맛집 블로그 • 9:16 쇼츠 • 맛집스튜디오
            </p>
          </div>
        </div>

        {/* Navigation Top Menu */}
        <nav className="hidden md:flex items-center space-x-1">
          <button
            onClick={() => onChangeTab('generator')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'generator'
                ? 'text-orange-600 bg-orange-50 border border-orange-200/60 shadow-2xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>맛집 생성기</span>
          </button>

          <button
            onClick={() => onChangeTab('webzine')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'webzine'
                ? 'text-orange-600 bg-orange-50 border border-orange-200/60 shadow-2xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-orange-500" />
            <span>미식 웹진</span>
          </button>

          <button
            onClick={() => onChangeTab('trends')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === 'trends'
                ? 'text-orange-600 bg-orange-50 border border-orange-200/60 shadow-2xs'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span>맛집 트렌드</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-200 mx-1" />

          {/* New Shorts Generator Menu without badge */}
          <button
            onClick={onOpenShorts}
            className="px-2.5 py-1.5 rounded-lg text-xs font-black text-rose-600 bg-gradient-to-r from-rose-50 via-orange-50 to-amber-50 hover:from-rose-100 hover:to-orange-100 border border-rose-200/80 transition-all flex items-center gap-1 shadow-3xs active:scale-95 cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-rose-500" />
            <span>쇼츠/릴스</span>
          </button>

          {/* New 5-SNS Multi Generator Menu without badge */}
          <button
            onClick={onOpenSns}
            className="px-2.5 py-1.5 rounded-lg text-xs font-black text-violet-600 bg-gradient-to-r from-violet-50 via-pink-50 to-red-50 hover:from-violet-100 hover:to-pink-100 border border-violet-200/80 transition-all flex items-center gap-1 shadow-3xs active:scale-95 cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-violet-500" />
            <span>맛집 5대 SNS</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="px-2 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex items-center gap-1 relative cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            내 보관함
            {savedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold bg-orange-500 text-white rounded-full">
                {savedCount}
              </span>
            )}
          </button>

          {/* Admin Menu Desktop Button */}
          {(user?.email === 'cyber924@naver.com' || user?.email === 'cyber924@gmail.com') && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="px-2.5 py-1.5 rounded-lg text-xs font-black text-slate-100 bg-slate-900 hover:bg-slate-800 transition-all flex items-center gap-1 cursor-pointer shadow-3xs border border-slate-700"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>관리자 메뉴</span>
            </button>
          )}
        </nav>

        {/* Right Auth / Action */}
        <div className="flex items-center space-x-1.5 sm:space-x-3">
          {/* Mobile Shorts Shortcut */}
          <button
            onClick={onOpenShorts}
            className="md:hidden px-2 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-bold flex items-center gap-1 active:scale-95"
          >
            <Video className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            <span className="hidden xs:inline">쇼츠</span>
          </button>

          {/* Mobile SNS Shortcut */}
          <button
            onClick={onOpenSns}
            className="md:hidden px-2 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 text-xs font-bold flex items-center gap-1 active:scale-95"
          >
            <Layers className="w-3.5 h-3.5 text-violet-500 shrink-0" />
            <span className="hidden xs:inline">SNS</span>
          </button>

          <button
            onClick={onOpenHistory}
            className="md:hidden p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg relative"
            title="보관함"
          >
            <History className="w-5 h-5 text-amber-600" />
            {savedCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
            )}
          </button>

          {/* Admin Menu Mobile Button */}
          {(user?.email === 'cyber924@naver.com' || user?.email === 'cyber924@gmail.com') && onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="md:hidden p-1.5 text-slate-100 bg-slate-950 hover:bg-slate-900 rounded-lg relative border border-slate-800 cursor-pointer"
              title="관리자 콘솔"
            >
              <ShieldCheck className="w-5 h-5 text-amber-400 animate-pulse" />
            </button>
          )}

          {user ? (
            <button
              onClick={onOpenAuthNotice}
              className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-bold text-gray-800 bg-orange-50 hover:bg-orange-100 px-2 sm:px-3.5 py-1.5 rounded-xl border border-orange-200 transition-all shadow-2xs active:scale-95"
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-6 h-6 rounded-full border border-orange-400 shrink-0" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user.displayName ? user.displayName[0].toUpperCase() : user.email?.[0].toUpperCase() || 'U'}
                </div>
              )}
              <span className="max-w-[50px] sm:max-w-[100px] truncate">{user.displayName || user.email?.split('@')[0]}</span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.5 rounded hidden sm:inline-block">
                DB 연결됨
              </span>
              <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1 py-0.5 rounded sm:hidden">
                DB
              </span>
            </button>
          ) : (
            <button
              onClick={onOpenAuthNotice}
              className="flex items-center space-x-1 sm:space-x-1.5 text-xs sm:text-sm font-semibold text-gray-800 bg-gradient-to-r from-amber-100 to-orange-100 hover:from-amber-200 hover:to-orange-200 px-2.5 sm:px-3.5 py-2 rounded-xl border border-orange-300/80 transition-all shadow-2xs hover:shadow-xs active:scale-95"
            >
              <LogIn className="w-4 h-4 text-orange-600 shrink-0" />
              <span>로그인</span>
              <span className="text-[9px] sm:text-[10px] bg-emerald-600 text-white font-bold px-1 py-0.5 sm:px-1.5 sm:py-0.5 rounded ml-0.5">
                DB
              </span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

