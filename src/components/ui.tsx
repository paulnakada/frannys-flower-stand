import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../assets/theme';

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}

export const Button = ({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  style,
  icon,
}: ButtonProps) => (
  <TouchableOpacity
    style={[
      styles.btn,
      variant === 'primary' && styles.btnPrimary,
      variant === 'secondary' && styles.btnSecondary,
      variant === 'ghost' && styles.btnGhost,
      (disabled || isLoading) && styles.btnDisabled,
      style,
    ]}
    onPress={onPress}
    disabled={disabled || isLoading}
    activeOpacity={0.82}
  >
    {isLoading ? (
      <ActivityIndicator
        color={variant === 'ghost' ? theme.colors.primary : theme.colors.white}
        size="small"
      />
    ) : (
      <React.Fragment>
        {icon}
        <Text
          style={[
            styles.btnText,
            variant === 'ghost' && styles.btnTextGhost,
            variant === 'secondary' && styles.btnTextSecondary,
          ]}
        >
          {label}
        </Text>
      </React.Fragment>
    )}
  </TouchableOpacity>
);

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address';
  style?: ViewStyle;
  error?: string;
}

export const Input = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  numberOfLines,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  style,
  error,
}: InputProps) => (
  <View style={[styles.inputWrapper, style]}>
    {label && <Text style={styles.inputLabel}>{label}</Text>}
    <TextInput
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        error && styles.inputError,
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.taupe}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      numberOfLines={numberOfLines}
      autoCapitalize={autoCapitalize}
      keyboardType={keyboardType}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
    {error && <Text style={styles.errorText}>{error}</Text>}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Button
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.round,
    gap: theme.spacing.sm,
  },
  btnPrimary: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.button,
  },
  btnSecondary: {
    backgroundColor: theme.colors.accent,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.white,
    letterSpacing: 0.3,
  },
  btnTextGhost: {
    color: theme.colors.primary,
  },
  btnTextSecondary: {
    color: theme.colors.charcoal,
  },

  // Input
  inputWrapper: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.xs,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputMultiline: {
    minHeight: 100,
    paddingTop: 12,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
