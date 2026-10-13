import React, { useState } from 'react';
import { GeneratedBlogResult } from '../types';
import ReactMarkdown from 'react-markdown';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Star, 
  Copy, 
  Check, 
  Sparkles, 
  Heart, 
  Tag,
  Video,
  Share2,
  Sliders,
  BookOpen
} from 'lucide-react';
import { getGourmetImage } from './WebzineGallery';

interface WebzineArticleViewerProps {
  post: GeneratedBlogResult;
  onBack: () => void;
  onConvertToShorts?: (result: GeneratedBlogResult) => void;
  onConvertToSns?: (result: GeneratedBlogResult) => void;
  onUpdatePost?: (updatedPost: GeneratedBlogResult) => Promise<void> | void;
}

// Helper to resolve high-res inline images dynamically based on parsed photo captions from AI
const getPremiumInlineImage = (description: string, restaurantName: string): string => {
  const d = description.toLowerCase();
  
  if (d.includes('외관') || d.includes('입구') || d.includes('간판')) {
    return 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('인테리어') || d.includes('분위기') || d.includes('내부') || d.includes('소품') || d.includes('한옥')) {
    return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('대기') || d.includes('줄') || d.includes('웨이팅') || d.includes('사람')) {
    return 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('메뉴') || d.includes('차림') || d.includes('상차림') || d.includes('식탁')) {
    return 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('찹쌀떡') || d.includes('모찌') || d.includes('디저트') || d.includes('딸기')) {
    return 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('소금빵') || d.includes('베이커리') || d.includes('빵')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('피자') || d.includes('화덕')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('삼겹살') || d.includes('고기') || d.includes('구이') || d.includes('숯불')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('양꼬치') || d.includes('꼬치')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('감자탕') || d.includes('해장국') || d.includes('전골')) {
    return 'https://images.unsplash.com/photo-1547928500-300185172443?q=80&w=800&auto=format&fit=crop';
  }
  if (d.includes('파스타') || d.includes('면')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop';
  }

  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop';
};

export const WebzineArticleViewer: React.FC<WebzineArticleViewerProps> = ({
  post,
  onBack,
  onConvertToShorts,
  onConvertToSns,
}) => {
  const [copied, setCopied] = useState(false);
  const [likes, setLikes] = useState(132);
  const [hasLiked, setHasLiked] = useState(false);

  const handleCopy = () => {
    // Strip raw AI image tags before copying to clipboard for a clean text copy
    const cleanedText = post.contentMarkdown.replace(/\[(?:📷\s*)?사진:\s*([^\]]+)\]/gi, '');
    navigator.clipboard.writeText(cleanedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = () => {
    if (hasLiked) {
      setLikes(prev => prev - 1);
      setHasLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setHasLiked(true);
    }
  };

  const handleImageLoadError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600";
  };

  const markdownComponents = {
    blockquote: ({children}: any) => (
      <blockquote className="border-l-4 border-amber-500 bg-amber-50/40 px-5 py-4 my-6 italic text-slate-800 text-sm sm:text-base font-medium rounded-r-xl leading-relaxed shadow-xs">
        {children}
      </blockquote>
    ),
    h2: ({children}: any) => (
      <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight mt-10 mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
        {children}
      </h2>
    ),
    h3: ({children}: any) => (
      <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mt-8 mb-3 pl-3 border-l-4 border-orange-500 flex items-center gap-1.5">
        {children}
      </h3>
    ),
    p: ({children}: any) => (
      <p className="text-sm sm:text-base text-slate-800 leading-8 tracking-wide mb-5 font-normal font-sans">
        {children}
      </p>
    ),
    ul: ({children}: any) => (
      <ul className="space-y-2.5 my-4 pl-1">
        {children}
      </ul>
    ),
    ol: ({children}: any) => (
      <ol className="space-y-2.5 my-4 pl-1 list-decimal list-inside text-slate-800 font-semibold">
        {children}
      </ol>
    ),
    li: ({children}: any) => (
      <li className="text-sm sm:text-base text-slate-700 leading-relaxed font-normal list-none pl-4 relative before:content-['•'] before:absolute before:left-0 before:text-orange-500 before:font-bold">
        {children}
      </li>
    ),
    strong: ({children}: any) => (
      <strong className="font-black text-slate-950 bg-amber-100/50 px-1 py-0.5 rounded-md">
        {children}
      </strong>
    )
  };

  // Pre-process Content: STRIP RAW "**" on markdown headers and CONVERT "[📷 사진: ...]" placeholders to high-fidelity live photo cards!
  const renderPremiumContent = (markdown: string) => {
    // 1. Clean headers: convert '## **인테리어**' to '## 인테리어'
    let cleaned = markdown.replace(/^(#+)\s*\*\*([^*]+)\*\*/gm, '$1 $2');
    cleaned = cleaned.replace(/^(#+)\s+(.+)$/gm, (match, hashes, content) => {
      return hashes + ' ' + content.replace(/\*\*/g, '');
    });

    // 2. Locate "[📷 사진: ...]" pattern and match flexibly
    const pattern = /\[(?:📷\s*)?사진\s*[:\-]\s*([^\]]+)\]/gi;
    const matches = [...cleaned.matchAll(pattern)];

    const elements: React.ReactNode[] = [];

    if (matches.length === 0) {
      return (
        <div className="prose prose-slate max-w-none text-slate-900 text-sm sm:text-base leading-relaxed font-normal">
          <ReactMarkdown components={markdownComponents}>
            {cleaned}
          </ReactMarkdown>
        </div>
      );
    }

    let lastIndex = 0;
    matches.forEach((match, idx) => {
      const matchString = match[0];
      const matchIndex = match.index || 0;
      const description = match[1].trim();

      // Text block before match
      const textBefore = cleaned.slice(lastIndex, matchIndex).trim();
      if (textBefore) {
        elements.push(
          <div key={`text-${idx}`} className="prose prose-slate max-w-none text-slate-900 text-sm sm:text-base leading-relaxed font-normal">
            <ReactMarkdown components={markdownComponents}>
              {textBefore}
            </ReactMarkdown>
          </div>
        );
      }

      // Render the premium matching photo card
      const inlineImgUrl = getPremiumInlineImage(description, post.input?.restaurantName || '');
      elements.push(
        <div key={`image-card-${idx}`} className="my-8 rounded-2xl overflow-hidden border border-gray-100 shadow-md bg-white hover:shadow-lg transition-shadow duration-300">
          <div className="relative h-64 sm:h-80 w-full bg-slate-50">
            <img 
              src={inlineImgUrl} 
              alt={description}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={handleImageLoadError}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white font-extrabold text-xs sm:text-sm drop-shadow-md flex items-center gap-2">
              <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">PREMIUM PIC</span>
              <span>{description}</span>
            </div>
          </div>
          <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 text-[11px] text-gray-500 font-bold italic flex justify-between items-center">
            <span>▲ {description}</span>
            <span>BlogAI Premium Photo</span>
          </div>
        </div>
      );

      lastIndex = matchIndex + matchString.length;
    });

    // Remaining text after last match
    const textRemaining = cleaned.slice(lastIndex).trim();
    if (textRemaining) {
      elements.push(
        <div key="text-remaining" className="prose prose-slate max-w-none text-slate-900 text-sm sm:text-base leading-relaxed font-normal">
          <ReactMarkdown components={markdownComponents}>
            {textRemaining}
          </ReactMarkdown>
        </div>
      );
    }

    return elements;
  };

  const imgUrl = getGourmetImage(post);

  // Dynamic Tasting metrics based on original rating
  const baseRating = post.rating || 4.9;
  const metrics = [
    { label: '단맛 / 감칠맛 (Sweetness)', value: Math.min(5, Number((baseRating * 1.02).toFixed(1))), color: 'bg-rose-500' },
    { label: '염도 / 풍미 (Savory & Aroma)', value: Math.min(5, Number((baseRating * 0.98).toFixed(1))), color: 'bg-amber-500' },
    { label: '식감 / 크리스피 (Texture & Body)', value: Math.min(5, Number((baseRating * 1.01).toFixed(1))), color: 'bg-orange-500' },
    { label: '공간 분위기 (Vibe & Interior)', value: Math.min(5, Number((baseRating * 1.03).toFixed(1))), color: 'bg-emerald-500' },
    { label: '가성비 / 만족도 (Value Rating)', value: Math.min(5, Number((baseRating * 0.96).toFixed(1))), color: 'bg-indigo-500' },
  ];

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top Floating Back Bar */}
      <div className="bg-slate-950 px-6 py-4 flex items-center justify-between text-white border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>전체 웹진 목록으로 돌아가기</span>
        </button>
        <span className="text-[10px] bg-orange-600/20 text-orange-400 border border-orange-500/30 px-3 py-1 rounded-full font-black uppercase tracking-wider">
          Gourmet Premium Magazine
        </span>
      </div>

      {/* Hero Visual Area */}
      <div className="relative h-64 sm:h-96 w-full bg-slate-950">
        <img
          src={imgUrl}
          alt={post.selectedTitle || 'Gourmet review'}
          className="w-full h-full object-cover opacity-85 transition-all duration-300 animate-fade-in"
          onError={(e) => {
            const fallbackUrl = getGourmetImage(post, true);
            if (e.currentTarget.src !== fallbackUrl) {
              e.currentTarget.src = fallbackUrl;
            }
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />

        {/* Title Overlay */}
        <div className="absolute bottom-6 left-6 right-6 sm:bottom-8 sm:left-8 sm:right-8 space-y-3 text-white z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded bg-orange-600 text-white text-xs font-black">
              {post.input?.restaurantName || '맛집'}
            </span>
            <span className="px-2.5 py-1 rounded bg-black/50 backdrop-blur-md text-slate-200 text-xs font-semibold border border-white/10">
              📍 {post.input?.location || '서울'}
            </span>
            {post.id.startsWith('blog_') && (
              <span className="px-2.5 py-1 rounded bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wide">
                실시간 DB 연동 완료
              </span>
            )}
          </div>

          {/* Title cleaned of duplicate raw asterisk wraps */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white leading-snug tracking-tight max-w-4xl drop-shadow-md">
            {(post.selectedTitle || post.titleOptions?.[0] || '').replace(/\*\*/g, '')}
          </h1>

          {/* Metadata info */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>
                {post.createdAt 
                  ? new Date(post.createdAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '방금 전'}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>종합 평점: {post.rating?.toFixed(1) || '4.9'} / 5.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Body Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-8 bg-white">
        
        {/* Left 2 Columns: Markdown Post Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="space-y-6">
            
            {/* Premium Editorial Header & Signature Signature (Removes AI feeling entirely) */}
            <div className="border-b border-gray-100 pb-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-orange-500" />
                  미식 매거진 스페셜 칼럼
                </h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 font-extrabold">복사 완료</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>전체 복사</span>
                    </>
                  )}
                </button>
              </div>

              {/* Editorial Bio Card */}
              <div className="bg-amber-50/20 border border-amber-100/50 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center font-black text-white text-xs shrink-0 border border-orange-400 shadow-sm">
                  MJ
                </div>
                <div className="text-xs">
                  <div className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <span>민지우 수석 미식 에디터 (Min Ji-woo)</span>
                    <span className="text-[8px] bg-amber-500/10 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-black tracking-wider uppercase">CHEF WRITER</span>
                  </div>
                  <p className="text-gray-500 mt-1 leading-relaxed">
                    로컬 맛집의 스토리와 고감도 맛 분석을 기록하는 전문 에디터입니다. 본 리뷰는 AI 흔적 및 템플릿 안내문구를 원천 정제하고 독자적인 전문 기사 형식으로 최종 감수 발행되었습니다.
                  </p>
                </div>
              </div>
            </div>

            {/* Webzine Body text (Renders filtered output without raw bold tags or picture tags) */}
            <div className="markdown-body space-y-6">
              {renderPremiumContent(post.contentMarkdown)}
            </div>
          </div>

          {/* Social interaction footer inside article */}
          <div className="flex items-center gap-4 pt-6 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                hasLiked 
                  ? 'bg-rose-50 text-rose-600 border border-rose-200 scale-95' 
                  : 'bg-gray-50 text-gray-600 border border-gray-100 hover:bg-gray-100'
              }`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>도움이 되었어요 ({likes})</span>
            </button>
            <span className="text-xs text-gray-400">
              조회수: {post.id.startsWith('blog_') ? '312회' : '1,204회'}
            </span>
          </div>
        </div>

        {/* Right 1 Column: Editorial Information & Studio Actions */}
        <div className="space-y-6">
          
          {/* Tasting Note radar performance scores card */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
            <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-600" />
              미식 테이스팅 밸런스 Note
            </h4>

            <div className="space-y-3 pt-1">
              {metrics.map((metric, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                    <span>{metric.label}</span>
                    <span className="text-slate-900 font-extrabold">{metric.value.toFixed(1)} / 5.0</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${metric.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${(metric.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Tips & Rating Card - Re-designed for Premium HTML Webzine Editorial style */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5.5 space-y-4.5 shadow-xs">
            <h4 className="font-extrabold text-xs text-amber-800 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
              EDITOR'S REVIEW & RATING
            </h4>
            
            <div className="space-y-3.5">
              {/* Rating score */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/50">
                <span className="text-xs text-amber-900 font-bold">에디터 종합 평점</span>
                <div className="flex items-center gap-1">
                  <div className="flex text-amber-500">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs text-amber-950 font-black ml-1 bg-amber-500/10 px-1.5 py-0.5 rounded">
                    {post.rating?.toFixed(1) || '4.9'}
                  </span>
                </div>
              </div>

              {/* Revisit Intent */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-200/50">
                <span className="text-xs text-amber-900 font-bold">재방문 의사</span>
                <span className="text-xs font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                  {post.revisitIntent || '강력 재방문 희망!'}
                </span>
              </div>

              {/* Key Highlights list */}
              <div className="space-y-3.5 pt-1">
                <p className="text-[11px] font-black text-amber-900 uppercase tracking-wide">미식 포인트 핵심 요약</p>
                <div className="space-y-2.5">
                  {(post.keyTips || []).map((tip, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs text-amber-950 leading-relaxed font-medium bg-white/70 p-2.5 rounded-xl border border-amber-100/50 shadow-2xs">
                      <span className="w-5 h-5 rounded-full bg-amber-500/15 text-amber-800 font-black flex items-center justify-center text-[10px] flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="flex-1">{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Multi-Platform Studio Generator Card */}
          <div className="bg-slate-900 rounded-2xl p-5 space-y-4 border border-slate-800 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-orange-600/20 rounded-full blur-xl pointer-events-none" />
            
            <div>
              <h4 className="font-extrabold text-xs text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-pulse" />
                AI 원클릭 미디어 스튜디오
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                이 고품격 블로그 글을 바탕으로 쇼츠 대본이나 SNS 카드 뉴스 홍보글을 원클릭으로 자동 연계 생성합니다.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              {onConvertToShorts && (
                <button
                  onClick={() => onConvertToShorts(post)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-95 animate-pulse"
                >
                  <Video className="w-4 h-4" />
                  <span>🎬 30초 맛집 쇼츠 대본 만들기</span>
                </button>
              )}

              {onConvertToSns && (
                <button
                  onClick={() => onConvertToSns(post)}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>📢 인스타/페이스북 카드뉴스글 만들기</span>
                </button>
              )}
            </div>
          </div>

          {/* Tags cloud */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <h4 className="font-extrabold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-gray-400" />
              SEO 해시태그 목록
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {post.hashtags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-100 hover:border-gray-200 transition-colors px-2 py-1 rounded-lg text-gray-600 font-semibold cursor-pointer"
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
