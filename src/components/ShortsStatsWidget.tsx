import React, { useState } from 'react';
import { GeneratedShortsResult, ShortsTone } from '../types';
import { BarChart3, Film, CheckCircle2, Clock, Flame, Sparkles, BookOpen, ChevronDown, ChevronUp, Share2 } from 'lucide-react';

interface ShortsStatsWidgetProps {
  shortsList: GeneratedShortsResult[];
  onTogglePublish?: (shortsId: string) => void;
}

export const ShortsStatsWidget: React.FC<ShortsStatsWidgetProps> = ({
  shortsList,
  onTogglePublish,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Calculations & Metrics
  const totalCount = shortsList.length;
  const publishedCount = shortsList.filter(s => s.isPublished).length;
  const draftCount = totalCount - publishedCount;
  const totalDuration = shortsList.reduce((sum, s) => sum + (s.totalDuration || s.targetDuration || 0), 0);

  // Tone/Theme counts and distribution
  const toneMap: Record<ShortsTone, { label: string; count: number; color: string; bg: string; border: string }> = {
    hype_fast: { label: 'MZ 텐션 업', count: 0, color: 'text-rose-500 bg-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' },
    vlog_calm: { label: '감성 브이로그', count: 0, color: 'text-emerald-500 bg-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
    honest_fact: { label: '솔직 팩트 체크', count: 0, color: 'text-amber-500 bg-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
    gourmet_expert: { label: '미식가 심층 분석', count: 0, color: 'text-indigo-500 bg-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  };

  shortsList.forEach(s => {
    if (toneMap[s.tone]) {
      toneMap[s.tone].count += 1;
    }
  });

  // Calculate percentages
  const toneList = Object.entries(toneMap).map(([key, value]) => ({
    key: key as ShortsTone,
    ...value,
    percentage: totalCount > 0 ? Math.round((value.count / totalCount) * 100) : 0,
  })).sort((a, b) => b.count - a.count);

  // Find most frequent theme
  const topTheme = toneList[0]?.count > 0 ? toneList[0].label : '없음';

  return (
    <div className="bg-white border border-orange-200/60 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
      {/* Collapsed/Header Toggle Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between text-left gap-3 bg-gradient-to-r from-orange-50/40 via-white to-transparent hover:from-orange-50/70 transition-all cursor-pointer focus:outline-none"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/10 shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-slate-900">
                📊 마이 쇼츠 AI 대시보드
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-orange-100 text-orange-700">
                실시간 집계
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              총 <span className="font-bold text-orange-600">{totalCount}개</span>의 숏폼 프로젝트 분석 · 인기 테마: <span className="font-bold text-slate-800">{topTheme}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 mt-2 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center gap-1 text-slate-600">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>배포 {publishedCount}개</span>
            </div>
            <div className="flex items-center gap-1 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-rose-500" />
              <span>재생 약 {totalDuration}초</span>
            </div>
          </div>

          <div className="p-1.5 rounded-full hover:bg-orange-100/50 text-orange-500 transition-colors">
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </button>

      {/* Expanded Dashboard Panel */}
      {isExpanded && (
        <div className="px-6 pb-6 pt-2 border-t border-slate-100/60 bg-slate-50/40 space-y-6 animate-in fade-in duration-300">
          
          {/* Top Key Metrics Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">총 제작 완료</span>
                <span className="text-lg font-black text-slate-900">{totalCount} <span className="text-xs font-normal text-slate-500">개</span></span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">배포 및 보관</span>
                <span className="text-lg font-black text-slate-900">{publishedCount} <span className="text-xs font-normal text-slate-500">개</span></span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">총 숏폼 재생시간</span>
                <span className="text-lg font-black text-slate-900">{totalDuration} <span className="text-xs font-normal text-slate-500">초</span></span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400">채널 배포율</span>
                <span className="text-lg font-black text-slate-900">
                  {totalCount > 0 ? Math.round((publishedCount / totalCount) * 100) : 0} <span className="text-xs font-normal text-slate-500">%</span>
                </span>
              </div>
            </div>

          </div>

          {/* Graphical Content: Theme Breakdown vs Platform Status */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* LEFT: Major Themes Distribution (Cols: 7) */}
            <div className="md:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs space-y-4">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span>주요 테마별 점유율</span>
              </h4>

              {totalCount === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  쇼츠를 생성하면 테마 통계가 여기에 실시간으로 표시됩니다.
                </div>
              ) : (
                <div className="space-y-3.5">
                  {toneList.map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-slate-700">{item.label}</span>
                        <span className="font-bold text-slate-500">
                          {item.count}개 ({item.percentage}%)
                        </span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${item.color.split(' ')[1]}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT: Deployment Channels Summary (Cols: 5) */}
            <div className="md:col-span-5 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-orange-500" />
                  <span>배포 현황 요약</span>
                </h4>

                {totalCount === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    배포 이력이 없습니다.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 border border-emerald-100/50">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span className="text-xs font-bold text-slate-700">배포 완료 (보관함 발행)</span>
                      </div>
                      <span className="text-xs font-black text-emerald-700">{publishedCount}개</span>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                        <span className="text-xs font-bold text-slate-700">미발행 프로젝트 (임시 저장)</span>
                      </div>
                      <span className="text-xs font-black text-slate-600">{draftCount}개</span>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100/60">
                💡 쇼츠 보관함에서 각 대본의 배포 유무를 직접 제어할 수 있으며, 배포된 쇼츠는 미식 프리미엄 채널 연동에 바로 우선 노출됩니다.
              </p>
            </div>

          </div>

          {/* Quick List of Recent Projects */}
          {shortsList.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">최근 분석 대상 프로젝트</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {shortsList.slice(0, 3).map((item) => (
                  <div key={item.id} className="bg-white px-4 py-3 rounded-xl border border-slate-100 shadow-xs flex items-center justify-between">
                    <div className="truncate pr-2">
                      <span className="block text-xs font-extrabold text-slate-800 truncate">{item.restaurantName}</span>
                      <span className="text-[10px] text-slate-400 block truncate mt-0.5">{item.title}</span>
                    </div>

                    <div className="shrink-0 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                        item.tone === 'hype_fast' ? 'bg-rose-50 text-rose-600' :
                        item.tone === 'vlog_calm' ? 'bg-emerald-50 text-emerald-600' :
                        item.tone === 'honest_fact' ? 'bg-amber-50 text-amber-600' :
                        'bg-indigo-50 text-indigo-600'
                      }`}>
                        {toneMap[item.tone]?.label}
                      </span>
                      {onTogglePublish && (
                        <button
                          onClick={() => onTogglePublish(item.id)}
                          className={`p-1 rounded-md transition-colors ${
                            item.isPublished 
                              ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100/80' 
                              : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                          }`}
                          title={item.isPublished ? "배포 취소" : "배포하기"}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
