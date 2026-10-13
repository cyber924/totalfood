import React, { useState, useEffect } from 'react';
import { TrendingFoodKeyword, TrendingKeywordsResponse } from '../types';
import { fetchTrendingFoodKeywords } from '../services/trendingService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import {
  TrendingUp,
  Flame,
  RefreshCw,
  Sparkles,
  Search,
  Check,
  ChevronDown,
  ChevronUp,
  MapPin,
  Utensils,
  ArrowRight,
  ExternalLink,
  Lightbulb,
} from 'lucide-react';

interface TrendingFoodKeywordsCardProps {
  onSelectKeyword: (keyword: TrendingFoodKeyword) => void;
  selectedKeywordId?: string | null;
}

const CATEGORIES = ['전체', '디저트/카페', '베이커리', '한식/맛집', '분식/야식', '고기/구이'];

const FALLBACK_TRENDS_LOCAL: TrendingKeywordsResponse = {
  lastUpdated: new Date().toISOString(),
  trends: [
    {
      id: "trend-1",
      keyword: "흑백요리사 밤 티라미수 & 리조또",
      category: "디저트/카페",
      reason: "넷플릭스 흑백요리사 방영 후 편의점 콜라보 및 셰프 레스토랑 예약 폭주",
      suggestedTitle: "흑백요리사 밤 티라미수 편의점 vs 레스토랑 내돈내산 솔직 비교 후기",
      locationOrStore: "성수동 / 한남동 셰프 레스토랑",
      menuItem: "맛피아 밤 티라미수 & 포르치니 리조또",
      features: "밤의 진한 고소함과 마스카포네 크림, 바삭한 그래놀라 토핑",
      searchVolume: "실시간 1위",
      tag: "#흑백요리사 #밤티라미수 #핫플레이스",
      rank: 1,
    },
    {
      id: "trend-2",
      keyword: "두바이 초콜릿 찹쌀떡 & 피스타치오 푸딩",
      category: "디저트/카페",
      reason: "카다이프와 원물 피스타치오 스프레드 결합한 쫄깃한 퓨전 디저트 열풍",
      suggestedTitle: "두바이 찹쌀떡 오픈런 성공! 피스타치오 원물 가득 내돈내산 솔직 리뷰",
      locationOrStore: "연남동 / 망원동 디저트 카페",
      menuItem: "두바이 초코 찹쌀떡 & 피스타치오 푸딩",
      features: "바삭한 카다이프 면의 식감과 원물 피스타치오의 묵직한 풍미",
      searchVolume: "급상승",
      tag: "#두바이초콜릿 #피스타치오 #디저트투어",
      rank: 2,
    },
    {
      id: "trend-3",
      keyword: "성수동 버터홀 소금빵 & 베이글",
      category: "베이커리",
      reason: "성수동 골목길 오픈런 대란, 겉바속촉 버터 동굴 소금빵 성지 순례",
      suggestedTitle: "성수동 소금빵 3대장 완벽 정리! 웨이팅 팁과 인생 빵 추천",
      locationOrStore: "서울 성수동 카페거리",
      menuItem: "크랙 소금빵 & 트러플 먹물 소금빵",
      features: "프랑스산 고급 발효버터의 깊은 풍미와 짭조름한 말돈 소금",
      searchVolume: "인기 유지",
      tag: "#성수동핫플 #소금빵맛집 #빵지순례",
      rank: 3,
    },
    {
      id: "trend-4",
      keyword: "을지로 힙지로 노포 알곤이 칼국수",
      category: "한식/맛집",
      reason: "레트로 야장 감성과 칼칼한 해물 육수, 푸짐한 알과 곤이의 중독성",
      suggestedTitle: "을지로3가 힙지로 맛집! 칼칼함의 끝판왕 알곤이 칼국수 웨이팅 후기",
      locationOrStore: "서울 을지로 3가 노포 골목",
      menuItem: "얼큰 알곤이 칼국수 & 해물파전",
      features: "푸짐한 명란과 곤이, 녹진하고 칼칼한 불향 육수",
      searchVolume: "급상승",
      tag: "#을지로맛집 #힙지로 #알곤이칼국수",
      rank: 4,
    },
    {
      id: "trend-5",
      keyword: "제철 완도 전복 솥밥 & 갈치 솥밥 정식",
      category: "한식/맛집",
      reason: "정갈한 1인 한상차림과 누룽지 숭늉까지 즐기는 MZ/직장인 힐링 푸드",
      suggestedTitle: "웨이팅 아깝지 않은 완도 전복 솥밥 정식! 부모님 모시고 가기 좋은 곳",
      locationOrStore: "안국동 / 익선동 한옥 거리",
      menuItem: "완도 전복 내장 솥밥 & 제철 도미 솥밥",
      features: "녹진한 게우 소스로 지은 밥과 탱글탱글한 버터 전복 구이",
      searchVolume: "조회수 폭발",
      tag: "#솥밥맛집 #한식다이닝 #정갈한한상",
      rank: 5,
    },
    {
      id: "trend-6",
      keyword: "마라 로제 엽기 떡볶이 & 꿔바로우",
      category: "분식/야식",
      reason: "얼얼한 마라와 부드러운 로제 크림의 조화, 유튜버 먹방 필수 메뉴",
      suggestedTitle: "마라 로제 떡볶이 꿀조합 토핑 추천! 분모자 통유부 필수 맵기 후기",
      locationOrStore: "전국 엽기떡볶이 / 배달 맛집",
      menuItem: "마라 로제 떡볶이 & 통유부 추가 & 꿔바로우",
      features: "부드럽고 매콤달콤한 소스, 쫄깃한 분모자와 국물 머금은 유부",
      searchVolume: "꾸준한 1위",
      tag: "#마라로제 #떡볶이그램 #야식추천",
      rank: 6,
    },
    {
      id: "trend-7",
      keyword: "제주 숙성 흑돼지 숄더랙 & 돈마호크",
      category: "고기/구이",
      reason: "워터에이징 볏짚 훈연과 멜젓에 찍어먹는 프리미엄 그릴링 다이닝",
      suggestedTitle: "인생 흑돼지 영접! 볏짚 초벌 숄더랙 육즙 폭발 솔직 방문기",
      locationOrStore: "제주 애월 / 중문 관광단지",
      menuItem: "360시간 숙성 흑돼지 숄더랙 & 멜젓 볶음밥",
      features: "두툼한 두께에서 뿜어져 나오는 풍부한 육즙과 바삭한 껍데기",
      searchVolume: "개인 소장",
      tag: "#제주맛집 #흑돼지구이 #고기스타그램",
      rank: 7,
    },
    {
      id: "trend-8",
      keyword: "일본식 수제 커스터드 푸딩 & 말차 파르페",
      category: "디저트/카페",
      reason: "레트로 킷사텐 감성의 탱글한 달걀 푸딩과 쌉싸름한 교토 말차 라떼",
      suggestedTitle: "감성 킷사텐 투어! 탱글탱글 인생 커스터드 푸딩 내돈내산",
      locationOrStore: "연남동 / 송리단길 디저트 카페",
      menuItem: "클래식 커스터드 푸딩 & 찐한 말차 파르페",
      features: "달콤 쌉싸름한 수제 카라멜 시럽과 부드러운 생크림 조화",
      searchVolume: "SNS 화제",
      tag: "#푸딩맛집 #킷사텐 #카페투어",
      rank: 8,
    }
  ],
  searchQueries: ["흑백요리사", "두바이 초콜릿 찹쌀떡", "성수 소금빵", "알곤이 칼국수"],
  groundingSources: []
};

export const TrendingFoodKeywordsCard: React.FC<TrendingFoodKeywordsCardProps> = ({
  onSelectKeyword,
  selectedKeywordId,
}) => {
  const [fullTrendsData, setFullTrendsData] = useState<TrendingKeywordsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('전체');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [appliedId, setAppliedId] = useState<string | null>(null);

  // Initialize Trends from cache (localStorage and Firestore)
  useEffect(() => {
    const initializeTrends = async () => {
      setLoading(true);
      let loadedFromCache = false;

      // 1. Load from localStorage (0ms instant render)
      try {
        const localCached = localStorage.getItem('blogai_cached_trends');
        if (localCached) {
          const parsed = JSON.parse(localCached);
          if (parsed && Array.isArray(parsed.trends) && parsed.trends.length > 0) {
            setFullTrendsData(parsed);
            setLoading(false);
            loadedFromCache = true;
            console.log('[Trends] Loaded from localStorage cache');
          }
        }
      } catch (e) {
        console.warn('[Trends] Failed to read localStorage:', e);
      }

      // 2. Load from Firestore (Global shared cache)
      try {
        const docRef = doc(db, 'cached_trends', 'google_search_trends');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as TrendingKeywordsResponse;
          if (data && Array.isArray(data.trends) && data.trends.length > 0) {
            setFullTrendsData(data);
            setLoading(false);
            loadedFromCache = true;
            localStorage.setItem('blogai_cached_trends', JSON.stringify(data));
            console.log('[Trends] Loaded from Firestore global cache');
          }
        }
      } catch (e) {
        console.warn('[Trends] Failed to read Firestore:', e);
      }

      // 3. Fallback to high-quality default trends if nothing is cached
      if (!loadedFromCache) {
        setFullTrendsData(FALLBACK_TRENDS_LOCAL);
        localStorage.setItem('blogai_cached_trends', JSON.stringify(FALLBACK_TRENDS_LOCAL));
        setLoading(false);
        console.log('[Trends] Loaded from local static fallback');
      }
    };

    initializeTrends();
  }, []);

  // Update Trends (Google 검색 갱신)
  const loadTrends = async (refresh = false) => {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Always fetch the FULL trends ('전체' category) from the server to keep a comprehensive cache
      const data = await fetchTrendingFoodKeywords(refresh, '전체');
      
      if (data && Array.isArray(data.trends) && data.trends.length > 0) {
        setFullTrendsData(data);

        // 1. Save to local storage
        try {
          localStorage.setItem('blogai_cached_trends', JSON.stringify(data));
        } catch (e) {
          console.warn(e);
        }

        // 2. UNCONDITIONALLY Save to Cloud Firestore
        try {
          const docRef = doc(db, 'cached_trends', 'google_search_trends');
          await setDoc(docRef, {
            ...data,
            lastUpdated: new Date().toISOString()
          });
          console.log('[Trends] Synchronized new trending keywords to Firestore');
        } catch (e) {
          console.warn('[Trends] Firestore synchronization failed:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load trending keywords:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApply = (trend: TrendingFoodKeyword) => {
    setAppliedId(trend.id || trend.keyword);
    onSelectKeyword(trend);
    // Remove highlight after 2.5s
    setTimeout(() => {
      setAppliedId(null);
    }, 2500);
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '방금 전';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '실시간';
    }
  };

  // Derived filtered trends data for the UI
  const filteredTrends = (fullTrendsData?.trends || []).filter((trend) => {
    if (selectedCategory === '전체') return true;
    return trend.category && trend.category.includes(selectedCategory);
  });

  const trendsData: TrendingKeywordsResponse | null = fullTrendsData
    ? {
        ...fullTrendsData,
        trends: filteredTrends,
      }
    : null;

  const trends = trendsData?.trends || [];

  return (
    <div className="bg-gradient-to-br from-amber-500/5 via-orange-500/5 to-rose-500/5 rounded-2xl border border-orange-200/90 shadow-lg shadow-orange-500/5 overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="p-5 sm:p-6 bg-white/80 backdrop-blur-xs border-b border-orange-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/20 shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                오늘의 실시간 인기 음식 검색 트렌드
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                <Search className="w-3 h-3 text-orange-600" />
                Google Search 기반
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                갱신일: {formatTime(trendsData?.lastUpdated)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              지금 사람들이 가장 많이 찾는 화제의 맛집/음식 키워드를 선택하여 클릭 1번으로 블로그 포스팅을 시작해보세요.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => loadTrends(true)}
            disabled={refreshing || loading}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-orange-50 text-gray-700 hover:text-orange-600 border border-gray-200 hover:border-orange-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            title="구글 실시간 검색으로 트렌드 새로고침"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
            <span>{refreshing ? '구글 검색 중...' : 'Google 검색 갱신'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
            title={isExpanded ? '접기' : '펼치기'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expandable Body */}
      {isExpanded && (
        <div className="p-5 sm:p-6 space-y-5">
          {/* Category Filter Badges */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-xs font-bold text-gray-400 mr-1 shrink-0">카테고리:</span>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-orange-600 text-white shadow-sm shadow-orange-600/20'
                    : 'bg-white hover:bg-orange-50 text-gray-600 hover:text-orange-700 border border-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Loading Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl bg-white border border-gray-100 shadow-xs animate-pulse space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-5 w-24 bg-gray-200 rounded"></div>
                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
                  <div className="h-3 w-1/2 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : trends.length === 0 ? (
            <div className="py-8 text-center bg-white rounded-xl border border-dashed border-gray-200 text-gray-500">
              <p className="text-sm font-medium">선택한 카테고리의 트렌드 키워드가 없습니다.</p>
              <button
                type="button"
                onClick={() => setSelectedCategory('전체')}
                className="mt-2 text-xs text-orange-600 font-bold hover:underline"
              >
                전체 카테고리 보기
              </button>
            </div>
          ) : (
            /* Trends Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {trends.map((trend, idx) => {
                const isSelected = selectedKeywordId === trend.id || selectedKeywordId === trend.keyword;
                const isJustApplied = appliedId === (trend.id || trend.keyword);
                const rank = trend.rank || idx + 1;

                return (
                  <div
                    key={trend.id || idx}
                    className={`group relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                      isJustApplied
                        ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-400/50 shadow-md'
                        : isSelected
                        ? 'bg-amber-50/70 border-amber-300 shadow-xs'
                        : 'bg-white hover:bg-orange-50/30 border-gray-200/80 hover:border-orange-300 shadow-xs hover:shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Card Header: Rank, Keyword & Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Rank Badge */}
                          <span
                            className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 ${
                              rank === 1
                                ? 'bg-amber-500 text-white shadow-xs'
                                : rank === 2
                                ? 'bg-slate-400 text-white'
                                : rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {rank}
                          </span>

                          {/* Keyword Title */}
                          <h3 className="font-extrabold text-base text-gray-900 group-hover:text-orange-600 transition-colors">
                            {trend.keyword}
                          </h3>
                        </div>

                        {/* Search Volume or Hot Badge */}
                        <div className="flex items-center gap-1 shrink-0">
                          {trend.searchVolume && (
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 text-rose-500" />
                              {trend.searchVolume}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-gray-100 text-gray-600">
                            {trend.category}
                          </span>
                        </div>
                      </div>

                      {/* Why it is trending */}
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2.5 leading-relaxed">
                        <span className="font-semibold text-gray-800">트렌드 원인: </span>
                        {trend.reason}
                      </p>

                      {/* Location & Signature Menu */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 mb-2.5">
                        {trend.locationOrStore && (
                          <div className="flex items-center gap-1 font-medium text-gray-700">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span>{trend.locationOrStore}</span>
                          </div>
                        )}
                        {trend.menuItem && (
                          <div className="flex items-center gap-1 font-medium text-gray-700">
                            <Utensils className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <span>{trend.menuItem}</span>
                          </div>
                        )}
                      </div>

                      {/* Suggested Blog Title (Catchy SEO Title) */}
                      {trend.suggestedTitle && (
                        <div className="p-2.5 rounded-lg bg-orange-50/60 border border-orange-100/80 text-xs text-orange-950 mb-3 flex items-start gap-1.5">
                          <Lightbulb className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-orange-800 block text-[11px]">추천 블로그 제목:</span>
                            <span className="font-medium text-gray-800">{trend.suggestedTitle}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2 mt-auto">
                      <span className="text-[11px] font-bold text-orange-600 truncate">
                        {trend.tag || '#맛집트렌드'}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleApply(trend)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          isJustApplied
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white shadow-xs'
                        }`}
                      >
                        {isJustApplied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>폼에 적용 완료!</span>
                          </>
                        ) : (
                          <>
                            <span>이 주제로 글 작성</span>
                            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Search Queries & Grounding Source Footnote */}
          {trendsData?.searchQueries && trendsData.searchQueries.length > 0 && (
            <div className="p-3 bg-white/70 rounded-xl border border-gray-200/80 text-xs text-gray-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-gray-700 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-orange-500" />
                  실시간 탐색 키워드:
                </span>
                {trendsData.searchQueries.map((q, i) => (
                  <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[11px]">
                    {q}
                  </span>
                ))}
              </div>

              {trendsData.groundingSources && trendsData.groundingSources.length > 0 && (
                <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
                  <span>출처:</span>
                  {trendsData.groundingSources.slice(0, 2).map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-orange-600 hover:underline flex items-center gap-0.5"
                    >
                      <span>{src.title.length > 15 ? src.title.slice(0, 15) + '...' : src.title}</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
