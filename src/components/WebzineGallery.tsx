import React from 'react';
import { GeneratedBlogResult } from '../types';
import { Sparkles, Calendar, Clock, Star, ArrowRight, BookOpen } from 'lucide-react';

interface WebzineGalleryProps {
  posts: GeneratedBlogResult[];
  onSelectPost: (post: GeneratedBlogResult) => void;
  selectedPostId?: string;
}

// Map restaurants/cuisine to premium high-quality Unsplash food photos
export const getGourmetImage = (post: GeneratedBlogResult, ignoreCustom = false): string => {
  if (post.customImageUrl && !ignoreCustom) {
    return post.customImageUrl;
  }
  const title = post.selectedTitle || '';
  const name = post.input?.restaurantName || '';
  
  if (name.includes('마리오네') || title.includes('피자') || title.includes('pizza') || title.includes('화덕')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=800&auto=format&fit=crop';
  }
  if (name.includes('감자탕') || title.includes('감자탕') || title.includes('해장국') || title.includes('soup')) {
    return 'https://images.unsplash.com/photo-1547928500-300185172443?q=80&w=800&auto=format&fit=crop'; // Asian hot pot/stew
  }
  if (name.includes('버터밀크') || title.includes('팬케이크') || title.includes('디저트') || title.includes('pancake')) {
    return 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?q=80&w=800&auto=format&fit=crop';
  }
  if (name.includes('흑돼지') || title.includes('흑돼지') || title.includes('pork') || title.includes('고기') || title.includes('삼겹살')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop';
  }
  if (name.includes('로제') || title.includes('파스타') || title.includes('pasta') || title.includes('Bistro')) {
    return 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?q=80&w=800&auto=format&fit=crop';
  }
  if (name.includes('양꼬치') || title.includes('양꼬치') || title.includes('skewer') || title.includes('bbq')) {
    return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800&auto=format&fit=crop'; // sizzling skewers
  }
  if (name.includes('한정선') || title.includes('찹쌀떡') || title.includes('모찌') || title.includes('디저트') || title.includes('딸기')) {
    return 'https://images.unsplash.com/photo-1511018556340-d16986a1c194?q=80&w=800&auto=format&fit=crop'; // strawberry dessert
  }
  
  return 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800&auto=format&fit=crop';
};

export const WebzineGallery: React.FC<WebzineGalleryProps> = ({
  posts,
  onSelectPost,
  selectedPostId,
}) => {
  // We expect up to 7 items (5 mockups + 2 new ones)
  const sortedPosts = [...posts].sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  if (sortedPosts.length === 0) return null;

  return (
    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden">
      {/* Decorative Blur Backdrops */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-5 relative z-10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-Driven Premium Webzine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            BlogAI 미식 프리미엄 매거진 갤러리
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            회원님의 단독 데이터베이스에 동기화 완료된 실시간 블로그 글을 엄선하여 고품격 미식 웹진 스타일로 발행했습니다. (현재 총 <span className="text-orange-400 font-bold">{sortedPosts.length}개</span> 발행됨)
          </p>
        </div>
        <div className="text-[10px] text-slate-500 font-bold tracking-wider uppercase bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          DB Realtime Connected
        </div>
      </div>

      {/* Bento Grid Gallery */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {sortedPosts.map((post, index) => {
          const imgUrl = getGourmetImage(post);
          const isSelected = selectedPostId === post.id;
          const isNew = post.id.startsWith('blog_');
          
          return (
            <div
              key={post.id}
              onClick={() => onSelectPost(post)}
              className={`group flex flex-col bg-slate-950 border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer shadow-lg hover:shadow-orange-950/20 hover:-translate-y-1 ${
                isSelected 
                  ? 'border-orange-500 ring-2 ring-orange-500/20' 
                  : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Card Thumbnail Image Area */}
              <div className="relative h-48 overflow-hidden bg-slate-900">
                <img
                  src={imgUrl}
                  alt={post.selectedTitle || 'Gourmet post'}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    const fallbackUrl = getGourmetImage(post, true);
                    if (e.currentTarget.src !== fallbackUrl) {
                      e.currentTarget.src = fallbackUrl;
                    }
                  }}
                />
                
                {/* Visual Gradients Over Image */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                {/* Badge Overlay */}
                <div className="absolute top-3 left-3 flex gap-1.5 items-center">
                  {isNew ? (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-600 text-white font-black uppercase tracking-wider shadow-sm animate-pulse">
                      NEW 실시간
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/90 text-amber-500 font-bold border border-amber-500/20 shadow-sm uppercase tracking-wider">
                      GOURMET
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-orange-400 font-bold border border-orange-500/20">
                    ★ {post.rating?.toFixed(1) || '4.9'}
                  </span>
                </div>

                {/* Clean Location Overlay at Bottom Right */}
                <div className="absolute bottom-3 right-3 text-xs">
                  <span className="text-slate-200 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 shadow-md">
                    📍 {post.input?.location || '서울'}
                  </span>
                </div>
              </div>

              {/* Card Body content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-extrabold text-sm text-slate-100 leading-snug tracking-tight group-hover:text-orange-400 transition-colors line-clamp-2">
                    {post.selectedTitle || post.titleOptions?.[0]}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {post.summary}
                  </p>
                </div>

                {/* Hashtags preview */}
                <div className="flex flex-wrap gap-1">
                  {(post.hashtags || []).slice(0, 3).map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold text-slate-500"
                    >
                      {tag.startsWith('#') ? tag : `#${tag}`}
                    </span>
                  ))}
                </div>

                {/* Card Footer Metadata */}
                <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    <span>
                      {post.createdAt 
                        ? new Date(post.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) 
                        : '최근'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-orange-400 font-black group-hover:gap-1.5 transition-all">
                    <span>전문 읽기</span>
                    <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
