import {
  collection,
  collectionGroup,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  onSnapshot,
  increment,
  DocumentSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { Comment, CommentStatus, CreateCommentForm } from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

const mapDocToComment = (snap: DocumentSnapshot): Comment => {
  const data = snap.data()!;
  return {
    ...data,
    id: snap.id,
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
  } as Comment;
};

// ─── Image Upload ─────────────────────────────────────────────────────────────

export const uploadCommentImage = async (
  localUri: string,
  postId: string,
  commentId: string
): Promise<string> => {
  const response = await fetch(localUri);
  const blob = await response.blob();
  const storageRef = ref(storage, `posts/${postId}/comments/${commentId}/image`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

// ─── Create Comment (anonymous — no login required) ───────────────────────────
// authorName comes from the user's locally-stored name (entered on first comment).
// status is always 'pending' — admin must approve.
// NO push notification is sent (per spec).

export const createComment = async (
  postId: string,
  form: CreateCommentForm
): Promise<Comment> => {
  const commentRef = await addDoc(collection(db, 'posts', postId, 'comments'), {
    postId,
    authorName: form.authorName.trim(),
    text: form.text.trim(),
    imageUrl: null,
    imageAspectRatio: null,
    status: 'pending' as CommentStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
  });

  if (form.imageUri) {
    const imageUrl = await uploadCommentImage(form.imageUri, postId, commentRef.id);
    await updateDoc(commentRef, { imageUrl });
  }

  const snap = await getDoc(commentRef);
  return mapDocToComment(snap);
};

// ─── Subscribe to Approved Comments ──────────────────────────────────────────

export const subscribeToApprovedComments = (
  postId: string,
  onUpdate: (comments: Comment[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    where('status', '==', 'approved'),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, snapshot => {
    onUpdate(snapshot.docs.map(mapDocToComment));
  });
};

// ─── Subscribe to Pending Comments (admin) ───────────────────────────────────

export const subscribeToPendingComments = (
  onUpdate: (comments: Array<Comment & { postId: string }>) => void
): Unsubscribe => {
  const q = query(
    collectionGroup(db, 'comments'),
    where('status', '==', 'pending'),
    where('isDeleted', '==', false),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(q, snapshot => {
    const comments = snapshot.docs.map(d => ({
      ...mapDocToComment(d),
      postId: d.ref.parent.parent!.id,
    }));
    onUpdate(comments);
  });
};

// ─── Approve Comment (admin) ──────────────────────────────────────────────────

export const approveComment = async (
  postId: string,
  commentId: string
): Promise<void> => {
  await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
    status: 'approved' as CommentStatus,
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
};

// ─── Reject Comment (admin) ───────────────────────────────────────────────────

export const rejectComment = async (
  postId: string,
  commentId: string
): Promise<void> => {
  await updateDoc(doc(db, 'posts', postId, 'comments', commentId), {
    status: 'rejected' as CommentStatus,
    updatedAt: serverTimestamp(),
  });
};
