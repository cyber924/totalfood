import React from 'react';
import { BlogInputForm, BlogTone, BlogPlatform } from '../types';
import { SAMPLE_PRESETS } from '../data/samplePresets';
import { Sparkles, Utensils, MapPin, AlignLeft, Sliders, Wand2, RefreshCw, Zap, BookmarkPlus } from 'lucide-react';

interface BlogGeneratorFormProps {
  formData: BlogInputForm;
  setFormData: React.Dispatch<React.SetStateAction<BlogInputForm>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export const BlogGeneratorForm: React.FC<BlogGeneratorFormProps> = ({
  formData,
  setFormData,
  onSubmit,
  isLoading,
}) => {
  const handlePresetSelect = (presetId: string) => {
    const found = SAMPLE_PRESETS.find((p) => p.id === presetId);
    if (found) {
      setFormData({ ...found.input });
    }
  };

  const handleReset = () => {
    setFormData({
      restaurantName: '',
      location: '',
      menuItems: '',
      features: '',
      tone: 'power_blogger',
      blogType: 'naver',
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-200/80 shadow-lg shadow-orange-500/5 p-5 sm:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-orange-500 text-white shadow-xs">
              <Utensils className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">맛집 블로그 글 정보 입력</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            간단한 정보를 작성하거나 아래 예시 템플릿을 클릭해 보세요.
          </p>
        </div>

        {/* Preset Sample Quick Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-gray-400 mr-1 hidden lg:inline">빠른 예시:</span>
          {SAMPLE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              disabled={isLoading}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/80 transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              <span>{preset.badge}</span>
              <span className="hidden sm:inline">{preset.title.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Row 1: Restaurant Name & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1">
              <span>맛집 / 식당 이름</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.restaurantName}
                onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
                placeholder="예: 소문난 성수 감자탕, 카페 연남버터"
                disabled={isLoading}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm text-gray-900 placeholder-gray-400 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              <span>위치 / 지역 (선택)</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="예: 서울 성수역 4번 출구 도보 3분, 제주 애월 해안도로"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>
        </div>

        {/* Row 2: Menu Items & Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1">
              <Utensils className="w-3.5 h-3.5 text-amber-500" />
              <span>대표 메뉴 & 가격 (선택)</span>
            </label>
            <input
              type="text"
              value={formData.menuItems}
              onChange={(e) => setFormData({ ...formData, menuItems: e.target.value })}
              placeholder="예: 우거지 감자탕(2.8만), 볶음밥, 흑돼지 근고기"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-1.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              <span>주요 특징 & 장점 (선택)</span>
            </label>
            <input
              type="text"
              value={formData.features}
              onChange={(e) => setFormData({ ...formData, features: e.target.value })}
              placeholder="예: 백종원 3대천왕 출연, 웨이팅 필수, 친절함, 주차 가능"
              disabled={isLoading}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all text-sm text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>
        </div>

        {/* Row 3: Tone & Manner Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-amber-600" />
            <span>글 톤앤매너 (작성 스타일)</span>
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              {
                id: 'power_blogger',
                label: '파워블로거 텐션 ⚡',
                desc: '이모지 폭발! 생생함 200%',
              },
              {
                id: 'honest_review',
                label: '솔직 내돈내산 💸',
                desc: '담백하고 객관적인 찐후기',
              },
              {
                id: 'romantic_date',
                label: '감성 데이트 🍷',
                desc: '분위기 중심 감성적 묘사',
              },
              {
                id: 'gourmet_critic',
                label: '미식 평론가 🧐',
                desc: '식재료 & 맛 디테일 분석',
              },
            ].map((toneItem) => (
              <button
                key={toneItem.id}
                type="button"
                disabled={isLoading}
                onClick={() => setFormData({ ...formData, tone: toneItem.id as BlogTone })}
                className={`p-3 rounded-xl border text-left transition-all relative ${
                  formData.tone === toneItem.id
                    ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-200 text-orange-950 shadow-xs'
                    : 'border-gray-200 bg-gray-50/50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="font-bold text-xs sm:text-sm">{toneItem.label}</div>
                <div className="text-[11px] text-gray-500 mt-0.5">{toneItem.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Target Platform Selection */}
        <div className="pt-2">
          <label className="block text-xs sm:text-sm font-bold text-gray-800 mb-2">
            발행 목표 블로그 플랫폼
          </label>
          <div className="flex items-center gap-3">
            {[
              { id: 'naver', label: '네이버 블로그 🟢', badge: '상위노출 최적화' },
              { id: 'tistory', label: '티스토리 🟠', badge: '구글 검색 노출' },
              { id: 'instagram', label: '인스타그램 🟣', badge: '카드뉴스 캡션' },
            ].map((plat) => (
              <button
                key={plat.id}
                type="button"
                disabled={isLoading}
                onClick={() => setFormData({ ...formData, blogType: plat.id as BlogPlatform })}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all flex items-center gap-2 ${
                  formData.blogType === plat.id
                    ? 'border-orange-500 bg-orange-500 text-white shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{plat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-normal ${
                    formData.blogType === plat.id
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {plat.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions Row */}
        <div className="pt-4 flex items-center justify-between gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={handleReset}
            disabled={isLoading}
            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>초기화</span>
          </button>

          <button
            type="submit"
            disabled={isLoading || !formData.restaurantName.trim()}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-sm sm:text-base font-bold shadow-md shadow-orange-300/50 hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>제미나이 AI가 맛집 블로그 생성 중...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>AI 맛집 블로그 글 1초 생성하기</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
