import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { subscribeToPendingComments } from '../../services/commentService';
import { subscribeToFeed } from '../../services/postService';
import { AdminStackParamList, Comment, Post } from '../../types';
import { theme } from '../../assets/theme';

type AdminNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminHome'>;

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

const StatCard = ({ icon, label, value, color }: StatCardProps) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <Ionicons name={icon as any} size={22} color={color} />
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

interface ActionCardProps {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  badgeCount?: number;
}

const ActionCard = ({ icon, title, subtitle, onPress, badgeCount }: ActionCardProps) => (
  <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.actionCardLeft}>
      <View style={styles.actionIconContainer}>
        <Ionicons name={icon as any} size={24} color={theme.colors.primary} />
        {(badgeCount ?? 0) > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeCount}</Text>
          </View>
        )}
      </View>
      <View>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
    </View>
    <Ionicons name="chevron-forward" size={18} color={theme.colors.taupe} />
  </TouchableOpacity>
);

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminNavProp>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingComments, setPendingComments] = useState<Array<Comment & { postId: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsub1 = subscribeToFeed(newPosts => {
      setPosts(newPosts);
      setIsLoading(false);
    });
    const unsub2 = subscribeToPendingComments(setPendingComments);
    return () => { unsub1(); unsub2(); };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  const totalLikes = posts.reduce((sum, p) => sum + p.likeCount, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.commentCount, 0);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Welcome banner */}
      <View style={styles.welcomeBanner}>
        <Text style={styles.welcomeTitle}>Welcome back, Franny 🌸</Text>
        <Text style={styles.welcomeSubtitle}>
          Here's how your stand is blooming today
        </Text>
      </View>

      {/* Stats row */}
      <Text style={styles.sectionTitle}>Overview</Text>
      <View style={styles.statsRow}>
        <StatCard
          icon="documents-outline"
          label="Posts"
          value={posts.length}
          color={theme.colors.primary}
        />
        <StatCard
          icon="heart-outline"
          label="Total Likes"
          value={totalLikes}
          color={theme.colors.accentDark}
        />
        <StatCard
          icon="chatbubble-outline"
          label="Comments"
          value={totalComments}
          color={theme.colors.warning}
        />
      </View>

      {/* Pending alert */}
      {pendingComments.length > 0 && (
        <TouchableOpacity
          style={styles.pendingAlert}
          onPress={() => navigation.navigate('PendingComments')}
          activeOpacity={0.8}
        >
          <Ionicons name="time-outline" size={22} color={theme.colors.charcoal} />
          <Text style={styles.pendingAlertText}>
            {pendingComments.length} comment{pendingComments.length !== 1 ? 's' : ''} waiting for review
          </Text>
          <Ionicons name="chevron-forward" size={16} color={theme.colors.charcoal} />
        </TouchableOpacity>
      )}

      {/* Actions */}
      <Text style={styles.sectionTitle}>Actions</Text>
      <ActionCard
        icon="add-circle-outline"
        title="New Post"
        subtitle="Share photos & updates with your followers"
        onPress={() => navigation.navigate('CreatePost')}
      />
      <ActionCard
        icon="chatbubbles-outline"
        title="Review Comments"
        subtitle="Approve or reject pending comments"
        onPress={() => navigation.navigate('PendingComments')}
        badgeCount={pendingComments.length}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: theme.colors.cream },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  welcomeBanner: {
    backgroundColor: theme.colors.primaryDark,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  welcomeTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.white,
    marginBottom: theme.spacing.xs,
  },
  welcomeSubtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: 'rgba(255,255,255,0.8)',
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderLeftWidth: 3,
    ...theme.shadows.card,
  },
  statValue: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xxl,
    color: theme.colors.charcoal,
  },
  statLabel: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
    textAlign: 'center',
  },
  pendingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.pendingBadge,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  pendingAlertText: {
    flex: 1,
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    flex: 1,
  },
  actionIconContainer: { position: 'relative' },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: 10,
    color: theme.colors.white,
  },
  actionTitle: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
  },
  actionSubtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
    marginTop: 2,
    maxWidth: 220,
  },
});
