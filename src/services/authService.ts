/**
 * authService.ts
 *
 * Two authentication modes:
 *
 * 1. ANONYMOUS (regular users) — no Firebase Auth at all.
 *    Display name entered once by the user, stored in AsyncStorage.
 *    A random deviceId (UUID) is also generated once and persisted
 *    in AsyncStorage — used to identify likes across sessions.
 *
 * 2. ADMIN (magic link) — Firebase Email Link authentication.
 *    Admin enters their email. If it matches ADMIN_EMAILS, Firebase
 *    sends a sign-in link. They tap the link in their email client,
 *    the deep link re-opens the app, and Firebase completes auth.
 *    The admin profile is stored in Firestore /users/{uid}.
 *
 * Firebase Email Link setup (Firebase Console):
 *   Authentication → Sign-in method → Email/Password → enable "Email link"
 *   Authentication → Settings → Authorized domains → add your domain
 *   app.json → add scheme and intentFilters for deep links
 */

import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  ActionCodeSettings,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from './firebase';
import { AdminUser, ADMIN_EMAILS } from '../types';

// ─── AsyncStorage Keys ────────────────────────────────────────────────────────

const KEYS = {
  DISPLAY_NAME: '@frannys/displayName',
  DEVICE_ID: '@frannys/deviceId',
  PENDING_EMAIL: '@frannys/pendingEmail',
};

// ─── Device ID ────────────────────────────────────────────────────────────────

export const getOrCreateDeviceId = async (): Promise<string> => {
  let id = await AsyncStorage.getItem(KEYS.DEVICE_ID);
  if (!id) {
    id = uuidv4();
    await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
  }
  return id;
};

// ─── Display Name (anonymous users) ──────────────────────────────────────────

export const getStoredDisplayName = async (): Promise<string | null> =>
  AsyncStorage.getItem(KEYS.DISPLAY_NAME);

export const saveDisplayName = async (name: string): Promise<void> => {
  await AsyncStorage.setItem(KEYS.DISPLAY_NAME, name.trim());
};

export const clearDisplayName = async (): Promise<void> => {
  await AsyncStorage.removeItem(KEYS.DISPLAY_NAME);
};

// ─── Admin: Send Magic Link ───────────────────────────────────────────────────

export const sendAdminMagicLink = async (email: string): Promise<boolean> => {
  const normalised = email.trim().toLowerCase();

  if (!ADMIN_EMAILS.map(e => e.toLowerCase()).includes(normalised)) {
    return false;
  }

  const actionCodeSettings: ActionCodeSettings = {
    // Must be whitelisted in Firebase Console → Auth → Authorized domains
    url: 'https://your-project.firebaseapp.com/admin-login',
    handleCodeInApp: true,
    iOS: {
      bundleId: 'com.yourcompany.frannyflowers',
    },
    android: {
      packageName: 'com.yourcompany.frannyflowers',
      installApp: true,
      minimumVersion: '12',
    },
  };

  await sendSignInLinkToEmail(auth, normalised, actionCodeSettings);
  await AsyncStorage.setItem(KEYS.PENDING_EMAIL, normalised);
  return true;
};

// ─── Admin: Complete Magic Link Sign-In ───────────────────────────────────────

export const completeAdminMagicLink = async (
  url: string
): Promise<AdminUser | null> => {
  if (!isSignInWithEmailLink(auth, url)) return null;

  const email = await AsyncStorage.getItem(KEYS.PENDING_EMAIL);
  if (!email) {
    throw new Error('No pending email found. Please request a new sign-in link.');
  }

  const credential = await signInWithEmailLink(auth, email, url);
  await AsyncStorage.removeItem(KEYS.PENDING_EMAIL);
  return upsertAdminProfile(credential.user, email);
};

// ─── Upsert Admin Firestore Profile ──────────────────────────────────────────

const upsertAdminProfile = async (
  fbUser: FirebaseUser,
  email: string
): Promise<AdminUser> => {
  const ref = doc(db, 'users', fbUser.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    return { ...data, id: snap.id, createdAt: data.createdAt?.toDate() ?? new Date() } as AdminUser;
  }

  const newAdmin = {
    id: fbUser.uid,
    displayName: 'Franny',
    email,
    role: 'admin' as const,
    fcmToken: undefined,
    createdAt: serverTimestamp(),
    isActive: true,
  };
  await setDoc(ref, newAdmin);
  return { ...newAdmin, createdAt: new Date() };
};

// ─── Get Admin Profile ────────────────────────────────────────────────────────

export const getAdminProfile = async (uid: string): Promise<AdminUser | null> => {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return { ...data, id: snap.id, createdAt: data.createdAt?.toDate() ?? new Date() } as AdminUser;
};

// ─── Admin Logout ─────────────────────────────────────────────────────────────

export const logoutAdmin = async (): Promise<void> => signOut(auth);

// ─── Auth State Observer ──────────────────────────────────────────────────────

export const subscribeToAdminAuthState = (
  callback: (user: FirebaseUser | null) => void
) => onAuthStateChanged(auth, callback);

// ─── FCM Token ───────────────────────────────────────────────────────────────

export const updateFcmToken = async (userId: string, fcmToken: string) =>
  updateDoc(doc(db, 'users', userId), { fcmToken });
