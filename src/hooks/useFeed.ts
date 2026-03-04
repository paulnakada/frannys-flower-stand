import { useState, useEffect, useCallback, useRef } from 'react';
import { Post } from '../types';
import { subscribeToFeed, fetchPosts, getDeviceLikedPosts, toggleLike } from '../services/postService';
import { useAuth } from './useAuth';

interface UseFeedResult {
  posts: Post[];
  likedPostIds: Set<string>;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  refresh: () => void;
  handleToggleLike: (postId: string) => Promise<void>;
}

export const useFeed = (): UseFeedResult => {
  const { deviceId } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const lastDocIdRef = useRef<string | undefined>(undefined);

  // Subscribe to real-time updates for the first page
  useEffect(() => {
    setIsLoading(true);
    lastDocIdRef.current = undefined;

    const unsubscribe = subscribeToFeed(async newPosts => {
      setPosts(newPosts);
      setIsLoading(false);
      setHasMore(newPosts.length >= 15);

      if (deviceId) {
        const liked = await getDeviceLikedPosts(deviceId, newPosts.map(p => p.id));
        setLikedPostIds(liked);
      }
    });

    return unsubscribe;
  }, [deviceId, refreshKey]);

  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const result = await fetchPosts(/* pass cursor from lastDocId */);
      setPosts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newUnique = result.data.filter(p => !existingIds.has(p.id));
        return [...prev, ...newUnique];
      });
      setHasMore(result.hasMore);
      lastDocIdRef.current = result.lastDocumentId;

      // Update liked status for new posts
      if (deviceId && result.data.length > 0) {
        const newLiked = await getDeviceLikedPosts(deviceId, result.data.map(p => p.id));
        setLikedPostIds(prev => new Set([...prev, ...newLiked]));
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, user]);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  const handleToggleLike = useCallback(
    async (postId: string) => {
      if (!deviceId) return;
      const wasLiked = likedPostIds.has(postId);
      setLikedPostIds(prev => {
        const next = new Set(prev);
        wasLiked ? next.delete(postId) : next.add(postId);
        return next;
      });
      setPosts(prev =>
        prev.map(p =>
          p.id === postId
            ? { ...p, likeCount: p.likeCount + (wasLiked ? -1 : 1) }
            : p
        )
      );
      try {
        await toggleLike(postId, deviceId);
      } catch {
        // Revert on failure
        setLikedPostIds(prev => {
          const next = new Set(prev);
          wasLiked ? next.add(postId) : next.delete(postId);
          return next;
        });
        setPosts(prev =>
          prev.map(p =>
            p.id === postId
              ? { ...p, likeCount: p.likeCount + (wasLiked ? 1 : -1) }
              : p
          )
        );
      }
    },
    [deviceId, likedPostIds]
  );

  return {
    posts,
    likedPostIds,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    handleToggleLike,
  };
};
