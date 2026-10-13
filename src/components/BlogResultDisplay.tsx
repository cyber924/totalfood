import React, { useState } from 'react';
import { GeneratedBlogResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { 
  Copy, 
  Check, 
  BookmarkPlus, 
  Share2, 
  Star, 
  Sparkles, 
  Tag, 
  Image as ImageIcon, 
  FileCode, 
  Eye, 
  CheckCircle2, 
  Lightbulb, 
  ExternalLink,
  ThumbsUp,
  Video,
  Film,
  Layers,
  ChevronRight,
  Globe
} from 'lucide-react';

const safeLocaleTimeString = (dateVal: any, options?: any): string => {
  if (!dateVal) return '방금 전';
  if (typeof dateVal === 'object' && dateVal.seconds) {
    return new Date(dateVal.seconds * 1000).toLocaleTimeString([], options || { hour: '2-digit', minute: '2-digit' });
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? '방금 전' : d.toLocaleTimeString([], options || { hour: '2-digit', minute: '2-digit' });
};

interface BlogResultDisplayProps {
  result: GeneratedBlogResult;
  onSave: () => void;
  isSaved: boolean;
  onConvertToShorts?: (result: GeneratedBlogResult) => void;
  onConvertToSns?: (result: GeneratedBlogResult) => void;
  onTogglePublish?: () => void;
}

export const BlogResultDisplay: React.FC<BlogResultDisplayProps> = ({
  result,
  onSave,
  isSaved,
  onConvertToShorts,
  onConvertToSns,
  onTogglePublish,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'markdown' | 'tags' | 'images'>('preview');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  const formattedHashtagsString = result.hashtags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ');

  return (
    <div className="bg-white rounded-2xl border border-orange-200 shadow-xl overflow-hidden mt-8 transition-all">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-gray-900 to-slate-900 text-white p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                SEO 최적화 완료
              </span>
              <span className="text-xs text-gray-400">
                {safeLocaleTimeString(result.createdAt, { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <h3 className="font-bold text-base sm:text-lg text-white mt-0.5 line-clamp-1">
              {result.selectedTitle}
            </h3>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 flex-wrap">
          {onConvertToShorts && (
            <button
              onClick={() => onConvertToShorts(result)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Video className="w-4 h-4 text-white" />
              <span>🎬 30초 맛집 쇼츠 만들기</span>
            </button>
          )}

          {onConvertToSns && (
            <button
              onClick={() => onConvertToSns(result)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-violet-600 via-pink-600 to-red-500 hover:from-violet-700 hover:to-red-600 text-white text-xs sm:text-sm font-black transition-all flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-white" />
              <span>✨ SNS 5대 플랫폼 연동</span>
            </button>
          )}

          <button
            onClick={() => copyToClipboard(result.contentMarkdown + '\n\n' + formattedHashtagsString, 'all')}
            className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 shadow-xs"
          >
            {copiedType === 'all' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedType === 'all' ? '복사 완료!' : '전체 복사'}</span>
          </button>

          <button
            onClick={onSave}
            disabled={isSaved}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 border ${
              isSaved
                ? 'bg-emerald-800/40 text-emerald-300 border-emerald-500/50 cursor-default'
                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
            }`}
          >
            <BookmarkPlus className="w-4 h-4" />
            <span>{isSaved ? '보관함에 저장됨' : '보관함 저장'}</span>
          </button>

          {onTogglePublish && (
            <button
              onClick={onTogglePublish}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
                result.isPublished
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 hover:bg-blue-600/40'
                  : 'bg-orange-600 hover:bg-orange-700 text-white border-orange-600 shadow-sm active:scale-95'
              }`}
            >
              <Globe className={`w-4 h-4 ${result.isPublished ? '' : 'animate-pulse'}`} />
              <span>{result.isPublished ? '웹진 발행 완료' : '웹진 즉시 발행'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Title Options Choice Banner */}
      {result.titleOptions && result.titleOptions.length > 0 && (
        <div className="bg-amber-50/80 border-b border-amber-100 p-3 sm:px-6 text-xs text-amber-900 flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-extrabold flex items-center gap-1 shrink-0 text-amber-800">
            <Lightbulb className="w-4 h-4 text-amber-600" />
            AI 추천 상위노출 제목 3선:
          </span>
          <div className="flex flex-wrap gap-1.5 font-medium">
            {result.titleOptions.map((titleOption, idx) => (
              <span
                key={idx}
                className="bg-white px-2.5 py-1 rounded-md border border-amber-200/80 text-gray-800 shadow-2xs"
              >
                {titleOption}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Navigation View Tabs */}
      <div className="border-b border-gray-200 bg-gray-50/80 px-4 sm:px-6 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('preview')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'preview'
              ? 'border-orange-500 text-orange-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Eye className="w-4 h-4" />
          <span>블로그 미리보기</span>
        </button>

        <button
          onClick={() => setActiveTab('markdown')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'markdown'
              ? 'border-orange-500 text-orange-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>마크다운 소스</span>
        </button>

        <button
          onClick={() => setActiveTab('tags')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'tags'
              ? 'border-orange-500 text-orange-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>SEO 해시태그 ({result.hashtags?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('images')}
          className={`py-3 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
            activeTab === 'images'
              ? 'border-orange-500 text-orange-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>AI 썸네일 프롬프트</span>
        </button>
      </div>

      {/* Main Tab Contents */}
      <div className="p-4 sm:p-7">
        {/* TAB 1: VISUAL PREVIEW */}
        {activeTab === 'preview' && (
          <div className="max-w-7xl mx-auto">
            
            {/* Split Screen Layout: Draft Metadata vs. Beautiful Live Blog */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT SIDE: DRAFT MANUSCRIPT (원고 확인 모드) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-800">
                        블로그 발행 원고 원문 확인
                      </h4>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.contentMarkdown, 'draft_copy')}
                      className="px-3 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-[10px] font-bold rounded-lg text-slate-600 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedType === 'draft_copy' ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>복사</span>
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">선택한 추천 제목</p>
                      <p className="text-xs font-extrabold text-slate-800 bg-white border border-slate-200 p-2.5 rounded-xl mt-1 leading-relaxed">
                        {result.selectedTitle}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AI 맛집 리뷰 요약본</p>
                      <p className="text-xs font-semibold text-slate-600 bg-white border border-slate-200 p-2.5 rounded-xl mt-1 leading-relaxed">
                        {result.summary}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">원고 본문 원문 스트림</p>
                      <div className="bg-white border border-slate-200 rounded-xl p-3 max-h-[360px] overflow-y-auto text-xs font-mono leading-relaxed text-slate-700 whitespace-pre-wrap select-text">
                        {result.contentMarkdown}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE: PREMIUM LIVE BLOG VIEW (실제 포털/웹진 형태 블로그) */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Simulated Portal Blog Frame Container */}
                <div className="border border-gray-200 rounded-2xl bg-white shadow-xl overflow-hidden">
                  
                  {/* Blog Mock Top Address Bar */}
                  <div className="bg-gray-100 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <div className="bg-white px-5 py-0.5 rounded-lg text-[9px] text-gray-400 border border-gray-200/80 font-semibold w-1/2 text-center truncate">
                      https://blog.naver.com/gourmet_ai/2026_review_live
                    </div>
                    <span className="w-4 h-4" />
                  </div>

                  {/* Blog Main Page Header */}
                  <div className="bg-orange-500/10 p-5 border-b border-orange-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full border border-orange-500/30 overflow-hidden bg-white flex items-center justify-center">
                        <img
                          src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                          alt="Blogger Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-gray-800">미식 탐험가의 푸드 다이어리</h4>
                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500 font-bold">
                          <span className="text-orange-600">이달의 우수 블로그</span>
                          <span>•</span>
                          <span>이웃 142,520명</span>
                        </div>
                      </div>
                    </div>
                    
                    <button className="px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] rounded-full transition-all shadow-xs flex items-center gap-1 cursor-pointer">
                      <Star className="w-3 h-3 fill-white" />
                      <span>이웃추가</span>
                    </button>
                  </div>

                  {/* HTML Live Blog Content Space */}
                  <div className="p-6 sm:p-8 space-y-6">
                    
                    {/* Visual Category Path */}
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600">
                      <span>맛집 탐방 리얼 리뷰</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      <span className="text-gray-500">{result.input.restaurantName || '인기 미식'}</span>
                    </div>

                    {/* Blog Dynamic Title */}
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">
                      {result.selectedTitle}
                    </h1>

                    {/* Blog Sub-Metadata details */}
                    <div className="flex items-center gap-3 text-xs text-gray-400 pb-4 border-b border-gray-100">
                      <span>작성일자: {safeLocaleTimeString(result.createdAt, { hour: '2-digit', minute: '2-digit' })}</span>
                      <span>•</span>
                      <span>조회수 1,294</span>
                      <span>•</span>
                      <span>댓글 48개</span>
                    </div>

                    {/* TOP HERO APPETIZING IMAGE (Dynamically Injected Unsplash) */}
                    <div className="my-5 rounded-2xl overflow-hidden shadow-md border border-gray-100 max-h-[380px] bg-slate-100">
                      <img
                        src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"
                        alt="대표 푸드 이미지"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Summary Card inside Live View */}
                    <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-100 flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <span className="inline-block text-[9px] font-black text-orange-700 bg-orange-150 px-2 py-0.5 rounded uppercase">
                          AI 총평 요약
                        </span>
                        <p className="text-xs font-bold text-gray-700 leading-relaxed">
                          {result.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 bg-white px-2.5 py-1 rounded-lg border border-orange-200">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        <span className="font-extrabold text-xs text-gray-800">{result.rating || 4.8}</span>
                      </div>
                    </div>

                    {/* Rendered Live HTML Markdown with dynamically injected images */}
                    <div className="prose prose-orange max-w-none text-gray-800 leading-relaxed text-sm sm:text-base space-y-4">
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 mt-6 mb-3 pb-1 border-b border-gray-100">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base sm:text-lg font-extrabold text-orange-950 mt-5 mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mt-4 mb-2">{children}</h3>,
                          p: ({ children }) => {
                            const textContent = String(children);
                            
                            // Unsplash premium image libraries
                            const gourmetImages = [
                              "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80", // Steak
                              "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80", // Pizza
                              "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=800&q=80", // Pancake
                              "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80", // Pasta
                              "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=800&q=80", // Sandwich
                              "https://images.unsplash.com/photo-1484723091739-30a097e8f929?auto=format&fit=crop&w=800&q=80", // Toast
                              "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=800&q=80"  // Grill
                            ];

                            if (textContent.includes('[📷') || textContent.includes('사진:')) {
                              // Dynamically seed index based on string hash for deterministic beauty
                              const charSum = textContent.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                              const imgIdx = charSum % gourmetImages.length;
                              const imgUrl = gourmetImages[imgIdx];
                              
                              return (
                                <div className="my-6 space-y-2">
                                  <div className="rounded-xl overflow-hidden shadow-xs border border-gray-200">
                                    <img
                                      src={imgUrl}
                                      alt="포토 리뷰"
                                      className="w-full object-cover max-h-[380px]"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <p className="text-center text-xs text-gray-500 font-bold mt-1.5">{textContent}</p>
                                </div>
                              );
                            }
                            return <p className="leading-relaxed text-gray-800 my-2 text-xs sm:text-sm">{children}</p>;
                          },
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-4 border-orange-400 bg-amber-50/50 pl-4 py-2 italic text-gray-700 my-4 rounded-r-lg text-xs sm:text-sm">
                              {children}
                            </blockquote>
                          ),
                          ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2 text-gray-850 text-xs sm:text-sm">{children}</ul>,
                        }}
                      >
                        {result.contentMarkdown}
                      </ReactMarkdown>
                    </div>

                    {/* Bottom Dynamic Unsplash Divider decoration */}
                    <div className="my-6 rounded-xl overflow-hidden max-h-[260px] bg-slate-50">
                      <img
                        src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"
                        alt="피날레 컷"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Blog Tags Area */}
                    <div className="mt-8 pt-5 border-t border-gray-100 flex flex-wrap gap-1.5">
                      {result.hashtags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200/50"
                        >
                          {tag.startsWith('#') ? tag : `#${tag}`}
                        </span>
                      ))}
                    </div>

                    {/* Blog footer buttons */}
                    <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-3">
                        <button className="flex items-center gap-1.5 font-bold text-gray-500 hover:text-red-500 transition-colors cursor-pointer">
                          <ThumbsUp className="w-4 h-4" />
                          <span>공감 {result.rating ? Math.round(result.rating * 12) : 58}개</span>
                        </button>
                      </div>
                      <span className="font-semibold text-[10px] text-gray-300">© AI 맛집 기자단. ALL RIGHTS RESERVED</span>
                    </div>

                  </div>

                </div>

                {/* Shorts 1-Click Banner in Right View */}
                {onConvertToShorts && (
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shrink-0">
                        <Video className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-white text-xs sm:text-sm">
                            이 블로그 글로 맛집 쇼츠(릴스) 제작하기
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">
                          AI가 맛깔나는 5개 씬 대본, 9:16 비주얼 화면, 한국어 목소리 오디오(TTS)를 자동 믹싱 연동합니다.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => onConvertToShorts(result)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white font-black text-xs transition-all shadow-lg active:scale-95 shrink-0 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>쇼츠 스튜디오 열기</span>
                      <Film className="w-4 h-4" />
                    </button>
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* TAB 2: RAW MARKDOWN SOURCE */}
        {activeTab === 'markdown' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                네이버/티스토리 에디터에 마크다운 모드로 바로 붙여넣기 하실 수 있습니다.
              </span>
              <button
                onClick={() => copyToClipboard(result.contentMarkdown, 'markdown_only')}
                className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                {copiedType === 'markdown_only' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedType === 'markdown_only' ? '복사됨' : '마크다운 원문 복사'}</span>
              </button>
            </div>

            <textarea
              readOnly
              rows={18}
              value={result.contentMarkdown}
              className="w-full p-4 rounded-xl border border-gray-200 bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed focus:ring-0"
            />
          </div>
        )}

        {/* TAB 3: HASHTAGS */}
        {activeTab === 'tags' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-orange-950">검색 유입 해시태그 한 줄 복사</h4>
                <p className="text-xs text-orange-800 mt-0.5">인스타그램, 블로그 태그란에 그대로 붙여넣으세요.</p>
              </div>
              <button
                onClick={() => copyToClipboard(formattedHashtagsString, 'hashtags')}
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
              >
                {copiedType === 'hashtags' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedType === 'hashtags' ? '복사 완료' : '태그 전체 복사'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <p className="text-sm font-semibold text-gray-800 leading-loose">
                {formattedHashtagsString}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {result.hashtags.map((tag, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between text-xs font-semibold text-gray-700"
                >
                  <span>{tag.startsWith('#') ? tag : `#${tag}`}</span>
                  <button
                    onClick={() => copyToClipboard(tag.startsWith('#') ? tag : `#${tag}`, `tag_${idx}`)}
                    className="text-gray-400 hover:text-orange-600 transition-colors"
                  >
                    {copiedType === `tag_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: AI IMAGE PROMPTS */}
        {activeTab === 'images' && (
          <div className="space-y-4 max-w-2xl mx-auto">
            <p className="text-xs text-gray-500">
              블로그 대표 썸네일이나 메인 음식 이미지를 직접 생성할 때 사용하는 AI 이미지 생성 프롬프트입니다.
            </p>

            {result.imagePrompts && result.imagePrompts.length > 0 ? (
              result.imagePrompts.map((imgPrompt, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-gray-200 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-orange-600 bg-orange-50 px-2.5 py-1 rounded border border-orange-200">
                      {imgPrompt.label}
                    </span>
                    <button
                      onClick={() => copyToClipboard(imgPrompt.prompt, `img_${idx}`)}
                      className="text-xs font-bold text-gray-600 hover:text-orange-600 flex items-center gap-1"
                    >
                      {copiedType === `img_${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>프롬프트 복사</span>
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono">
                    {imgPrompt.prompt}
                  </p>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-gray-400">
                이미지 프롬프트 정보가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
