import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../assets/theme';

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, isAdmin, logoutAdmin, setDisplayName, clearDisplayName } = useAuth();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(user.displayName);

  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    await setDisplayName(nameInput.trim());
    setEditingName(false);
  };

  const handleClearName = () => {
    Alert.alert('Clear name', 'This will remove your saved name. You'll be asked again next time you comment.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: async () => {
        await clearDisplayName();
        setNameInput('');
      }},
    ]);
  };

  const handleAdminLogout = () => {
    Alert.alert('Sign out', 'Sign out from admin?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logoutAdmin },
    ]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Profile</Text>

      {/* Identity card */}
      <View style={styles.card}>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            {isAdmin
              ? <Ionicons name="leaf" size={36} color={theme.colors.primary} />
              : <Ionicons name="flower-outline" size={36} color={theme.colors.accent} />
            }
          </View>
          <View style={styles.avatarMeta}>
            {isAdmin && user.role === 'admin' ? (
              <>
                <Text style={styles.name}>{user.displayName}</Text>
                <View style={styles.adminBadge}>
                  <Ionicons name="leaf" size={11} color={theme.colors.white} />
                  <Text style={styles.adminBadgeText}>Admin</Text>
                </View>
                <Text style={styles.email}>{user.email}</Text>
              </>
            ) : (
              <>
                <Text style={styles.name}>
                  {user.displayName || 'Guest visitor'}
                </Text>
                <Text style={styles.roleLabel}>Flower fan 🌸</Text>
              </>
            )}
          </View>
        </View>
      </View>

      {/* Anon name editor */}
      {!isAdmin && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>Your display name</Text>
          <Text style={styles.sectionHint}>
            Used when you leave comments. Remembered on this device.
          </Text>
          {editingName ? (
            <View style={styles.nameEditRow}>
              <TextInput
                style={styles.nameInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Enter your name"
                placeholderTextColor={theme.colors.taupe}
                autoFocus
                maxLength={40}
              />
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveName}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.nameDisplayRow}>
              <Text style={styles.nameDisplay}>
                {user.displayName || 'Not set'}
              </Text>
              <TouchableOpacity onPress={() => { setNameInput(user.displayName); setEditingName(true); }}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
          {user.displayName ? (
            <TouchableOpacity onPress={handleClearName} style={styles.clearRow}>
              <Text style={styles.clearText}>Clear saved name</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}

      {/* Admin: sign-out */}
      {isAdmin && (
        <TouchableOpacity style={styles.signOutBtn} onPress={handleAdminLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={theme.colors.error} />
          <Text style={styles.signOutText}>Sign Out (Admin)</Text>
        </TouchableOpacity>
      )}

      {/* Non-admin: go to admin login */}
      {!isAdmin && (
        <TouchableOpacity
          style={styles.adminLinkBtn}
          onPress={() => navigation.navigate('AdminLogin')}
          activeOpacity={0.8}
        >
          <Ionicons name="leaf-outline" size={18} color={theme.colors.warmGray} />
          <Text style={styles.adminLinkText}>Admin sign in</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.cream },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxxl },
  pageTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.colors.accent,
  },
  avatarMeta: { flex: 1 },
  name: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  email: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
    marginTop: 4,
  },
  roleLabel: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
  adminBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.round,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  adminBadgeText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.white,
  },
  sectionLabel: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    marginBottom: 4,
  },
  sectionHint: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
    marginBottom: theme.spacing.md,
    lineHeight: 18,
  },
  nameEditRow: { flexDirection: 'row', gap: theme.spacing.sm, alignItems: 'center' },
  nameInput: {
    flex: 1,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
  },
  saveBtnText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.white,
  },
  nameDisplayRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  nameDisplay: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
  },
  editLink: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
  },
  clearRow: { marginTop: theme.spacing.sm },
  clearText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.error,
  },
  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  signOutText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.error,
  },
  adminLinkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  adminLinkText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
});
