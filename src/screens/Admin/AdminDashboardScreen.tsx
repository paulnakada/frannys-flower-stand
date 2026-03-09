import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Post, AdminStackParamList } from '../../types';
import { PostCard } from '../../components/PostCard';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

type AdminNavProp = NativeStackNavigationProp<AdminStackParamList, 'AdminHome'>;

export default function AdminDashboardScreen() {
  const navigation = useNavigation<AdminNavProp>();
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setIsLoading(true);
    await Promise.all([loadPosts(), loadPendingCount()]);
    setIsLoading(false);
  }

  async function loadPosts() {
    const q = query(
      collection(db, 'posts'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20),
    );
    const snap = await getDocs(q);
    setPosts(snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        authorId: data.authorId,
        authorName: data.authorName ?? 'Franny',
        text: data.text ?? '',
        imageUrl: data.imageUrl,
        imageAspectRatio: data.imageAspectRatio,
        likeCount: data.likeCount ?? 0,
        commentCount: data.commentCount ?? 0,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        isDeleted: data.isDeleted ?? false,
      };
    }));
  }

  async function loadPendingCount() {
    // Count pending comments across all posts
    const postsSnap = await getDocs(query(collection(db, 'posts'), where('isDeleted', '==', false)));
    let total = 0;
    await Promise.all(postsSnap.docs.map(async (postDoc) => {
      const q = query(
        collection(db, 'posts', postDoc.id, 'comments'),
        where('status', '==', 'pending'),
        where('isDeleted', '==', false),
      );
      const snap = await getDocs(q);
      total += snap.size;
    }));
    setPendingCount(total);
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={posts}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          isLiked={false}
          onLike={() => {}}
          onPress={(id) => navigation.navigate('PostDetail', { postId: id })}
          onCommentPress={(id) => navigation.navigate('PostDetail', { postId: id })}
        />
      )}
      ListHeaderComponent={
        <View>
          <Text style={styles.welcome}>Welcome, {user?.displayName || 'Admin'}</Text>

          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('CreatePost')}
            >
              <Ionicons name="add-circle" size={32} color={theme.colors.primary} />
              <Text style={styles.actionLabel}>New Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('PendingComments')}
            >
              <View>
                <Ionicons name="chatbubbles" size={32} color={theme.colors.primary} />
                {pendingCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{pendingCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.actionLabel}>Comments</Text>
              {pendingCount > 0 && (
                <Text style={styles.pendingLabel}>{pendingCount} pending</Text>
              )}
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Your Posts</Text>
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="✍️"
          title="No posts yet"
          subtitle="Tap 'New Post' to share your first bouquet!"
        />
      }
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={loadDashboard} tintColor={theme.colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: theme.colors.cream },
  content: { paddingBottom: theme.spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cream },
  welcome: {
    fontFamily: theme.typography.fonts.displayItalic,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
  },
  quickActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  actionCard: {
    flex: 1,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
    ...theme.shadows.card,
  },
  actionLabel: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
  },
  pendingLabel: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warning,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.round,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.white,
  },
  sectionTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.charcoal,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
});
