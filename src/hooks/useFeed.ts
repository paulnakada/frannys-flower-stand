import { useCallback, useEffect, useRef, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData,
  where,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Post } from '../types';

const PAGE_SIZE = 10;

function docToPost(d: QueryDocumentSnapshot<DocumentData>): Post {
  const data = d.data();
  return {
    id: d.id,
    authorId: data.authorId ?? '',
    authorName: "Franny's Flower Stand",
    text: data.text ?? '',
    imageUrl: data.imageUrl,
    imageAspectRatio: data.imageAspectRatio,
    commentCount: data.commentCount ?? 0,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isDeleted: data.isDeleted ?? false,
  };
}

export function useFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const subscribeFeed = useCallback(() => {
    // Tear down any existing listener before creating a new one
    unsubscribeRef.current?.();
    setIsLoading(true);

    const q = query(
      collection(db, 'posts'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    );

    unsubscribeRef.current = onSnapshot(q, (snap) => {
      const fetched = snap.docs.map(docToPost);
      lastDocRef.current = snap.docs[snap.docs.length - 1] ?? null;
      setHasMore(snap.docs.length === PAGE_SIZE);
      setPosts(fetched);
      setIsLoading(false);
    });
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
    setIsLoadingMore(false);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    subscribeFeed();
    return () => { unsubscribeRef.current?.(); };
  }, []);

  return {
    posts,
    isLoading,
    isLoadingMore,
    hasMore,
    refresh: subscribeFeed,
    loadMore,
  };
}
