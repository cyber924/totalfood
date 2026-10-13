import React, { useState, useEffect } from 'react';
import { BlogInputForm, GeneratedBlogResult, GeneratedSnsRecord, GeneratedShortsResult } from './types';
import { SAMPLE_PRESETS } from './data/samplePresets';
import { Navbar } from './components/Navbar';
import { HeroHeader } from './components/HeroHeader';
import { BlogGeneratorForm } from './components/BlogGeneratorForm';
import { BlogResultDisplay } from './components/BlogResultDisplay';
import { BlogHistoryDrawer } from './components/BlogHistoryDrawer';
import { FirebaseAuthModal } from './components/FirebaseAuthModal';
import { ShortsStudioModal } from './components/ShortsStudioModal';
import { SnsStudioModal } from './components/SnsStudioModal';
import { ShortsStatsWidget } from './components/ShortsStatsWidget';
import { AdminConsolePage } from './components/AdminConsolePage';
import { FeaturesSection } from './components/FeaturesSection';
import { Sparkles, Utensils, AlertCircle, Flame, BookOpen } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { savePostToFirestore, deletePostFromFirestore, subscribeUserPosts } from './services/blogService';
import { saveSnsToFirestore, deleteSnsFromFirestore, subscribeUserSns, saveSnsToFirestoreDirectly } from './services/snsService';
import { subscribeAllPosts } from './services/adminService';
import { saveShortsToFirestore, subscribeUserShorts, saveShortsToFirestoreDirectly } from './services/shortsService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { checkAndRunPendingReservations } from './services/reservationService';
import { MigrationModal } from './components/MigrationModal';
import { MIGRATION_BACKUP_DATA } from './data/migrationSourceData';
import { TrendingFoodKeywordsCard } from './components/TrendingFoodKeywordsCard';
import { TrendingFoodKeyword } from './types';
import { WebzineGallery } from './components/WebzineGallery';
import { WebzineArticleViewer } from './components/WebzineArticleViewer';

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

function MainApp() {
  const { user } = useAuth();
  const [isMigrationModalOpen, setIsMigrationModalOpen] = useState<boolean>(false);
  const [selectedTrendingId, setSelectedTrendingId] = useState<string | null>(null);

  // On-access trigger for pending automated scheduled reservations
  useEffect(() => {
    if (user) {
      console.log('[Queue Trigger] Performing on-access scheduled reservation check.');
      checkAndRunPendingReservations(user.uid);
    }
  }, [user]);

  // Input Form State
  const [formData, setFormData] = useState<BlogInputForm>({ ...SAMPLE_PRESETS[0].input });

  // Generation & Results State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [generatedResult, setGeneratedResult] = useState<GeneratedBlogResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Saved Drafts (Synced with Firestore when logged in, LocalStorage fallback)
  const [savedPosts, setSavedPosts] = useState<GeneratedBlogResult[]>([]);
  const [savedSnsRecords, setSavedSnsRecords] = useState<GeneratedSnsRecord[]>([]);
  const [savedShortsList, setSavedShortsList] = useState<GeneratedShortsResult[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  // Webzine Selection and Posts States
  const [selectedWebzinePost, setSelectedWebzinePost] = useState<GeneratedBlogResult | null>(null);
  const [allWebzinePosts, setAllWebzinePosts] = useState<GeneratedBlogResult[]>([]);

  // Active Tab View Navigation State
  const [activeTab, setActiveTab] = useState<'generator' | 'webzine' | 'trends'>('generator');

  // Firebase Auth Modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Shorts Studio Modal State
  const [isShortsModalOpen, setIsShortsModalOpen] = useState<boolean>(false);
  const [shortsInitialData, setShortsInitialData] = useState<{
    restaurantName?: string;
    location?: string;
    menuItems?: string;
    features?: string;
    blogContent?: string;
  } | null>(null);

  const handleOpenShortsFromBlog = (blog: GeneratedBlogResult) => {
    setShortsInitialData({
      restaurantName: blog.input.restaurantName,
      location: blog.input.location,
      menuItems: blog.input.menuItems,
      features: blog.input.features,
      blogContent: `${blog.selectedTitle}\n\n${blog.summary}\n\n${blog.contentMarkdown.slice(0, 800)}`,
    });
    setIsShortsModalOpen(true);
  };

  const handleOpenShortsFromNavbar = () => {
    // If formData already has restaurantName, prefill it, else let user configure
    if (formData.restaurantName.trim()) {
      setShortsInitialData({
        restaurantName: formData.restaurantName,
        location: formData.location,
        menuItems: formData.menuItems,
        features: formData.features,
      });
    } else {
      setShortsInitialData(null);
    }
    setIsShortsModalOpen(true);
  };

  // 5-SNS Studio Modal State
  const [isSnsModalOpen, setIsSnsModalOpen] = useState<boolean>(false);
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isMarketOpen, setIsMarketOpen] = useState<boolean>(false);
  const [snsInitialData, setSnsInitialData] = useState<{
    id?: string;
    restaurantName?: string;
    location?: string;
    menuItems?: string;
    features?: string;
    isSavedRecord?: boolean;
    selectedPlatforms?: string[];
    data?: any;
  } | null>(null);

  const handleOpenSnsFromBlog = (blog: GeneratedBlogResult) => {
    setSnsInitialData({
      restaurantName: blog.input.restaurantName,
      location: blog.input.location,
      menuItems: blog.input.menuItems,
      features: blog.input.features,
      isSavedRecord: false,
    });
    setIsSnsModalOpen(true);
  };

  const handleOpenSnsFromNavbar = () => {
    if (formData.restaurantName.trim()) {
      setSnsInitialData({
        restaurantName: formData.restaurantName,
        location: formData.location,
        menuItems: formData.menuItems,
        features: formData.features,
        isSavedRecord: false,
      });
    } else {
      setSnsInitialData(null);
    }
    setIsSnsModalOpen(true);
  };

  const handleOpenSnsFromHistory = (record: GeneratedSnsRecord) => {
    setSnsInitialData({
      id: record.id,
      restaurantName: record.restaurantName,
      location: record.location,
      menuItems: record.menuItems,
      features: record.features,
      isSavedRecord: true,
      selectedPlatforms: record.selectedPlatforms,
      data: record.data,
    });
    setIsSnsModalOpen(true);
  };

  // Load Saved Drafts from LocalStorage or Migration Backup when offline/logged out
  useEffect(() => {
    if (!user) {
      try {
        const loaded = localStorage.getItem('blogai_saved_posts');
        if (loaded && JSON.parse(loaded).length > 0) {
          setSavedPosts(JSON.parse(loaded));
        } else if ((MIGRATION_BACKUP_DATA.saved_posts || []).length > 0) {
          const backupPosts = (MIGRATION_BACKUP_DATA.saved_posts as unknown as any[]).map(p => ({
            ...p,
            id: p._id || p.id,
          }));
          setSavedPosts(backupPosts);
          saveToLocalStorageSafely('blogai_saved_posts', backupPosts);
        }
      } catch (e) {
        console.error('Failed to load saved posts:', e);
      }
      try {
        const loadedSns = localStorage.getItem('blogai_saved_sns');
        if (loadedSns && JSON.parse(loadedSns).length > 0) {
          setSavedSnsRecords(JSON.parse(loadedSns));
        } else if ((MIGRATION_BACKUP_DATA.saved_sns || []).length > 0) {
          const backupSns = (MIGRATION_BACKUP_DATA.saved_sns as unknown as any[]).map(s => ({
            ...s,
            id: s._id || s.id,
          }));
          setSavedSnsRecords(backupSns);
          saveToLocalStorageSafely('blogai_saved_sns', backupSns);
        }
      } catch (e) {
        console.error('Failed to load saved SNS:', e);
      }
      try {
        const loadedShorts = localStorage.getItem('blogai_saved_shorts');
        if (loadedShorts && JSON.parse(loadedShorts).length > 0) {
          setSavedShortsList(JSON.parse(loadedShorts));
        } else if ((MIGRATION_BACKUP_DATA.saved_shorts || []).length > 0) {
          const backupShorts = (MIGRATION_BACKUP_DATA.saved_shorts as unknown as any[]).map(s => ({
            ...s,
            id: s._id || s.id,
          }));
          setSavedShortsList(backupShorts);
          saveToLocalStorageSafely('blogai_saved_shorts', backupShorts);
        }
      } catch (e) {
        console.error('Failed to load saved Shorts:', e);
      }
    }
  }, [user]);

  // Realtime subscription to ALL blog posts in the DB for the public Webzine Gallery
  useEffect(() => {
    const unsubscribe = subscribeAllPosts((posts) => {
      setAllWebzinePosts(posts);
    }, (err) => {
      console.warn('Failed to subscribe all posts for Webzine:', err);
    });
    return () => unsubscribe();
  }, []);

  // Realtime Firestore Subscription & Automated Local Storage Sync when User is Logged In
  useEffect(() => {
    if (user) {
      // 1. Immediately extract any unsynced local drafts BEFORE subscription can trigger an empty Firestore overwrite!
      const rawLocalPosts = localStorage.getItem('blogai_saved_posts');
      const rawLocalSns = localStorage.getItem('blogai_saved_sns');
      const rawLocalShorts = localStorage.getItem('blogai_saved_shorts');

      // Helper function to sync local items to Cloud Firestore
      const performSync = async () => {
        try {
          // Sync Blog Posts
          if (rawLocalPosts) {
            const posts = JSON.parse(rawLocalPosts);
            if (Array.isArray(posts) && posts.length > 0) {
              for (const post of posts) {
                if (post.id) {
                  const docSnap = await getDoc(doc(db, 'saved_posts', post.id));
                  if (!docSnap.exists()) {
                    console.log(`[Auto-Sync] Syncing new local post ${post.id} to Firestore...`);
                    await savePostToFirestore(user.uid, post);
                  }
                }
              }
            }
          }
          // Sync SNS
          if (rawLocalSns) {
            const snsList = JSON.parse(rawLocalSns);
            if (Array.isArray(snsList) && snsList.length > 0) {
              for (const sns of snsList) {
                if (sns.id) {
                  const docSnap = await getDoc(doc(db, 'saved_sns', sns.id));
                  if (!docSnap.exists()) {
                    console.log(`[Auto-Sync] Syncing new local SNS ${sns.id} to Firestore...`);
                    await saveSnsToFirestore(user.uid, sns);
                  }
                }
              }
            }
          }
          // Sync Shorts
          if (rawLocalShorts) {
            const shortsList = JSON.parse(rawLocalShorts);
            if (Array.isArray(shortsList) && shortsList.length > 0) {
              for (const shorts of shortsList) {
                if (shorts.id) {
                  const docSnap = await getDoc(doc(db, 'saved_shorts', shorts.id));
                  if (!docSnap.exists()) {
                    console.log(`[Auto-Sync] Syncing new local Shorts ${shorts.id} to Firestore...`);
                    await saveShortsToFirestore(user.uid, shorts);
                  }
                }
              }
            }
          }
        } catch (e) {
          console.warn('[Sync Error] Background sync failed:', e);
        }
      };

      // Run sync in the background
      performSync();

      const unsubscribePosts = subscribeUserPosts(
        user.uid,
        (firestorePosts) => {
          setSavedPosts(firestorePosts);
          saveToLocalStorageSafely('blogai_saved_posts', firestorePosts);
        },
        (err) => {
          console.warn('Firestore blog subscription note:', err);
        }
      );
      const unsubscribeSns = subscribeUserSns(
        user.uid,
        (firestoreSns) => {
          setSavedSnsRecords(firestoreSns);
          saveToLocalStorageSafely('blogai_saved_sns', firestoreSns);
        },
        (err) => {
          console.warn('Firestore SNS subscription note:', err);
        }
      );
      const unsubscribeShorts = subscribeUserShorts(
        user.uid,
        (firestoreShorts) => {
          setSavedShortsList(firestoreShorts);
          saveToLocalStorageSafely('blogai_saved_shorts', firestoreShorts);
        },
        (err) => {
          console.warn('Firestore Shorts subscription note:', err);
        }
      );
      return () => {
        unsubscribePosts();
        unsubscribeSns();
        unsubscribeShorts();
      };
    }
  }, [user]);

  // Synchronize snsInitialData with the latest live data from savedSnsRecords in real-time
  useEffect(() => {
    if (isSnsModalOpen && snsInitialData && snsInitialData.id) {
      const latest = savedSnsRecords.find((r) => r.id === snsInitialData.id);
      if (latest) {
        const currentStr = JSON.stringify(snsInitialData.data);
        const latestStr = JSON.stringify(latest.data);
        if (currentStr !== latestStr) {
          setSnsInitialData({
            id: latest.id,
            restaurantName: latest.restaurantName,
            location: latest.location,
            menuItems: latest.menuItems,
            features: latest.features,
            isSavedRecord: true,
            selectedPlatforms: latest.selectedPlatforms,
            data: latest.data,
          });
        }
      }
    }
  }, [savedSnsRecords, snsInitialData, isSnsModalOpen]);

  // Save posts helper (Optimistic Local-First + Firestore Background)
  const handleSaveResult = async () => {
    if (!generatedResult) return;

    // 1. Optimistic Local Persistence
    const updated = [generatedResult, ...savedPosts.filter((p) => p.id !== generatedResult.id)];
    setSavedPosts(updated);
    saveToLocalStorageSafely('blogai_saved_posts', updated);

    // 2. Cloud Firestore sync in background if logged in
    if (user) {
      try {
        await savePostToFirestore(user.uid, generatedResult);
      } catch (e) {
        console.warn('Firestore post save note (locally preserved):', e);
      }
    }
  };

  const handleDeleteSaved = async (id: string) => {
    const updated = savedPosts.filter((p) => p.id !== id);
    setSavedPosts(updated);
    saveToLocalStorageSafely('blogai_saved_posts', updated);

    if (user) {
      try {
        await deletePostFromFirestore(user.uid, id);
      } catch (e) {
        console.warn('Error deleting from Firestore:', e);
      }
    }
  };

  const handleClearAllSaved = async () => {
    setSavedPosts([]);
    saveToLocalStorageSafely('blogai_saved_posts', []);

    if (user) {
      for (const p of savedPosts) {
        try {
          await deletePostFromFirestore(user.uid, p.id);
        } catch {}
      }
    }
  };

  // Save SNS helper (Optimistic Local-First + Firestore Background)
  const handleSaveSnsRecord = async (record: GeneratedSnsRecord) => {
    if (user) {
      try {
        await saveSnsToFirestoreDirectly(user.uid, record);
      } catch (e) {
        console.warn('Firestore SNS save failed:', e);
        const updated = [record, ...savedSnsRecords.filter((r) => r.id !== record.id)];
        setSavedSnsRecords(updated);
        saveToLocalStorageSafely('blogai_saved_sns', updated);
      }
    } else {
      const updated = [record, ...savedSnsRecords.filter((r) => r.id !== record.id)];
      setSavedSnsRecords(updated);
      saveToLocalStorageSafely('blogai_saved_sns', updated);
    }
  };

  const handleDeleteSnsRecord = async (id: string) => {
    const updated = savedSnsRecords.filter((r) => r.id !== id);
    setSavedSnsRecords(updated);
    saveToLocalStorageSafely('blogai_saved_sns', updated);

    if (user) {
      try {
        await deleteSnsFromFirestore(user.uid, id);
      } catch (e) {
        console.warn('Error deleting SNS from Firestore:', e);
      }
    }
  };

  const handleClearAllSnsRecords = async () => {
    if (user) {
      for (const r of savedSnsRecords) {
        await deleteSnsFromFirestore(user.uid, r.id);
      }
    } else {
      setSavedSnsRecords([]);
      try {
        localStorage.setItem('blogai_saved_sns', JSON.stringify([]));
      } catch (e) {
        console.error('Failed to clear saved SNS:', e);
      }
    }
  };

  const handleTogglePublishPost = async (post: GeneratedBlogResult) => {
    const nextPublished = !post.isPublished;
    const updatedPost = { ...post, isPublished: nextPublished };

    if (generatedResult && generatedResult.id === post.id) {
      setGeneratedResult(updatedPost);
    }

    const updatedList = savedPosts.map((p) => (p.id === post.id ? updatedPost : p));
    setSavedPosts(updatedList);

    try {
      localStorage.setItem('blogai_saved_posts', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }

    if (user) {
      try {
        await savePostToFirestore(user.uid, updatedPost);
      } catch (e) {
        console.warn('Failed to toggle publish post:', e);
      }
    }
  };

  const handleUpdateWebzinePost = async (updatedPost: GeneratedBlogResult) => {
    setSelectedWebzinePost(updatedPost);

    // Update in allWebzinePosts list
    setAllWebzinePosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));

    // Update in savedPosts list
    const updatedList = savedPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
    setSavedPosts(updatedList);

    try {
      localStorage.setItem('blogai_saved_posts', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }

    if (user) {
      try {
        await savePostToFirestore(user.uid, updatedPost);
      } catch (e) {
        console.warn('Failed to update webzine post in Firestore:', e);
      }
    }
  };

  const handleTogglePublishSns = async (record: GeneratedSnsRecord) => {
    const nextPublished = !record.isPublished;
    const updatedRecord = { ...record, isPublished: nextPublished };

    const updatedList = savedSnsRecords.map((r) => (r.id === record.id ? updatedRecord : r));
    setSavedSnsRecords(updatedList);

    try {
      localStorage.setItem('blogai_saved_sns', JSON.stringify(updatedList));
    } catch (e) {
      console.error(e);
    }

    if (user) {
      try {
        await saveSnsToFirestore(user.uid, updatedRecord);
      } catch (e) {
        console.warn('Failed to toggle publish SNS:', e);
      }
    }
  };

  const handleTogglePublishShorts = async (shortsId: string) => {
    const shortsItem = savedShortsList.find((s) => s.id === shortsId);
    if (!shortsItem) return;

    const nextPublished = !shortsItem.isPublished;
    const updatedShorts = { ...shortsItem, isPublished: nextPublished };

    const updatedList = savedShortsList.map((s) => (s.id === shortsId ? updatedShorts : s));
    setSavedShortsList(updatedList);

    try {
      localStorage.setItem('blogai_saved_shorts', JSON.stringify(stripBase64(updatedList)));
    } catch (e) {
      console.error(e);
    }

    if (user) {
      try {
        await saveShortsToFirestoreDirectly(user.uid, updatedShorts);
      } catch (e) {
        console.warn('Failed to toggle publish Shorts:', e);
      }
    }
  };

  const handleSyncAllToWebzine = async () => {
    const updatedPosts = savedPosts.map((post) => ({ ...post, isPublished: true }));
    setSavedPosts(updatedPosts);
    try {
      localStorage.setItem('blogai_saved_posts', JSON.stringify(updatedPosts));
    } catch {}

    const updatedSns = savedSnsRecords.map((record) => ({ ...record, isPublished: true }));
    setSavedSnsRecords(updatedSns);
    try {
      localStorage.setItem('blogai_saved_sns', JSON.stringify(updatedSns));
    } catch {}

    if (user) {
      try {
        const promises = [
          ...updatedPosts.map((post) => savePostToFirestore(user.uid, post)),
          ...updatedSns.map((record) => saveSnsToFirestore(user.uid, record)),
        ];
        await Promise.all(promises);
      } catch (e) {
        console.warn('Firestore sync note during batch publish:', e);
      }
    }
  };

  // Handle selecting a real-time trending keyword to auto-fill blog post form
  const handleSelectTrendingKeyword = (trend: TrendingFoodKeyword) => {
    setSelectedTrendingId(trend.id || trend.keyword);
    setFormData((prev) => ({
      ...prev,
      restaurantName: trend.locationOrStore ? `${trend.locationOrStore} (${trend.keyword})` : trend.keyword,
      location: trend.locationOrStore || prev.location || '서울 핫플레이스',
      menuItems: trend.menuItem || trend.keyword,
      features: `${trend.reason}. ${trend.features || ''} (추천 해시태그: ${trend.tag || trend.keyword})`.trim(),
    }));

    // Smooth scroll to the generator form
    const formEl = document.getElementById('blog-form-container');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Submit Handler -> Call /api/generate-blog
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.restaurantName.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/generate-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '블로그 글 생성에 실패했습니다.');
      }

      const newResult: GeneratedBlogResult = {
        id: 'post_' + Date.now(),
        createdAt: new Date().toISOString(),
        input: { ...formData },
        titleOptions: data.data.titleOptions || [data.data.selectedTitle],
        selectedTitle: data.data.selectedTitle || `${formData.restaurantName} 맛집 리뷰`,
        summary: data.data.summary || `${formData.restaurantName} 방문 후기 및 추천 메뉴 리뷰`,
        contentMarkdown: data.data.contentMarkdown || '',
        hashtags: data.data.hashtags || [],
        rating: data.data.rating || 4.8,
        revisitIntent: data.data.revisitIntent || '재방문 의사 100%',
        imagePrompts: data.data.imagePrompts || [],
        keyTips: data.data.keyTips || [],
        seoScore: 96,
      };

      setGeneratedResult(newResult);

      // Auto-save to Firestore and local cache if logged in
      if (user) {
        try {
          await savePostToFirestore(user.uid, newResult);
        } catch (err) {
          console.warn('Auto save note:', err);
        }
      }

      // Smooth scroll to result
      setTimeout(() => {
        const resultElem = document.getElementById('blog-result');
        if (resultElem) {
          resultElem.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } catch (err: any) {
      console.error('Submit error:', err);
      setErrorMessage(err?.message || '서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const isCurrentSaved = generatedResult
    ? savedPosts.some((p) => p.id === generatedResult.id)
    : false;

  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 font-sans flex flex-col antialiased selection:bg-orange-100 selection:text-orange-900">
      {/* Top Navbar */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAuthNotice={() => setIsAuthModalOpen(true)}
        onOpenShorts={handleOpenShortsFromNavbar}
        onOpenSns={handleOpenSnsFromNavbar}
        onOpenAdmin={() => setIsAdminOpen(true)}
        savedCount={savedPosts.length + savedSnsRecords.length}
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          // If switching tab, clear any selected webzine post to ensure they go back to list
          if (tab !== 'webzine') {
            setSelectedWebzinePost(null);
          }
          document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Hero Banner Header */}
      <HeroHeader />

      {/* Main Workspace Section */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8" id="generator">
        
        {/* Luxury Tab Switcher Bar */}
        <div className="bg-white border border-orange-200/60 rounded-2xl p-2 sm:p-2.5 shadow-xs max-w-2xl mx-auto flex items-center justify-between gap-1">
          <button
            onClick={() => {
              setActiveTab('generator');
              setSelectedWebzinePost(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-100'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
            }`}
          >
            <Flame className="w-4 h-4 shrink-0" />
            <span>AI 맛집 생성기</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('webzine');
              setSelectedWebzinePost(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'webzine'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-100'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            <span>미식 프리미엄 웹진</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('trends');
              setSelectedWebzinePost(null);
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'trends'
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm shadow-orange-100'
                : 'text-gray-600 hover:text-gray-950 hover:bg-gray-50'
            }`}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>실시간 맛집 트렌드</span>
          </button>
        </div>

        {/* Dynamic Page Views rendering based on activeTab */}
        {activeTab === 'generator' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* AI Shorts Statistics Dashboard Widget */}
            <ShortsStatsWidget 
              shortsList={savedShortsList} 
              onTogglePublish={handleTogglePublishShorts}
            />

            {/* Original Generator Form */}
            <div id="blog-form-container">
              <BlogGeneratorForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={handleSubmit}
                isLoading={isLoading}
              />
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <p className="font-bold">생성 오류</p>
                  <p className="text-xs text-rose-700">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Loading Spinner Indicator */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-orange-200 p-8 sm:p-12 text-center space-y-4 shadow-lg animate-pulse">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md animate-spin">
                  <Sparkles className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-gray-900">
                    제미나이 3.6 AI가 맛집 블로그 포스팅을 작성 중입니다...
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500">
                    네이버 상위 노출 제목, 생생한 시식 묘사, 사진 가이드 및 SEO 해시태그를 생성하고 있습니다.
                  </p>
                </div>
              </div>
            )}

            {/* Blog Generated Result */}
            {generatedResult && !isLoading && (
              <div id="blog-result">
                <BlogResultDisplay
                  result={generatedResult}
                  onSave={handleSaveResult}
                  isSaved={isCurrentSaved}
                  onConvertToShorts={handleOpenShortsFromBlog}
                  onConvertToSns={handleOpenSnsFromBlog}
                  onTogglePublish={() => handleTogglePublishPost(generatedResult)}
                />
              </div>
            )}

            {/* Features Section */}
            <FeaturesSection />
          </div>
        )}

        {activeTab === 'webzine' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {selectedWebzinePost ? (
              <WebzineArticleViewer
                post={selectedWebzinePost}
                onBack={() => setSelectedWebzinePost(null)}
                onConvertToShorts={(post) => {
                  handleOpenShortsFromBlog(post);
                }}
                onConvertToSns={(post) => {
                  handleOpenSnsFromBlog(post);
                }}
                onUpdatePost={handleUpdateWebzinePost}
              />
            ) : (
              <WebzineGallery
                posts={allWebzinePosts}
                onSelectPost={(post) => {
                  setSelectedWebzinePost(post);
                  document.getElementById('generator')?.scrollIntoView({ behavior: 'smooth' });
                }}
                selectedPostId={selectedWebzinePost?.id}
              />
            )}
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent rounded-3xl p-6 sm:p-8 border border-amber-200/40 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold mb-3">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>Real-time Google Grounding Trends</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  실시간 전국구 맛집 검색 트렌드 탐색기
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                  오늘의 구글 및 검색 포털 데이터를 실시간 분석 및 Grounding 하여 핫하게 상위 노출 중인 키워드를 엄선했습니다. 카드를 클릭하면 해당하는 정보가 생성기 폼에 즉시 자동 기입되어 원클릭 생성이 연계됩니다!
                </p>
              </div>
            </div>

            <TrendingFoodKeywordsCard
              onSelectKeyword={handleSelectTrendingKeyword}
              selectedKeywordId={selectedTrendingId}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 text-center text-xs text-gray-500 mt-12">
        <div className="max-w-5xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs">
              <Utensils className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-gray-800 text-sm">BlogAI 맛집 블로그 자동화</span>
          </div>
          <p className="text-gray-400">
            © 2026 BlogAI. Powered by Google Gemini 3.6 & Express + Firebase.
          </p>
        </div>
      </footer>

      {/* Drawers and Modals */}
      <BlogHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedPosts={savedPosts}
        onSelectPost={(post) => setGeneratedResult(post)}
        onDeletePost={handleDeleteSaved}
        onClearAll={handleClearAllSaved}
        savedSns={savedSnsRecords}
        onSelectSns={handleOpenSnsFromHistory}
        onDeleteSns={handleDeleteSnsRecord}
        onClearAllSns={handleClearAllSnsRecords}
        onTogglePublishPost={handleTogglePublishPost}
        onTogglePublishSns={handleTogglePublishSns}
        onSyncAllToWebzine={handleSyncAllToWebzine}
      />

      <FirebaseAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* 9:16 Shorts & Reels AI Studio Modal */}
      <ShortsStudioModal
        isOpen={isShortsModalOpen}
        onClose={() => setIsShortsModalOpen(false)}
        initialData={shortsInitialData}
      />

      {/* 5-SNS Multi-Platform Content Studio Modal */}
      <SnsStudioModal
        isOpen={isSnsModalOpen}
        onClose={() => setIsSnsModalOpen(false)}
        initialData={snsInitialData}
        onSaveSns={handleSaveSnsRecord}
        savedSnsIds={savedSnsRecords.map(r => r.id)}
      />

      {/* Super Admin Console Full Service Page */}
      <AdminConsolePage
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
