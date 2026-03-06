import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

// ─── Button ──────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', isLoading, disabled, style }: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <TouchableOpacity
      style={[styles.btn, styles[`btn_${variant}`], isDisabled && styles.btn_disabled, style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' ? theme.colors.white : theme.colors.primary} size="small" />
      ) : (
        <Text style={[styles.btnLabel, styles[`btnLabel_${variant}`]]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Section Title ────────────────────────────────────────────────────────────

interface SectionTitleProps {
  children: string;
  style?: TextStyle;
}

export function SectionTitle({ children, style }: SectionTitleProps) {
  return <Text style={[styles.sectionTitle, style]}>{children}</Text>;
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  btn: {
    paddingVertical: theme.spacing.sm + 4,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.round,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  btn_primary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  btn_secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  btn_ghost: {
    backgroundColor: 'transparent',
  },
  btn_danger: {
    backgroundColor: theme.colors.error,
  },
  btn_disabled: {
    opacity: 0.5,
  },
  btnLabel: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.base,
  },
  btnLabel_primary: { color: theme.colors.white },
  btnLabel_secondary: { color: theme.colors.primary },
  btnLabel_ghost: { color: theme.colors.primary },
  btnLabel_danger: { color: theme.colors.white },

  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.md,
    ...theme.shadows.card,
  },

  sectionTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
  },

  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
  },
});
