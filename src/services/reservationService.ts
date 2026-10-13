import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  getDocs,
  where,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { ScheduledReservation } from '../types';
import { savePostToFirestore } from './blogService';
import { saveSnsToFirestore } from './snsService';
import { saveShortsToFirestore } from './shortsService';

// Fetch or subscribe all reservations
export const subscribeAllReservations = (
  onUpdate: (reservations: ScheduledReservation[]) => void,
  onError?: (err: any) => void
) => {
  const getLocalReservations = (): ScheduledReservation[] => {
    try {
      const raw = localStorage.getItem('blogai_saved_reservations');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  };

  const q = collection(db, 'scheduled_reservations');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ScheduledReservation[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as ScheduledReservation;
        if (data) {
          data.id = d.id;
          list.push(data);
        }
      });
      // Sort by scheduledAt desc or createdAt desc
      list.sort((a, b) => {
        const timeA = a.scheduledAt ? new Date(a.scheduledAt.replace(/\./g, '/').replace('오전', 'AM').replace('오후', 'PM')).getTime() : 0;
        const timeB = b.scheduledAt ? new Date(b.scheduledAt.replace(/\./g, '/').replace('오전', 'AM').replace('오후', 'PM')).getTime() : 0;
        return timeB - timeA;
      });
      try {
        localStorage.setItem('blogai_saved_reservations', JSON.stringify(list));
      } catch {}
      onUpdate(list);
    },
    (error) => {
      console.warn('ReservationService: Note fetching reservations (using local cache):', error?.message || error);
      onUpdate(getLocalReservations());
      if (onError) onError(error);
    }
  );
};

// Add a new reservation
export const saveReservation = async (reservationData: Omit<ScheduledReservation, 'id' | 'createdAt'>) => {
  const id = 'res_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  const fullData: ScheduledReservation = {
    id,
    ...reservationData,
    createdAt: new Date().toISOString(),
  };

  // 1. Local cache update
  try {
    const raw = localStorage.getItem('blogai_saved_reservations');
    const list: ScheduledReservation[] = raw ? JSON.parse(raw) : [];
    list.unshift(fullData);
    localStorage.setItem('blogai_saved_reservations', JSON.stringify(list));
  } catch (e) {}

  // 2. Firestore cloud sync
  try {
    const ref = doc(db, 'scheduled_reservations', id);
    await setDoc(ref, fullData);
  } catch (err: any) {
    console.warn('[Firestore:scheduled_reservations] Save note (cached locally):', err?.message || err);
  }

  return id;
};

// Update status/details of a reservation
export const updateReservation = async (id: string, updatedFields: Partial<ScheduledReservation>) => {
  // 1. Local update
  try {
    const raw = localStorage.getItem('blogai_saved_reservations');
    if (raw) {
      const list: ScheduledReservation[] = JSON.parse(raw);
      const idx = list.findIndex((r) => r.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updatedFields };
        localStorage.setItem('blogai_saved_reservations', JSON.stringify(list));
      }
    }
  } catch (e) {}

  // 2. Cloud update
  try {
    const ref = doc(db, 'scheduled_reservations', id);
    await updateDoc(ref, updatedFields);
  } catch (err: any) {
    console.warn('[Firestore:scheduled_reservations] Update note:', err?.message || err);
  }
};

// Delete a reservation
export const deleteReservation = async (id: string) => {
  // 1. Local delete
  try {
    const raw = localStorage.getItem('blogai_saved_reservations');
    if (raw) {
      const list: ScheduledReservation[] = JSON.parse(raw);
      const filtered = list.filter((r) => r.id !== id);
      localStorage.setItem('blogai_saved_reservations', JSON.stringify(filtered));
    }
  } catch (e) {}

  // 2. Cloud delete
  try {
    const ref = doc(db, 'scheduled_reservations', id);
    await deleteDoc(ref);
  } catch (err: any) {
    console.warn('[Firestore:scheduled_reservations] Delete note:', err?.message || err);
  }
};

// Queue system for on-access trigger processing
// Process a single reservation queue
export const processSingleReservation = async (userId: string, reservation: ScheduledReservation) => {
  try {
    // 1. Lock state to "진행중"
    await updateReservation(reservation.id, { status: '진행중' });
    console.log(`[Queue Hub] Processing reservation: ${reservation.id} - ${reservation.topic}`);

    const results: any = {};
    const keyword = reservation.topic;

    // Process each selected platform
    for (const platform of reservation.platforms) {
      if (platform === '블로그') {
        const response = await fetch('/api/generate-blog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantName: keyword,
            location: '제주도',
            menuItems: '흑돼지 미식코스',
            features: '최상급 숙성육, 숯불 직화, 오션뷰 분위기',
            tone: '솔직담백 내돈내산 파워블로거 톤',
            blogType: '네이버 블로그'
          })
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            const blogId = 'blog_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            const blogData = {
              id: blogId,
              createdAt: new Date().toISOString(),
              ...resJson.data
            };
            await savePostToFirestore(userId, blogData);
            results.blogId = blogId;
          }
        }
      } else if (platform === 'SNS') {
        const response = await fetch('/api/generate-sns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantName: keyword,
            location: '제주도',
            menuItems: '흑돼지 미식코스',
            features: '최상급 숙성육, 숯불 직화, 오션뷰 분위기',
            selectedPlatforms: ['instagram', 'threads']
          })
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            const snsId = 'sns_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            const snsData = {
              id: snsId,
              userId,
              createdAt: new Date().toISOString(),
              restaurantName: keyword,
              location: '제주도',
              menuItems: '흑돼지 미식코스',
              features: '최상급 숙성육, 숯불 직화, 오션뷰 분위기',
              selectedPlatforms: ['instagram', 'threads'],
              data: resJson.data
            };
            await saveSnsToFirestore(userId, snsData);
            results.snsId = snsId;
          }
        }
      } else if (platform === '쇼츠') {
        const response = await fetch('/api/generate-shorts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restaurantName: keyword,
            location: '제주도',
            menuItems: '흑돼지 미식코스',
            features: '최상급 숙성육, 숯불 직화, 오션뷰 분위기',
            tone: 'hype_fast',
            targetDuration: 35
          })
        });
        if (response.ok) {
          const resJson = await response.json();
          if (resJson.success && resJson.data) {
            const shortsId = 'shorts_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
            const shortsData = {
              id: shortsId,
              userId,
              createdAt: new Date().toISOString(),
              restaurantName: keyword,
              location: '제주도',
              tone: 'hype_fast' as const,
              targetDuration: 35,
              title: resJson.data.title || '제주도 흑돼지 미식맛집 탐방',
              hook: resJson.data.hook || '',
              totalDuration: resJson.data.totalDuration || 35,
              bgmRecommendation: resJson.data.bgmRecommendation || '',
              hashtags: resJson.data.hashtags || [],
              scenes: resJson.data.scenes || [],
              youtubeDescription: resJson.data.youtubeDescription || '',
              filmingTips: resJson.data.filmingTips || []
            };
            await saveShortsToFirestore(userId, shortsData);
            results.shortsId = shortsId;
          }
        }
      }
    }

    // 2. Complete status
    await updateReservation(reservation.id, {
      status: '발행완료',
      processedAt: new Date().toISOString(),
      results
    });
    console.log(`[Queue Hub] Completed reservation: ${reservation.id}`);
  } catch (error: any) {
    console.error(`[Queue Hub] Failed reservation ${reservation.id}:`, error);
    await updateReservation(reservation.id, {
      status: '실패',
      error: error?.message || 'Unknown processing error'
    });
  }
};

// Helper to convert "2026.9.10 오전 11:30" or similar to a Date object safely
const parseScheduledDate = (scheduledStr: string): Date => {
  try {
    // Standardize Korean date string to a parsable format
    // Example: "2026.9.10 오전 11:30"
    let clean = scheduledStr.trim();
    
    // Check if it's already an ISO or standard string
    if (clean.includes('T') || isNaN(Date.parse(clean.replace(/\./g, '/')))) {
      // Manual parsing for Korean formatted scheduling string
      const match = clean.match(/(\d{4})\s*\.\s*(\d{1,2})\s*\.\s*(\d{1,2})\s*(오전|오후)?\s*(\d{1,2}):(\d{2})/);
      if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]) - 1; // 0-indexed month
        const day = parseInt(match[3]);
        const meridian = match[4];
        let hour = parseInt(match[5]);
        const min = parseInt(match[6]);

        if (meridian === '오후' && hour < 12) {
          hour += 12;
        } else if (meridian === '오전' && hour === 12) {
          hour = 0;
        }

        return new Date(year, month, day, hour, min);
      }
    }
    
    // Fallback standard parse
    const formatted = clean
      .replace(/\./g, '/')
      .replace('오전', 'AM')
      .replace('오후', 'PM');
    return new Date(formatted);
  } catch (e) {
    return new Date(scheduledStr);
  }
};

// Check and run all pending past scheduled reservations
export const checkAndRunPendingReservations = async (userId: string) => {
  if (!userId) return;

  const now = new Date();
  const pendingToProcess: ScheduledReservation[] = [];

  try {
    const q = query(
      collection(db, 'scheduled_reservations'),
      where('status', '==', '대기')
    );
    const snapshot = await getDocs(q);

    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data() as ScheduledReservation;
      if (data) {
        data.id = docSnapshot.id;
        const scheduledTime = parseScheduledDate(data.scheduledAt);
        if (scheduledTime <= now) {
          pendingToProcess.push(data);
        }
      }
    });
  } catch (err: any) {
    console.warn('[Queue Trigger] Note checking remote reservations (checking local queue):', err?.message || err);
    // Fall back to checking local reservations queue
    try {
      const raw = localStorage.getItem('blogai_saved_reservations');
      if (raw) {
        const localList: ScheduledReservation[] = JSON.parse(raw);
        for (const item of localList) {
          if (item.status === '대기' && parseScheduledDate(item.scheduledAt) <= now) {
            pendingToProcess.push(item);
          }
        }
      }
    } catch {}
  }

  if (pendingToProcess.length > 0) {
    console.log(`[Queue Trigger] Processing ${pendingToProcess.length} pending reservations.`);
    for (const resItem of pendingToProcess) {
      await processSingleReservation(userId, resItem);
    }
  }
};
