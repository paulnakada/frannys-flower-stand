import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  increment,
  serverTimestamp,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Post, PaginatedResult, CreatePostForm } from '../types';

const PAGE_SIZE = 15;

// ─── Helper ───────────────────────────────────────────────────────────────────

const mapDocToPost = (snap: DocumentSnapshot): Post => {
  const data = snap.data()!;
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as Post;
};

// ─── Image Upload ─────────────────────────────────────────────────────────────

export const uploadPostImage = async (
  localUri: string,
  postId: string
): Promise<string> => {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `posts/${postId}/image`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

// ─── Create Post (admin only) ─────────────────────────────────────────────────

export const createPost = async (
  adminId: string,
  adminName: string,
  form: CreatePostForm
): Promise<Post> => {
  const postRef = await addDoc(collection(db, 'posts'), {
    authorId: adminId,
    authorName: adminName,
    text: form.text,
    imageUrl: null,
    imageAspectRatio: null,
    likeCount: 0,
    commentCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });

  if (form.imageUri) {
    const imageUrl = await uploadPostImage(form.imageUri, postRef.id);
    await updateDoc(postRef, { imageUrl });
  }

  const snap = await getDoc(postRef);
  return mapDocToPost(snap);
};

// ─── Real-time Feed Subscription ─────────────────────────────────────────────

export const subscribeToFeed = (
  onUpdate: (posts: Post[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );

  return onSnapshot(q, snapshot => {
    const posts = snapshot.docs
      .filter(d => !d.data().isDeleted)
      .map(mapDocToPost);
    onUpdate(posts);
  });
};

// ─── Paginated Fetch ──────────────────────────────────────────────────────────

export const fetchPosts = async (
  afterDoc?: DocumentSnapshot
): Promise<PaginatedResult<Post>> => {
  let q = query(
    collection(db, 'posts'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE)
  );
  if (afterDoc) {
    q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), startAfter(afterDoc), limit(PAGE_SIZE));
  }

  const snapshot = await getDocs(q);
  const posts = snapshot.docs.filter(d => !d.data().isDeleted).map(mapDocToPost);

  return {
    data: posts,
    lastDocumentId: snapshot.docs[snapshot.docs.length - 1]?.id,
    hasMore: snapshot.docs.length === PAGE_SIZE,
  };
};

// ─── Get Single Post ──────────────────────────────────────────────────────────

export const getPost = async (postId: string): Promise<Post | null> => {
  const snap = await getDoc(doc(db, 'posts', postId));
  if (!snap.exists() || snap.data().isDeleted) return null;
  return mapDocToPost(snap);
};

// ─── Delete Post (admin only) ─────────────────────────────────────────────────

export const deletePost = async (postId: string): Promise<void> => {
  await updateDoc(doc(db, 'posts', postId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
};

// ─── Likes (device-based, no login required) ──────────────────────────────────
// The like document ID is the deviceId so we can do fast "did I like this?" checks.

export const toggleLike = async (
  postId: string,
  deviceId: string
): Promise<{ liked: boolean }> => {
  const likeRef = doc(db, 'posts', postId, 'likes', deviceId);
  const likeSnap = await getDoc(likeRef);

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);
    await updateDoc(doc(db, 'posts', postId), { likeCount: increment(-1) });
    return { liked: false };
  } else {
    await setDoc(likeRef, {
      deviceId,
      postId,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'posts', postId), { likeCount: increment(1) });
    return { liked: true };
  }
};

export const getDeviceLikedPosts = async (
  deviceId: string,
  postIds: string[]
): Promise<Set<string>> => {
  const liked = new Set<string>();
  await Promise.all(
    postIds.map(async postId => {
      const snap = await getDoc(doc(db, 'posts', postId, 'likes', deviceId));
      if (snap.exists()) liked.add(postId);
    })
  );
  return liked;
};
