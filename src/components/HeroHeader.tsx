import React from 'react';
import { Sparkles, UtensilsCrossed, Zap, CheckCircle2, Search, FileText } from 'lucide-react';

export const HeroHeader: React.FC = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-white pt-8 pb-10 border-b border-orange-100/60">
      {/* Decorative Blur Background Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-200/30 rounded-full blur-3xl -z-10 pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-80 h-80 bg-orange-300/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        {/* Top Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-100/90 text-orange-800 text-xs sm:text-sm font-bold border border-orange-200 shadow-2xs mb-5">
          <Sparkles className="w-4 h-4 text-orange-600 animate-pulse" />
          <span>Google Gemini 3.6 Flash 엔진 탑재 · 맛집 전용 카피라이팅</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
          맛집 이름만 입력하면 <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 bg-clip-text text-transparent">
            파워블로거급 고품질 후기 글
          </span>
          이 1초 만에!
        </h1>

        <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed mb-6">
          네이버 / 티스토리 상위 노출에 최적화된 글 구조, 생생한 미식 표현, 
          사진 가이드 및 연관 해시태그까지 한 번에 자동 생성해 드립니다.
        </p>

        {/* Feature Pill Tags */}
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-700 font-medium">
          <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>내돈내산 / 파워블로거 톤 선택</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
            <span>사진 위치 & 썸네일 프롬프트</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-orange-500" />
            <span>SEO 해시태그 12+ 자동 추출</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/90 px-3 py-1.5 rounded-xl border border-gray-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-rose-500" />
            <span>원클릭 마크다운 & HTML 복사</span>
          </div>
        </div>
      </div>
    </div>
  );
};
