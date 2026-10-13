export type BlogPlatform = 'naver' | 'tistory' | 'instagram';

export type BlogTone = 'power_blogger' | 'honest_review' | 'romantic_date' | 'gourmet_critic';

export interface BlogInputForm {
  restaurantName: string;
  location: string;
  menuItems: string;
  features: string;
  tone: BlogTone;
  blogType: BlogPlatform;
}

export interface ImagePromptInfo {
  label: string;
  prompt: string;
}

export interface GeneratedBlogResult {
  id: string;
  createdAt: string;
  userId?: string;
  input: BlogInputForm;
  titleOptions: string[];
  selectedTitle: string;
  summary: string;
  contentMarkdown: string;
  hashtags: string[];
  rating: number;
  revisitIntent: string;
  imagePrompts: ImagePromptInfo[];
  keyTips: string[];
  seoScore?: number;
  isPublished?: boolean;
  price?: number;
  customImageUrl?: string;
}

export interface PresetSample {
  id: string;
  title: string;
  badge: string;
  input: BlogInputForm;
}

export interface TrendingFoodKeyword {
  id?: string;
  keyword: string;
  category: string;
  reason: string;
  suggestedTitle: string;
  locationOrStore?: string;
  menuItem?: string;
  features?: string;
  searchVolume?: string;
  tag?: string;
  rank?: number;
}

export interface TrendingKeywordsResponse {
  lastUpdated: string;
  trends: TrendingFoodKeyword[];
  searchQueries?: string[];
  groundingSources?: { title: string; url: string }[];
}

export type ShortsTone = 'hype_fast' | 'vlog_calm' | 'honest_fact' | 'gourmet_expert';

export interface ShortsScene {
  sceneNumber: number;
  timeRange: string;
  durationSec: number;
  hookText: string;
  subtitle: string;
  narration: string;
  visualDescription: string;
  imagePrompt: string;
  imageUrl?: string;
}

export interface GeneratedShortsResult {
  id: string;
  createdAt: string;
  userId?: string;
  restaurantName: string;
  location?: string;
  tone: ShortsTone;
  targetDuration: number;
  title: string;
  hook: string;
  totalDuration: number;
  bgmRecommendation: string;
  hashtags: string[];
  scenes: ShortsScene[];
  youtubeDescription: string;
  filmingTips: string[];
  isPublished?: boolean;
  price?: number;
}

// Multi-SNS Content Generator Types
export interface SnsInstagramResult {
  caption: string;
  hashtags: string[];
  imageIdea: string;
}

export interface SnsTwitterResult {
  tweet: string;
  hashtags: string[];
}

export interface SnsThreadsResult {
  threadPosts: string[];
}

export interface SnsTiktokResult {
  bgm: string;
  videoConcept: string;
  hookText: string;
  narration: string;
  hashtags: string[];
}

export interface SnsShortsScene {
  sceneNumber: number;
  subtitle: string;
  narration: string;
  visual: string;
}

export interface SnsShortsResult {
  title: string;
  hook: string;
  bgm: string;
  scenes: SnsShortsScene[];
}

export interface SnsGeneratedResult {
  instagram?: SnsInstagramResult;
  twitter?: SnsTwitterResult;
  threads?: SnsThreadsResult;
  tiktok?: SnsTiktokResult;
  shorts?: SnsShortsResult;
}

export interface GeneratedSnsRecord {
  id: string;
  createdAt: string;
  userId?: string;
  restaurantName: string;
  location: string;
  menuItems: string;
  features: string;
  selectedPlatforms: string[];
  data: SnsGeneratedResult;
  isPublished?: boolean;
  price?: number;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt: string;
  status?: 'active' | 'suspended';
  role?: 'admin' | 'user';
}

export interface SharedGourmetAsset {
  id: string;
  sourceType: 'ai' | 'unsplash' | 'upload';
  imageContent: string; // Base64 jpeg encoded under 200KB
  searchKeyword: string;
  createdAt: string;
  isShared: boolean;
  authorEmail: string;
}

export interface MarketingChannel {
  id: string;
  type: 'instagram' | 'youtube' | 'facebook' | 'naver';
  name: string;
  accountId: string;
  passwordPlaceholder?: string; // Masked representation of password
  status: 'connected' | 'disconnected' | 'error';
  createdAt: string;
  verifiedAt?: string;
  accessToken?: string;
}

export interface ScheduledReservation {
  id: string;
  userId: string;
  topic: string;
  platforms: ('블로그' | 'SNS' | '쇼츠')[];
  scheduledAt: string; // ISO string or YYYY.MM.DD HH:mm
  status: '대기' | '진행중' | '발행완료' | '실패';
  createdAt: string;
  processedAt?: string;
  error?: string;
  results?: {
    blogId?: string;
    snsId?: string;
    shortsId?: string;
  };
}


