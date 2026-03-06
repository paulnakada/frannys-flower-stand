import React, { useState } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { RootStackParamList } from '../../types';
import { theme } from '../../theme';

type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<RootNavProp>();
  const { user, signOut, setAnonDisplayName } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user?.displayName ?? '');

  async function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Name required', 'Please enter a display name.');
      return;
    }
    await setAnonDisplayName(trimmed);
    setEditingName(false);
  }

  async function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out of admin?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: signOut },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons
              name={isAdmin ? 'shield-checkmark' : 'person'}
              size={40}
              color={isAdmin ? theme.colors.primary : theme.colors.warmGray}
            />
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{isAdmin ? 'Admin' : 'Guest'}</Text>
          </View>
        </View>

        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Display Name</Text>
          {editingName && !isAdmin ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={[styles.input, styles.nameInput]}
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
              <Button label="Save" onPress={saveName} style={styles.saveBtn} />
            </View>
          ) : (
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{user?.displayName || 'Not set'}</Text>
              {!isAdmin && (
                <Button
                  label="Edit"
                  onPress={() => setEditingName(true)}
                  variant="ghost"
                  style={styles.editBtn}
                />
              )}
            </View>
          )}
          {!isAdmin && (
            <Text style={styles.hint}>
              Your name is shown on comments you post.
            </Text>
          )}
        </View>

        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Email</Text>
            <Text style={styles.nameText}>{(user as any).email}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          {isAdmin ? (
            <Button label="Sign Out" onPress={handleSignOut} variant="secondary" />
          ) : (
            <Button
              label="Admin Sign In"
              onPress={() => navigation.navigate('AdminLogin')}
              variant="secondary"
            />
          )}
        </View>

        {/* App info */}
        <View style={styles.footer}>
          <Ionicons name="flower" size={20} color={theme.colors.accent} />
          <Text style={styles.footerText}>Franny's Flower Stand</Text>
          <Text style={styles.version}>v1.0.0</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cream },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  avatarContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleBadge: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.sand,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.round,
  },
  roleBadgeText: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionLabel: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.charcoal,
  },
  nameEditRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    alignItems: 'center',
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
  nameInput: { flex: 1 },
  saveBtn: { paddingHorizontal: theme.spacing.md },
  editBtn: { paddingVertical: 0 },
  hint: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    marginTop: theme.spacing.xs,
  },
  actionsSection: {
    marginTop: theme.spacing.md,
  },
  footer: {
    marginTop: theme.spacing.xxxl,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  footerText: {
    fontFamily: theme.typography.fonts.displayItalic,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.charcoal,
  },
  version: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.taupe,
  },
});
