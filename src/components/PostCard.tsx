import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../types';
import { theme } from '../theme';

interface PostCardProps {
  post: Post;
  onPress: (postId: string) => void;
  onCommentPress: (postId: string) => void;
}

export function PostCard({ post, onPress, onCommentPress }: PostCardProps) {
  const dateLabel = formatDate(post.createdAt);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(post.id)} activeOpacity={0.9}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="flower" size={18} color={theme.colors.accent} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.date}>{dateLabel}</Text>
        </View>
      </View>

      {/* Body */}
      {post.text.length > 0 && (
        <Text style={styles.postText}>{post.text}</Text>
      )}

      {/* Image */}
      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={[
            styles.image,
            post.imageAspectRatio ? { aspectRatio: post.imageAspectRatio } : undefined,
          ]}
          resizeMode="cover"
        />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onCommentPress(post.id)}>
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.warmGray} />
          {post.commentCount > 0 && (
            <Text style={styles.actionCount}>{post.commentCount}</Text>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

function formatDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  authorName: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
  },
  date: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
    marginTop: 2,
  },
  postText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    lineHeight: 22,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  image: {
    width: '100%',
    height: 280,
    backgroundColor: theme.colors.sand,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionCount: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
});
