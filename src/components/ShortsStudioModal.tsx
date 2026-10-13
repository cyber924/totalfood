import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Film,
  Camera,
  Copy,
  Check,
  Download,
  Bookmark,
  ChevronRight,
  ChevronLeft,
  Flame,
  Smartphone,
  Music,
  Share2,
  Sliders,
  Clock,
  Video,
  Layers,
  Wand2,
  ExternalLink,
  Trash2,
  Save,
  AlertCircle,
  Eye,
  Mic,
} from 'lucide-react';
import { GeneratedShortsResult, ShortsScene, ShortsTone, GeneratedBlogResult } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  saveShortsToFirestore,
  deleteShortsFromFirestore,
  subscribeUserShorts,
  saveShortsToFirestoreDirectly,
} from '../services/shortsService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { saveSharedAsset, subscribeAllAssets } from '../services/adminService';
import { SharedGourmetAsset } from '../types';

const stripBase64 = (val: any): any => {
  if (typeof val === 'string') {
    if (val.startsWith('data:image/')) {
      return ''; // Strip heavy base64 strings from local cache
    }
    return val;
  }
  if (Array.isArray(val)) {
    return val.map(stripBase64);
  }
  if (val && typeof val === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(val)) {
      cleaned[key] = stripBase64(val[key]);
    }
    return cleaned;
  }
  return val;
};

const saveToLocalStorageSafely = (key: string, data: any) => {
  try {
    const lightweightData = stripBase64(data);
    localStorage.setItem(key, JSON.stringify(lightweightData));
  } catch (err) {
    console.warn(`[LocalStorage Quota Enforcer] Safely handled quota write limit for key: ${key}`, err);
  }
};

const uploadBase64ImageToFirestore = async (base64String: string): Promise<string> => {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return base64String; // Keep HTTP/HTTPS URLs as is
  }

  try {
    const imageId = 'img_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    console.log(`[ImageStorage] Uploading heavy base64 image (length: ${base64String.length}) to post_images collection as ID: ${imageId}...`);
    const imageRef = doc(db, 'post_images', imageId);
    await setDoc(imageRef, {
      imageContent: base64String,
      createdAt: new Date().toISOString(),
    });
    console.log(`[ImageStorage] Successfully uploaded base64. Hosted URL proxy pointer: /api/get-image?id=${imageId}`);
    return `/api/get-image?id=${imageId}`;
  } catch (err) {
    console.error('[ImageStorage] Failed to upload base64 image to post_images collection:', err);
    return base64String; // Return original base64 as safe fallback if upload fails
  }
};

const compressImageUnder200KB = (base64Str: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!base64Str || !base64Str.startsWith('data:image/')) {
      resolve(base64Str);
      return;
    }
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      const MAX_SIZE = 800;
      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        let quality = 0.75;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        while (dataUrl.length > 200 * 1024 && quality > 0.1) {
          quality -= 0.05;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
};

interface ShortsStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    restaurantName?: string;
    location?: string;
    menuItems?: string;
    features?: string;
    blogContent?: string;
  } | null;
}

export const ShortsStudioModal: React.FC<ShortsStudioModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { user } = useAuth();

  // Form Inputs
  const [restaurantName, setRestaurantName] = useState('소문난 성수 감자탕');
  const [location, setLocation] = useState('서울 성동구 성수역 4번 출구');
  const [menuItems, setMenuItems] = useState('시그니처 감자탕 (대), 볶음밥, 뼈 추가');
  const [features, setFeatures] = useState('웨이팅 필수 핫플, 깊고 진한 우거지 육수, 살코기 푸짐함');
  const [tone, setTone] = useState<ShortsTone>('hype_fast');
  const [targetDuration, setTargetDuration] = useState<number>(35);

  // Studio Flow & Data
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shortsResult, setShortsResult] = useState<GeneratedShortsResult | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'script' | 'saved'>('player');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Player State
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.1);
  const [isGeneratingSceneImg, setIsGeneratingSceneImg] = useState<number | null>(null);
  const [isEnhancingPrompt, setIsEnhancingPrompt] = useState<number | null>(null);
  const [styleLock, setStyleLock] = useState<'cinematic' | 'warm' | 'minimal' | 'retro'>('cinematic');
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');

  // Subtitle Custom Styling presets
  const [subPosition, setSubPosition] = useState<'bottom' | 'middle' | 'top'>('bottom');
  const [subFontSize, setSubFontSize] = useState<'small' | 'medium' | 'large' | 'xl'>('medium');
  const [subFontFamily, setSubFontFamily] = useState<'sans-serif' | 'serif' | 'monospace' | 'impact'>('sans-serif');
  const [subColor, setSubColor] = useState<string>('#FFFFFF');
  const [subBgOpacity, setSubBgOpacity] = useState<number>(0.75);

  // Premium Audio / BGM options
  const [bgmEnabled, setBgmEnabled] = useState<boolean>(false);
  const [bgmType, setBgmType] = useState<'lofi' | 'pop' | 'jazz' | 'techno'>('lofi');
  const [ttsProvider, setTtsProvider] = useState<'gemini' | 'google'>('gemini'); // Default to Gemini Premium
  const [ttsVoice, setTtsVoice] = useState<'Kore' | 'Zephyr' | 'Puck' | 'Charon' | 'Fenrir'>('Kore');

  // Premium Google Cloud TTS Cache states
  const [ttsAudioCache, setTtsAudioCache] = useState<Record<number, string>>({});
  const [isPreloadingTts, setIsPreloadingTts] = useState(false);
  const [preRenderedAudioBase64, setPreRenderedAudioBase64] = useState<string | null>(null);
  const [preRenderedWavUrl, setPreRenderedWavUrl] = useState<string | null>(null);
  const [isSynthesizingAudio, setIsSynthesizingAudio] = useState(false);

  // Saved Shorts
  const [savedShortsList, setSavedShortsList] = useState<GeneratedShortsResult[]>([]);
  const [isSavedCurrent, setIsSavedCurrent] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const toastTimeoutRef = useRef<any>(null);

  // Shared Assets Library States
  const [allSharedAssets, setAllSharedAssets] = useState<SharedGourmetAsset[]>([]);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryTargetSceneIdx, setLibraryTargetSceneIdx] = useState<number | null>(null);
  const [librarySearchFilter, setLibrarySearchFilter] = useState('');

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMessage({ text, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const googleAudioRef = useRef<HTMLAudioElement | null>(null);

  // Sync initial data when modal opens
  useEffect(() => {
    if (initialData) {
      if (initialData.restaurantName) setRestaurantName(initialData.restaurantName);
      if (initialData.location) setLocation(initialData.location);
      if (initialData.menuItems) setMenuItems(initialData.menuItems);
      if (initialData.features) setFeatures(initialData.features);
    }
  }, [initialData]);

  // Preload and cache Google Cloud premium or Gemini Native TTS voices in the background
  const preloadTtsAudio = async (resultToCache = shortsResult) => {
    if (!resultToCache || !resultToCache.scenes || resultToCache.scenes.length === 0) return;
    setIsPreloadingTts(true);
    
    const cache: Record<number, string> = {};
    let successCount = 0;

    console.log(`[TTS Preload] Starting background caching using ${ttsProvider.toUpperCase()} (${ttsProvider === 'gemini' ? ttsVoice : 'ko-KR-Neural2-A'}) voices...`);

    for (let i = 0; i < resultToCache.scenes.length; i++) {
      const scene = resultToCache.scenes[i];
      try {
        const response = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: scene.narration,
            provider: ttsProvider,
            voiceName: ttsProvider === 'gemini' ? ttsVoice : "ko-KR-Neural2-A",
            ssmlGender: "FEMALE",
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.success && resData.audioContent) {
            const mimeType = ttsProvider === 'gemini' ? 'audio/wav' : 'audio/mp3';
            cache[i] = `data:${mimeType};base64,${resData.audioContent}`;
            successCount++;
          }
        } else {
          console.warn(`[TTS Preload] API returned error for scene ${i}`);
        }
      } catch (err) {
        console.warn(`[TTS Preload] Network error for scene ${i}:`, err);
      }
    }

    setTtsAudioCache(cache);
    setIsPreloadingTts(false);
    console.log(`[TTS Preload] Completed. Pre-cached ${successCount}/${resultToCache.scenes.length} premium voices.`);
  };

  // Helper to convert base64 to ArrayBuffer (used in Audio decoding)
  const base64ToArrayBuffer = (base64Data: string) => {
    const base64 = base64Data.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Helper to convert AudioBuffer to WAV format Blob
  const audioBufferToWavBlob = (buffer: AudioBuffer) => {
    const numOfChan = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const format = 1; // PCM
    const bitDepth = 16;
    
    let result;
    if (numOfChan === 1) {
      result = buffer.getChannelData(0);
    } else {
      const c0 = buffer.getChannelData(0);
      const c1 = buffer.getChannelData(1);
      result = new Float32Array(c0.length * 2);
      for (let i = 0; i < c0.length; i++) {
        result[i * 2] = c0[i];
        result[i * 2 + 1] = c1[i];
      }
    }
    
    const bufferLen = result.length * 2;
    const wavBuffer = new ArrayBuffer(44 + bufferLen);
    const view = new DataView(wavBuffer);
    
    const writeString = (view: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };
    
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + bufferLen, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, format, true);
    view.setUint16(22, numOfChan, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numOfChan * (bitDepth / 8), true);
    view.setUint16(32, numOfChan * (bitDepth / 8), true);
    view.setUint16(34, bitDepth, true);
    writeString(view, 36, 'data');
    view.setUint32(40, bufferLen, true);
    
    let offset = 44;
    for (let i = 0; i < result.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, result[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
  };

  // REPRESENTATIVE'S REVOLUTIONARY IDEA: Pre-synthesize the 100% clean unified vocal track beforehand with 0% noise using fresh Gemini TTS fetches
  const handleGenerateUnifiedVoice = async (): Promise<string | null> => {
    if (!shortsResult || !shortsResult.scenes || shortsResult.scenes.length === 0) return null;
    setIsSynthesizingAudio(true);
    showToast('🎙️ 제미나이 AI가 모든 씬의 자막 나레이션 음성 파일들을 직접 하나하나 합성하는 중...', 'info');

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();

    try {
      const decodedBuffers: (AudioBuffer | null)[] = [];
      
      // Loop through each scene and fetch fresh Gemini TTS directly (ignoring incomplete background caches)
      for (let i = 0; i < shortsResult.scenes.length; i++) {
        const sc = shortsResult.scenes[i];
        
        // Clean and prepare subtitle/narration text - strip out prefix labels like [나레이션]: or [자막]:
        const cleanText = sc.narration.replace(/^\[나레이션\]\s*:\s*/i, '').replace(/^\[자막\]\s*:\s*/i, '').trim();
        
        console.log(`[Gemini TTS:Mux] Actively generating voice file for scene ${i + 1}: "${cleanText.slice(0, 30)}..."`);
        
        try {
          const response = await fetch('/api/tts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: cleanText,
              provider: 'gemini', // Enforce Gemini TTS as requested!
              voiceName: ttsVoice || 'Kore',
            }),
          });
          
          if (!response.ok) {
            throw new Error(`TTS API returned status ${response.status}`);
          }
          
          const resData = await response.json();
          if (resData.success && resData.audioContent) {
            const arrayBuf = base64ToArrayBuffer(`data:audio/wav;base64,${resData.audioContent}`);
            const audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
            decodedBuffers.push(audioBuffer);
          } else {
            decodedBuffers.push(null);
          }
        } catch (err) {
          console.warn(`[Gemini TTS:Mux] Failed to fetch or decode live TTS for scene ${i}:`, err);
          decodedBuffers.push(null);
        }
      }

      const sampleRate = audioCtx.sampleRate;
      const totalDurationSec = shortsResult.scenes.reduce((acc, sc) => acc + (sc.durationSec || 5.0), 0);
      const totalLength = Math.ceil(totalDurationSec * sampleRate);
      
      const masterBuffer = audioCtx.createBuffer(1, totalLength, sampleRate);
      const masterChannelData = masterBuffer.getChannelData(0);

      let cumulativeTime = 0;
      for (let i = 0; i < shortsResult.scenes.length; i++) {
        const buffer = decodedBuffers[i];
        const sceneDuration = shortsResult.scenes[i].durationSec || 5.0;
        
        if (buffer) {
          const sourceData = buffer.getChannelData(0);
          const startOffset = Math.round(cumulativeTime * sampleRate);
          const copyLength = Math.min(sourceData.length, totalLength - startOffset);
          for (let s = 0; s < copyLength; s++) {
            masterChannelData[startOffset + s] = sourceData[s];
          }
        }
        cumulativeTime += sceneDuration;
      }

      const wavBlob = audioBufferToWavBlob(masterBuffer);
      const blobUrl = URL.createObjectURL(wavBlob);
      setPreRenderedWavUrl(blobUrl);

      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPreRenderedAudioBase64(reader.result);
            setIsSynthesizingAudio(false);
            showToast('🎙️ 제미나이 AI 명품 자막 TTS 음성 파일 생성이 완료되어 브라우저에 임베딩되었습니다!', 'success');
            resolve(blobUrl);
          } else {
            setIsSynthesizingAudio(false);
            resolve(null);
          }
        };
        reader.onerror = () => {
          setIsSynthesizingAudio(false);
          resolve(null);
        };
        reader.readAsDataURL(wavBlob);
      });
    } catch (err) {
      console.error('Unified voice generation error:', err);
      setIsSynthesizingAudio(false);
      showToast('제미나이 TTS 음성 파일 생성에 실패했습니다.', 'error');
      return null;
    } finally {
      audioCtx.close().catch(() => {});
    }
  };

  // Pre-fetch premium voices when a new story is generated or TTS settings change
  useEffect(() => {
    if (shortsResult) {
      setTtsAudioCache({});
      setPreRenderedAudioBase64(null);
      setPreRenderedWavUrl(null);
      preloadTtsAudio(shortsResult);
    }
  }, [shortsResult, ttsProvider, ttsVoice]);

  // Subscribe to all shared assets (Gourmet Image Library)
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeAllAssets(
      (assets) => {
        setAllSharedAssets(assets);
      },
      (err) => console.warn('[ShortsStudio] Shared assets load note (using migration backup):', err)
    );
    return () => unsub();
  }, [isOpen]);

  // Load saved shorts from LocalStorage and Firestore
  useEffect(() => {
    if (!isOpen) return;

    // 1. Immediately read from local storage cache for instantaneous availability
    try {
      const raw = localStorage.getItem('blogai_saved_shorts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSavedShortsList(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load local saved shorts:', e);
    }

    // 2. Subscribe to Firestore if user logged in, merging with local storage
    if (user) {
      console.log(`[ShortsStudio:Subscription] Initializing live Firestore listener for user: ${user.uid}`);
      const unsub = subscribeUserShorts(
        user.uid,
        (list) => {
          console.log(`[ShortsStudio:Subscription] Live Firestore snap received. Project count in DB: ${list.length}`);
          setSavedShortsList((prev) => {
            const map = new Map<string, GeneratedShortsResult>();
            list.forEach((item) => map.set(item.id, item));
            prev.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            const merged = Array.from(map.values()).sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            saveToLocalStorageSafely('blogai_saved_shorts', merged);
            return merged;
          });

          // 실시간으로 현재 편집 중인 shortsResult도 Firestore의 최신 데이터로 동기화
          setShortsResult((current) => {
            if (!current) return null;
            const latest = list.find((item) => item.id === current.id);
            if (latest) {
              const currentStr = JSON.stringify(current);
              const latestStr = JSON.stringify(latest);
              if (currentStr !== latestStr) {
                console.log(`[ShortsStudio:Subscription] Change detected for active project: ${current.id}. Synchronizing raw state (including base64 images) to player model.`);
                return latest;
              }
            }
            return current;
          });
        },
        (err) => console.warn('[ShortsStudio:Subscription] Error or fallback in subscription stream:', err?.message || err)
      );
      return () => {
        console.log(`[ShortsStudio:Subscription] Detaching live Firestore listener for user: ${user.uid}`);
        unsub();
      };
    }
  }, [user, isOpen]);

  // Check if current is saved
  useEffect(() => {
    if (!shortsResult) {
      setIsSavedCurrent(false);
      return;
    }
    const found = savedShortsList.some((s) => s.id === shortsResult.id);
    setIsSavedCurrent(found);
  }, [shortsResult, savedShortsList]);

  // Speech TTS handler for current scene
  const playNarration = (text: string, sceneIndex: number) => {
    if (isMuted) return;

    // 1. If pre-rendered single continuous WAV is available, play/sync it beautifully
    if (preRenderedWavUrl && shortsResult) {
      console.log(`[TTS:Premium] Synchronizing unified pre-rendered WAV for scene ${sceneIndex}`);
      let startTime = 0;
      for (let i = 0; i < sceneIndex; i++) {
        startTime += shortsResult.scenes[i]?.durationSec || 5.0;
      }

      if (!googleAudioRef.current) {
        const audio = new Audio(preRenderedWavUrl);
        audio.playbackRate = playbackSpeed;
        audio.currentTime = startTime;
        googleAudioRef.current = audio;
        audio.play().catch((err) => console.warn('Pristine pre-rendered audio playback failed:', err));
      } else {
        const audio = googleAudioRef.current;
        const drift = Math.abs(audio.currentTime - startTime);
        if (drift > 0.4) {
          audio.currentTime = startTime;
        }
        if (audio.paused) {
          audio.play().catch((err) => console.warn('Pristine pre-rendered audio resume failed:', err));
        }
      }
      return;
    }

    // 2. Stop any currently playing premium audio (fallback path)
    if (googleAudioRef.current) {
      googleAudioRef.current.pause();
      googleAudioRef.current = null;
    }

    // 3. Clear browser synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const cachedAudio = ttsAudioCache[sceneIndex];
    if (cachedAudio) {
      console.log(`[TTS:Premium] Playing high-quality Google Cloud voice for scene ${sceneIndex}`);
      const audio = new Audio(cachedAudio);
      audio.playbackRate = playbackSpeed;
      googleAudioRef.current = audio;
      audio.play().catch((err) => console.warn('Audio play failed:', err));
    } else {
      // Graceful fallback to browser speechSynthesis if not cached yet or failed
      console.log(`[TTS:Fallback] Falling back to browser speechSynthesis for scene ${sceneIndex}`);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ko-KR';
        utterance.rate = playbackSpeed;
        utterance.pitch = 1.05;
        speechRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    }
  };

  // Stop narration
  const stopNarration = () => {
    if (googleAudioRef.current) {
      googleAudioRef.current.pause();
      googleAudioRef.current = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  // Playback timer loop
  useEffect(() => {
    let interval: any = null;

    if (isPlaying && shortsResult && shortsResult.scenes.length > 0) {
      const currentScene = shortsResult.scenes[currentSceneIndex];
      const durationMs = (currentScene?.durationSec || 5) * 1000;
      const stepMs = 50;

      // Play narration once at the start of scene
      if (sceneProgress === 0) {
        playNarration(currentScene.narration, currentSceneIndex);
      }

      interval = setInterval(() => {
        setSceneProgress((prev) => {
          const next = prev + (stepMs / durationMs) * 100;
          if (next >= 100) {
            // Move to next scene or loop back
            if (currentSceneIndex < shortsResult.scenes.length - 1) {
              setCurrentSceneIndex((idx) => idx + 1);
            } else {
              setCurrentSceneIndex(0);
            }
            return 0;
          }
          return next;
        });
      }, stepMs);
    } else {
      stopNarration();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentSceneIndex, shortsResult, isMuted, playbackSpeed, ttsAudioCache]);

  // Generate Shorts
  const handleGenerateShorts = async () => {
    if (!restaurantName.trim()) {
      setErrorMessage('맛집 이름을 입력해 주세요.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setIsPlaying(false);
    stopNarration();

    try {
      const response = await fetch('/api/generate-shorts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantName,
          location,
          menuItems,
          features,
          tone,
          targetDuration,
          blogContent: initialData?.blogContent,
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || '쇼츠 대본 생성에 실패했습니다.');
      }

      const generated = resData.data;

      // Ensure scenes have initial vertical food photo fallbacks
      const fallbackImgs = [
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=720&h=1280&q=80',
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=720&h=1280&q=80',
        'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=720&h=1280&q=80',
        'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?auto=format&fit=crop&w=720&h=1280&q=80',
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=720&h=1280&q=80',
      ];

      const enhancedScenes = (generated.scenes || []).map((sc: any, idx: number) => {
        // If we already have a previous shortsResult, preserve the custom image the user loaded/generated
        const existingScene = shortsResult?.scenes?.[idx];
        const previousImageUrl = existingScene?.imageUrl;
        return {
          ...sc,
          imageUrl: previousImageUrl || sc.imageUrl || fallbackImgs[idx % fallbackImgs.length],
        };
      });

      const newShorts: GeneratedShortsResult = {
        id: 'shorts_' + Date.now(),
        createdAt: new Date().toISOString(),
        restaurantName,
        location,
        tone,
        targetDuration,
        title: generated.title || `🔥 ${restaurantName} 맛집 쇼츠`,
        hook: generated.hook || '인생 맛집 등장!',
        totalDuration: generated.totalDuration || targetDuration,
        bgmRecommendation: generated.bgmRecommendation || '트렌디 힙합 로파이 128BPM',
        hashtags: generated.hashtags || ['#맛집쇼츠', '#릴스추천', '#먹방'],
        scenes: enhancedScenes,
        youtubeDescription: generated.youtubeDescription || '',
        filmingTips: generated.filmingTips || [],
      };

      setShortsResult(newShorts);
      setCurrentSceneIndex(0);
      setSceneProgress(0);
      setActiveTab('player');

      if (user) {
        try {
          await saveShortsToFirestoreDirectly(user.uid, newShorts);
          setIsSavedCurrent(true);
          showToast(`'${restaurantName}' 쇼츠 대본이 완성되어 Firestore에 성공적으로 저장되었습니다!`, 'success');
        } catch (e) {
          console.warn('Background Firestore save failed:', e);
          const updatedList = [newShorts, ...savedShortsList.filter((s) => s.id !== newShorts.id)];
          setSavedShortsList(updatedList);
          saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
          setIsSavedCurrent(true);
          showToast(`'${restaurantName}' 쇼츠 대본이 완성되어 보관함에 임시 저장되었습니다!`, 'success');
        }
      } else {
        const updatedList = [newShorts, ...savedShortsList.filter((s) => s.id !== newShorts.id)];
        setSavedShortsList(updatedList);
        saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
        setIsSavedCurrent(true);
        showToast(`'${restaurantName}' 쇼츠 대본이 완성되어 보관함에 자동 저장되었습니다!`, 'success');
      }
    } catch (err: any) {
      console.error('Generate shorts error:', err);
      setErrorMessage(err.message || '쇼츠 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate Image for specific scene
  const handleGenerateSceneImage = async (sceneIdx: number) => {
    if (!shortsResult) return;
    const scene = shortsResult.scenes[sceneIdx];
    if (!scene) return;

    setIsGeneratingSceneImg(sceneIdx);
    try {
      const styleSuffixes = {
        cinematic: 'cinematic 8k appetizing food photography, vertical 9:16 format, professional styling, soft shadows',
        warm: 'warm cozy food commercial vibe, natural sunlight, detailed styling, vertical 9:16 format, appetizing',
        minimal: 'minimalist food studio style, clean solid background, sharp details, vertical 9:16 format',
        retro: 'retro vintage commercial food photography style, warm colors, detailed texture, vertical 9:16 format'
      };
      const stylePrompt = styleSuffixes[styleLock] || styleSuffixes.cinematic;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `${scene.imagePrompt || scene.visualDescription || ''}, ${stylePrompt}`,
          aspectRatio: '9:16',
        }),
      });

      const data = await response.json();
      if (data.success && data.imageUrl) {
        // Convert to Firestore image hosting URL to prevent Base64 stripping and Firestore payload limit issues
        const hostedImageUrl = await uploadBase64ImageToFirestore(data.imageUrl);

        // Compress generated image under 200KB and register in the Gourmet Shared Assets Image Library!
        try {
          console.log('[ShortsStudio:handleGenerateSceneImage] Compressing generated image under 200KB to register as Shared Asset...');
          const compressedBase64 = await compressImageUnder200KB(data.imageUrl);
          const keyword = `#${shortsResult.restaurantName || 'AI추천'}`;
          
          await saveSharedAsset({
            sourceType: 'ai',
            imageContent: compressedBase64,
            searchKeyword: keyword,
            createdAt: new Date().toISOString(),
            isShared: true,
            authorEmail: user?.email || 'guest@gourmet.ai',
          });
          console.log(`[ShortsStudio:handleGenerateSceneImage] Image successfully registered in shared_assets with keyword: ${keyword}`);
        } catch (assetErr) {
          console.warn('[ShortsStudio:handleGenerateSceneImage] Failed to register image in shared_assets:', assetErr);
        }

        const updatedScenes = [...shortsResult.scenes];
        updatedScenes[sceneIdx] = {
          ...updatedScenes[sceneIdx],
          imageUrl: hostedImageUrl,
        };

        const updatedResult = { ...shortsResult, scenes: updatedScenes };
        setShortsResult(updatedResult);

        if (user) {
          try {
            console.log(`[ShortsStudio:handleGenerateSceneImage] Asynchronously syncing generated image for scene ${sceneIdx + 1} to Firestore. Project ID: ${updatedResult.id}`);
            await saveShortsToFirestoreDirectly(user.uid, updatedResult);
            console.log(`[ShortsStudio:handleGenerateSceneImage] Successfully persisted generated scene ${sceneIdx + 1} image to Firestore.`);
            showToast(`씬 ${sceneIdx + 1} AI 이미지가 생성되어 Firestore에 직접 저장되었습니다!`, 'success');
          } catch (e) {
            console.error(`[ShortsStudio:handleGenerateSceneImage] Firestore scene image update failed:`, e);
            const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
            setSavedShortsList(updatedList);
            saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
            showToast(`씬 ${sceneIdx + 1} AI 이미지가 생성 및 로컬에 저장되었습니다!`, 'success');
          }
        } else {
          const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
          setSavedShortsList(updatedList);
          saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
          showToast(`씬 ${sceneIdx + 1} AI 이미지가 생성 및 저장되었습니다!`, 'success');
        }
      }
    } catch (e) {
      console.error('Failed to generate scene image:', e);
      showToast('이미지 생성에 실패했습니다.', 'error');
    } finally {
      setIsGeneratingSceneImg(null);
    }
  };

  // Image Library Selection Handler
  const handleOpenLibrary = (sceneIdx: number) => {
    setLibraryTargetSceneIdx(sceneIdx);
    setIsLibraryOpen(true);
  };

  const handleSelectLibraryImage = async (imageUrl: string) => {
    if (libraryTargetSceneIdx === null || !shortsResult) return;

    const sceneIdx = libraryTargetSceneIdx;
    
    // The image from the library is already uploaded/stored in firestore under /api/get-image, or it's a base64, or other URL.
    // Let's make sure if it's base64, we store/proxy it, otherwise keep it as is.
    const hostedUrl = await uploadBase64ImageToFirestore(imageUrl);

    const updatedScenes = [...shortsResult.scenes];
    updatedScenes[sceneIdx] = {
      ...updatedScenes[sceneIdx],
      imageUrl: hostedUrl,
    };

    const updatedResult = { ...shortsResult, scenes: updatedScenes };
    setShortsResult(updatedResult);

    if (user) {
      try {
        console.log(`[ShortsStudio:LibrarySelect] Asynchronously syncing library image for scene ${sceneIdx + 1} to Firestore. Project ID: ${updatedResult.id}`);
        await saveShortsToFirestoreDirectly(user.uid, updatedResult);
        console.log(`[ShortsStudio:LibrarySelect] Successfully persisted library scene ${sceneIdx + 1} image to Firestore.`);
        showToast(`씬 ${sceneIdx + 1} 이미지가 라이브러리 사진으로 변경되고 Firestore에 저장되었습니다!`, 'success');
      } catch (e) {
        console.error('Firestore library image sync failed:', e);
        const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
        setSavedShortsList(updatedList);
        saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
      }
    } else {
      const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
      setSavedShortsList(updatedList);
      saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
      showToast(`씬 ${sceneIdx + 1} 이미지가 라이브러리 사진으로 교체되었습니다!`, 'success');
    }

    setIsLibraryOpen(false);
    setLibraryTargetSceneIdx(null);
  };

  // Directly edit the image prompt of a scene
  const handleEditScenePrompt = (sceneIdx: number, newPrompt: string) => {
    if (!shortsResult) return;
    const updatedScenes = [...shortsResult.scenes];
    updatedScenes[sceneIdx] = {
      ...updatedScenes[sceneIdx],
      imagePrompt: newPrompt,
    };
    const updatedResult = { ...shortsResult, scenes: updatedScenes };
    setShortsResult(updatedResult);

    // Sync to local cache only if user is NOT logged in (to bypass local storage write when logged in)
    if (!user) {
      const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
      setSavedShortsList(updatedList);
      saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
    }
  };

  // Gemini magic enhancer (요술봉) for scene prompt
  const handleEnhancePrompt = async (sceneIdx: number) => {
    if (!shortsResult) return;
    const scene = shortsResult.scenes[sceneIdx];
    if (!scene) return;

    const sourceText = scene.imagePrompt || scene.visualDescription || '';
    if (!sourceText.trim()) {
      showToast('보정할 원본 프롬프트 내용이 비어있습니다.', 'error');
      return;
    }

    setIsEnhancingPrompt(sceneIdx);
    try {
      const response = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: sourceText }),
      });

      const data = await response.json();
      if (data.success && data.enhancedPrompt) {
        const updatedScenes = [...shortsResult.scenes];
        updatedScenes[sceneIdx] = {
          ...updatedScenes[sceneIdx],
          imagePrompt: data.enhancedPrompt,
        };
        const updatedResult = { ...shortsResult, scenes: updatedScenes };
        setShortsResult(updatedResult);

        if (user) {
          try {
            await saveShortsToFirestoreDirectly(user.uid, updatedResult);
            showToast(`씬 ${sceneIdx + 1} 프롬프트가 보정되어 Firestore에 직접 저장되었습니다!`, 'success');
          } catch (e) {
            console.error('Failed to save enhanced prompt to Firestore:', e);
            const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
            setSavedShortsList(updatedList);
            saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
            showToast(`씬 ${sceneIdx + 1} 프롬프트 보정 완료 및 로컬에 저장되었습니다!`, 'success');
          }
        } else {
          const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
          setSavedShortsList(updatedList);
          saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
          showToast(`씬 ${sceneIdx + 1} 프롬프트가 최고화질 레벨로 보정 완료되었습니다!`, 'success');
        }
      } else {
        throw new Error('Enhance failed');
      }
    } catch (e) {
      console.error('Enhance error:', e);
      showToast('프롬프트 요술봉 보정에 실패했습니다.', 'error');
    } finally {
      setIsEnhancingPrompt(null);
    }
  };

  // Save to Firestore / LocalStorage (Optimistic & Resilient)
  const handleSaveShorts = async () => {
    if (!shortsResult) return;

    if (user) {
      try {
        console.log(`[ShortsStudio:handleSaveShorts] Saving directly to Firestore DB...`);
        await saveShortsToFirestoreDirectly(user.uid, shortsResult);
        
        console.log(`[ShortsStudio:handleSaveShorts] Re-fetching absolute truth document back from Firestore...`);
        const docRef = doc(db, 'saved_shorts', shortsResult.id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const freshData = docSnap.data() as GeneratedShortsResult;
          setShortsResult(freshData);
          console.log(`[ShortsStudio:handleSaveShorts] State successfully updated with the fresh document retrieved from Firestore DB!`, freshData);
        } else {
          console.warn(`[ShortsStudio:handleSaveShorts] Document did not exist in Firestore after write!`);
        }

        setIsSavedCurrent(true);
        showToast(`'${shortsResult.restaurantName}' 쇼츠가 Firestore에 직접 안전하게 저장되었습니다! (DB 원격 데이터 동기화 완료)`, 'success');
      } catch (e) {
        console.warn('Firestore direct save failed:', e);
        // Fallback to local storage if Firestore fails
        const updated = [shortsResult, ...savedShortsList.filter((s) => s.id !== shortsResult.id)];
        setSavedShortsList(updated);
        saveToLocalStorageSafely('blogai_saved_shorts', updated);
        setIsSavedCurrent(true);
        showToast(`'${shortsResult.restaurantName}' 쇼츠가 보관함에 임시 저장되었습니다!`, 'success');
      }
    } else {
      // 1. Optimistic local state update
      const updated = [shortsResult, ...savedShortsList.filter((s) => s.id !== shortsResult.id)];
      setSavedShortsList(updated);
      saveToLocalStorageSafely('blogai_saved_shorts', updated);
      setIsSavedCurrent(true);
      showToast(`'${shortsResult.restaurantName}' 쇼츠가 보관함에 안전하게 저장되었습니다!`, 'success');
    }
  };

  // Delete saved shorts (No native window.confirm, safe local-first deletion)
  const handleDeleteShorts = async (id: string) => {
    const target = savedShortsList.find((s) => s.id === id);
    const updated = savedShortsList.filter((s) => s.id !== id);
    setSavedShortsList(updated);
    saveToLocalStorageSafely('blogai_saved_shorts', updated);
    if (shortsResult?.id === id) {
      setIsSavedCurrent(false);
    }
    showToast(`'${target?.restaurantName || '쇼츠'}' 프로젝트가 보관함에서 삭제되었습니다.`, 'info');

    if (user) {
      try {
        await deleteShortsFromFirestore(user.uid, id);
      } catch (e) {
        console.warn('Error deleting shorts from Firestore:', e);
      }
    }
  };

  // Copy helper
  const copyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Export 9:16 Video using Canvas Recording (100% Client-side Muxing - no server FFmpeg used!)
  const handleExportVideo = async () => {
    if (!shortsResult || !canvasRef.current) return;
    setIsExportingVideo(true);
    setExportProgress(0);
    setExportStatus('명품 보이스 1초 한방 합성 점검 중...');
    setIsPlaying(false);
    stopNarration();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExportingVideo(false);
      setExportProgress(0);
      setExportStatus('');
      return;
    }

    // REPRESENTATIVE'S GENIUS PRINCIPLE: Ensure the clean TTS master file is ready in the browser.
    // If not already pre-rendered, automatically render it in 1 second!
    let finalWavUrl = preRenderedWavUrl;
    if (!finalWavUrl) {
      setExportStatus('명품 보이스 마스터 오디오 사전 합성 기동 중...');
      finalWavUrl = await handleGenerateUnifiedVoice();
    }

    if (!finalWavUrl) {
      showToast('명품 음성 합성 파일을 찾을 수 없어 렌더링할 수 없습니다.', 'error');
      setIsExportingVideo(false);
      setExportProgress(0);
      setExportStatus('');
      return;
    }

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const exportAudioCtx = new AudioContextClass();

    try {
      // 1. Fetch clean Google/Gemini TTS WAV as ArrayBuffer
      setExportStatus('명품 보이스 음원 데이터 메모리(RAM) 로드 중...');
      const audioResponse = await fetch(finalWavUrl);
      const audioArrayBuffer = await audioResponse.arrayBuffer();

      // 2. Decode Audio data to PCM AudioBuffer for absolute jitter-free hardware thread playback (0% buzz noise!)
      setExportStatus('명품 보이스 0% 노이즈 초저지연 하드웨어 PCM 변환 중...');
      const decodedAudioBuffer = await exportAudioCtx.decodeAudioData(audioArrayBuffer);

      // 3. Preload all high-definition visual assets to avoid runtime frame latency
      setExportStatus('모든 고화질 비주얼 이미지 리소스 사전 메모리 탑재 중...');
      const loadedImages: HTMLImageElement[] = [];
      const totalScenes = shortsResult.scenes.length;
      for (let sIdx = 0; sIdx < totalScenes; sIdx++) {
        const sc = shortsResult.scenes[sIdx];
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = sc.imageUrl || '';
        await new Promise((resolve) => {
          img.onload = () => resolve(true);
          img.onerror = () => resolve(true);
        });
        loadedImages.push(img);
      }

      // 4. Create Web Audio API buffer source node and audio destination stream
      const audioDestination = exportAudioCtx.createMediaStreamDestination();
      const sourceNode = exportAudioCtx.createBufferSource();
      sourceNode.buffer = decodedAudioBuffer;
      sourceNode.connect(audioDestination);

      // 5. Capture Video Stream from Canvas and combine with pristine captured Audio track from our hardware PCM node
      const videoStream = canvas.captureStream(30);
      const combinedStream = new MediaStream();

      // Add Video Track
      videoStream.getVideoTracks().forEach((track) => combinedStream.addTrack(track));
      
      // Add Audio Track (completely isolated digital PCM voice stream, absolutely immune to UI thread freeze/lag)
      audioDestination.stream.getAudioTracks().forEach((track) => combinedStream.addTrack(track));

      // 6. Set up MediaRecorder for 100% Client-Side WebM with high-quality Audio
      let options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }

      console.log(`[ShortsStudio:Export] Recording combined client-side video/audio using mimeType: ${options.mimeType}`);
      const recorder = new MediaRecorder(combinedStream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        setExportProgress(100);
        setExportStatus('100% 클라이언트 기반 렌더링 완료! 저장 중...');

        const webmBlob = new Blob(chunks, { type: 'video/webm' });
        const webmUrl = URL.createObjectURL(webmBlob);
        
        const a = document.createElement('a');
        a.href = webmUrl;
        a.download = `${shortsResult.restaurantName || 'shorts'}_shorts_9x16.webm`;
        a.click();
        URL.revokeObjectURL(webmUrl);

        // Cleanup resources
        try {
          sourceNode.stop();
        } catch (e) {}
        exportAudioCtx.close().catch(() => {});

        setTimeout(() => {
          setIsExportingVideo(false);
          setExportProgress(0);
          setExportStatus('');
        }, 1500);
      };

      // Start Recording and Play AudioBufferSourceNode exactly simultaneously
      recorder.start();
      sourceNode.start(0);

      setExportStatus('비디오 프레임 인코딩 시작...');
      
      // Render each scene onto canvas based on preloaded image objects
      const totalFrames = shortsResult.scenes.reduce((acc, sc) => acc + Math.round((sc.durationSec || 5.0) * 30), 0);
      let cumulativeFramesRendered = 0;

      for (let sIdx = 0; sIdx < totalScenes; sIdx++) {
        const sc = shortsResult.scenes[sIdx];
        const img = loadedImages[sIdx];

        const durationSec = sc.durationSec || 5.0;
        const frames = Math.round(durationSec * 30); // 30fps

        for (let f = 0; f < frames; f++) {
          const scale = 1.0 + (f / frames) * 0.06; // subtle zoom
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw background image centered with zoom
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.scale(scale, scale);
          ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
          ctx.restore();

          // Dark overlay gradient for subtitles
          const grad = ctx.createLinearGradient(0, canvas.height - 300, 0, canvas.height);
          grad.addColorStop(0, 'rgba(0,0,0,0)');
          grad.addColorStop(1, 'rgba(0,0,0,0.85)');
          ctx.fillStyle = grad;
          ctx.fillRect(0, canvas.height - 300, canvas.width, 300);

          // Hook Title (Top)
          ctx.fillStyle = '#FFE600';
          ctx.font = 'bold 36px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 8;
          ctx.fillText(sc.hookText, canvas.width / 2, 140);

          // Custom Subtitle Overlay with Preset Options
          const canvasFontSize = 
            subFontSize === 'small' ? 18 :
            subFontSize === 'medium' ? 24 :
            subFontSize === 'large' ? 32 : 40;
          
          const canvasFontFamily = 
            subFontFamily === 'sans-serif' ? 'sans-serif' :
            subFontFamily === 'serif' ? 'Georgia, serif' :
            subFontFamily === 'monospace' ? 'monospace' : 'Impact, sans-serif';

          const canvasSubY = 
            subPosition === 'bottom' ? canvas.height - 120 :
            subPosition === 'top' ? 280 : canvas.height / 2;

          ctx.font = `bold ${canvasFontSize}px ${canvasFontFamily}`;
          ctx.textAlign = 'center';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 6;

          if (subBgOpacity > 0) {
            const textWidth = ctx.measureText(sc.subtitle).width;
            const boxWidth = Math.min(textWidth + 40, canvas.width - 40);
            const boxHeight = canvasFontSize * 1.6;
            const boxX = (canvas.width - boxWidth) / 2;
            const boxY = canvasSubY - canvasFontSize / 2 - (canvasFontSize * 0.4);

            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${subBgOpacity})`;
            ctx.shadowColor = 'transparent';
            ctx.beginPath();
            if (ctx.roundRect) {
              ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 14);
            } else {
              ctx.rect(boxX, boxY, boxWidth, boxHeight);
            }
            ctx.fill();
            ctx.restore();
          }

          ctx.fillStyle = subColor;
          ctx.fillText(sc.subtitle, canvas.width / 2, canvasSubY);

          // Top Segment Bar
          ctx.fillStyle = 'rgba(255,255,255,0.4)';
          ctx.fillRect(40, 40, canvas.width - 80, 8);
          ctx.fillStyle = '#FF5500';
          const progWidth = ((sIdx + f / frames) / shortsResult.scenes.length) * (canvas.width - 80);
          ctx.fillRect(40, 40, progWidth, 8);

          // Calculate overall progress and update state
          const currentFrame = cumulativeFramesRendered + f;
          const overallProgress = Math.min(Math.round((currentFrame / totalFrames) * 92), 92); // Up to 92%
          
          setExportProgress(overallProgress);
          setExportStatus(`씬 ${sIdx + 1}/${totalScenes} 비디오 프레임 인코딩 중 (${Math.round((f / frames) * 100)}%)...`);

          await new Promise((r) => setTimeout(r, 33));
        }

        cumulativeFramesRendered += frames;

        // Individual scenes are drawn seamlessly without blocking or interrupting the continuous audio flow
      }

      setExportProgress(95);
      setExportStatus('최종 비디오 트랙과 오디오 채널 결합(Muxing) 마감 중...');
      recorder.stop();
    } catch (err) {
      console.error('Canvas export error:', err);
      setIsExportingVideo(false);
      setExportProgress(0);
      setExportStatus('');
      exportAudioCtx.close().catch(() => {});
    }
  };

  if (!isOpen) return null;

  const currentScene = shortsResult?.scenes[currentSceneIndex] || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      {/* Hidden canvas for video export */}
      <canvas ref={canvasRef} width={540} height={960} className="hidden" />

      <div className="relative w-full max-w-6xl bg-slate-900 border border-amber-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] text-white">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-500 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  맛집 숏츠(Shorts) & 릴스 AI 스튜디오
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-xs">
                  9:16 FULL AI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                초강력 후킹 대본, 9:16 버티컬 비주얼, AI 나레이션 및 원클릭 영상 내보내기
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {shortsResult && (
              <button
                id="shorts-save-button"
                onClick={handleSaveShorts}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
                  isSavedCurrent
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border border-emerald-400/50 shadow-emerald-950/40'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white border border-orange-400/40 shadow-orange-950/40'
                }`}
              >
                {isSavedCurrent ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>보관함 저장 완료</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-3.5 h-3.5 text-white" />
                    <span>보관함 저장</span>
                  </>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Floating In-App Toast Notification (Zero Native Dialogs) */}
        {toastMessage && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-3 duration-200 pointer-events-auto">
            <div
              className={`px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-emerald-950/50'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-950/95 text-rose-200 border-rose-500/60 shadow-rose-950/50'
                  : 'bg-slate-900/95 text-slate-200 border-slate-700/80 shadow-black/50'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : toastMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
              <button
                onClick={() => setToastMessage(null)}
                className="ml-1 text-slate-400 hover:text-white p-0.5 rounded-md"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Studio Content: Split into Left Player / Right Configuration & Scripts */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          {/* LEFT: 9:16 Smartphone Preview Player (Cols: 5) */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-slate-800">
            {shortsResult && currentScene ? (
              <div className="w-full max-w-[320px] sm:max-w-[340px] space-y-4">
                {/* 9:16 Smartphone Mockup Frame */}
                <div className="relative aspect-[9/16] w-full rounded-[36px] bg-black border-[7px] border-slate-700 shadow-2xl overflow-hidden group">
                  {/* Top Phone Speaker Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-900 rounded-full z-30 flex items-center justify-center">
                    <div className="w-8 h-1.5 bg-slate-700 rounded-full" />
                  </div>

                  {/* Segmented Top Stories / Reels Progress Bar */}
                  <div className="absolute top-8 left-3 right-3 z-30 flex items-center gap-1.5">
                    {shortsResult.scenes.map((sc, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentSceneIndex(idx);
                          setSceneProgress(0);
                        }}
                        className="flex-1 h-1.5 bg-white/30 rounded-full overflow-hidden cursor-pointer"
                      >
                        <div
                          className="h-full bg-orange-400 transition-all duration-75"
                          style={{
                            width:
                              idx < currentSceneIndex
                                ? '100%'
                                : idx === currentSceneIndex
                                ? `${sceneProgress}%`
                                : '0%',
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Scene Visual Background (with Ken Burns subtle zoom) */}
                  <div className="absolute inset-0 z-10 overflow-hidden">
                    <img
                      src={currentScene.imageUrl}
                      alt=""
                      className={`w-full h-full object-cover transition-transform duration-700 ${
                        isPlaying ? 'scale-105' : 'scale-100'
                      }`}
                      referrerPolicy="no-referrer"
                    />
                    {/* Dark gradient for text visibility */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80 pointer-events-none" />
                  </div>

                  {/* Top Scene Hook Headline */}
                  <div className="absolute top-16 left-4 right-4 z-20 text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-orange-500/90 text-white font-black text-xs shadow-md mb-2">
                      SCENE {currentScene.sceneNumber} · {currentScene.timeRange}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-yellow-300 drop-shadow-[0_3px_5px_rgba(0,0,0,0.9)] tracking-tight leading-snug">
                      {currentScene.hookText}
                    </h3>
                  </div>

                  {/* Center Action (Play/Pause on click) */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20"
                  >
                    <div className="w-14 h-14 rounded-full bg-orange-500/80 backdrop-blur-md flex items-center justify-center text-white shadow-xl hover:scale-110 transition-transform">
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                    </div>
                  </button>

                  {/* Subtitles & Narration Box (with Preset Customization) */}
                  <div 
                    className={`absolute z-20 transition-all duration-300 left-4 right-4 ${
                      subPosition === 'bottom' ? 'bottom-12' : 
                      subPosition === 'top' ? 'top-28' : 'top-[50%] -translate-y-1/2'
                    }`}
                  >
                    <div 
                      className="p-3.5 rounded-2xl border border-white/10 text-center shadow-2xl transition-all duration-300"
                      style={{ 
                        backgroundColor: `rgba(0, 0, 0, ${subBgOpacity})`,
                        backdropFilter: subBgOpacity > 0 ? 'blur(8px)' : 'none'
                      }}
                    >
                      <p 
                        className={`font-black leading-relaxed transition-all duration-300 ${
                          subFontSize === 'small' ? 'text-xs sm:text-[13px]' :
                          subFontSize === 'medium' ? 'text-[13px] sm:text-base' :
                          subFontSize === 'large' ? 'text-base sm:text-[19px]' : 'text-lg sm:text-[23px]'
                        } ${
                          subFontFamily === 'sans-serif' ? 'font-sans' :
                          subFontFamily === 'serif' ? 'font-serif' :
                          subFontFamily === 'monospace' ? 'font-mono' : ''
                        }`}
                        style={{ 
                          color: subColor,
                          fontFamily: subFontFamily === 'impact' ? 'Impact, Charcoal, sans-serif' : undefined,
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}
                      >
                        {currentScene.subtitle}
                      </p>
                    </div>

                    {/* Audio BGM indicator */}
                    {subPosition === 'bottom' && (
                      <div className="flex items-center justify-between text-[10px] text-slate-300 px-2 mt-2 bg-black/40 backdrop-blur-sm py-1 rounded-lg">
                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                          <Music className="w-3 h-3 text-rose-400" />
                          {shortsResult.bgmRecommendation}
                        </span>
                        <span className="font-bold text-orange-400">
                          {currentScene.durationSec}초
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Quick AI Image Refresh Overlay */}
                  <div className="absolute top-16 right-3 z-30 flex flex-col gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateSceneImage(currentSceneIndex);
                      }}
                      disabled={isGeneratingSceneImg === currentSceneIndex}
                      className="p-2 rounded-xl bg-black/60 hover:bg-orange-600 text-white backdrop-blur-md border border-white/20 transition-all shadow-md active:scale-95 flex items-center justify-center"
                      title="이 씬의 9:16 AI 세로 사진 새로고침"
                    >
                      {isGeneratingSceneImg === currentSceneIndex ? (
                        <Sparkles className="w-4 h-4 animate-spin text-amber-300" />
                      ) : (
                        <Camera className="w-4 h-4 text-white" />
                      )}
                    </button>

                    {/* Simulator Direct Upload */}
                    <label 
                      onClick={(e) => e.stopPropagation()}
                      className="p-2 rounded-xl bg-black/60 hover:bg-emerald-600 text-white backdrop-blur-md border border-white/20 transition-all shadow-md active:scale-95 flex items-center justify-center cursor-pointer"
                      title="이 씬에 모바일 실물 사진 업로드"
                    >
                      <Video className="w-4 h-4 text-emerald-300" />
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
                                const updatedScenes = [...shortsResult.scenes];
                                updatedScenes[currentSceneIndex] = {
                                  ...updatedScenes[currentSceneIndex],
                                  imageUrl: await uploadBase64ImageToFirestore(reader.result),
                                };
                                const updatedResult = { ...shortsResult, scenes: updatedScenes };
                                setShortsResult(updatedResult);

                                if (user) {
                                  console.log(`[ShortsStudio:SimulatorUpload] Asynchronously syncing uploaded image for scene ${currentSceneIndex + 1} to Firestore. Project ID: ${updatedResult.id}`);
                                  saveShortsToFirestoreDirectly(user.uid, updatedResult)
                                    .then(() => {
                                      console.log(`[ShortsStudio:SimulatorUpload] Successfully persisted uploaded image for scene ${currentSceneIndex + 1} to Firestore.`);
                                      showToast(`씬 ${currentSceneIndex + 1} 사용자 이미지가 Firestore에 직접 저장되었습니다!`, 'success');
                                    })
                                    .catch((err) => {
                                      console.error(`[ShortsStudio:SimulatorUpload] Failed to save uploaded image:`, err);
                                      const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
                                      setSavedShortsList(updatedList);
                                      saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
                                    });
                                } else {
                                  const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
                                  setSavedShortsList(updatedList);
                                  saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
                                  showToast(`씬 ${currentSceneIndex + 1} 사용자 이미지가 직접 교체되었습니다!`, 'success');
                                }
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {/* Simulator Image Library button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenLibrary(currentSceneIndex);
                      }}
                      className="p-2 rounded-xl bg-black/60 hover:bg-sky-600 text-white backdrop-blur-md border border-white/20 transition-all shadow-md active:scale-95 flex items-center justify-center"
                      title="공용 이미지 라이브러리 열기"
                    >
                      <Layers className="w-4 h-4 text-sky-400" />
                    </button>

                    {/* REPRESENTATIVE'S INNOVATIVE AUDIO SYNTHESIS BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateUnifiedVoice();
                      }}
                      disabled={isSynthesizingAudio}
                      className={`p-2 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center border backdrop-blur-md ${
                        preRenderedAudioBase64 
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-400' 
                          : 'bg-black/60 hover:bg-orange-600 text-white border-white/20'
                      }`}
                      title={preRenderedAudioBase64 ? "🎙️ 무소음 마스터 음성 합성 완료 (클릭 시 재합성)" : "🎙️ 무소음 마스터 음성 1초 한방 합성"}
                    >
                      <Mic className={`w-4 h-4 ${isSynthesizingAudio ? 'animate-bounce text-yellow-300' : preRenderedAudioBase64 ? 'text-white' : 'text-orange-400'}`} />
                    </button>
                  </div>
                </div>

                {/* Player Controls Under Phone */}
                <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setCurrentSceneIndex((idx) => Math.max(0, idx - 1));
                        setSceneProgress(0);
                      }}
                      className="p-2 rounded-xl hover:bg-slate-700 text-slate-300 transition-colors"
                      title="이전 씬"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="p-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white shadow-md active:scale-95 flex items-center justify-center"
                      title={isPlaying ? '일시정지' : '재생'}
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() => {
                        setCurrentSceneIndex((idx) =>
                          Math.min(shortsResult.scenes.length - 1, idx + 1)
                        );
                        setSceneProgress(0);
                      }}
                      className="p-2 rounded-xl hover:bg-slate-700 text-slate-300 transition-colors"
                      title="다음 씬"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (!isMuted) stopNarration();
                      }}
                      className={`p-2 rounded-xl border transition-colors ${
                        isMuted
                          ? 'bg-rose-950/60 border-rose-700/60 text-rose-400'
                          : 'bg-slate-700/60 border-slate-600 text-emerald-400'
                      }`}
                      title={isMuted ? '음성 나레이션 켜기' : '음성 나레이션 음소거'}
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>

                    <button
                      onClick={() =>
                        setPlaybackSpeed((s) => (s === 1.0 ? 1.2 : s === 1.2 ? 1.4 : 1.0))
                      }
                      className="px-2 py-1.5 rounded-lg bg-slate-700 text-[10px] font-bold text-amber-300 hover:bg-slate-600"
                      title="나레이션 낭독 속도 조절"
                    >
                      {playbackSpeed}x
                    </button>

                    {preRenderedWavUrl ? (
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = preRenderedWavUrl;
                          a.download = `${shortsResult.restaurantName || 'shorts'}_narration.wav`;
                          a.click();
                          showToast('🎙️ 제미나이 마스터 나레이션 WAV 다운로드 완료!', 'success');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-600 text-[10px] font-bold text-white hover:text-emerald-100 transition-colors flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                        title="제미나이 성우 나레이션 WAV 음성 파일 직접 다운로드"
                      >
                        <Music className="w-3.5 h-3.5 text-white" />
                        <span>음성 다운로드</span>
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          const url = await handleGenerateUnifiedVoice();
                          if (url) {
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = `${shortsResult.restaurantName || 'shorts'}_narration.wav`;
                            a.click();
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-orange-600/90 text-[10px] font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1 border border-slate-700 hover:border-orange-500 shadow-sm active:scale-95 cursor-pointer"
                        title="명품 음성 실시간 합성 후 직접 다운로드"
                      >
                        <Mic className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                        <span>음성 합성 & 다운로드</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Video Export Button */}
                <button
                  onClick={handleExportVideo}
                  disabled={isExportingVideo}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer"
                >
                  {isExportingVideo ? (
                    <>
                      <Sparkles className="w-4 h-4 animate-spin" />
                      <span>9:16 비디오 렌더링 중...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>9:16 비디오(WebM/MP4) 바로 다운로드</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Empty Placeholder before generation */
              <div className="w-full max-w-[300px] aspect-[9/16] rounded-[36px] bg-slate-950 border-[6px] border-slate-800 flex flex-col items-center justify-center p-6 text-center space-y-4 shadow-xl">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 text-orange-400 flex items-center justify-center shadow-inner">
                  <Smartphone className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm text-white">9:16 쇼츠 프리뷰 대기 중</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    오른쪽 양식에서 맛집 정보를 입력하고 [AI 쇼츠 대본 & 스토리보드 생성]을 클릭하세요!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Input Settings & Storyboard Tabs (Cols: 7) */}
          <div className="lg:col-span-7 bg-slate-900 p-6 flex flex-col space-y-6 overflow-y-auto">
            {/* Quick Presets / Mode Bar */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setActiveTab('player')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'player'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>스토리보드 & 설정</span>
                </button>

                {shortsResult && (
                  <button
                    onClick={() => setActiveTab('script')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      activeTab === 'script'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>대본 & 캡컷 복사</span>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('saved')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeTab === 'saved'
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>쇼츠 보관함 ({savedShortsList.length})</span>
                </button>
              </div>

              {initialData?.blogContent && (
                <span className="text-[11px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full font-semibold">
                  블로그 글 연동됨
                </span>
              )}
            </div>

            {/* TAB 1: Player & Storyboard Settings */}
            {activeTab === 'player' && (
              <div className="space-y-6">
                {/* Generation Input Card */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/50">
                    <span className="text-xs font-black text-orange-400 flex items-center gap-1.5">
                      <Flame className="w-4 h-4 animate-pulse" /> 맛집 기본 정보 설정
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                      <span className="font-extrabold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20">✨ AI 추천:</span>
                      <button
                        onClick={() => {
                          setRestaurantName('소문난 성수 감자탕');
                          setLocation('서울 성동구 연무장길 (성수역 4번 출구 200m)');
                          setMenuItems('시그니처 우거지 감자탕, 수제 수제비 사리, 날치알 볶음밥');
                          setFeatures('24시간 우려낸 명품 등뼈 육수, 야들야들한 살코기, 성수동 연무장길 독보적 1위 웨이팅 맛집');
                          setTone('hype_fast');
                          setStyleLock('cinematic');
                          setTargetDuration(30);
                        }}
                        className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 hover:text-amber-400 text-slate-300 rounded-lg border border-slate-700/60 transition-all text-[11px] active:scale-95 cursor-pointer"
                      >
                        🍲 성수 감자탕
                      </button>
                      <button
                        onClick={() => {
                          setRestaurantName('멜팅치즈 연남 수제버거');
                          setLocation('서울 마포구 동교로 (연남동 미로길 안쪽)');
                          setMenuItems('트러플 치즈 더블버거, 허니 버터 고구마 프라이, 시원한 생맥주');
                          setFeatures('매일 새벽 직접 손질하는 100% 비프 패티, 흘러넘치는 아메리칸 멜팅 치즈, 인스타 감성의 세련된 미드센추리 인테리어');
                          setTone('vlog_calm');
                          setStyleLock('warm');
                          setTargetDuration(30);
                        }}
                        className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 hover:text-amber-400 text-slate-300 rounded-lg border border-slate-700/60 transition-all text-[11px] active:scale-95 cursor-pointer"
                      >
                        🍔 연남 수제버거
                      </button>
                      <button
                        onClick={() => {
                          setRestaurantName('우우 강남 와규 다이닝');
                          setLocation('서울 강남구 테헤란로 (역삼역 8번 출구 150m)');
                          setMenuItems('프리미엄 최고급 와규 모듬구이, 한우 투뿔 우니 육회, 가마솥 곤드레 밥');
                          setFeatures('완벽한 눈꽃 마블링, 최고급 참숯 화로구이, 100% 개별 프라이빗 룸으로 조용하고 럭셔리한 분위기');
                          setTone('gourmet_expert');
                          setStyleLock('minimal');
                          setTargetDuration(45);
                        }}
                        className="px-2 py-0.5 bg-slate-800/80 hover:bg-slate-700 hover:text-amber-400 text-slate-300 rounded-lg border border-slate-700/60 transition-all text-[11px] active:scale-95 cursor-pointer"
                      >
                        🥩 강남 야키니쿠
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">식당 이름 *</label>
                      <input
                        type="text"
                        value={restaurantName}
                        onChange={(e) => setRestaurantName(e.target.value)}
                        placeholder="예: 소문난 성수 감자탕"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">위치 / 역세권</label>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="예: 서울 성동구 성수역 4번 출구"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">대표 메뉴</label>
                      <input
                        type="text"
                        value={menuItems}
                        onChange={(e) => setMenuItems(e.target.value)}
                        placeholder="예: 시그니처 감자탕, 볶음밥"
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">
                        쇼츠 톤앤매너
                      </label>
                      <select
                        value={tone}
                        onChange={(e) => setTone(e.target.value as ShortsTone)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                      >
                        <option value="hype_fast">침샘 자극 텐션 업 (빠른 템포/MZ 숏폼)</option>
                        <option value="vlog_calm">감성 힐링 브이로그 (차분/인스타 릴스)</option>
                        <option value="honest_fact">내돈내산 솔직 팩트 체크 (광고X 솔직리뷰)</option>
                        <option value="gourmet_expert">미식가 심층 분석 (식재료/풍미 중심)</option>
                      </select>
                    </div>
                  </div>

                  {/* Visual Style Lock Selector */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 mt-1">
                    <span className="text-xs text-slate-400">🎨 이미지 비주얼 스타일 일치 (Style Lock):</span>
                    <select
                      value={styleLock}
                      onChange={(e) => setStyleLock(e.target.value as any)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    >
                      <option value="cinematic">시네마틱 푸드 스튜디오 (기본 고화질)</option>
                      <option value="warm">따뜻한 내추럴 천연 채광 (감성 브이로그)</option>
                      <option value="minimal">미니멀리스트 퓨전 (깔끔하고 선명한 단색 배경)</option>
                      <option value="retro">레트로 빈티지 광고 스타일 (필름 카메라 질감)</option>
                    </select>
                  </div>

                  {/* Target Duration Selector */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">영상 목표 길이:</span>
                    <div className="flex items-center gap-1.5">
                      {[30, 45, 60].map((dur) => (
                        <button
                          key={dur}
                          type="button"
                          onClick={() => setTargetDuration(dur)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            targetDuration === dur
                              ? 'bg-orange-500 text-white'
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {dur}초
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtitle Styling Controls */}
                  <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 pt-3">
                    <span className="text-[11px] font-extrabold text-amber-400 flex items-center gap-1">
                      ✏️ AI 쇼츠 자막 디자인 설정 (실시간 반영)
                    </span>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {/* Position Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">자막 위치</label>
                        <select
                          value={subPosition}
                          onChange={(e) => setSubPosition(e.target.value as any)}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none"
                        >
                          <option value="bottom">하단 (기본 숏폼 스타일)</option>
                          <option value="middle">중앙 (임팩트 후킹 스타일)</option>
                          <option value="top">상단 (헤드라인 스타일)</option>
                        </select>
                      </div>

                      {/* Font Family Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">폰트 스타일</label>
                        <select
                          value={subFontFamily}
                          onChange={(e) => setSubFontFamily(e.target.value as any)}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none"
                        >
                          <option value="sans-serif">고딕체 (깔끔하고 선명)</option>
                          <option value="serif">명조체 (감성 브이로그)</option>
                          <option value="monospace">독특한 코딩체</option>
                          <option value="impact">임팩트 굵은체 (Hype Bold)</option>
                        </select>
                      </div>

                      {/* Font Size Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">글자 크기</label>
                        <select
                          value={subFontSize}
                          onChange={(e) => setSubFontSize(e.target.value as any)}
                          className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none"
                        >
                          <option value="small">작게</option>
                          <option value="medium">중간 (기본)</option>
                          <option value="large">크게</option>
                          <option value="xl">아주 크게</option>
                        </select>
                      </div>

                      {/* Subtitle Color Selector */}
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 block">글자 색상</label>
                        <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1">
                          <input
                            type="color"
                            value={subColor}
                            onChange={(e) => setSubColor(e.target.value)}
                            className="w-5 h-5 bg-transparent border-0 cursor-pointer p-0"
                          />
                          <span className="text-[10px] font-mono uppercase text-slate-300">{subColor}</span>
                        </div>
                      </div>
                    </div>

                    {/* Subtitle Background Opacity */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-400">자막 배경 음영 세기:</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="0.95"
                          step="0.15"
                          value={subBgOpacity}
                          onChange={(e) => setSubBgOpacity(parseFloat(e.target.value))}
                          className="w-24 accent-orange-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-slate-300 w-8 text-right">
                          {Math.round(subBgOpacity * 100)}%
                        </span>
                      </div>
                    </div>

                    {/* BGM & TTS Audio Controls */}
                    <div className="border-t border-slate-800/80 pt-3 space-y-3">
                      <div className="flex items-center gap-1.5 text-orange-400 font-bold text-[11px]">
                        <Music className="w-3.5 h-3.5" />
                        <span>🎙️ AI 배경음악 & 프리미엄 성우 설정</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {/* TTS Voice Provider */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block">음성 합성 모델 (엔진)</label>
                          <select
                            value={ttsProvider}
                            onChange={(e) => setTtsProvider(e.target.value as any)}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none"
                          >
                            <option value="gemini">Gemini Premium (물 흐르는 플로우)</option>
                            <option value="google">Classic Google (정교한 고딕)</option>
                          </select>
                        </div>

                        {/* TTS Voice Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block">AI 성우 목소리 선택</label>
                          <select
                            value={ttsVoice}
                            disabled={ttsProvider !== 'gemini'}
                            onChange={(e) => setTtsVoice(e.target.value as any)}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none disabled:opacity-40"
                          >
                            <option value="Kore">Kore (여성 - 트렌디/MZ 추천)</option>
                            <option value="Zephyr">Zephyr (남성 - 부드러운 중저음)</option>
                            <option value="Puck">Puck (남성 - 밝고 위트있는)</option>
                            <option value="Charon">Charon (남성 - 묵직한 신뢰감)</option>
                            <option value="Fenrir">Fenrir (여성 - 에너제틱/설득력)</option>
                          </select>
                        </div>

                        {/* BGM Enabled Toggle */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block">배경음악 사용 여부</label>
                          <select
                            value={bgmEnabled ? "true" : "false"}
                            onChange={(e) => setBgmEnabled(e.target.value === "true")}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none"
                          >
                            <option value="true">음악 켜기 (BGM On)</option>
                            <option value="false">음악 끄기 (Mute - 나레이션만)</option>
                          </select>
                        </div>

                        {/* BGM Type Selector */}
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block">배경음악 장르 선택</label>
                          <select
                            value={bgmType}
                            disabled={!bgmEnabled}
                            onChange={(e) => setBgmType(e.target.value as any)}
                            className="w-full px-2 py-1 bg-slate-800 border border-slate-700 rounded-lg text-white text-[11px] focus:outline-none disabled:opacity-40"
                          >
                            <option value="lofi">Lofi Chill (기본 - 따뜻함)</option>
                            <option value="pop">Uplifting Pop (밝고 신남)</option>
                            <option value="jazz">Smooth Jazz (분위기 맛집)</option>
                            <option value="techno">Techno Bass (박진감 넘침)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleGenerateShorts}
                    disabled={isGenerating}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 via-amber-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-5 h-5 animate-spin" />
                        <span>AI 제미나이가 9:16 쇼츠 스토리보드를 제작 중입니다...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-5 h-5" />
                        <span>AI 쇼츠 대본 & 9:16 스토리보드 생성하기</span>
                      </>
                    )}
                  </button>

                  {errorMessage && (
                    <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                </div>

                {/* Generated Scenes Breakdown List */}
                {shortsResult && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-sm text-white flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-orange-400" />
                        <span>스토리보드 씬별 상세 타임라인 ({shortsResult.scenes.length}개 씬)</span>
                      </h3>
                      <span className="text-xs text-slate-400">
                        총 영상 길이: 약 {shortsResult.totalDuration}초
                      </span>
                    </div>

                    <div className="space-y-3">
                      {shortsResult.scenes.map((sc, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setCurrentSceneIndex(idx);
                            setSceneProgress(0);
                          }}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                            currentSceneIndex === idx
                              ? 'bg-slate-800/95 border-orange-500 ring-2 ring-orange-500/30 shadow-md'
                              : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Visual Scene Thumbnail with click preview capability */}
                            {sc.imageUrl && (
                              <div className="w-14 h-20 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 relative group/thumb shadow-sm">
                                <img src={sc.imageUrl} className="w-full h-full object-cover" alt={`Scene ${sc.sceneNumber}`} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-all">
                                  <Eye className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            )}

                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs ${
                                      currentSceneIndex === idx
                                        ? 'bg-orange-500 text-white'
                                        : 'bg-slate-800 text-slate-300'
                                    }`}
                                  >
                                    {sc.sceneNumber}
                                  </span>
                                  <div>
                                    <span className="text-[11px] font-bold text-orange-400">
                                      {sc.timeRange} ({sc.durationSec}초)
                                    </span>
                                    <h4 className="font-extrabold text-xs text-white line-clamp-1">
                                      {sc.hookText}
                                    </h4>
                                  </div>
                                </div>

                                <div className="flex items-center space-x-1.5 shrink-0">
                                  {/* Direct Image Upload Button */}
                                  <label 
                                    onClick={(e) => e.stopPropagation()}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer border border-slate-700"
                                    title="이 씬에 직접 사장님 실물 사진 업로드"
                                  >
                                    <Video className="w-3 h-3 text-emerald-400" />
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
                                              const updatedScenes = [...shortsResult.scenes];
                                              updatedScenes[idx] = {
                                                ...updatedScenes[idx],
                                                imageUrl: await uploadBase64ImageToFirestore(reader.result),
                                              };
                                              const updatedResult = { ...shortsResult, scenes: updatedScenes };
                                              setShortsResult(updatedResult);

                                              if (user) {
                                                console.log(`[ShortsStudio:Upload] Asynchronously syncing uploaded image for scene ${idx + 1} to Firestore. Project ID: ${updatedResult.id}`);
                                                saveShortsToFirestoreDirectly(user.uid, updatedResult)
                                                  .then(() => {
                                                    console.log(`[ShortsStudio:Upload] Successfully persisted uploaded image for scene ${idx + 1} to Firestore.`);
                                                    showToast(`씬 ${idx + 1} 사용자 이미지가 Firestore에 직접 저장되었습니다!`, 'success');
                                                  })
                                                  .catch((err) => {
                                                    console.error(`[ShortsStudio:Upload] Failed to save uploaded image:`, err);
                                                    const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
                                                    setSavedShortsList(updatedList);
                                                    saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
                                                  });
                                              } else {
                                                const updatedList = [updatedResult, ...savedShortsList.filter((s) => s.id !== updatedResult.id)];
                                                setSavedShortsList(updatedList);
                                                saveToLocalStorageSafely('blogai_saved_shorts', updatedList);
                                                showToast(`씬 ${idx + 1} 사용자 이미지가 직접 업로드 교체되었습니다!`, 'success');
                                              }
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                      }}
                                    />
                                  </label>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleGenerateSceneImage(idx);
                                    }}
                                    disabled={isGeneratingSceneImg === idx}
                                    className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:bg-orange-800 text-white text-[10px] font-black flex items-center gap-1 transition-colors"
                                  >
                                    {isGeneratingSceneImg === idx ? (
                                      <Sparkles className="w-3 h-3 animate-spin text-amber-300" />
                                    ) : (
                                      <Camera className="w-3 h-3 text-white" />
                                    )}
                                    <span>AI 사진 생성</span>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenLibrary(idx);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-700"
                                    title="공용 이미지 라이브러리에서 사진 가져오기"
                                  >
                                    <Layers className="w-3 h-3 text-sky-400" />
                                    <span>이미지 라이브러리</span>
                                  </button>
                                </div>
                              </div>

                              {/* Narration script & subtitle */}
                              <div className="space-y-1.5 text-xs" onClick={(e) => e.stopPropagation()}>
                                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 leading-relaxed flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="font-extrabold text-orange-400 text-[10px] flex items-center gap-1">🎙️ 나레이션 대본 편집 (Gemini TTS 읽기 자막)</span>
                                    <span className="text-[9px] text-slate-500 font-mono">수정 시 즉시 오디오 실시간 동기화</span>
                                  </div>
                                  <textarea
                                    value={sc.narration}
                                    onChange={(e) => {
                                      const updatedScenes = [...shortsResult.scenes];
                                      updatedScenes[idx] = {
                                        ...updatedScenes[idx],
                                        narration: e.target.value
                                      };
                                      setShortsResult({ ...shortsResult, scenes: updatedScenes });
                                      setPreRenderedAudioBase64(null);
                                      setPreRenderedWavUrl(null);
                                    }}
                                    className="w-full bg-slate-950/80 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none rounded-lg p-2 text-slate-200 resize-none font-medium leading-relaxed"
                                    rows={2}
                                    placeholder="예: [나레이션]:최고급 참숯 화로가 육즙을 완벽히 가둡니다."
                                  />
                                </div>

                                {/* Dynamic Image Prompt & AI Booster Area */}
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2.5 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-400 flex items-center gap-1">
                                      <Wand2 className="w-3 h-3 text-orange-400 animate-pulse" />
                                      <span>이미지 생성 프롬프트 수정</span>
                                    </span>
                                    
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEnhancePrompt(idx);
                                      }}
                                      disabled={isEnhancingPrompt === idx}
                                      className="text-[10px] text-amber-400 hover:text-amber-300 font-black flex items-center gap-1 hover:underline cursor-pointer"
                                      title="Gemini AI 기반 전문 시네마틱 푸드 프롬프트로 강화"
                                    >
                                      {isEnhancingPrompt === idx ? (
                                        <Sparkles className="w-2.5 h-2.5 animate-spin text-amber-400" />
                                      ) : (
                                        <Wand2 className="w-2.5 h-2.5 text-amber-400" />
                                      )}
                                      <span>AI 프롬프트 요술봉 보정</span>
                                    </button>
                                  </div>
                                  
                                  <textarea
                                    value={sc.imagePrompt || sc.visualDescription || ''}
                                    onChange={(e) => handleEditScenePrompt(idx, e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onBlur={async () => {
                                      if (user && shortsResult) {
                                        try {
                                          await saveShortsToFirestoreDirectly(user.uid, shortsResult);
                                          showToast(`씬 ${idx + 1} 프롬프트 수정사항이 Firestore에 직접 저장되었습니다!`, 'success');
                                        } catch (e) {
                                          console.warn('Failed to save prompt to Firestore on blur:', e);
                                        }
                                      }
                                    }}
                                    className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:outline-none rounded-lg text-[11px] text-white font-mono leading-relaxed resize-none"
                                    rows={2}
                                    placeholder="상세 이미지 묘사를 한글 또는 영문으로 입력해 주세요."
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Script & One-Click Copy for CapCut / Premiere */}
            {activeTab === 'script' && shortsResult && (
              <div className="space-y-4">
                {/* Title and Tags Card */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400">유튜브 쇼츠 / 릴스 제목</span>
                    <button
                      onClick={() => copyText(shortsResult.title, 'title')}
                      className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedType === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedType === 'title' ? '복사됨!' : '제목 복사'}</span>
                    </button>
                  </div>
                  <p className="text-sm font-bold text-white bg-slate-900 p-3 rounded-xl border border-slate-800">
                    {shortsResult.title}
                  </p>
                </div>

                {/* Full Narration Timecode for CapCut */}
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-400">
                      타임라인 전체 대본 (캡컷/프리미어 자막용)
                    </span>
                    <button
                      onClick={() => {
                        const fullScript = shortsResult.scenes
                          .map(
                            (s) =>
                              `[${s.timeRange}] ${s.hookText}\n나레이션: ${s.narration}\n자막: ${s.subtitle}\n`
                          )
                          .join('\n');
                        copyText(fullScript, 'fullScript');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5"
                    >
                      {copiedType === 'fullScript' ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedType === 'fullScript' ? '대본 전체 복사 완료!' : '전체 대본 복사'}</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                    {shortsResult.scenes.map((s, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-400">
                          <span>Scene {s.sceneNumber} ({s.timeRange})</span>
                          <span>자막: {s.hookText}</span>
                        </div>
                        <p className="text-slate-200">{s.narration}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Filming Tips Card */}
                {shortsResult.filmingTips && shortsResult.filmingTips.length > 0 && (
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> 쇼츠 현장 촬영 꿀팁
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {shortsResult.filmingTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-orange-400 font-bold">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Saved Shorts Drawer/List */}
            {activeTab === 'saved' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-orange-400 flex items-center gap-1.5">
                    <Bookmark className="w-4 h-4" />
                    <span>저장된 쇼츠 프로젝트 ({savedShortsList.length}건)</span>
                  </h3>
                </div>

                {savedShortsList.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-950 border border-slate-800 text-slate-400 space-y-2">
                    <Film className="w-8 h-8 mx-auto text-slate-600" />
                    <p className="text-xs">아직 저장된 쇼츠 프로젝트가 없습니다.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                    {savedShortsList.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-white">
                              {item.restaurantName}
                            </span>
                            <span className="text-[10px] text-orange-400 font-bold">
                              {item.targetDuration}초 쇼츠
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 line-clamp-1">{item.title}</p>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => {
                              setShortsResult(item);
                              if (item.restaurantName) setRestaurantName(item.restaurantName);
                              if (item.location) setLocation(item.location);
                              if (item.tone) setTone(item.tone);
                              if (item.targetDuration) setTargetDuration(item.targetDuration);
                              setCurrentSceneIndex(0);
                              setSceneProgress(0);
                              setIsPlaying(false);
                              setIsSavedCurrent(true);
                              setActiveTab('player');
                              showToast(`'${item.restaurantName}' 프로젝트를 플레이어로 불러왔습니다.`, 'info');
                            }}
                            className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500 text-orange-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
                          >
                            열기
                          </button>
                          <button
                            onClick={() => handleDeleteShorts(item.id)}
                            className="p-1.5 rounded-xl hover:bg-rose-900/60 text-slate-500 hover:text-rose-400 transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* === 비디오 인코딩 및 오디오 멀티플렉싱 실시간 진행 상황 다이얼로그 (Progress Overlay) === */}
        {isExportingVideo && (
          <div className="absolute inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-slate-900 border border-orange-500/30 rounded-3xl p-8 shadow-2xl space-y-6 flex flex-col items-center text-center">
              {/* Spinning/pulsing graphic depicting soundwaves merging with film */}
              <div className="relative w-24 h-24 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-dashed border-orange-500/30 animate-spin" style={{ animationDuration: '10s' }} />
                <div className="absolute w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-lg animate-pulse">
                  <Film className="w-8 h-8" />
                </div>
                {/* Audio waves surrounding */}
                <div className="absolute -bottom-1 flex items-center gap-0.5 justify-center">
                  <span className="w-1 h-3 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1 h-5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                  <span className="w-1 h-2 bg-rose-400 rounded-full animate-bounce" style={{ animationDelay: '0.5s' }} />
                  <span className="w-1 h-4 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>

              {/* Text labels */}
              <div className="space-y-2">
                <h3 className="text-base font-black tracking-tight text-white flex items-center justify-center gap-1.5">
                  <span>9:16 비디오 & 오디오 합성 중</span>
                  <span className="text-orange-400 text-xs">({exportProgress}%)</span>
                </h3>
                <p className="text-xs text-slate-400 font-bold min-h-[32px] max-w-[320px] mx-auto leading-relaxed">
                  {exportStatus}
                </p>
              </div>

              {/* Progress track */}
              <div className="w-full space-y-1.5">
                <div className="w-full h-3 bg-slate-950 border border-slate-800 rounded-full overflow-hidden relative p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-full transition-all duration-300 relative"
                    style={{ width: `${exportProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0.15)_75%,transparent_75%,transparent)] bg-[length:16px_16px] animate-[shimmer_1s_linear_infinite]" />
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold">
                  <span>START</span>
                  <span className="text-amber-400">오디오 멀티플렉싱(Muxing) 활성화</span>
                  <span>100% COMPLETE</span>
                </div>
              </div>

              {/* Tip / helper text */}
              <div className="pt-2 border-t border-slate-850 w-full">
                <p className="text-[10px] text-slate-500 leading-normal">
                  * 오디오 데이터 소실 방지를 위해 다운로드 팝업이 나타날 때까지<br />
                  브라우저 탭을 닫거나 다른 페이지로 이동하지 마세요.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* === 공용 이미지 라이브러리 다이얼로그 (대표님 맞춤 스펙) === */}
        {isLibraryOpen && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <div>
                    <h3 className="text-sm font-black text-white">공용 이미지 라이브러리</h3>
                    <p className="text-[11px] text-slate-400">대표님들의 소중한 AI 생성/수집 200KB 고효질 압축 이미지 저장소</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsLibraryOpen(false);
                    setLibraryTargetSceneIdx(null);
                  }}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search filter */}
              <div className="p-4 border-b border-slate-850 bg-slate-950/40">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="해시태그나 키워드로 이미지 검색 (예: #성수동, #족발)..."
                    value={librarySearchFilter}
                    onChange={(e) => setLibrarySearchFilter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
                  />
                  {librarySearchFilter && (
                    <button
                      onClick={() => setLibrarySearchFilter('')}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                    >
                      초기화
                    </button>
                  )}
                </div>
              </div>

              {/* Grid content */}
              <div className="flex-1 p-5 overflow-y-auto min-h-[300px]">
                {/* Filter assets */}
                {(() => {
                  const filtered = allSharedAssets.filter((asset) => {
                    if (!librarySearchFilter.trim()) return true;
                    return asset.searchKeyword?.toLowerCase().includes(librarySearchFilter.toLowerCase());
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                        <Layers className="w-10 h-10 text-slate-600 mb-3" />
                        <p className="text-xs font-bold">해당 키워드의 이미지 라이브러리가 비어있습니다.</p>
                        <p className="text-[10px] text-slate-600 mt-1">쇼츠에서 AI 사진을 새로 생성하면 이곳에 자동 축적됩니다!</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {filtered.map((asset) => (
                        <div
                          key={asset.id}
                          onClick={() => handleSelectLibraryImage(asset.imageContent)}
                          className="group bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden cursor-pointer hover:border-sky-500 transition-all shadow-md active:scale-98 flex flex-col relative"
                        >
                          <div className="aspect-[9/16] w-full bg-slate-900 overflow-hidden relative">
                            <img
                              src={asset.imageContent}
                              alt={asset.searchKeyword}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="px-3 py-1.5 rounded-xl bg-sky-500 text-white font-extrabold text-[10px]">이 씬에 적용</span>
                            </div>
                          </div>
                          <div className="p-2.5 flex items-center justify-between text-[11px] font-bold text-slate-300 border-t border-slate-850 bg-slate-950/80">
                            <span className="text-sky-400 truncate max-w-[100px]">{asset.searchKeyword || '#식당'}</span>
                            <span className="text-slate-500 text-[10px]">
                              {asset.imageContent ? `${(asset.imageContent.length * 0.75 / 1024).toFixed(1)}KB` : '0KB'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
