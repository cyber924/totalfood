import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { GeneratedShortsResult } from '../types';
import { MIGRATION_BACKUP_DATA } from '../data/migrationSourceData';

const stripBase64 = (val: any): any => {
  if (typeof val === 'string') {
    if (val.startsWith('data:image/')) return ''; // Strip base64 string
    return val;
  }
  if (Array.isArray(val)) return val.map(stripBase64);
  if (val && typeof val === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(val)) {
      cleaned[key] = stripBase64(val[key]);
    }
    return cleaned;
  }
  return val;
};

export const saveShortsToFirestoreDirectly = async (userId: string, shorts: GeneratedShortsResult) => {
  if (!userId || !shorts?.id) return;
  const shortsRef = doc(db, 'saved_shorts', shorts.id);
  await setDoc(shortsRef, {
    ...shorts,
    userId,
    updatedAt: new Date().toISOString(),
  });
};

export const saveShortsToFirestore = async (userId: string, shorts: GeneratedShortsResult) => {
  if (!userId || !shorts?.id) return;

  // 1. Local cache update
  try {
    const raw = localStorage.getItem('blogai_saved_shorts');
    const list: GeneratedShortsResult[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((s) => s.id === shorts.id);
    const updatedShorts = { ...shorts, userId, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updatedShorts;
    } else {
      list.unshift(updatedShorts);
    }
    localStorage.setItem('blogai_saved_shorts', JSON.stringify(stripBase64(list)));
  } catch (e) {}

  // 2. Cloud Firestore sync
  try {
    const shortsRef = doc(db, 'saved_shorts', shorts.id);
    await setDoc(shortsRef, {
      ...shorts,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Firestore:saved_shorts] Cloud sync note (cached locally):', err?.message || err);
  }
};

export const deleteShortsFromFirestore = async (userId: string, shortsId: string) => {
  if (!shortsId) return;

  // 1. Local cache update
  try {
    const raw = localStorage.getItem('blogai_saved_shorts');
    if (raw) {
      const list: GeneratedShortsResult[] = JSON.parse(raw);
      const filtered = list.filter((s) => s.id !== shortsId);
      localStorage.setItem('blogai_saved_shorts', JSON.stringify(filtered));
    }
  } catch (e) {}

  // 2. Cloud delete
  try {
    const shortsRef = doc(db, 'saved_shorts', shortsId);
    await deleteDoc(shortsRef);
  } catch (err: any) {
    console.warn('[Firestore:saved_shorts] Cloud delete note:', err?.message || err);
  }
};

export const subscribeUserShorts = (
  userId: string,
  onUpdate: (shortsList: GeneratedShortsResult[]) => void,
  onError?: (err: any) => void
) => {
  const getFallbackShorts = (): GeneratedShortsResult[] => {
    try {
      const loaded = localStorage.getItem('blogai_saved_shorts');
      if (loaded) {
        const parsed = JSON.parse(loaded);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    return (MIGRATION_BACKUP_DATA.saved_shorts as unknown as any[] || []).map((s) => ({
      ...s,
      id: s._id || s.id,
    }));
  };

  if (!userId) {
    onUpdate(getFallbackShorts());
    return () => {};
  }

  const q = collection(db, 'saved_shorts');

  return onSnapshot(
    q,
    (snapshot) => {
      const list: GeneratedShortsResult[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as GeneratedShortsResult;
        if (data && data.userId === userId) {
          list.push({ ...data, id: d.id });
        }
      });

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try {
        localStorage.setItem('blogai_saved_shorts', JSON.stringify(stripBase64(list)));
      } catch {}
      onUpdate(list);
    },
    (error) => {
      console.warn('[Firestore] Shorts subscription note, serving local/backup data:', error?.message || error);
      onUpdate(getFallbackShorts());
      if (onError) onError(error);
    }
  );
};

