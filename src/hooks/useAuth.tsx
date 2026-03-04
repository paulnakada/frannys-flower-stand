import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { Linking } from 'react-native';
import { AppUser, AdminUser, AnonUser } from '../types';
import {
  subscribeToAdminAuthState,
  getAdminProfile,
  completeAdminMagicLink,
  sendAdminMagicLink,
  logoutAdmin,
  getStoredDisplayName,
  saveDisplayName,
  clearDisplayName,
  getOrCreateDeviceId,
} from '../services/authService';
import { registerForPushNotifications } from '../services/notificationService';

// ─── Context Shape ────────────────────────────────────────────────────────────

interface AuthContextValue {
  /** Current user — either an AdminUser or an AnonUser */
  user: AppUser;
  /** Convenience flag */
  isAdmin: boolean;
  /** True while we're determining auth state on first launch */
  isLoading: boolean;
  /** Stable device ID for anonymous likes */
  deviceId: string;

  // Admin actions
  requestAdminLink: (email: string) => Promise<'sent' | 'not-admin'>;
  logoutAdmin: () => Promise<void>;

  // Anon name actions
  setDisplayName: (name: string) => Promise<void>;
  clearDisplayName: () => Promise<void>;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_ANON: AnonUser = { role: 'anonymous', displayName: '' };

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser>(DEFAULT_ANON);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceId, setDeviceId] = useState('');

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    let didInit = false;

    const init = async () => {
      // Always ensure a stable device ID exists
      const id = await getOrCreateDeviceId();
      setDeviceId(id);

      // Restore any saved display name for anonymous state
      const savedName = await getStoredDisplayName();
      if (savedName) {
        setUser({ role: 'anonymous', displayName: savedName });
      }
    };

    init();

    // Watch Firebase auth for admin sessions
    const unsubscribe = subscribeToAdminAuthState(async fbUser => {
      if (fbUser) {
        const profile = await getAdminProfile(fbUser.uid);
        if (profile) {
          setUser(profile);
          // Register push token for admin (admin is excluded from receiving pushes
          // in the Cloud Function, but we store the token for potential future use)
          registerForPushNotifications(profile.id).catch(console.warn);
        }
      } else {
        // No Firebase session — restore anon state
        const savedName = await getStoredDisplayName();
        setUser({ role: 'anonymous', displayName: savedName ?? '' });
      }

      if (!didInit) {
        didInit = true;
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  // ── Deep link handler for magic link completion ────────────────────────────

  useEffect(() => {
    const handleUrl = async ({ url }: { url: string }) => {
      try {
        const admin = await completeAdminMagicLink(url);
        if (admin) setUser(admin);
      } catch (e) {
        console.warn('Magic link error:', e);
      }
    };

    // Handle cold-start link
    Linking.getInitialURL().then(url => {
      if (url) handleUrl({ url });
    });

    // Handle foreground link
    const sub = Linking.addEventListener('url', handleUrl);
    return () => sub.remove();
  }, []);

  // ── Actions ───────────────────────────────────────────────────────────────

  const requestAdminLink = useCallback(
    async (email: string): Promise<'sent' | 'not-admin'> => {
      const sent = await sendAdminMagicLink(email);
      return sent ? 'sent' : 'not-admin';
    },
    []
  );

  const handleLogoutAdmin = useCallback(async () => {
    await logoutAdmin();
    const savedName = await getStoredDisplayName();
    setUser({ role: 'anonymous', displayName: savedName ?? '' });
  }, []);

  const handleSetDisplayName = useCallback(async (name: string) => {
    await saveDisplayName(name);
    setUser(prev =>
      prev.role === 'anonymous' ? { ...prev, displayName: name } : prev
    );
  }, []);

  const handleClearDisplayName = useCallback(async () => {
    await clearDisplayName();
    setUser(prev =>
      prev.role === 'anonymous' ? { ...prev, displayName: '' } : prev
    );
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user.role === 'admin',
        isLoading,
        deviceId,
        requestAdminLink,
        logoutAdmin: handleLogoutAdmin,
        setDisplayName: handleSetDisplayName,
        clearDisplayName: handleClearDisplayName,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
