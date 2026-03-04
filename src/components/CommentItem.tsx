import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../../types';
import { theme } from '../../assets/theme';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface CommentItemProps {
  comment: Comment;
  isAdmin?: boolean;
  onApprove?: (commentId: string) => void;
  onReject?: (commentId: string) => void;
  showPostLink?: boolean;
  postTitle?: string;
  onPostPress?: () => void;
}

export const CommentItem = ({
  comment,
  isAdmin = false,
  onApprove,
  onReject,
  showPostLink,
  postTitle,
  onPostPress,
}: CommentItemProps) => {
  const isPending = comment.status === 'pending';
  const initial = comment.authorName?.[0]?.toUpperCase() ?? '?';

  return (
    <View style={[styles.container, isPending && styles.pendingContainer]}>
      {isPending && (
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeText}>Awaiting Approval</Text>
        </View>
      )}

      {showPostLink && postTitle && (
        <TouchableOpacity onPress={onPostPress} style={styles.postLink}>
          <Ionicons name="return-up-back" size={12} color={theme.colors.primary} />
          <Text style={styles.postLinkText} numberOfLines={1}>{postTitle}</Text>
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        </View>
        <View style={styles.meta}>
          <Text style={styles.authorName}>{comment.authorName}</Text>
          <Text style={styles.timestamp}>{formatDistanceToNow(comment.createdAt)}</Text>
        </View>
      </View>

      <Text style={styles.text}>{comment.text}</Text>

      {comment.imageUrl && (
        <Image
          source={{ uri: comment.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      {isAdmin && isPending && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.approveBtn]}
            onPress={() => onApprove?.(comment.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark" size={16} color={theme.colors.white} />
            <Text style={styles.actionBtnText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            onPress={() => onReject?.(comment.id)}
            activeOpacity={0.8}
          >
            <Ionicons name="close" size={16} color={theme.colors.white} />
            <Text style={styles.actionBtnText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pendingContainer: {
    borderColor: theme.colors.pendingBadge,
    borderWidth: 1.5,
  },
  pendingBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.pendingBadge,
    borderRadius: theme.radius.round,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    marginBottom: theme.spacing.sm,
  },
  pendingBadgeText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.charcoal,
  },
  postLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: theme.spacing.sm,
  },
  postLinkText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.primary,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: theme.colors.accentLight,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.accentDark,
  },
  meta: { flex: 1 },
  authorName: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
  },
  timestamp: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
  },
  text: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    lineHeight: theme.typography.sizes.sm * 1.6,
  },
  image: {
    width: '100%',
    height: 160,
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.sand,
  },
  adminActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  approveBtn: { backgroundColor: theme.colors.primary },
  rejectBtn: { backgroundColor: theme.colors.error },
  actionBtnText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.white,
  },
});
