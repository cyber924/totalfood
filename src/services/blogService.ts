import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { GeneratedBlogResult } from '../types';
import { MIGRATION_BACKUP_DATA } from '../data/migrationSourceData';

export const distributePostImages = async (
  title: string,
  bodyMarkdown: string,
  coverUrl: string
): Promise<{ cleanedBody: string; cleanedCover: string }> => {
  let cleanedCover = coverUrl || '';
  let cleanedBody = bodyMarkdown || '';

  // 1. Check cover image
  if (coverUrl && coverUrl.startsWith('data:')) {
    const imageId = 'img_cover_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    try {
      await setDoc(doc(db, 'post_images', imageId), {
        imageContent: coverUrl,
        createdAt: new Date().toISOString()
      });
      cleanedCover = `/api/get-image?id=${imageId}`;
    } catch (err) {
      console.warn('Failed to distribute cover image:', err);
    }
  }

  // 2. Parse inline images in markdown: ![alt](data:image/jpeg;base64,...)
  const mdImageRegex = /!\[([^\]]*)\]\((data:image\/[^;]+;base64,[^)]+)\)/g;
  let match;
  
  let tempBody = bodyMarkdown || '';
  const matches: { alt: string; base64: string }[] = [];
  
  mdImageRegex.lastIndex = 0;
  while ((match = mdImageRegex.exec(tempBody)) !== null) {
    matches.push({
      alt: match[1],
      base64: match[2]
    });
  }

  for (const item of matches) {
    const imageId = 'img_inline_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
    try {
      await setDoc(doc(db, 'post_images', imageId), {
        imageContent: item.base64,
        createdAt: new Date().toISOString()
      });
      const proxyUrl = `/api/get-image?id=${imageId}`;
      tempBody = tempBody.replaceAll(item.base64, proxyUrl);
    } catch (err) {
      console.warn('Failed to distribute inline image:', err);
    }
  }

  cleanedBody = tempBody;
  return { cleanedBody, cleanedCover };
};

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

export const savePostToFirestore = async (userId: string, post: GeneratedBlogResult) => {
  if (!userId || !post?.id) return;

  // Distribute any embedded Base64 images to separate documents in Firestore to preserve the 1MB document limit
  let finalBody = post.contentMarkdown || '';
  let finalCover = post.customImageUrl || '';
  try {
    const distributed = await distributePostImages(post.selectedTitle || '', post.contentMarkdown || '', post.customImageUrl || '');
    finalBody = distributed.cleanedBody;
    finalCover = distributed.cleanedCover;
  } catch (distErr) {
    console.warn('[Distributed Storage] Note:', distErr);
  }

  const processedPost = {
    ...post,
    contentMarkdown: finalBody,
    customImageUrl: finalCover
  };

  // 1. Optimistic local cache update so user never loses data
  try {
    const raw = localStorage.getItem('blogai_saved_posts');
    const list: GeneratedBlogResult[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((p) => p.id === post.id);
    const updatedPost = { ...processedPost, userId, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list[idx] = updatedPost;
    } else {
      list.unshift(updatedPost);
    }
    localStorage.setItem('blogai_saved_posts', JSON.stringify(stripBase64(list)));
  } catch (e) {
    // localStorage may be unavailable or quota exceeded
  }

  // 2. Cloud Firestore synchronization
  try {
    const postRef = doc(db, 'saved_posts', post.id);
    await setDoc(postRef, {
      ...processedPost,
      userId,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('[Firestore:saved_posts] Cloud sync note (cached locally):', err?.message || err);
  }
};

export const deletePostFromFirestore = async (userId: string, postId: string) => {
  if (!postId) return;

  // 1. Local cache update
  try {
    const raw = localStorage.getItem('blogai_saved_posts');
    if (raw) {
      const list: GeneratedBlogResult[] = JSON.parse(raw);
      const filtered = list.filter((p) => p.id !== postId);
      localStorage.setItem('blogai_saved_posts', JSON.stringify(filtered));
    }
  } catch (e) {}

  // 2. Cloud delete
  try {
    const postRef = doc(db, 'saved_posts', postId);
    await deleteDoc(postRef);
  } catch (err: any) {
    console.warn('[Firestore:saved_posts] Cloud delete note:', err?.message || err);
  }
};

export const subscribeUserPosts = (
  userId: string,
  onUpdate: (posts: GeneratedBlogResult[]) => void,
  onError?: (err: any) => void
) => {
  const getFallbackPosts = (): GeneratedBlogResult[] => {
    try {
      const loaded = localStorage.getItem('blogai_saved_posts');
      if (loaded) {
        const parsed = JSON.parse(loaded);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    return (MIGRATION_BACKUP_DATA.saved_posts as unknown as any[] || []).map((p) => ({
      ...p,
      id: p._id || p.id,
    }));
  };

  if (!userId) {
    onUpdate(getFallbackPosts());
    return () => {};
  }

  const q = collection(db, 'saved_posts');

  return onSnapshot(
    q,
    (snapshot) => {
      const posts: GeneratedBlogResult[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as GeneratedBlogResult;
        if (data && data.userId === userId) {
          posts.push({ ...data, id: doc.id });
        }
      });

      // Sort client side by createdAt desc
      posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      try {
        localStorage.setItem('blogai_saved_posts', JSON.stringify(stripBase64(posts)));
      } catch {}
      onUpdate(posts);
    },
    (error) => {
      console.warn('[Firestore] Posts subscription note, serving local/backup data:', error?.message || error);
      onUpdate(getFallbackPosts());
      if (onError) onError(error);
    }
  );
};

