import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { ADMIN_EMAILS } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { theme } from '../../theme';

export default function AdminLoginScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Dismiss the modal automatically once auth context confirms admin role
  useEffect(() => {
    if (user?.role === 'admin') {
      navigation.goBack();
    }
  }, [user]);

  async function handleSignIn() {
    const trimmedEmail = email.trim().toLowerCase();
    if (!ADMIN_EMAILS.includes(trimmedEmail)) {
      Alert.alert('Access denied', 'This email is not authorized for admin access.');
      return;
    }
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, trimmedEmail, password);
      // Navigation will happen via the useEffect above once auth state updates
    } catch (err: any) {
      const msg = friendlyAuthError(err.code);
      Alert.alert('Sign-in failed', `${msg}\n\n(${err.code})`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.subtitle}>
          Sign in to manage posts and comments for Franny's Flower Stand.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@example.com"
            placeholderTextColor={theme.colors.taupe}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={theme.colors.taupe}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="password"
          />
          <Button
            label="Sign In"
            onPress={handleSignIn}
            isLoading={isLoading}
            disabled={!email.trim() || !password}
            style={styles.signInBtn}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function friendlyAuthError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'That doesn\'t look like a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Enable it in the Firebase Console under Authentication → Sign-in method.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Try again later.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cream },
  content: {
    padding: theme.spacing.xl,
    paddingTop: theme.spacing.xxl,
    flexGrow: 1,
  },
  subtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.warmGray,
    marginBottom: theme.spacing.xl,
    lineHeight: 22,
  },
  form: { gap: theme.spacing.sm },
  label: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    marginBottom: 2,
    marginTop: theme.spacing.sm,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  signInBtn: { marginTop: theme.spacing.lg },
});
