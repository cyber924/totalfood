import React from 'react';
import { Search, Sparkles, Sliders, Zap, ShieldCheck, Database, FileCheck2, ArrowUpRight } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-12 border-t border-gray-200/70 bg-gradient-to-b from-white to-orange-50/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full uppercase tracking-wider">
            Automated Gourmet Blog Engine
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-2">
            왜 BlogAI 맛집 블로그 생성기인가요?
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-2">
            네이버 상위 노출 로직과 파워블로거 리뷰 패턴을 완벽히 학습한 AI 모델
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white border border-orange-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900">1. 네이버 SEO 키워드 최적화</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              검색 유입을 끌어모으는 지역명 + 맛집 키워드 조합 제목 3선과 연관 해시태그 12+를 자동으로 추출합니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-orange-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900">2. 생생한 파워블로거 톤앤매너</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              어색한 AI 말투는 NO! 내돈내산 솔직후기, 파워블로거 텐션, 감성 데이트 추천 등 원하는 톤을 선택할 수 있습니다.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-orange-100 shadow-sm hover:shadow-md transition-shadow space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-gray-900">3. 사진 배치 가이드 & 썸네일</h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              어느 위치에 어떤 사진을 넣어야 할지 사진 배치 가이드와 썸네일용 AI 이미지 생성 프롬프트를 함께 제시합니다.
            </p>
          </div>
        </div>

        {/* Firebase Roadmap Callout */}
        <div className="mt-10 p-5 rounded-2xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-amber-950">
                Next.js + Firebase Authentication & Firestore DB 스택 준비
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                현재 메인 디자인과 제미나이 글 생성기가 적용되었습니다. 추후 로그인 연동 시 내 블로그 보관함이 클라우드 DB로 자동 동기화됩니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
