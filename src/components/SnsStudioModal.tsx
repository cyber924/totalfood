import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Instagram,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Send,
  MessageSquare,
  Video,
  Music,
  Flame,
  AlertCircle,
  Smartphone,
  Eye,
  Layers,
  Wand2,
  Camera,
} from 'lucide-react';
import { SnsGeneratedResult, SnsShortsScene, GeneratedSnsRecord } from '../types';
import { useAuth } from '../context/AuthContext';
import { saveSnsToFirestoreDirectly } from '../services/snsService';

interface SnsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    id?: string;
    restaurantName?: string;
    location?: string;
    menuItems?: string;
    features?: string;
    isSavedRecord?: boolean;
    selectedPlatforms?: string[];
    data?: SnsGeneratedResult;
  } | null;
  onSaveSns?: (record: GeneratedSnsRecord) => Promise<void>;
  savedSnsIds?: string[];
}

// Custom X (Twitter) Icon Component
const XIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const RESTAURANT_RECOMMENDATIONS = [
  {
    name: '성수 헤이즈 다이닝 (HEIZE DINING)',
    location: '서울 성동구 연무장길 (성수역 3번 출구 150m)',
    menu: '우드파이어 한우 채끝 스테이크, 트러플 크림 파스타, 무화과 부라타 샐러드',
    features: '성수동 골목 가을 낙엽 감성 테라스 테마, 숯불과 참나무 장작의 스모키한 참맛 그릴 하우스, 네이버 예약 필수 핫플'
  },
  {
    name: '합정 화덕 피제리아 다 카포',
    location: '서울 마포구 합정동 (합정역 7번 출구 300m)',
    menu: '디아볼라 콘 부팔라 화덕피자, 바질페스토 수제 뇨끼, 시칠리아식 가리비 관자 구이',
    features: '나폴리 챔피언 출신 셰프의 485도 초고온 참나무 참숯 화덕, 겉바속촉 에어 버블 도우의 쫄깃함, 야외 골목 테라스 와인 바'
  },
  {
    name: '연남동 킷사텐 은하수',
    location: '서울 마포구 성미산로 (홍대입구역 3번 출구 500m)',
    menu: '클래식 수제 탱글 커스터드 푸딩, 메론 소다 에이드, 에그 가츠 산도',
    features: '70년대 도쿄 골목 킷사텐 레트로 감성을 완벽 재현한 우드톤 힐링 카페, LP판 클래식 재즈 감성, 인스타 사진 맛집 대표 주자'
  },
  {
    name: '을지로 원조 알곤이 야장 칼국수',
    location: '서울 중구 을지로3가 (을지로3가역 11번 출구 노포 골목)',
    menu: '얼큰 알곤이 가득 칼국수, 노릇노릇 해물 미나리 파전, 불향 가득 꼬막 비빔밥',
    features: '힙지로 감성의 탁 트인 야장 골목, 매일 새벽 공수한 신선하고 통통한 명란 알과 고니, 칼칼한 특제 육수와 수제 면발'
  },
  {
    name: '제주 애월 한담 숯불 흑돼지',
    location: '제주 애월읍 애월해안로 (한담해변 도보 3분)',
    menu: '360시간 볏짚 초벌 흑돼지 숄더랙, 멜젓 뚝배기 볶음밥, 딱새우 된장찌개',
    features: '애월 한담 해변 바다 전망의 오션뷰 그릴 다이닝, 육즙이 터져 나오는 3센티 두께의 프리미엄 흑돼지 구이, 직원 전담 그릴링 서비스'
  },
  {
    name: '청담 심야 일식 오마카세 스시 이치로',
    location: '서울 강남구 압구정로 (압구정로데오역 4번 출구 400m)',
    menu: '디너 사시미 & 스시 오마카세 코스, 성게알 단새우 마끼, 수제 유자 샤베트',
    features: '소수 예약제로 운영되는 프라이빗 프렌치 일식 터치 바, 노량진 새벽 경매 극비 A급 참치와 우니 사용, 격조 높은 골드 인테리어'
  },
  {
    name: '여의도 더현대 옥수수 치즈번 베이커리',
    location: '서울 영등포구 여의대로 (더현대서울 지하 1층 델리존)',
    menu: '초당 옥수수 크림 치즈번, 피스타치오 가나슈 크루아상, 솔티드 카라멜 베이글',
    features: '오픈 시간부터 줄 서서 사는 웨이팅 필수 트렌디 베이커리, 입안 가득 팡 터지는 고소하고 달콤한 초당 옥수수 알갱이 원물 가득'
  },
  {
    name: '익선동 고즈넉한 한옥 솥밥 정식',
    location: '서울 종로구 삼일대로 (종로3가역 4번 출구 한옥마을 초입)',
    menu: '완도 전복 내장 솥밥 정식, 영양 단호박 한우 갈비찜, 수제 식혜 에이드',
    features: '100년 전통 한옥 중정을 개조한 고즈넉한 정원 테마 한식집, 1인 정갈한 우드 쟁반 트레이 한상 차림, 부모님 모시기 좋은 데이트 맛집'
  }
];

export const SnsStudioModal: React.FC<SnsStudioModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSaveSns,
  savedSnsIds = [],
}) => {
  // Input states
  const [restaurantName, setRestaurantName] = useState('소문난 성수 감자탕');
  const [location, setLocation] = useState('서울 성수동');
  const [menuItems, setMenuItems] = useState('감자탕, 볶음밥');
  const [features, setFeatures] = useState('2시간 웨이팅, 부드러운 살코기, 진한 육수');
  const [lastRecommendIndex, setLastRecommendIndex] = useState(-1);

  const handleRandomizeInput = () => {
    let nextIndex = Math.floor(Math.random() * RESTAURANT_RECOMMENDATIONS.length);
    if (nextIndex === lastRecommendIndex) {
      nextIndex = (nextIndex + 1) % RESTAURANT_RECOMMENDATIONS.length;
    }
    setLastRecommendIndex(nextIndex);
    const chosen = RESTAURANT_RECOMMENDATIONS[nextIndex];
    setRestaurantName(chosen.name);
    setLocation(chosen.location);
    setMenuItems(chosen.menu);
    setFeatures(chosen.features);
  };
  
  // Platform selection states
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    'instagram',
    'twitter',
    'threads',
    'tiktok',
    'shorts',
  ]);

  // Generation states
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [snsResult, setSnsResult] = useState<SnsGeneratedResult | null>(null);
  const [currentSnsId, setCurrentSnsId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);

  // New Dynamic Premium Custom Images
  const [instagramImageUrl, setInstagramImageUrl] = useState<string>('');
  const [tiktokImageUrl, setTiktokImageUrl] = useState<string>('');
  const [shortsImageUrl, setShortsImageUrl] = useState<string>('');

  const { user } = useAuth();

  const saveCurrentSnsToFirestore = async (
    updatedInstagram?: string,
    updatedTiktok?: string,
    updatedShorts?: string,
    updatedResultSns?: SnsGeneratedResult
  ) => {
    if (!user || !currentSnsId) return;

    const record: GeneratedSnsRecord = {
      id: currentSnsId,
      createdAt: new Date().toISOString(),
      restaurantName,
      location,
      menuItems,
      features,
      selectedPlatforms,
      data: {
        ...(updatedResultSns || snsResult),
        instagramImageUrl: updatedInstagram !== undefined ? updatedInstagram : instagramImageUrl,
        tiktokImageUrl: updatedTiktok !== undefined ? updatedTiktok : tiktokImageUrl,
        shortsImageUrl: updatedShorts !== undefined ? updatedShorts : shortsImageUrl,
      } as any,
    };

    try {
      await saveSnsToFirestoreDirectly(user.uid, record);
    } catch (e) {
      console.error('Failed to save SNS to Firestore directly:', e);
    }
  };

  const [isGeneratingInsta, setIsGeneratingInsta] = useState(false);
  const [isEnhancingInstaPrompt, setIsEnhancingInstaPrompt] = useState(false);
  const [isGeneratingTiktok, setIsGeneratingTiktok] = useState(false);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimeoutRef = React.useRef<any>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync initial data
  useEffect(() => {
    if (initialData && isOpen) {
      setRestaurantName(initialData.restaurantName || '');
      setLocation(initialData.location || '');
      setMenuItems(initialData.menuItems || '');
      setFeatures(initialData.features || '');
      
      if (initialData.isSavedRecord && initialData.data) {
        setSnsResult(initialData.data);
        setCurrentSnsId(initialData.id || null);
        setSelectedPlatforms(initialData.selectedPlatforms || ['instagram', 'twitter', 'threads', 'tiktok', 'shorts']);
        
        const d = initialData.data as any;
        setInstagramImageUrl(d.instagramImageUrl || '');
        setTiktokImageUrl(d.tiktokImageUrl || '');
        setShortsImageUrl(d.shortsImageUrl || '');
      } else {
        setSnsResult(null);
        setCurrentSnsId(null);
        setInstagramImageUrl('');
        setTiktokImageUrl('');
        setShortsImageUrl('');
      }
      
      setActiveTab('all');
    }
  }, [initialData, isOpen]);

  const isSnsSaved = currentSnsId ? savedSnsIds.includes(currentSnsId) : false;

  if (!isOpen) return null;

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      if (selectedPlatforms.length > 1) {
        setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
      }
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    
    // Save previous custom images to restore if they exist
    const prevInstagram = instagramImageUrl;
    const prevTiktok = tiktokImageUrl;
    const prevShorts = shortsImageUrl;

    setSnsResult(null);
    setInstagramImageUrl('');
    setTiktokImageUrl('');
    setShortsImageUrl('');

    try {
      const response = await fetch('/api/generate-sns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          restaurantName,
          location,
          menuItems,
          features,
          selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'SNS 홍보물 생성에 실패했습니다.');
      }

      setSnsResult(data.data);
      setCurrentSnsId('sns_' + Date.now());
      setActiveTab('all');

      // 1. Preserve or Auto-generate Instagram image
      if (prevInstagram) {
        setInstagramImageUrl(prevInstagram);
      } else {
        const instaIdea = data.data.instagram?.imageIdea || `${restaurantName} ${menuItems} gourmet dish`;
        try {
          const imgResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `appetizing premium food photography of ${instaIdea}, glowing warm commercial charcoal grill lighting, highly detailed texture, professional styling, vertical or square 1:1 format`,
              aspectRatio: '1:1',
            }),
          });
          const imgData = await imgResponse.json();
          if (imgData.success && imgData.imageUrl) {
            setInstagramImageUrl(imgData.imageUrl);
          }
        } catch (err) {
          console.warn('Auto-generation for Instagram image failed:', err);
        }
      }

      // 2. Preserve or Auto-generate TikTok/Shorts image
      if (prevTiktok) {
        setTiktokImageUrl(prevTiktok);
        setShortsImageUrl(prevShorts || prevTiktok);
      } else {
        const tiktokIdea = data.data.tiktok?.videoConcept || `${restaurantName} ${menuItems} cooking premium video`;
        try {
          const imgResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: `cinematic appetizing professional vertical food advertising shot of ${tiktokIdea}, detailed texture, warm steam, 9:16 format, 8k, appetizing lighting`,
              aspectRatio: '9:16',
            }),
          });
          const imgData = await imgResponse.json();
          if (imgData.success && imgData.imageUrl) {
            setTiktokImageUrl(imgData.imageUrl);
            setShortsImageUrl(imgData.imageUrl);
          }
        } catch (err) {
          console.warn('Auto-generation for TikTok/Shorts image failed:', err);
        }
      }

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'AI 홍보물 생성 도중 서버 에러가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateInstaImage = async (customPrompt?: string) => {
    if (!snsResult) return;
    setIsGeneratingInsta(true);
    try {
      const promptToUse = customPrompt || snsResult.instagram?.imageIdea || `${restaurantName} ${menuItems}`;
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `appetizing premium food photography of ${promptToUse}, glowing warm commercial charcoal grill lighting, highly detailed texture, professional styling, vertical or square 1:1 format`,
          aspectRatio: '1:1',
        }),
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        setInstagramImageUrl(data.imageUrl);
        showToast('인스타그램 커스텀 AI 피드 이미지가 생성되었습니다!', 'success');
        if (user && currentSnsId) {
          await saveCurrentSnsToFirestore(data.imageUrl);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('인스타그램 이미지 생성 실패', 'error');
    } finally {
      setIsGeneratingInsta(false);
    }
  };

  const handleEnhanceInstaPrompt = async () => {
    if (!snsResult?.instagram) return;
    setIsEnhancingInstaPrompt(true);
    try {
      const originalIdea = snsResult.instagram.imageIdea;
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: originalIdea }),
      });
      const data = await response.json();
      if (data.success && data.enhancedPrompt) {
        const updatedResult = {
          ...snsResult,
          instagram: {
            ...snsResult.instagram,
            imageIdea: data.enhancedPrompt,
          }
        };
        setSnsResult(updatedResult);
        showToast('인스타그램 프롬프트 요술봉 보정 완료!', 'success');
        await handleGenerateInstaImage(data.enhancedPrompt);
      }
    } catch (e) {
      console.error(e);
      showToast('요술봉 프롬프트 보정 실패', 'error');
    } finally {
      setIsEnhancingInstaPrompt(false);
    }
  };

  const handleGenerateTiktokImage = async () => {
    if (!snsResult) return;
    setIsGeneratingTiktok(true);
    try {
      const promptToUse = snsResult.tiktok?.videoConcept || `${restaurantName} ${menuItems}`;
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `cinematic appetizing professional vertical food advertising shot of ${promptToUse}, detailed texture, warm steam, 9:16 format, 8k, appetizing lighting`,
          aspectRatio: '9:16',
        }),
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        setTiktokImageUrl(data.imageUrl);
        setShortsImageUrl(data.imageUrl);
        showToast('틱톡/쇼츠 세로 비주얼 이미지가 생성되었습니다!', 'success');
        if (user && currentSnsId) {
          await saveCurrentSnsToFirestore(undefined, data.imageUrl, data.imageUrl);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('동영상 프레임 이미지 생성 실패', 'error');
    } finally {
      setIsGeneratingTiktok(false);
    }
  };

  const handleSaveSns = async () => {
    if (!snsResult || !onSaveSns) return;
    const recordId = currentSnsId || 'sns_' + Date.now();
    if (!currentSnsId) {
      setCurrentSnsId(recordId);
    }
    const record: GeneratedSnsRecord = {
      id: recordId,
      createdAt: new Date().toISOString(),
      restaurantName,
      location,
      menuItems,
      features,
      selectedPlatforms,
      data: {
        ...snsResult,
        instagramImageUrl,
        tiktokImageUrl,
        shortsImageUrl,
      } as any,
    };

    if (user) {
      try {
        await saveSnsToFirestoreDirectly(user.uid, record);
        showToast('보관함에 SNS 대본 및 매칭 비주얼 저장 완료 (DB 즉시 동기화)!', 'success');
      } catch (e) {
        console.warn('Failed to save SNS to Firestore:', e);
        await onSaveSns(record);
      }
    } else {
      await onSaveSns(record);
    }
  };

  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPlatform(platform);
    setTimeout(() => setCopiedPlatform(null), 2000);
  };

  // Curated Unsplash images for realistic feed visuals
  const getRandomFoodImage = (idx: number) => {
    const images = [
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&h=600&q=80",
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&h=600&q=80",
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=600&h=600&q=80",
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&h=600&q=80",
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=600&h=600&q=80"
    ];
    return images[idx % images.length];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="sns-studio-modal"
        className="bg-slate-50 rounded-3xl border border-slate-200 w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-pink-600 to-red-500 flex items-center justify-center text-white shadow-md">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <span>맛집 5대 SNS 멀티 생성기</span>
                <span className="text-[10px] bg-red-100 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200">
                  HOT
                </span>
              </h2>
              <p className="text-xs text-slate-500">인스타, X, 스레드, 틱톡, 쇼츠에 적합한 피드 카드 자동 제작</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          {/* Left Panel: Inputs & Selection */}
          <div className="w-full md:w-5/12 bg-white border-r border-slate-200 p-6 space-y-6 overflow-y-auto">
            {/* 1. Restaurant Info Form */}
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-3.5 bg-orange-500 rounded-xs inline-block"></span>
                  맛집 정보 입력
                </h3>
                <button
                  type="button"
                  onClick={handleRandomizeInput}
                  className="text-[11px] font-black text-orange-600 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg border border-orange-200 transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-orange-500 animate-pulse" />
                  <span>새 추천 맛집 🔄</span>
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">맛집 이름 *</label>
                  <input
                    type="text"
                    value={restaurantName}
                    onChange={(e) => setRestaurantName(e.target.value)}
                    placeholder="예: 소문난 성수 감자탕"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">위치/지역</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="예: 서울 성수동"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">주요 메뉴</label>
                  <input
                    type="text"
                    value={menuItems}
                    onChange={(e) => setMenuItems(e.target.value)}
                    placeholder="예: 우거지 감자탕, 볶음밥"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">식당 특징 및 매력 포인트</label>
                  <textarea
                    rows={2}
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                    placeholder="예: 고기가 부드럽고 국물이 시원함. 24시간 영업, 웨이팅 필수"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-orange-500 transition-colors text-slate-800 font-medium resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 2. Platform Multi-Selector */}
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <span className="w-1.5 h-3.5 bg-violet-500 rounded-xs inline-block"></span>
                출력 대상 SNS 플랫폼 선택 (중복가능)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-2">
                {/* Instagram */}
                <button
                  onClick={() => togglePlatform('instagram')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPlatforms.includes('instagram')
                      ? 'border-pink-300 bg-pink-50/50 text-pink-900 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center">
                      <Instagram className="w-4 h-4" />
                    </div>
                    <span>인스타그램 (Instagram)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlatforms.includes('instagram') ? 'bg-pink-500 border-pink-500 text-white' : 'border-slate-300'
                  }`}>
                    {selectedPlatforms.includes('instagram') && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>

                {/* X (Twitter) */}
                <button
                  onClick={() => togglePlatform('twitter')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPlatforms.includes('twitter')
                      ? 'border-slate-900 bg-slate-900 text-white font-semibold shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 text-xs">
                    <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center ${
                      selectedPlatforms.includes('twitter') ? 'bg-slate-800' : 'bg-slate-900'
                    }`}>
                      <XIcon className="w-3.5 h-3.5" />
                    </div>
                    <span>X (구 트위터)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlatforms.includes('twitter') ? 'bg-white border-white text-slate-900' : 'border-slate-300'
                  }`}>
                    {selectedPlatforms.includes('twitter') && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>

                {/* Threads */}
                <button
                  onClick={() => togglePlatform('threads')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPlatforms.includes('threads')
                      ? 'border-emerald-300 bg-emerald-50/50 text-emerald-950 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <span>스레드 (Threads)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlatforms.includes('threads') ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                  }`}>
                    {selectedPlatforms.includes('threads') && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>

                {/* TikTok */}
                <button
                  onClick={() => togglePlatform('tiktok')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPlatforms.includes('tiktok')
                      ? 'border-cyan-300 bg-cyan-50/50 text-cyan-950 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-black text-white flex items-center justify-center">
                      <Music className="w-4 h-4" />
                    </div>
                    <span>틱톡 (TikTok)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlatforms.includes('tiktok') ? 'bg-black border-black text-white' : 'border-slate-300'
                  }`}>
                    {selectedPlatforms.includes('tiktok') && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>

                {/* YouTube Shorts */}
                <button
                  onClick={() => togglePlatform('shorts')}
                  className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedPlatforms.includes('shorts')
                      ? 'border-red-300 bg-red-50/50 text-red-950 font-semibold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 text-xs">
                    <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                    <span>유튜브 쇼츠 (Shorts)</span>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    selectedPlatforms.includes('shorts') ? 'bg-red-600 border-red-600 text-white' : 'border-slate-300'
                  }`}>
                    {selectedPlatforms.includes('shorts') && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Action Submit Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4.5 rounded-2xl bg-gradient-to-r from-violet-600 via-pink-600 to-red-500 hover:from-violet-700 hover:to-red-600 text-white font-black text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-98 disabled:opacity-50"
            >
              <Wand2 className={`w-5 h-5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'AI가 SNS 맞춤형 홍보글을 만드는 중...' : 'SNS 카드 대본 멀티 생성하기'}</span>
            </button>
          </div>

          {/* Right Panel: Results & Interactive Cards */}
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto flex flex-col space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold">생성 에러</p>
                  <p className="text-xs text-rose-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Generating Loader */}
            {isGenerating && (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-pink-500 to-violet-600 text-white flex items-center justify-center shadow-lg animate-spin">
                  <Sparkles className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-extrabold text-slate-800 text-lg">AI 멀티 SNS 포스팅 제작중</h4>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm">
                    인스타 감성, X 주접, 스레드 줄글, 틱톡 및 쇼츠 나레이션을 한 번에 구성하는 고품질 알고리즘을 수행 중입니다.
                  </p>
                </div>
              </div>
            )}

            {/* No Result State */}
            {!isGenerating && !snsResult && (
              <div className="flex-1 flex flex-col items-center justify-center py-24 text-center text-slate-400 space-y-3">
                <Smartphone className="w-16 h-16 text-slate-300 animate-bounce" />
                <div>
                  <h4 className="font-extrabold text-slate-700 text-base">맛집 정보가 비어있습니다</h4>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    왼쪽 패널에 맛집 상호와 특징을 적고 아래 생성 버튼을 누르면 인스타/X/스레드 등 맞춤형 카드 대본이 짜여집니다.
                  </p>
                </div>
              </div>
            )}

            {/* Generated Results Tab Menu */}
            {!isGenerating && snsResult && (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'all'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      모아보기 (Bento Grid)
                    </button>
                    {snsResult.instagram && (
                      <button
                        onClick={() => setActiveTab('instagram')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'instagram'
                            ? 'bg-pink-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Instagram
                      </button>
                    )}
                    {snsResult.twitter && (
                      <button
                        onClick={() => setActiveTab('twitter')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'twitter'
                            ? 'bg-slate-950 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        X (Twitter)
                      </button>
                    )}
                    {snsResult.threads && (
                      <button
                        onClick={() => setActiveTab('threads')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'threads'
                            ? 'bg-slate-800 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        Threads
                      </button>
                    )}
                    {snsResult.tiktok && (
                      <button
                        onClick={() => setActiveTab('tiktok')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'tiktok'
                            ? 'bg-cyan-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        TikTok
                      </button>
                    )}
                    {snsResult.shorts && (
                      <button
                        onClick={() => setActiveTab('shorts')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeTab === 'shorts'
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        YouTube Shorts
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSaveSns}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSnsSaved
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xs active:scale-95'
                      }`}
                    >
                      <Bookmark className={`w-3.5 h-3.5 ${isSnsSaved ? 'fill-emerald-600 text-emerald-600' : 'text-white'}`} />
                      <span>{isSnsSaved ? '보관함 저장 완료' : '보관함 저장'}</span>
                    </button>
                    <div className="hidden lg:flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                      <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      <span>원클릭 포스팅 복사 완료 기능 탑재</span>
                    </div>
                  </div>
                </div>

                {/* Grid Deck */}
                <div className={`grid gap-6 ${activeTab === 'all' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  
                  {/* INSTAGRAM CARD */}
                  {snsResult.instagram && (activeTab === 'all' || activeTab === 'instagram') && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-md max-w-lg mx-auto w-full">
                      {/* Insta Header */}
                      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 bg-white">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-red-500 to-purple-500 p-0.5">
                            <div className="w-full h-full bg-white rounded-full p-0.5">
                              <div className="w-full h-full bg-orange-100 rounded-full flex items-center justify-center font-extrabold text-[10px] text-orange-600">
                                MD
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-900 leading-none">taste_explorer_kr</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{location || "KOREA"}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(`${snsResult.instagram?.caption}\n\n${snsResult.instagram?.hashtags.join(' ')}`, 'instagram')}
                          className="px-2.5 py-1 rounded bg-pink-50 hover:bg-pink-100 text-pink-600 text-[11px] font-black transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedPlatform === 'instagram' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPlatform === 'instagram' ? '복사됨!' : '피드 복사'}</span>
                        </button>
                      </div>

                      {/* Insta Image Frame with Grilling Glow animation and controls */}
                      <div className="aspect-square relative bg-slate-950 flex items-center justify-center overflow-hidden group">
                        <img 
                          src={instagramImageUrl || getRandomFoodImage(0)} 
                          alt="Instagram Feed Content" 
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                          referrerPolicy="no-referrer"
                        />
                        
                        {/* Premium "지글지글" Active Grill Warmth Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/15 via-amber-500/5 to-transparent mix-blend-color-burn pointer-events-none animate-pulse duration-[3000ms]"></div>
                        
                        {/* Action Overlays */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-3 p-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleGenerateInstaImage()}
                              disabled={isGeneratingInsta}
                              className="p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                              title="AI 이미지 새로고침"
                            >
                              {isGeneratingInsta ? (
                                <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                              ) : (
                                <Camera className="w-4 h-4" />
                              )}
                              <span>AI 재합성</span>
                            </button>

                            <button
                              onClick={handleEnhanceInstaPrompt}
                              disabled={isEnhancingInstaPrompt}
                              className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                              title="Gemini AI 푸드 사진작가 프롬프트 보정"
                            >
                              {isEnhancingInstaPrompt ? (
                                <Sparkles className="w-4 h-4 animate-spin" />
                              ) : (
                                <Wand2 className="w-4 h-4" />
                              )}
                              <span>요술봉 보정</span>
                            </button>

                            {/* Manual Upload */}
                            <label className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-black text-xs flex items-center gap-1 shadow-md transition-all active:scale-95 cursor-pointer">
                              <Video className="w-4 h-4 text-emerald-400" />
                              <span>직접 업로드</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      if (typeof reader.result === 'string') {
                                        setInstagramImageUrl(reader.result);
                                        showToast('인스타그램 실제 매장 사진 업로드 완료!', 'success');
                                        if (user && currentSnsId) {
                                          await saveCurrentSnsToFirestore(reader.result);
                                        }
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="absolute top-3 right-3 bg-black/75 px-2.5 py-1 rounded-md text-[9px] text-white font-extrabold backdrop-blur-xs border border-white/10 flex items-center gap-1 shadow-sm">
                          <Sparkles className="w-3 h-3 text-amber-400 animate-bounce" />
                          <span>추천 구도: {snsResult.instagram.imageIdea}</span>
                        </div>
                      </div>

                      {/* Interactive Image Prompt Edit Field */}
                      <div className="p-3 bg-slate-50 border-y border-slate-100 flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">📸 이미지 프롬프트:</span>
                        <input
                          type="text"
                          value={snsResult.instagram.imageIdea}
                          onChange={(e) => {
                            const updated = {
                              ...snsResult,
                              instagram: {
                                ...snsResult.instagram,
                                imageIdea: e.target.value,
                              }
                            };
                            setSnsResult(updated);
                          }}
                          onBlur={async () => {
                            if (user && currentSnsId) {
                              await saveCurrentSnsToFirestore(undefined, undefined, undefined, snsResult);
                            }
                          }}
                          className="flex-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-[11px] font-medium focus:outline-none focus:border-orange-500 text-slate-800"
                        />
                        <button
                          onClick={() => handleGenerateInstaImage(snsResult.instagram?.imageIdea)}
                          className="px-2 py-1 rounded bg-orange-100 text-orange-700 text-[10px] font-bold hover:bg-orange-200 transition-colors cursor-pointer"
                        >
                          반영
                        </button>
                      </div>

                      {/* Insta Interactive Toolbar */}
                      <div className="p-4 space-y-3 bg-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-slate-700">
                            <Heart className="w-5.5 h-5.5 text-rose-500 fill-rose-500 cursor-pointer hover:scale-110 transition-transform" />
                            <MessageCircle className="w-5.5 h-5.5 cursor-pointer hover:scale-110 transition-transform" />
                            <Send className="w-5 h-5 cursor-pointer hover:scale-110 transition-transform" />
                          </div>
                          <Bookmark className="w-5.5 h-5.5 text-slate-700 cursor-pointer hover:scale-110 transition-transform" />
                        </div>

                        {/* Caption Text */}
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold text-slate-900">좋아요 1,284개</p>
                          <div className="text-xs text-slate-800 leading-relaxed space-y-1">
                            <span className="font-extrabold mr-1.5">taste_explorer_kr</span>
                            <div className="whitespace-pre-line text-slate-700 font-medium">
                              {snsResult.instagram.caption}
                            </div>
                          </div>
                          <div className="text-[11px] text-blue-600 font-bold whitespace-normal leading-relaxed">
                            {snsResult.instagram.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                          </div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">1시간 전 • 인스타그램 맛집 최적화</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* X (TWITTER) CARD */}
                  {snsResult.twitter && (activeTab === 'all' || activeTab === 'twitter') && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-md max-w-lg mx-auto w-full space-y-4">
                      {/* X Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-full bg-slate-900 flex items-center justify-center text-white text-[11px] font-black">
                            XT
                          </div>
                          <div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs font-extrabold text-slate-950">맛집지킴이_X</span>
                              <span className="text-[10px] bg-slate-100 text-slate-500 px-1 py-0.2 rounded font-bold">공식</span>
                            </div>
                            <span className="text-[10px] text-slate-500 leading-none">@taste_keeper_x</span>
                          </div>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(`${snsResult.twitter?.tweet}\n\n${snsResult.twitter?.hashtags.join(' ')}`, 'twitter')}
                          className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-black transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedPlatform === 'twitter' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPlatform === 'twitter' ? '복사됨!' : '트윗 복사'}</span>
                        </button>
                      </div>

                      {/* Tweet Content */}
                      <div className="space-y-3.5">
                        <p className="text-xs sm:text-sm text-slate-900 leading-relaxed font-bold font-mono">
                          {snsResult.twitter.tweet}
                        </p>
                        
                        <div className="text-xs text-sky-600 font-bold whitespace-normal">
                          {snsResult.twitter.hashtags.map(t => t.startsWith('#') ? t : `#${t}`).join(' ')}
                        </div>

                        {/* Date info */}
                        <div className="text-[10px] text-slate-400 font-bold border-y border-slate-100 py-2">
                          오후 3:15 · 2026년 9월 10일 · <span className="text-slate-700">12.5만</span> 조회수
                        </div>

                        {/* Actions Row */}
                        <div className="flex items-center justify-between text-slate-400 text-xs font-bold px-1">
                          <span className="hover:text-sky-500 cursor-pointer transition-colors flex items-center gap-1">
                            💬 142
                          </span>
                          <span className="hover:text-emerald-500 cursor-pointer transition-colors flex items-center gap-1">
                            🔁 3,120
                          </span>
                          <span className="hover:text-rose-500 text-rose-500 cursor-pointer transition-colors flex items-center gap-1">
                            ❤️ 9,840
                          </span>
                          <span className="hover:text-sky-500 cursor-pointer transition-colors">
                            🔖 542
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* THREADS CARD */}
                  {snsResult.threads && (activeTab === 'all' || activeTab === 'threads') && (
                    <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-md max-w-lg mx-auto w-full space-y-4">
                      {/* Threads Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-white/5">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 rounded-full bg-white text-slate-950 flex items-center justify-center text-[10px] font-black">
                            🧵
                          </div>
                          <span className="text-xs font-extrabold text-white">thread_gourmet</span>
                          <span className="text-[9px] text-white/50">• 42분 전</span>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(snsResult.threads?.threadPosts.join('\n\n') || '', 'threads')}
                          className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedPlatform === 'threads' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPlatform === 'threads' ? '복사됨!' : '스레드 전체 복사'}</span>
                        </button>
                      </div>

                      {/* Thread Posts connected sequentially */}
                      <div className="space-y-4">
                        {snsResult.threads.threadPosts.map((post, idx) => (
                          <div key={idx} className="flex gap-3">
                            {/* Connector line for threads */}
                            <div className="flex flex-col items-center">
                              <div className="w-6 h-6 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-[9px] font-bold text-orange-400">
                                {idx + 1}
                              </div>
                              {idx < (snsResult.threads?.threadPosts.length || 0) - 1 && (
                                <div className="w-0.5 flex-1 bg-white/10 my-1"></div>
                              )}
                            </div>
                            
                            {/* Thread Item Text */}
                            <div className="flex-1 bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/5">
                              <p className="text-xs text-white leading-relaxed font-medium">
                                {post}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Info */}
                      <div className="flex items-center space-x-4 text-[10px] text-white/40 font-bold px-1 pt-1">
                        <span>답글 18개</span>
                        <span>•</span>
                        <span>좋아요 345개</span>
                      </div>
                    </div>
                  )}

                  {/* TIKTOK CARD */}
                  {snsResult.tiktok && (activeTab === 'all' || activeTab === 'tiktok') && (
                    <div className="bg-black text-white rounded-2xl overflow-hidden shadow-lg max-w-sm mx-auto w-full flex flex-col border border-slate-800">
                      {/* Top status */}
                      <div className="px-4 py-3 bg-zinc-950 flex justify-between items-center text-xs border-b border-zinc-900">
                        <span className="font-extrabold text-cyan-400 tracking-wide">🔥 TIKTOK 텐션폭발 대본</span>
                        <button 
                          onClick={() => copyToClipboard(`[추천 BGM] ${snsResult.tiktok?.bgm}\n[컨셉] ${snsResult.tiktok?.videoConcept}\n[후킹 자막] ${snsResult.tiktok?.hookText}\n\n[오디오 나레이션]\n${snsResult.tiktok?.narration}\n\n${snsResult.tiktok?.hashtags.join(' ')}`, 'tiktok')}
                          className="px-2 py-0.5 rounded bg-cyan-500 hover:bg-cyan-600 text-white text-[10px] font-black cursor-pointer"
                        >
                          {copiedPlatform === 'tiktok' ? '복사 완료!' : '대본 복사'}
                        </button>
                      </div>

                      {/* Simulated Screen with text overlay */}
                      <div className="aspect-[9/16] relative bg-zinc-900 flex flex-col justify-between overflow-hidden">
                        {/* Background Mock View */}
                        <img 
                          src={tiktokImageUrl || getRandomFoodImage(2)} 
                          alt="TikTok View" 
                          className="absolute inset-0 w-full h-full object-cover opacity-80 transition-transform duration-700 hover:scale-105" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                        
                        {/* Premium Active Grill Warmth Overlay for TikTok video preview */}
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/10 via-amber-500/5 to-transparent mix-blend-color-burn pointer-events-none animate-pulse"></div>

                        {/* Interactive Action Overlay for TikTok background image replacement */}
                        <div className="absolute top-14 right-4 z-20 flex flex-col gap-2">
                          <button
                            onClick={() => handleGenerateTiktokImage()}
                            disabled={isGeneratingTiktok}
                            className="p-2 rounded-xl bg-black/60 hover:bg-cyan-600 text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center"
                            title="AI 비디오 프레임 새로고침"
                          >
                            {isGeneratingTiktok ? (
                              <Sparkles className="w-4 h-4 animate-spin text-amber-200" />
                            ) : (
                              <Camera className="w-4 h-4" />
                            )}
                          </button>

                          <label className="p-2 rounded-xl bg-black/60 hover:bg-emerald-600 text-white border border-white/10 backdrop-blur-md transition-all active:scale-95 cursor-pointer flex items-center justify-center">
                            <Video className="w-4 h-4 text-emerald-400" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = async () => {
                                      if (typeof reader.result === 'string') {
                                        setTiktokImageUrl(reader.result);
                                        setShortsImageUrl(reader.result);
                                        showToast('틱톡 비디오 프레임 실물 이미지 업로드 완료!', 'success');
                                        if (user && currentSnsId) {
                                          await saveCurrentSnsToFirestore(undefined, reader.result, reader.result);
                                        }
                                      }
                                    };
                                    reader.readAsDataURL(file);
                                  }
                              }}
                            />
                          </label>
                        </div>

                        {/* Top indicators */}
                        <div className="z-10 p-4 flex justify-between items-center">
                          <span className="bg-black/40 px-2 py-1 rounded text-[9px] font-bold">LIVE</span>
                          <div className="flex space-x-2 text-[10px] font-bold text-white/80">
                            <span>팔로잉</span>
                            <span className="text-white border-b-2 border-white pb-0.5">추천</span>
                          </div>
                          <span className="text-white/80">🔍</span>
                        </div>

                        {/* Middle UI: Giant Hook Title */}
                        <div className="z-10 px-6 text-center">
                          <div className="inline-block bg-cyan-500/90 text-black font-extrabold text-xs px-2.5 py-1 rounded-sm shadow-md skew-x-[-6deg] mb-1">
                            초대박 성수 1티어
                          </div>
                          <h4 className="text-lg sm:text-xl font-black text-white bg-black/60 px-4 py-2 rounded-xl border border-white/10 shadow-lg drop-shadow-md leading-snug animate-pulse">
                            "{snsResult.tiktok.hookText}"
                          </h4>
                        </div>

                        {/* Bottom UI Details */}
                        <div className="z-10 p-4 flex justify-between items-end">
                          <div className="space-y-2 flex-1 max-w-[80%]">
                            <p className="text-xs font-black text-cyan-400">@tiktok_mukbang_star</p>
                            <p className="text-[11px] text-white font-medium line-clamp-3 leading-relaxed">
                              식당 컨셉: {snsResult.tiktok.videoConcept}
                            </p>
                            <p className="text-[10px] text-cyan-300 font-bold whitespace-normal">
                              {snsResult.tiktok.hashtags.join(' ')}
                            </p>
                            <p className="text-[9px] bg-white/10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/5">
                              🎵 추천음악: {snsResult.tiktok.bgm}
                            </p>
                          </div>

                          {/* TikTok Right Action column */}
                          <div className="flex flex-col items-center space-y-4 text-xs font-bold text-white">
                            <div className="flex flex-col items-center">
                              <span className="text-xl">❤️</span>
                              <span className="text-[9px] text-slate-300 mt-1">42.8K</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xl">💬</span>
                              <span className="text-[9px] text-slate-300 mt-1">2.4K</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="text-xl">⭐</span>
                              <span className="text-[9px] text-slate-300 mt-1">12K</span>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-800 border-2 border-white animate-spin flex items-center justify-center text-xs">
                              💿
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Narration Script section under screen */}
                      <div className="p-4 bg-zinc-950 border-t border-zinc-900 space-y-2">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">🎤 리액션 오디오 나레이션 대본:</span>
                        <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-900/50 p-3 rounded-xl leading-relaxed whitespace-pre-line font-medium font-mono">
                          {snsResult.tiktok.narration}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* YOUTUBE SHORTS CARD */}
                  {snsResult.shorts && (activeTab === 'all' || activeTab === 'shorts') && (
                    <div className="bg-white rounded-2xl border border-red-200 overflow-hidden shadow-md max-w-lg mx-auto w-full flex flex-col">
                      {/* Shorts Header */}
                      <div className="bg-gradient-to-r from-red-600 to-rose-600 text-white p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                            <Video className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold">유튜브 쇼츠용 요약 스토리보드</p>
                            <p className="text-[10px] text-red-100">{snsResult.shorts.title}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => copyToClipboard(`[제목] ${snsResult.shorts?.title}\n[BGM] ${snsResult.shorts?.bgm}\n[첫 3초 후킹] ${snsResult.shorts?.hook}\n\n[스토리보드]\n` + snsResult.shorts?.scenes.map(s => `씬${s.sceneNumber}: [자막] ${s.subtitle}\n[나레이션] ${s.narration}\n[화면연출] ${s.visual}`).join('\n\n'), 'shorts')}
                          className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-[11px] font-black transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {copiedPlatform === 'shorts' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedPlatform === 'shorts' ? '복사됨!' : '대본 전체 복사'}</span>
                        </button>
                      </div>

                      {/* Content Details */}
                      <div className="p-4 sm:p-5 space-y-4 text-xs">
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100 space-y-1">
                          <p className="text-red-900 font-extrabold flex items-center gap-1">
                            <Flame className="w-4 h-4 text-red-500" />
                            <span>최종 영상 제목 및 추천 배경음악</span>
                          </p>
                          <p className="text-slate-800 font-bold text-xs">🎬 제목: "{snsResult.shorts.title}"</p>
                          <p className="text-slate-600 font-medium">🎵 음악 스타일: {snsResult.shorts.bgm}</p>
                        </div>

                        {/* Scenes mapped */}
                        <div className="space-y-3.5">
                          {snsResult.shorts.scenes.map((scene, idx) => (
                            <div key={idx} className="border border-slate-100 rounded-xl bg-slate-50/60 p-3.5 space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="bg-red-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                                  씬 {scene.sceneNumber}
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold">약 5초 소요</span>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 block">💬 화면 자막:</span>
                                  <p className="bg-white p-2 rounded-lg border border-slate-200 text-slate-900 font-black leading-normal">
                                    {scene.subtitle}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[10px] font-bold text-slate-400 block">🎤 나레이션 스크립트:</span>
                                  <p className="bg-amber-50/60 p-2 rounded-lg border border-amber-200 text-slate-800 font-medium leading-relaxed">
                                    {scene.narration}
                                  </p>
                                </div>
                              </div>

                              <div className="bg-slate-200/50 p-2 rounded-lg border border-slate-300/40 text-[10px] text-slate-600 font-semibold">
                                📸 화면 연출: {scene.visual}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </>
            )}
          </div>
        </div>
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 bg-slate-900 border-slate-800 text-white">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-xs font-bold">{toastMessage.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
