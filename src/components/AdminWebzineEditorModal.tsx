import React, { useState, useEffect, useRef } from 'react';
import {
  X, Monitor, Smartphone, Sparkles, Image as ImageIcon, Search, RefreshCw,
  Save, Edit2, Play, Eye, Compass, Shield, MapPin, Check, ChevronRight, HelpCircle
} from 'lucide-react';
import { subscribeAllAssets } from '../services/adminService';
import { SharedGourmetAsset } from '../types';

interface Block {
  type: 'text' | 'image';
  content: string;
  alt?: string;
  url?: string;
  index?: number;
}

interface AdminWebzineEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'blog' | 'sns' | 'shorts';
  item: any;
  onSave: (updatedFields: {
    editTitle: string;
    editBody: string;
    editRestaurant: string;
    editLocation: string;
    editImageUrl: string;
  }) => Promise<void>;
  isSaving: boolean;
  showToast: (text: string, type?: 'success' | 'info' | 'error') => void;
}

export function AdminWebzineEditorModal({
  isOpen,
  onClose,
  type,
  item,
  onSave,
  isSaving,
  showToast
}: AdminWebzineEditorModalProps) {
  if (!isOpen || !item) return null;

  // Layout orientation mode: 'pc' or 'mobile'
  const [deviceMode, setDeviceMode] = useState<'pc' | 'mobile'>('pc');
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [editTab, setEditTab] = useState<'visual' | 'raw'>('visual');

  // Core editing states
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [editRestaurant, setEditRestaurant] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editImageUrl, setEditImageUrl] = useState('');

  // Image swapper overlay state
  const [activeSwapperTarget, setActiveSwapperTarget] = useState<{
    targetType: 'cover' | 'inline';
    inlineIndex?: number;
  } | null>(null);

  // Image swapper tabs & search states
  const [swapperTab, setSwapperTab] = useState<'presets' | 'unsplash' | 'ai' | 'url'>('presets');
  const [unsplashQuery, setUnsplashQuery] = useState('');
  const [unsplashResults, setUnsplashResults] = useState<string[]>([]);
  const [isSearchingUnsplash, setIsSearchingUnsplash] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // AI Generation states
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAiImage, setIsGeneratingAiImage] = useState(false);

  // AI Concept Suggestions states
  const [aiConcepts, setAiConcepts] = useState<{ label: string; prompt: string }[]>([]);
  const [isAnalyzingConcepts, setIsAnalyzingConcepts] = useState(false);

  // Shared assets state
  const [sharedAssets, setSharedAssets] = useState<SharedGourmetAsset[]>([]);

  // Subscribe to shared assets
  useEffect(() => {
    if (isOpen) {
      const unsubscribe = subscribeAllAssets((updatedAssets) => {
        setSharedAssets(updatedAssets);
      });
      return () => unsubscribe();
    }
  }, [isOpen]);

  // Initialize data on item change
  useEffect(() => {
    if (item) {
      if (type === 'blog') {
        setEditTitle(item.selectedTitle || item.titleOptions?.[0] || '');
        setEditBody(item.contentMarkdown || '');
        setEditRestaurant(item.input?.restaurantName || item.restaurantName || '');
        setEditLocation(item.input?.location || item.location || '');
        setEditImageUrl(item.customImageUrl || item.imageUrl || '');
      } else if (type === 'sns') {
        setEditTitle(`${item.restaurantName || 'SNS 카드'} 원고`);
        setEditBody(JSON.stringify(item.data, null, 2));
        setEditRestaurant(item.restaurantName || '');
        setEditLocation(item.location || '');
        setEditImageUrl('');
      } else if (type === 'shorts') {
        setEditTitle(item.title || '');
        setEditBody(item.youtubeDescription || '');
        setEditRestaurant(item.restaurantName || '');
        setEditLocation(item.location || '');
        setEditImageUrl('');
      }
      setIsEditMode(false);
      setActiveSwapperTarget(null);
      setAiConcepts([]);
    }
  }, [item, type]);

  // Set default prompt when restaurant name is loaded
  useEffect(() => {
    if (editRestaurant) {
      setAiPrompt(`Premium macro food photography of signature dish at ${editRestaurant}, glistening, steaming hot, shallow depth of field, warm cozy lighting, professional gourmet styling, 8k`);
      setUnsplashQuery(editRestaurant);
    }
  }, [editRestaurant]);

  // Parse markdown body to interactive blocks (Standard Markdown or [📷 사진: ...] text placeholders)
  const blocks = React.useMemo(() => {
    const list: Block[] = [];
    const regex = /(!\[(.*?)\]\((.*?)\))|(\[📷?\s*사진:\s*(.*?)\])/g;
    let lastIndex = 0;
    let match;
    let imgCount = 0;

    while ((match = regex.exec(editBody)) !== null) {
      const textBefore = editBody.substring(lastIndex, match.index);
      if (textBefore) {
        list.push({ type: 'text', content: textBefore });
      }

      const isMarkdownImage = !!match[1];
      const alt = isMarkdownImage ? match[2] : match[5];
      let url = isMarkdownImage ? match[3] : '';

      if (!url) {
        // Automatically generate a beautiful high-fidelity gourmet Unsplash search URL based on description keyword
        const searchKeywords = (alt || '').replace(/📷|사진/g, '').trim();
        url = `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(searchKeywords || editRestaurant || 'gourmet')},food`;
      }

      list.push({
        type: 'image',
        content: match[0],
        alt: alt || '맛집 사진',
        url: url,
        index: imgCount++
      });
      lastIndex = regex.lastIndex;
    }

    const textAfter = editBody.substring(lastIndex);
    if (textAfter) {
      list.push({ type: 'text', content: textAfter });
    }

    return list;
  }, [editBody, editRestaurant]);

  const handleUpdateBlockText = (index: number, newText: string) => {
    const updatedBlocks = blocks.map((block, idx) => {
      if (idx === index) {
        return { ...block, content: newText };
      }
      return block;
    });
    const reconstructed = updatedBlocks.map(b => {
      if (b.type === 'image') {
        return `![${b.alt || '맛집 사진'}](${b.url})`;
      }
      return b.content;
    }).join('');
    setEditBody(reconstructed);
  };

  const handleImageLoadError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src = "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600";
  };

  const compressImageBase64 = (base64Str: string, maxDimension = 1024): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.src = base64Str;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Force 16:9 aspect ratio widescreen crop (e.g. 1024 x 576)
        const targetWidth = 1024;
        const targetHeight = 576;

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(base64Str);
          return;
        }

        const scale = Math.max(targetWidth / width, targetHeight / height);
        const xVal = (targetWidth / 2) - (width / 2) * scale;
        const yVal = (targetHeight / 2) - (height / 2) * scale;

        ctx.drawImage(img, xVal, yVal, width * scale, height * scale);

        let quality = 0.8;
        let compressed = canvas.toDataURL("image/jpeg", quality);
        while (compressed.length * 0.75 > 200 * 1024 && quality > 0.15) {
          quality -= 0.1;
          compressed = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(compressed);
      };
      img.onerror = () => {
        resolve(base64Str);
      };
    });
  };

  const getCompressedImage = async (url: string): Promise<string> => {
    if (!url) return '';
    try {
      let base64 = url;
      if (!url.startsWith('data:')) {
        const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data.success && data.base64) {
          base64 = data.base64;
        } else {
          throw new Error('Proxy failed');
        }
      }
      return await compressImageBase64(base64);
    } catch (err) {
      console.warn('Failed to compress image, returning original:', err);
      return url;
    }
  };

  // Core handler to change a specific image URL and reconstruct body markdown
  const handleUpdateImageUrl = async (newUrl: string) => {
    if (!activeSwapperTarget) return;

    showToast('이미지 고화질 16:9 크롭 및 200KB 초경량 최적화 압축 중...', 'info');
    const compressedUrl = await getCompressedImage(newUrl);

    if (activeSwapperTarget.targetType === 'cover') {
      setEditImageUrl(compressedUrl);
      showToast('대표 커버 이미지가 16:9 최적화 압축 적용되었습니다!', 'success');
    } else if (activeSwapperTarget.targetType === 'inline' && activeSwapperTarget.inlineIndex !== undefined) {
      const targetIdx = activeSwapperTarget.inlineIndex;
      const updatedBlocks = blocks.map(block => {
        if (block.type === 'image' && block.index === targetIdx) {
          return { ...block, url: compressedUrl };
        }
        return block;
      });
      const reconstructed = updatedBlocks.map(b => {
        if (b.type === 'image') {
          return `![${b.alt || '맛집 사진'}](${b.url})`;
        }
        return b.content;
      }).join('');
      setEditBody(reconstructed);
      showToast('본문 이미지가 16:9 최적화 압축 적용되었습니다!', 'success');
    }

    setActiveSwapperTarget(null);
  };

  // Perform Gemini AI concept analysis based on content and title
  const handleAnalyzeConcepts = async () => {
    setIsAnalyzingConcepts(true);
    setSwapperTab('ai'); // Automatically guide user to the AI tab
    try {
      const response = await fetch('/api/analyze-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: editBody, restaurantName: editRestaurant })
      });
      const data = await response.json();
      if (data.success && data.data?.concepts) {
        setAiConcepts(data.data.concepts);
        showToast('성공적으로 이 맛집 맞춤형 비주얼 컨셉을 추출했습니다!', 'success');
      } else {
        throw new Error(data.error || '컨셉 추천에 실패했습니다.');
      }
    } catch (err: any) {
      showToast('AI 분석 실패: ' + err.message, 'error');
      // Curated gourmet concepts fallback
      setAiConcepts([
        {
          label: '🔥 그릴 위에서 육즙이 떨어지는 흑돼지 디테일 샷',
          prompt: `Ultra-detailed macro shot of thick sizzling black pork belly on hot charcoal grates, sparks flying, dripping juice, golden-brown crust, steam rising, professional food styling, warm dramatic lighting, 8k`
        },
        {
          label: '🏡 따스한 한옥 감성의 세련된 푸드 테이블 세팅',
          prompt: `Cinematic wide angle shot of a beautifully decorated Korean dining table with premium grilled meats and side dishes inside a cozy, modern Hanok interior, sunlight beaming through windows, luxurious atmosphere, 4k`
        },
        {
          label: '🥢 신선한 야채와 쌈을 올리는 한입 근접 슬로우 모션 연출',
          prompt: `Extreme close up shot of a hand assembling a perfect Korean lettuce wrap (Ssam) with garlic, soybean paste, and juicy grilled meat, vibrant green herbs, shallow depth of field, appetizing macro photography`
        }
      ]);
    } finally {
      setIsAnalyzingConcepts(false);
    }
  };

  // Perform AI Image Generation
  const handleGenerateAiImage = async () => {
    if (!aiPrompt.trim()) {
      showToast('프롬프트를 입력해 주세요.', 'info');
      return;
    }
    setIsGeneratingAiImage(true);
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiPrompt,
          aspectRatio: '16:9'
        })
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        handleUpdateImageUrl(data.imageUrl);
        showToast('AI 이미지 생성 및 적용 성공!', 'success');
      } else {
        showToast(data.error || 'AI 이미지 생성에 실패했습니다.', 'error');
      }
    } catch (err: any) {
      showToast('이미지 생성 실패: ' + err.message, 'error');
    } finally {
      setIsGeneratingAiImage(false);
    }
  };

  // Perform Unsplash Search
  const handleSearchUnsplash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unsplashQuery.trim()) return;
    setIsSearchingUnsplash(true);
    try {
      const response = await fetch(`https://unsplash.com/napi/search/photos?query=${encodeURIComponent(unsplashQuery.trim())}&per_page=8`);
      if (response.ok) {
        const data = await response.json();
        const results = (data.results || []).map((img: any) => img.urls?.regular || img.urls?.small);
        setUnsplashResults(results);
        if (results.length === 0) {
          showToast('검색 결과가 없습니다. 다른 검색어를 입력해 주세요.', 'info');
        } else {
          showToast('Unsplash 무료 라이브러리 검색을 완료했습니다.', 'success');
        }
      } else {
        throw new Error();
      }
    } catch (err) {
      // Fallback
      setUnsplashResults([
        `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(unsplashQuery.trim())},food`,
        `https://images.unsplash.com/featured/800x600/?${encodeURIComponent(unsplashQuery.trim())},gourmet`,
        "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600",
        "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600",
        "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600",
        "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600"
      ]);
      showToast('Unsplash 매칭 데이터에서 실시간 조율을 진행합니다.', 'success');
    } finally {
      setIsSearchingUnsplash(false);
    }
  };

  // Preset gourmet images list
  const presetImages = [
    "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=600", // Pork BBQ
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600", // Lamb skewers
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600", // Pizza
    "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=600", // Sushi
    "https://images.unsplash.com/photo-1547928500-300185172443?q=80&w=600", // Hot pot
    "https://images.unsplash.com/photo-1511018556340-d16986a1c194?q=80&w=600", // Strawberry mochi
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=600", // Salt bread
    "https://images.unsplash.com/photo-1610444583731-9e828d1c4554?q=80&w=600"  // Hanok exterior
  ];

  // Call onSave function from parent
  const handleSaveAndExit = async () => {
    try {
      await onSave({
        editTitle,
        editBody,
        editRestaurant,
        editLocation,
        editImageUrl
      });
      onClose();
    } catch (e) {
      // Handled by parent
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex flex-col bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
      
      {/* 1. Modal Top Bar Control */}
      <div className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/10 border border-orange-500/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <h2 className="font-extrabold text-sm text-white flex items-center gap-2">
              <span>웹진 전용 초정밀 매거진 편집 스튜디오</span>
              <span className="text-[10px] bg-orange-500/15 text-orange-400 border border-orange-500/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                Full Premium Mode
              </span>
            </h2>
            <p className="text-[10px] text-slate-500">실제 독자 시점의 웹진 레이아웃을 보며 이미지를 클릭해 바로 교체하고 생성하세요.</p>
          </div>
        </div>

        {/* Action controllers */}
        <div className="flex items-center gap-3">
          {/* PC / Mobile layout toggles */}
          <div className="bg-slate-950 p-0.5 rounded-xl border border-slate-800 flex items-center">
            <button
              onClick={() => setDeviceMode('pc')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === 'pc' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>PC 뷰</span>
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                deviceMode === 'mobile' ? 'bg-slate-800 text-white shadow-xs' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>모바일 가독성 뷰</span>
            </button>
          </div>

          <div className="h-6 w-[1px] bg-slate-800" />

          {/* Edit toggle switch */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`px-3.5 py-1.5 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 border cursor-pointer ${
              isEditMode
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-slate-800 text-slate-200 border-slate-750 hover:bg-slate-700'
            }`}
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{isEditMode ? '수정 중 (클릭 편집 가능)' : '상세 미리보기 모드'}</span>
          </button>

          {/* Save / Close */}
          <button
            onClick={handleSaveAndExit}
            disabled={isSaving}
            className="px-4.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-850 disabled:text-slate-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-950/20 cursor-pointer transition-all shrink-0"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>데이터 보존 중...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>최종 저장 및 완료</span>
              </>
            )}
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-750"
            title="모달 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side: Real-time Gourmet Webzine Simulator Viewport */}
        <div className="flex-1 bg-slate-950 p-6 overflow-y-auto flex items-start justify-center">
          
          <div className={`transition-all duration-350 w-full flex justify-center ${
            deviceMode === 'mobile' ? 'py-4' : 'max-w-4xl'
          }`}>
            
            {/* 2-1. MOBILE FRAME SIMULATOR */}
            {deviceMode === 'mobile' ? (
              <div className="w-[365px] h-[720px] rounded-[50px] border-[12px] border-slate-900 bg-slate-950 shadow-2xl relative flex flex-col overflow-hidden ring-4 ring-slate-800/40">
                {/* Simulated Speaker Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-900 rounded-b-2xl z-40 flex items-center justify-center">
                  <div className="w-12 h-1 bg-slate-800 rounded-full" />
                </div>
                
                {/* Scrollable Container Inside Phone */}
                <div className="flex-1 overflow-y-auto scrollbar-none pt-6 pb-12 bg-slate-950 text-left">
                  {renderWebzineContent()}
                </div>

                {/* Simulated Home Bar */}
                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-750 rounded-full z-40" />
              </div>
            ) : (
              /* 2-2. DESKTOP/PC NATURAL PREVIEW CONTAINER */
              <div className="w-full bg-slate-900 border border-slate-800/75 rounded-3xl overflow-hidden shadow-2xl">
                {renderWebzineContent()}
              </div>
            )}
            
          </div>
        </div>

        {/* Right Side: Text & Data Control Workspace (Only if in edit mode) */}
        {isEditMode && (
          <div className="w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col justify-between shrink-0">
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-400 border-b border-slate-800 pb-3">
                <Shield className="w-4 h-4 text-orange-500" />
                <span>데이터 속성 인라인 변경 장치</span>
              </div>

              {/* Restaurant & Location */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">상호명</label>
                  <input
                    type="text"
                    value={editRestaurant}
                    onChange={(e) => setEditRestaurant(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
                <div className="space-y-1.5 text-left">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">지역/위치</label>
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs font-bold text-white focus:outline-hidden focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Interactive Gourmet Title */}
              <div className="space-y-1.5 text-left">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">웹진 헤드라인 타이틀</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={type === 'sns'}
                  className="w-full px-3 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-black text-white focus:outline-hidden focus:border-orange-500"
                />
              </div>

              {/* Main Text & Block Workspace (Highly Advanced Visual/Raw Toggle) */}
              <div className="space-y-3 text-left flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                    본문 에디터 제어판
                  </label>
                  <span className="text-[9px] text-slate-600 font-mono">
                    ({editBody.length}자)
                  </span>
                </div>

                {type === 'blog' && (
                  <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center justify-between shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditTab('visual')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        editTab === 'visual' ? 'bg-orange-600 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>비주얼 블록 편집기</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditTab('raw')}
                      className={`flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        editTab === 'raw' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      <span>원문 마크다운 에디터</span>
                    </button>
                  </div>
                )}

                {type === 'blog' && editTab === 'visual' ? (
                  /* 1. VISUAL BLOCK EDITOR LIST */
                  <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                    {blocks.map((block, blockIdx) => {
                      if (block.type === 'text') {
                        return (
                          <div key={blockIdx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1.5 text-left">
                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">📝 본문 텍스트 단락</span>
                            <textarea
                              value={block.content}
                              onChange={(e) => handleUpdateBlockText(blockIdx, e.target.value)}
                              rows={Math.max(3, Math.min(10, Math.floor(block.content.length / 45)))}
                              className="w-full bg-transparent text-[11px] text-slate-200 border-none p-0 focus:outline-hidden focus:ring-0 leading-relaxed resize-y font-medium"
                              placeholder="여기에 텍스트 내용을 입력하세요..."
                            />
                          </div>
                        );
                      } else {
                        return (
                          <div key={blockIdx} className="bg-slate-950 p-3.5 rounded-xl border border-orange-500/20 space-y-3 text-left relative overflow-hidden">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                              <span className="text-[8.5px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-1">
                                <ImageIcon className="w-3 h-3 text-orange-500" />
                                <span>본문 사진 #{block.index! + 1}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSwapperTarget({
                                    targetType: 'inline',
                                    inlineIndex: block.index
                                  });
                                  setCustomUrlInput(block.url || '');
                                }}
                                className="px-2 py-1 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-black rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-md shadow-orange-950/20"
                              >
                                <RefreshCw className="w-2.5 h-2.5" />
                                <span>사진 교체/AI 생성</span>
                              </button>
                            </div>
                            
                            {/* Embedded Visual Block Preview */}
                            <div className="flex gap-3">
                              <div className="w-20 h-14 rounded-lg bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                                <img
                                  src={block.url || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200'}
                                  className="w-full h-full object-cover"
                                  alt="Editor block preview"
                                  referrerPolicy="no-referrer"
                                  onError={handleImageLoadError}
                                />
                              </div>
                              <div className="flex-1 space-y-1.5 text-left min-w-0">
                                <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">사진 보조 캡션 (Alt)</label>
                                <input
                                  type="text"
                                  value={block.alt || ''}
                                  onChange={(e) => {
                                    const newAlt = e.target.value;
                                    const updatedBlocks = blocks.map((b, idx) => {
                                      if (idx === blockIdx) {
                                        return { ...b, alt: newAlt };
                                      }
                                      return b;
                                    });
                                    const reconstructed = updatedBlocks.map(b => {
                                      if (b.type === 'image') {
                                        return `![${b.alt || '맛집 사진'}](${b.url})`;
                                      }
                                      return b.content;
                                    }).join('');
                                    setEditBody(reconstructed);
                                  }}
                                  className="w-full px-2 py-1.5 bg-slate-900 rounded-lg border border-slate-850 text-[10px] text-white focus:outline-hidden font-bold"
                                  placeholder="사진 아래에 들어갈 설명 캡션..."
                                />
                                <div className="text-[8px] text-slate-500 truncate font-mono">
                                  {block.url}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  /* 2. RAW MARKDOWN OR JSON EDITOR TEXTAREA */
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={14}
                    className="w-full px-3.5 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] leading-relaxed font-semibold focus:outline-hidden focus:border-orange-500 text-slate-300 font-mono"
                    placeholder="본문 내용을 마크다운 포맷으로 입력하세요..."
                  />
                )}
              </div>

              {/* Editing Instruction Guide */}
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-[10px] text-slate-500 leading-normal space-y-1 text-left">
                <p className="font-bold text-slate-400 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                  <span>스마트 매거진 편집 팁</span>
                </p>
                <p>• 왼쪽 웹진 시뮬레이터 속의 이미지(커버 및 본문 이미지)를 마우스로 클릭하면 실시간으로 사진을 교체하거나 AI 즉석 생성을 할 수 있습니다.</p>
                <p>• 본문 텍스트 내용을 우측 영역에서 바로 타이핑하면 왼쪽 가독성 시뮬레이터에 실시간 반영됩니다.</p>
              </div>

            </div>
            
            {/* Action Bar */}
            <div className="p-4 bg-slate-950 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-500 font-mono shrink-0">
              <span>수정 상태 동시 동기화 완료</span>
              <span>v1.5 Premium</span>
            </div>
          </div>
        )}

      </div>

      {/* 3. FLOATING POPUP OVERLAY: IMAGE SWAPPER STUDIO */}
      {activeSwapperTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in text-left">
          <div className="w-[480px] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            
            {/* Header */}
            <div className="px-4.5 py-3.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <span className="text-xs font-black text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-orange-500 animate-pulse" />
                <span>
                  {activeSwapperTarget.targetType === 'cover' ? '대표 커버 대표 사진 교체하기' : `본문 삽입 사진 #${activeSwapperTarget.inlineIndex! + 1} 교체하기`}
                </span>
              </span>
              <button
                onClick={() => setActiveSwapperTarget(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-850 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Tabs Header */}
            <div className="grid grid-cols-4 gap-0.5 bg-slate-950/80 p-1 border-b border-slate-800 text-xs">
              <button
                onClick={() => setSwapperTab('presets')}
                className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  swapperTab === 'presets' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                고급 템플릿
              </button>
              <button
                onClick={() => setSwapperTab('unsplash')}
                className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  swapperTab === 'unsplash' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                Unsplash 실시간
              </button>
              <button
                onClick={() => setSwapperTab('ai')}
                className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  swapperTab === 'ai' ? 'bg-slate-800 text-white shadow-md shadow-orange-950/20' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                🎨 AI 즉석 생성
              </button>
              <button
                onClick={() => setSwapperTab('url')}
                className={`py-2 text-[10px] font-black rounded-lg transition-all cursor-pointer ${
                  swapperTab === 'url' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                공용 이미지 보관함
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-5 flex-1 overflow-y-auto max-h-[380px] space-y-4">
              
              {/* TAB 1: PRESETS */}
              {swapperTab === 'presets' && (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-bold">인기 프리미엄 맛집 전용 고화질 카테고리 프리셋</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {presetImages.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => handleUpdateImageUrl(url)}
                        className="relative aspect-video h-12 w-full rounded-lg overflow-hidden border-2 border-slate-800 hover:border-orange-500 hover:scale-105 transition-all cursor-pointer"
                      >
                        <img src={url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: UNSPLASH */}
              {swapperTab === 'unsplash' && (
                <div className="space-y-3">
                  <form onSubmit={handleSearchUnsplash} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="예: 삼겹살, 소금빵, sushi, cafe..."
                      value={unsplashQuery}
                      onChange={(e) => setUnsplashQuery(e.target.value)}
                      className="flex-1 px-3 py-2 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white focus:outline-hidden"
                    />
                    <button
                      type="submit"
                      disabled={isSearchingUnsplash}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      {isSearchingUnsplash ? '검색중...' : '검색'}
                    </button>
                  </form>

                  <div className="grid grid-cols-4 gap-2.5 max-h-[160px] overflow-y-auto pt-1">
                    {unsplashResults.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => handleUpdateImageUrl(url)}
                        className="relative aspect-video h-12 w-full rounded-lg overflow-hidden border-2 border-slate-800 hover:border-orange-500 hover:scale-105 transition-all cursor-pointer"
                      >
                        <img src={url} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: AI GENERATION & SUGGESTIONS */}
              {swapperTab === 'ai' && (
                <div className="space-y-4">
                  
                  {/* AI Visual Concepts Recommendations Panel */}
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                        <span>AI 비주얼 프롬프트 컨셉 추천 (초고도화)</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleAnalyzeConcepts}
                        disabled={isAnalyzingConcepts}
                        className="px-2.5 py-1 text-[9px] bg-orange-600 hover:bg-orange-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      >
                        {isAnalyzingConcepts ? (
                          <>
                            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                            <span>분석 중...</span>
                          </>
                        ) : (
                          <span>🧠 AI 컨셉 분석 실행</span>
                        )}
                      </button>
                    </div>

                    {aiConcepts.length === 0 ? (
                      <p className="text-[9px] text-slate-500 leading-normal">
                        위 버튼을 누르시면 제미나이 AI가 현재 원고 텍스트를 정밀 스캔하여 딱 알맞은 시각 컨셉 프롬프트 3가지를 정밀 추천합니다.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-[140px] overflow-y-auto pt-0.5">
                        {aiConcepts.map((concept, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setAiPrompt(concept.prompt);
                              showToast('추천 컨셉 프롬프트가 적용되었습니다!', 'info');
                            }}
                            className="w-full text-left p-2 bg-slate-900 border border-slate-800 hover:border-amber-500 hover:bg-slate-850 rounded-lg text-[10px] leading-relaxed transition-all cursor-pointer text-slate-300 block"
                          >
                            <p className="font-extrabold text-amber-400 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              {concept.label}
                            </p>
                            <p className="text-[8px] text-slate-500 truncate mt-0.5 font-mono">{concept.prompt}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Manual Prompt Input */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Imagen 3.0 / Gemini AI 이미지 생성 프롬프트</label>
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[10px] text-white focus:outline-hidden font-mono leading-relaxed"
                      placeholder="생성하고 싶은 음식 사진을 구체적인 영어 묘사로 채워주세요..."
                    />
                  </div>

                  <button
                    onClick={handleGenerateAiImage}
                    disabled={isGeneratingAiImage}
                    className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500"
                  >
                    {isGeneratingAiImage ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>AI 대표 이미지 고화질 즉석 생성 중... (10~15초 소요)</span>
                      </>
                    ) : (
                      <>
                        <span>🎨 AI 대표 이미지 즉석 생성 및 적용</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* TAB 4: PUBLIC IMAGE GALLERY & CUSTOM URL */}
              {swapperTab === 'url' && (
                <div className="space-y-4">
                  
                  {/* Public Image Library List */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      👥 실시간 공용 이미지 보관함 ({sharedAssets.length}개)
                    </label>
                    
                    {sharedAssets.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950 text-center text-slate-500 border border-slate-850">
                        <p className="text-[10px]">아직 생성되거나 저장된 공용 이미지가 존재하지 않습니다.</p>
                        <p className="text-[8px] text-slate-600 mt-1">AI 즉석 생성을 수행하면 공용 보관함에 자동 등록됩니다.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-2.5 max-h-[180px] overflow-y-auto pr-1.5 pt-0.5">
                        {sharedAssets.map((asset) => {
                          const isBase64 = asset.imageContent && asset.imageContent.startsWith('data:');
                          const imgSrc = isBase64 ? asset.imageContent : asset.imageContent;
                          return (
                            <button
                              key={asset.id}
                              type="button"
                              onClick={() => {
                                if (asset.imageContent) {
                                  handleUpdateImageUrl(asset.imageContent);
                                }
                              }}
                              className="relative aspect-video w-full rounded-lg overflow-hidden border border-slate-800 hover:border-orange-500 hover:scale-105 transition-all group cursor-pointer"
                              title={asset.searchKeyword || '공용 이미지'}
                            >
                              <img 
                                src={imgSrc} 
                                className="w-full h-full object-cover" 
                                alt={asset.searchKeyword || '공용 이미지'}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.src = "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=200";
                                }}
                              />
                              {asset.searchKeyword && (
                                <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-1 py-0.5 text-[8px] text-slate-300 truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  {asset.searchKeyword}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-800"></div>
                    <span className="flex-shrink mx-3 text-[9px] text-slate-600 font-bold">또는 직접 주소 입력</span>
                    <div className="flex-grow border-t border-slate-800"></div>
                  </div>

                  {/* Original Custom URL Fallback */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">인터넷 이미지 주소 (HTTP URL)</label>
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/photo-..."
                        value={customUrlInput}
                        onChange={(e) => setCustomUrlInput(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs text-white focus:outline-hidden font-mono"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (customUrlInput.trim()) {
                          handleUpdateImageUrl(customUrlInput.trim());
                        }
                      }}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white text-xs font-bold rounded-xl cursor-pointer"
                    >
                      적용하기
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );

  // Helper render to generate full high-fidelity gourmet webzine layout inside responsive simulator
  function renderWebzineContent() {
    if (type === 'sns') {
      return (
        <div className="p-8 text-slate-300 space-y-6">
          <div className="border-b border-slate-800 pb-4 text-center">
            <span className="px-3 py-1 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 text-[9px] font-bold">
              SNS 카드 데이터 팩
            </span>
            <h3 className="text-lg font-black text-white mt-2.5">{editRestaurant || 'SNS 카드 전용'}</h3>
            {editLocation && <p className="text-xs text-slate-500 mt-1">{editLocation}</p>}
          </div>

          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 font-mono text-[10px] leading-relaxed max-h-[350px] overflow-y-auto">
            <pre className="text-emerald-400 whitespace-pre-wrap">{editBody}</pre>
          </div>
        </div>
      );
    }

    if (type === 'shorts') {
      return (
        <div className="p-8 text-slate-300 space-y-6">
          <div className="border-b border-slate-800 pb-4 text-center">
            <span className="px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-bold">
              9:16 유튜브 쇼츠 대본
            </span>
            <h3 className="text-lg font-black text-white mt-2.5">{editTitle || '쇼츠 대본'}</h3>
            {editRestaurant && <p className="text-xs text-slate-500 mt-1">{editRestaurant} • {editLocation}</p>}
          </div>

          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-850 leading-relaxed space-y-4">
            <p className="text-xs font-bold text-slate-400 border-b border-slate-850 pb-2">유튜브 본문 소개/해시태그 원고</p>
            <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">{editBody}</p>
          </div>
        </div>
      );
    }

    // Default: 'blog' Gourmet Webzine layout
    const isMobile = deviceMode === 'mobile';

    return (
      <div className="text-left bg-slate-950">
        
        {/* 1. Large Gorgeous Hero Banner (Editable with Cover-Image) */}
        <div className={`relative w-full bg-slate-950 overflow-hidden group ${
          isMobile ? 'h-[170px]' : 'h-[280px] sm:h-[350px]'
        }`}>
          <img
            src={editImageUrl || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800'}
            alt="Hero thumbnail"
            className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-102"
            referrerPolicy="no-referrer"
            onError={handleImageLoadError}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          {/* Permanent Visible Floating Edit Badge (100% intuitive visual guide) */}
          {isEditMode && (
            <button
              onClick={() => {
                setActiveSwapperTarget({ targetType: 'cover' });
                setCustomUrlInput(editImageUrl);
              }}
              className={`absolute top-3 right-3 z-35 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-xl flex items-center shadow-lg cursor-pointer transition-all ${
                isMobile ? 'px-2 py-1 text-[9px] gap-1' : 'px-3.5 py-2 text-xs gap-1.5'
              }`}
            >
              <ImageIcon className={isMobile ? 'w-3 h-3' : 'w-4 h-4'} />
              <span>📸 이미지 교체 (AI 생성)</span>
            </button>
          )}

          {/* Title tag details */}
          <div className={`absolute left-4 right-4 ${
            isMobile ? 'bottom-3 space-y-1' : 'bottom-6 left-6 right-6 space-y-2'
          }`}>
            <span className={`font-black uppercase tracking-wider bg-orange-600 text-white rounded-full ${
              isMobile ? 'px-2 py-0.5 text-[7px]' : 'px-3.5 py-1 text-[9px]'
            }`}>
              Premium Gourmet Webzine
            </span>
            <h1 className={`font-black text-white drop-shadow-md leading-snug ${
              isMobile ? 'text-xs sm:text-sm' : 'text-xl sm:text-2xl'
            }`}>
              {editTitle || '선정된 헤드라인 제목이 여기에 노출됩니다'}
            </h1>
          </div>
        </div>

        {/* 2. Metadata gourmet details panel */}
        <div className={`border-b border-slate-900 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2.5 ${
          isMobile ? 'px-4 py-2.5' : 'px-6 py-4'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-orange-400 font-extrabold ${
              isMobile ? 'text-[10px]' : 'text-xs'
            }`}>
              <MapPin className={isMobile ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
              <span>{editRestaurant || '식당 상호명'}</span>
            </div>
            {editLocation && (
              <span className={`text-slate-500 font-semibold ${
                isMobile ? 'text-[9px]' : 'text-[11px]'
              }`}>{editLocation}</span>
            )}
          </div>
          
          <div className={`text-slate-500 font-mono ${
            isMobile ? 'text-[8px] flex gap-1' : 'text-[10px] flex gap-2'
          }`}>
            <span>작성자: 파워 카피라이터</span>
            <span>|</span>
            <span>오늘 작성</span>
          </div>
        </div>

        {/* 3. Article Body blocks parser */}
        <div className={`text-slate-300 leading-relaxed font-medium ${
          isMobile ? 'px-4 py-4 space-y-4 text-[10.5px]' : 'px-6 py-8 space-y-6 text-xs sm:text-sm'
        }`}>
          {blocks.map((block, i) => {
            if (block.type === 'text') {
              // Format simple paragraphs nicely
              return (
                <div key={i} className={`whitespace-pre-wrap leading-relaxed prose prose-invert font-semibold text-slate-300 ${
                  isMobile ? 'text-[10.5px] leading-relaxed' : 'text-xs sm:text-sm leading-relaxed'
                }`}>
                  {block.content}
                </div>
              );
            } else {
              // Image block with permanent visible replacement badge in edit mode
              return (
                <div key={i} className={`relative group rounded-2xl overflow-hidden border border-slate-900 mx-auto ${
                  isMobile ? 'my-3 max-w-[280px]' : 'my-6 max-w-lg'
                }`}>
                  <img
                    src={block.url || 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=400'}
                    alt={block.alt || 'Gourmet Photo'}
                    className="w-full h-auto object-cover opacity-90"
                    referrerPolicy="no-referrer"
                    onError={handleImageLoadError}
                  />
                  {block.alt && (
                    <div className={`bg-slate-900/60 text-center text-slate-400 font-bold italic ${
                      isMobile ? 'p-1.5 text-[8.5px]' : 'p-3 text-[10px]'
                    }`}>
                      ▲ {block.alt}
                    </div>
                  )}

                  {/* Permanent visible image-edit action on top of the image (No hover requirement) */}
                  {isEditMode && (
                    <button
                      onClick={() => {
                        setActiveSwapperTarget({
                          targetType: 'inline',
                          inlineIndex: block.index
                        });
                        setCustomUrlInput(block.url || '');
                      }}
                      className={`absolute top-2.5 right-2.5 z-25 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-lg flex items-center shadow-md cursor-pointer transition-all ${
                        isMobile ? 'px-2 py-1 text-[8.5px] gap-1' : 'px-2.5 py-1.5 text-xs gap-1'
                      }`}
                    >
                      <ImageIcon className={isMobile ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
                      <span>📸 사진 교체</span>
                    </button>
                  )}
                </div>
              );
            }
          })}
        </div>

      </div>
    );
  }
}
