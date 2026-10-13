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
import { GeneratedSnsRecord } from '../types';
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

export const saveSnsToFirestoreDirectly = async (userId: string, sns: GeneratedSnsRecord) => {
  if (!userId || !sns?.id) return;
  const snsRef = doc(db, 'saved_sns', sns.id);
  await setDoc(snsRef, {
    ...sns,
    userId,
    updatedAt: new Date().toISOString(),
  });
};

export const saveSnsToFirestore = async (userId: string, sns: GeneratedSnsRecord) => {
  if (!userId || !sns?.id) return;

  // 1. Local cache update
  try {
    const raw = localStorage.getItem('blogai_saved_sns');
    const list: GeneratedSnsRecord[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((s) => s.id === sns.id);
    const updatedSns = { ...sns, userId, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updatedSns;
    } else {
      list.unshift(updatedSns);
    }
    localStorage.setItem('blogai_saved_sns', JSON.stringify(stripBase64(list)));
  } catch (e) {}

  // 2. Cloud Firestore sync
  try {
    const snsRef = doc(db, 'saved_sns', sns.id);
    await setDoc(snsRef, {
      ...sns,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Firestore:saved_sns] Cloud sync note (cached locally):', err?.message || err);
  }
};

export const deleteSnsFromFirestore = async (userId: string, snsId: string) => {
  if (!snsId) return;

  // 1. Local cache update
  try {
    const raw = localStorage.getItem('blogai_saved_sns');
    if (raw) {
      const list: GeneratedSnsRecord[] = JSON.parse(raw);
      const filtered = list.filter((s) => s.id !== snsId);
      localStorage.setItem('blogai_saved_sns', JSON.stringify(filtered));
    }
  } catch (e) {}

  // 2. Cloud delete
  try {
    const snsRef = doc(db, 'saved_sns', snsId);
    await deleteDoc(snsRef);
  } catch (err: any) {
    console.warn('[Firestore:saved_sns] Cloud delete note:', err?.message || err);
  }
};

export const subscribeUserSns = (
  userId: string,
  onUpdate: (snsList: GeneratedSnsRecord[]) => void,
  onError?: (err: any) => void
) => {
  const getFallbackSns = (): GeneratedSnsRecord[] => {
    try {
      const loaded = localStorage.getItem('blogai_saved_sns');
      if (loaded) {
        const parsed = JSON.parse(loaded);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    return (MIGRATION_BACKUP_DATA.saved_sns as unknown as any[] || []).map((s) => ({
      ...s,
      id: s._id || s.id,
    }));
  };

  if (!userId) {
    onUpdate(getFallbackSns());
    return () => {};
  }

  const q = collection(db, 'saved_sns');

  return onSnapshot(
    q,
    (snapshot) => {
      const list: GeneratedSnsRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as GeneratedSnsRecord;
        if (data && data.userId === userId) {
          list.push({ ...data, id: d.id });
        }
      });

      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try {
        localStorage.setItem('blogai_saved_sns', JSON.stringify(stripBase64(list)));
      } catch {}
      onUpdate(list);
    },
    (error) => {
      console.warn('[Firestore] SNS subscription note, serving local/backup data:', error?.message || error);
      onUpdate(getFallbackSns());
      if (onError) onError(error);
    }
  );
};

