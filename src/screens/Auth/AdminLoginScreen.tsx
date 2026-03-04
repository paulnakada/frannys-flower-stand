import React, { useState } from 'react';
import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/ui';
import { theme } from '../../assets/theme';

type Step = 'enter-email' | 'link-sent';

export default function AdminLoginScreen() {
  const navigation = useNavigation();
  const { requestAdminLink } = useAuth();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('enter-email');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestLink = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setIsLoading(true);
    try {
      const result = await requestAdminLink(trimmed);

      if (result === 'sent') {
        setStep('link-sent');
      } else {
        // Email not in admin list — give a neutral message so we don't leak info
        Alert.alert(
          'Sign-in unavailable',
          "That email address isn't set up for admin access. If you think this is a mistake, please try again or contact support.",
          [{ text: 'OK' }]
        );
      }
    } catch (e: any) {
      Alert.alert('Something went wrong', e.message ?? 'Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={20} color={theme.colors.charcoal} />
          <Text style={styles.backText}>Back to feed</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={40} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>Admin Sign In</Text>
          <Text style={styles.subtitle}>Franny's Flower Stand</Text>
        </View>

        {step === 'enter-email' ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Enter your email</Text>
            <Text style={styles.cardBody}>
              If your email is on the approved admin list, we'll send you a
              one-tap sign-in link — no password needed.
            </Text>

            <Input
              label="Admin email address"
              value={email}
              onChangeText={setEmail}
              placeholder="franny@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Button
              label="Send sign-in link"
              onPress={handleRequestLink}
              isLoading={isLoading}
              disabled={!email.trim() || isLoading}
              icon={
                !isLoading ? (
                  <Ionicons name="mail-outline" size={18} color={theme.colors.white} />
                ) : undefined
              }
            />
          </View>
        ) : (
          <View style={styles.card}>
            {/* Link sent confirmation */}
            <View style={styles.sentIcon}>
              <Ionicons name="checkmark-circle" size={52} color={theme.colors.primary} />
            </View>
            <Text style={styles.cardTitle}>Check your email</Text>
            <Text style={styles.cardBody}>
              A sign-in link has been sent to{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.cardBodySmall}>
              Open the email on this device and tap the link — you'll be signed
              in automatically. The link expires in 1 hour.
            </Text>

            <TouchableOpacity
              style={styles.resendRow}
              onPress={() => {
                setStep('enter-email');
                setEmail('');
              }}
            >
              <Text style={styles.resendText}>Use a different email</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.cream },
  content: {
    flexGrow: 1,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.xl,
    alignSelf: 'flex-start',
  },
  backText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  title: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.charcoal,
  },
  subtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    marginTop: 4,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  sentIcon: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.sm,
  },
  cardBody: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.warmGray,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  cardBodySmall: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
  },
  emailHighlight: {
    fontFamily: theme.typography.fonts.bodyMedium,
    color: theme.colors.primary,
  },
  resendRow: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  resendText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
  },
});
