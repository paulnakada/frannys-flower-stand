import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  deleteDoc,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  where,
  runTransaction,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../services/firebase';
import { Post } from '../types';

const PAGE_SIZE = 10;
const DEVICE_ID_KEY = '@franny_device_id';

async function getDeviceId(): Promise<string> {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

function docToPost(d: QueryDocumentSnapshot<DocumentData>): Post {
  const data = d.data();
  return {
    id: d.id,
    authorId: data.authorId ?? '',
    authorName: data.authorName ?? 'Franny',
    text: data.text ?? '',
    imageUrl: data.imageUrl,
    imageAspectRatio: data.imageAspectRatio,
    likeCount: data.likeCount ?? 0,
    commentCount: data.commentCount ?? 0,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isDeleted: data.isDeleted ?? false,
  };
}

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  const initDeviceId = useCallback(async () => {
    deviceIdRef.current = await getDeviceId();
  }, []);

  const fetchPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsLoading(true);

    const q = query(
      collection(db, 'posts'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    );

    const snap = await getDocs(q);
    const fetched = snap.docs.map(docToPost);
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
    setHasMore(snap.docs.length === PAGE_SIZE);
    setPosts(fetched);

    // Load liked status
    if (deviceIdRef.current) {
      await refreshLikedSet(fetched.map(p => p.id));
    }

    setIsLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !lastDocRef.current) return;
    setIsLoadingMore(true);

    const q = query(
      collection(db, 'posts'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      startAfter(lastDocRef.current),
      limit(PAGE_SIZE),
    );

    const snap = await getDocs(q);
    const fetched = snap.docs.map(docToPost);
    lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
    setHasMore(snap.docs.length === PAGE_SIZE);
    setPosts(prev => [...prev, ...fetched]);

    if (deviceIdRef.current) {
      await refreshLikedSet([...posts.map(p => p.id), ...fetched.map(p => p.id)]);
    }

    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore, posts]);

  async function refreshLikedSet(postIds: string[]) {
    const deviceId = deviceIdRef.current;
    if (!deviceId) return;

    const checks = postIds.map(async (postId) => {
      const likeSnap = await getDocs(
        query(collection(db, 'posts', postId, 'likes'), where('deviceId', '==', deviceId), limit(1))
      );
      return likeSnap.empty ? null : postId;
    });

    const results = await Promise.all(checks);
    const liked = new Set(results.filter(Boolean) as string[]);
    setLikedPostIds(liked);
  }

  const handleToggleLike = useCallback(async (postId: string) => {
    const deviceId = deviceIdRef.current;
    if (!deviceId) return;

    const isLiked = likedPostIds.has(postId);
    const likeRef = doc(db, 'posts', postId, 'likes', deviceId);
    const postRef = doc(db, 'posts', postId);

    // Optimistic update
    setLikedPostIds(prev => {
      const next = new Set(prev);
      isLiked ? next.delete(postId) : next.add(postId);
      return next;
    });
    setPosts(prev =>
      prev.map(p => p.id === postId ? { ...p, likeCount: p.likeCount + (isLiked ? -1 : 1) } : p)
    );

    try {
      await runTransaction(db, async (tx) => {
        const postSnap = await tx.get(postRef);
        if (!postSnap.exists()) return;
        const current = postSnap.data().likeCount ?? 0;
        if (isLiked) {
          tx.delete(likeRef);
          tx.update(postRef, { likeCount: Math.max(0, current - 1) });
        } else {
          tx.set(likeRef, { id: deviceId, postId, deviceId, createdAt: new Date() });
          tx.update(postRef, { likeCount: current + 1 });
        }
      });
    } catch {
      // Revert optimistic update on failure
      setLikedPostIds(prev => {
        const next = new Set(prev);
        isLiked ? next.add(postId) : next.delete(postId);
        return next;
      });
      setPosts(prev =>
        prev.map(p => p.id === postId ? { ...p, likeCount: p.likeCount + (isLiked ? 1 : -1) } : p)
      );
    }
  }, [likedPostIds]);

  useEffect(() => {
    initDeviceId().then(() => fetchPosts());
  }, []);

  return {
    posts,
    likedPostIds,
    isLoading,
    isLoadingMore,
    hasMore,
    refresh: () => fetchPosts(true),
    loadMore,
    handleToggleLike,
  };
}
