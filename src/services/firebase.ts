/**
 * firebase.ts
 *
 * Central Firebase initialization.
 * Replace the config values below with your own from the Firebase Console:
 *   https://console.firebase.google.com → Project Settings → Your apps
 *
 * Required Firebase services:
 *   - Authentication  (Email/Password enabled)
 *   - Cloud Firestore
 *   - Cloud Storage
 *   - Cloud Functions  (for push notifications)
 *   - Cloud Messaging  (FCM)
 */

import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

// Prevent re-initialization in development hot-reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

/**
 * Firestore Collections Reference
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *  /users/{userId}
 *    - id, displayName, email, avatarUrl, role, fcmToken, createdAt, isActive
 *
 *  /posts/{postId}
 *    - id, authorId, text, imageUrl, imageAspectRatio,
 *      likeCount, commentCount, createdAt, updatedAt, isDeleted
 *
 *  /posts/{postId}/likes/{userId}
 *    - id, postId, userId, createdAt
 *    (userId as doc ID allows fast "did I like this?" lookups)
 *
 *  /posts/{postId}/comments/{commentId}
 *    - id, postId, authorId, text, imageUrl, imageAspectRatio,
 *      status ('pending'|'approved'|'rejected'), createdAt, updatedAt, isDeleted
 *
 * Security Rules summary (see firestore.rules):
 *   - Only authenticated users can read posts & approved comments
 *   - Only admin (role == 'admin') can create posts
 *   - Any authenticated user can create comments (status auto-set to 'pending')
 *   - Only admin can update comment status
 *   - Likes can be written/deleted by the owning user only
 */
