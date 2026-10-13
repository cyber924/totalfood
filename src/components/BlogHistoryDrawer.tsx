import React, { useState } from 'react';
import { GeneratedBlogResult, GeneratedSnsRecord } from '../types';
import { X, Trash2, Calendar, FileText, ArrowRight, Layers, Globe, Lock, RefreshCw, Check } from 'lucide-react';

const safeLocaleDateString = (dateVal: any): string => {
  if (!dateVal) return '알 수 없음';
  if (typeof dateVal === 'object' && dateVal.seconds) {
    return new Date(dateVal.seconds * 1000).toLocaleDateString();
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? '알 수 없음' : d.toLocaleDateString();
};

interface BlogHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPosts: GeneratedBlogResult[];
  onSelectPost: (post: GeneratedBlogResult) => void;
  onDeletePost: (id: string) => void;
  onClearAll: () => void;
  savedSns?: GeneratedSnsRecord[];
  onSelectSns?: (record: GeneratedSnsRecord) => void;
  onDeleteSns?: (id: string) => void;
  onClearAllSns?: () => void;
  onTogglePublishPost?: (post: GeneratedBlogResult) => void;
  onTogglePublishSns?: (record: GeneratedSnsRecord) => void;
  onSyncAllToWebzine?: () => Promise<void>;
}

export const BlogHistoryDrawer: React.FC<BlogHistoryDrawerProps> = ({
  isOpen,
  onClose,
  savedPosts,
  onSelectPost,
  onDeletePost,
  onClearAll,
  savedSns = [],
  onSelectSns,
  onDeleteSns,
  onClearAllSns,
  onTogglePublishPost,
  onTogglePublishSns,
  onSyncAllToWebzine,
}) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState<'blog' | 'sns'>('blog');
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col gap-3.5 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-gray-900">내 보관함</h3>
              <p className="text-xs text-gray-500">저장된 블로그 및 SNS 콘텐츠 목록</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setActiveHistoryTab('blog')}
              className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeHistoryTab === 'blog'
                  ? 'bg-white text-orange-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              블로그 글 ({savedPosts.length})
            </button>
            <button
              onClick={() => setActiveHistoryTab('sns')}
              className={`py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeHistoryTab === 'sns'
                  ? 'bg-white text-violet-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              SNS 카드 ({savedSns.length})
            </button>
          </div>

          {/* Sync Webzine Quick Banner */}
          {onSyncAllToWebzine && (savedPosts.length > 0 || savedSns.length > 0) && (
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs mt-1">
              <div className="space-y-0.5">
                <p className="text-xs font-extrabold text-orange-950 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
                  <span>실시간 웹진 동기화</span>
                </p>
                <p className="text-[10px] text-orange-700 leading-tight font-medium">
                  내 보관함의 글들을 웹진 갤러리에 동기화(발행)합니다.
                </p>
              </div>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setIsSyncingAll(true);
                  try {
                    await onSyncAllToWebzine();
                    setSyncSuccess(true);
                    setTimeout(() => setSyncSuccess(false), 3000);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setIsSyncingAll(false);
                  }
                }}
                disabled={isSyncingAll}
                className="px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 disabled:opacity-75 text-white text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs active:scale-95 flex items-center gap-1"
              >
                {isSyncingAll ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : syncSuccess ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                <span>{isSyncingAll ? '동기화 중' : syncSuccess ? '완료!' : '전체 동기화'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Drawer Body - List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {activeHistoryTab === 'blog' ? (
            savedPosts.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <FileText className="w-12 h-12 mx-auto stroke-1 text-gray-300" />
                <p className="text-sm font-medium">저장된 포스팅이 없습니다.</p>
                <p className="text-xs text-gray-400">
                  블로그 글을 생성한 후 '보관함 저장' 버튼을 눌러보세요.
                </p>
              </div>
            ) : (
              savedPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl border border-gray-200 hover:border-orange-300 bg-white hover:bg-orange-50/30 transition-all group relative cursor-pointer shadow-2xs"
                  onClick={() => {
                    onSelectPost(post);
                    onClose();
                  }}
                >
                  <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-orange-600 bg-orange-100/80 px-2 py-0.5 rounded">
                        {post.input.restaurantName}
                      </span>
                      {post.isPublished && (
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                          웹진 발행됨
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {safeLocaleDateString(post.createdAt)}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {post.selectedTitle}
                  </h4>

                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {post.summary}
                  </p>

                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-orange-600">
                    <span className="flex items-center gap-1">
                      불러오기 <ArrowRight className="w-3.5 h-3.5" />
                    </span>

                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      {onTogglePublishPost && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePublishPost(post);
                          }}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border ${
                            post.isPublished
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                          title={post.isPublished ? "웹진 발행 취소" : "웹진으로 발행"}
                        >
                          {post.isPublished ? <Globe className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                          <span>{post.isPublished ? '발행됨' : '웹진발행'}</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePost(post.id);
                        }}
                        className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )
          ) : (
            savedSns.length === 0 ? (
              <div className="text-center py-16 text-gray-400 space-y-3">
                <Layers className="w-12 h-12 mx-auto stroke-1 text-gray-300" />
                <p className="text-sm font-medium">저장된 SNS 콘텐츠가 없습니다.</p>
                <p className="text-xs text-gray-400">
                  '맛집 5대 SNS' 생성을 완료한 뒤 '보관함 저장' 버튼을 눌러보세요.
                </p>
              </div>
            ) : (
              savedSns.map((record) => {
                const platformsStr = record.selectedPlatforms.map(p => {
                  if (p === 'instagram') return '인스타';
                  if (p === 'twitter') return 'X';
                  if (p === 'threads') return '스레드';
                  if (p === 'tiktok') return '틱톡';
                  if (p === 'shorts') return '쇼츠';
                  return p;
                }).join(', ');

                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-xl border border-gray-200 hover:border-violet-300 bg-white hover:bg-violet-50/20 transition-all group relative cursor-pointer shadow-2xs"
                    onClick={() => {
                      if (onSelectSns) onSelectSns(record);
                      onClose();
                    }}
                  >
                    <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-violet-600 bg-violet-100/80 px-2 py-0.5 rounded">
                          {record.restaurantName}
                        </span>
                        {record.isPublished && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200">
                            웹진 발행됨
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {safeLocaleDateString(record.createdAt)}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-gray-900 line-clamp-1 group-hover:text-violet-600 transition-colors">
                      {record.restaurantName} SNS 카드 홍보물
                    </h4>

                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-medium">
                      지정 SNS: {platformsStr} • {record.location || "위치 정보 없음"}
                    </p>

                    <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-violet-600">
                      <span className="flex items-center gap-1">
                        홍보 스튜디오 열기 <ArrowRight className="w-3.5 h-3.5" />
                      </span>

                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {onTogglePublishSns && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePublishSns(record);
                            }}
                            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all border ${
                              record.isPublished
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                            title={record.isPublished ? "웹진 발행 취소" : "웹진으로 발행"}
                          >
                            {record.isPublished ? <Globe className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
                            <span>{record.isPublished ? '발행됨' : '웹진발행'}</span>
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteSns) onDeleteSns(record.id);
                          }}
                          className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                          title="삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>

        {/* Drawer Footer */}
        {((activeHistoryTab === 'blog' && savedPosts.length > 0) || (activeHistoryTab === 'sns' && savedSns.length > 0)) && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <button
              onClick={() => {
                if (activeHistoryTab === 'blog') {
                  onClearAll();
                } else {
                  if (onClearAllSns) onClearAllSns();
                }
              }}
              className="text-xs text-rose-600 font-bold hover:underline font-semibold"
            >
              전체 삭제
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
