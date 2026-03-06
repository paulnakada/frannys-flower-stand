import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { AdminUser, AnonUser, AppUser, ADMIN_EMAILS } from '../types';

const ANON_NAME_KEY = '@franny_anon_display_name';

interface AuthContextValue {
  user: AppUser | null;
  isLoadingAuth: boolean;
  signOut: () => Promise<void>;
  setAnonDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && ADMIN_EMAILS.includes(firebaseUser.email ?? '')) {
        // Unblock the UI immediately with basic auth data
        const basicAdmin: AdminUser = {
          id: firebaseUser.uid,
          displayName: firebaseUser.displayName ?? 'Admin',
          email: firebaseUser.email!,
          role: 'admin',
          createdAt: new Date(),
          isActive: true,
        };
        setUser(basicAdmin);
        setIsLoadingAuth(false);

        // Sync Firestore user doc in the background (creates it on first sign-in)
        loadAdminUser(firebaseUser).then(setUser).catch(() => {});
      } else {
        if (firebaseUser) {
          // Signed in but not an admin email — sign them out
          await firebaseSignOut(auth);
        }
        const anonUser = await loadAnonUser();
        setUser(anonUser);
        setIsLoadingAuth(false);
      }
    });

    return unsubscribe;
  }, []);

  async function loadAdminUser(firebaseUser: User): Promise<AdminUser> {
    const userRef = doc(db, 'users', firebaseUser.uid);
    try {
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: firebaseUser.uid,
          displayName: data.displayName ?? firebaseUser.displayName ?? 'Admin',
          email: firebaseUser.email!,
          role: 'admin',
          fcmToken: data.fcmToken,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          isActive: data.isActive ?? true,
        };
      }
      // First sign-in — create the user document so Firestore rules work
      const newAdmin = {
        displayName: firebaseUser.displayName ?? 'Admin',
        email: firebaseUser.email!,
        role: 'admin',
        createdAt: serverTimestamp(),
        isActive: true,
      };
      await setDoc(userRef, newAdmin);
      return {
        id: firebaseUser.uid,
        ...newAdmin,
        createdAt: new Date(),
      };
    } catch {
      // Firestore unavailable — return a usable default
      return {
        id: firebaseUser.uid,
        displayName: firebaseUser.displayName ?? 'Admin',
        email: firebaseUser.email!,
        role: 'admin',
        createdAt: new Date(),
        isActive: true,
      };
    }
  }

  async function loadAnonUser(): Promise<AnonUser> {
    const storedName = await AsyncStorage.getItem(ANON_NAME_KEY);
    return { role: 'anonymous', displayName: storedName ?? '' };
  }

  async function signOut() {
    await firebaseSignOut(auth);
    const anonUser = await loadAnonUser();
    setUser(anonUser);
  }

  async function setAnonDisplayName(name: string) {
    await AsyncStorage.setItem(ANON_NAME_KEY, name);
    setUser({ role: 'anonymous', displayName: name });
  }

  return (
    <AuthContext.Provider value={{ user, isLoadingAuth, signOut, setAnonDisplayName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
