import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { GeneratedBlogResult, GeneratedSnsRecord, GeneratedShortsResult, UserProfile, SharedGourmetAsset, MarketingChannel } from '../types';
import { MIGRATION_BACKUP_DATA } from '../data/migrationSourceData';

// Subscribe to all users
export const subscribeAllUsers = (
  onUpdate: (users: UserProfile[]) => void,
  onError?: (err: any) => void
) => {
  const q = collection(db, 'users');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as UserProfile;
        if (data) {
          data.id = d.id;
          list.push(data);
        }
      });
      if (list.length === 0 && (MIGRATION_BACKUP_DATA.users || []).length > 0) {
        const fallbackUsers = (MIGRATION_BACKUP_DATA.users as unknown as any[]).map(u => ({ ...u, id: u._id || u.id }));
        onUpdate(fallbackUsers);
        return;
      }
      // Safe sort by createdAt desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const finalA = isNaN(timeA) ? 0 : timeA;
        const finalB = isNaN(timeB) ? 0 : timeB;
        return finalB - finalA;
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Admin: Note fetching users (using migration backup):', error?.message || error);
      const fallbackUsers = (MIGRATION_BACKUP_DATA.users as unknown as any[]).map(u => ({ ...u, id: u._id || u.id }));
      onUpdate(fallbackUsers);
      if (onError) onError(error);
    }
  );
};

// Subscribe to all posts
export const subscribeAllPosts = (
  onUpdate: (posts: GeneratedBlogResult[]) => void,
  onError?: (err: any) => void
) => {
  const q = collection(db, 'saved_posts');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: GeneratedBlogResult[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as GeneratedBlogResult;
        if (data) {
          data.id = d.id;
          list.push(data);
        }
      });
      
      if (list.length === 0 && (MIGRATION_BACKUP_DATA.saved_posts || []).length > 0) {
        const fallbackPosts = (MIGRATION_BACKUP_DATA.saved_posts as unknown as any[]).map(p => ({ ...p, id: p._id || p.id })) as GeneratedBlogResult[];
        onUpdate(fallbackPosts);
        return;
      }
      
      // Safe sort real list by createdAt desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const finalA = isNaN(timeA) ? 0 : timeA;
        const finalB = isNaN(timeB) ? 0 : timeB;
        return finalB - finalA;
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Admin: Note fetching posts (using migration backup):', error?.message || error);
      const fallbackPosts = (MIGRATION_BACKUP_DATA.saved_posts as unknown as any[]).map(p => ({ ...p, id: p._id || p.id })) as GeneratedBlogResult[];
      onUpdate(fallbackPosts);
      if (onError) onError(error);
    }
  );
};

// Subscribe to all SNS records
export const subscribeAllSns = (
  onUpdate: (snsList: GeneratedSnsRecord[]) => void,
  onError?: (err: any) => void
) => {
  const q = collection(db, 'saved_sns');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: GeneratedSnsRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as GeneratedSnsRecord;
        if (data) {
          data.id = d.id;
          list.push(data);
        }
      });
      
      if (list.length === 0 && (MIGRATION_BACKUP_DATA.saved_sns || []).length > 0) {
        const fallbackSns = (MIGRATION_BACKUP_DATA.saved_sns as unknown as any[]).map(s => ({ ...s, id: s._id || s.id })) as GeneratedSnsRecord[];
        onUpdate(fallbackSns);
        return;
      }
      
      // Safe sort real list by createdAt desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const finalA = isNaN(timeA) ? 0 : timeA;
        const finalB = isNaN(timeB) ? 0 : timeB;
        return finalB - finalA;
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Admin: Note fetching SNS (using migration backup):', error?.message || error);
      const fallbackSns = (MIGRATION_BACKUP_DATA.saved_sns as unknown as any[]).map(s => ({ ...s, id: s._id || s.id })) as GeneratedSnsRecord[];
      onUpdate(fallbackSns);
      if (onError) onError(error);
    }
  );
};

// Subscribe to all Shorts records
export const subscribeAllShorts = (
  onUpdate: (shortsList: GeneratedShortsResult[]) => void,
  onError?: (err: any) => void
) => {
  const q = collection(db, 'saved_shorts');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: GeneratedShortsResult[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as GeneratedShortsResult;
        if (data) {
          data.id = d.id;
          list.push(data);
        }
      });
      
      if (list.length === 0 && (MIGRATION_BACKUP_DATA.saved_shorts || []).length > 0) {
        const fallbackShorts = (MIGRATION_BACKUP_DATA.saved_shorts as unknown as any[]).map(s => ({ ...s, id: s._id || s.id })) as GeneratedShortsResult[];
        onUpdate(fallbackShorts);
        return;
      }
      
      // Safe sort real list by createdAt desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        const finalA = isNaN(timeA) ? 0 : timeA;
        const finalB = isNaN(timeB) ? 0 : timeB;
        return finalB - finalA;
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Admin: Note fetching shorts (using migration backup):', error?.message || error);
      const fallbackShorts = (MIGRATION_BACKUP_DATA.saved_shorts as unknown as any[]).map(s => ({ ...s, id: s._id || s.id })) as GeneratedShortsResult[];
      onUpdate(fallbackShorts);
      if (onError) onError(error);
    }
  );
};

// Admin Edit / Update Content
export const updatePostAsAdmin = async (postId: string, updatedData: Partial<GeneratedBlogResult>) => {
  const postRef = doc(db, 'saved_posts', postId);
  await updateDoc(postRef, {
    ...updatedData,
    updatedAt: new Date().toISOString(),
  });
};

export const updateSnsAsAdmin = async (snsId: string, updatedData: Partial<GeneratedSnsRecord>) => {
  const snsRef = doc(db, 'saved_sns', snsId);
  await updateDoc(snsRef, {
    ...updatedData,
    updatedAt: new Date().toISOString(),
  });
};

export const updateShortsAsAdmin = async (shortsId: string, updatedData: Partial<GeneratedShortsResult>) => {
  const shortsRef = doc(db, 'saved_shorts', shortsId);
  await updateDoc(shortsRef, {
    ...updatedData,
    updatedAt: new Date().toISOString(),
  });
};

// Admin Delete Content
export const deletePostAsAdmin = async (postId: string) => {
  const postRef = doc(db, 'saved_posts', postId);
  await deleteDoc(postRef);
};

export const deleteSnsAsAdmin = async (snsId: string) => {
  const snsRef = doc(db, 'saved_sns', snsId);
  await deleteDoc(snsRef);
};

export const deleteShortsAsAdmin = async (shortsId: string) => {
  const shortsRef = doc(db, 'saved_shorts', shortsId);
  await deleteDoc(shortsRef);
};

// Admin Update User Status / Role
export const updateUserStatusAsAdmin = async (userId: string, status: 'active' | 'suspended', role?: 'admin' | 'user') => {
  const userRef = doc(db, 'users', userId);
  const updates: any = { status };
  if (role) {
    updates.role = role;
  }
  await updateDoc(userRef, updates);
};

// --- Shared Assets (3-Way Image Gallery Persistent Storage) ---

// Subscribe to all assets
export const subscribeAllAssets = (
  onUpdate: (assets: SharedGourmetAsset[]) => void,
  onError?: (err: any) => void
) => {
  const q = collection(db, 'shared_assets');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: SharedGourmetAsset[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as SharedGourmetAsset;
        if (data) {
          data.id = d.id;
          list.push(data);
        }
      });
      if (list.length === 0 && (MIGRATION_BACKUP_DATA.shared_assets || []).length > 0) {
        const fallbackAssets = (MIGRATION_BACKUP_DATA.shared_assets as unknown as any[]).map(a => ({ ...a, id: a._id || a.id }));
        onUpdate(fallbackAssets);
        return;
      }
      // Sort by createdAt desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Admin: Note fetching shared assets (using migration backup):', error?.message || error);
      const fallbackAssets = (MIGRATION_BACKUP_DATA.shared_assets as unknown as any[]).map(a => ({ ...a, id: a._id || a.id }));
      onUpdate(fallbackAssets);
      if (onError) onError(error);
    }
  );
};

// Save a new shared asset (AI generated, Unsplash, or Upload)
export const saveSharedAsset = async (assetData: Omit<SharedGourmetAsset, 'id'>) => {
  // Generate a simple secure random ID
  const randomId = 'asset_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  const assetRef = doc(db, 'shared_assets', randomId);
  const fullData: SharedGourmetAsset = {
    id: randomId,
    ...assetData,
  };
  await setDoc(assetRef, fullData);
  return randomId;
};

// Delete a shared asset
export const deleteSharedAsset = async (assetId: string) => {
  const assetRef = doc(db, 'shared_assets', assetId);
  await deleteDoc(assetRef);
};

// --- Marketing Channels (SNS & YouTube Accounts Connection Hub) ---

// Subscribe to all channels
export const subscribeAllChannels = (
  onUpdate: (channels: MarketingChannel[]) => void,
  onError?: (err: any) => void
) => {
  const q = collection(db, 'marketing_channels');
  return onSnapshot(
    q,
    (snapshot) => {
      const list: MarketingChannel[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as MarketingChannel;
        if (data) {
          data.id = d.id;
          list.push(data);
        }
      });
      // Sort by createdAt desc
      list.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
      onUpdate(list);
    },
    (error) => {
      console.warn('Admin: Note fetching marketing channels:', error?.message || error);
      if (onError) onError(error);
    }
  );
};

// Save a new marketing channel
export const saveMarketingChannel = async (channelData: Omit<MarketingChannel, 'id'>) => {
  const randomId = 'channel_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  const channelRef = doc(db, 'marketing_channels', randomId);
  const fullData: MarketingChannel = {
    id: randomId,
    ...channelData,
  };
  await setDoc(channelRef, fullData);
  return randomId;
};

// Update a marketing channel (status, verification, etc.)
export const updateMarketingChannel = async (channelId: string, updatedData: Partial<MarketingChannel>) => {
  const channelRef = doc(db, 'marketing_channels', channelId);
  await updateDoc(channelRef, {
    ...updatedData,
    verifiedAt: updatedData.status === 'connected' ? new Date().toISOString() : undefined,
  });
};

// Delete a marketing channel
export const deleteMarketingChannel = async (channelId: string) => {
  const channelRef = doc(db, 'marketing_channels', channelId);
  await deleteDoc(channelRef);
};

