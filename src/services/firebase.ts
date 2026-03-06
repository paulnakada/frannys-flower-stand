import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: 'AIzaSyC70w7nGWsqiAp6cdXzNBTBX55dNl0JZmo',
  authDomain: 'franny-s-flower-stand.firebaseapp.com',
  projectId: 'franny-s-flower-stand',
  storageBucket: 'franny-s-flower-stand.firebasestorage.app',
  messagingSenderId: '224786983858',
  appId: '1:224786983858:web:d37fc24d266d49cb8412ab',
};

const isFirstInit = getApps().length === 0;
const app = isFirstInit ? initializeApp(firebaseConfig) : getApp();

export const auth = isFirstInit
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

/**
 * Firestore schema:
 *
 * /users/{uid}
 *   id, displayName, email, role, fcmToken?, createdAt, isActive
 *
 * /posts/{postId}
 *   id, authorId, authorName, text, imageUrl?, imageAspectRatio?,
 *   likeCount, commentCount, createdAt, updatedAt, isDeleted
 *
 * /posts/{postId}/likes/{deviceId}
 *   id, postId, deviceId, createdAt
 *
 * /posts/{postId}/comments/{commentId}
 *   id, postId, authorName, text, imageUrl?, imageAspectRatio?,
 *   status ('pending'|'approved'|'rejected'), createdAt, updatedAt, isDeleted
 */
