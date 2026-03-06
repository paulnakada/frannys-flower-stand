import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Comment, CommentStatus } from '../types';
import { theme } from '../theme';

interface CommentItemProps {
  comment: Comment;
  isAdmin?: boolean;
  onApprove?: (commentId: string) => void;
  onReject?: (commentId: string) => void;
}

const STATUS_COLORS: Record<CommentStatus, string> = {
  pending: theme.colors.warning,
  approved: theme.colors.success,
  rejected: theme.colors.error,
};

export function CommentItem({ comment, isAdmin, onApprove, onReject }: CommentItemProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={14} color={theme.colors.warmGray} />
        </View>
        <Text style={styles.authorName}>{comment.authorName}</Text>
        <Text style={styles.date}>{formatDate(comment.createdAt)}</Text>
        {isAdmin && (
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[comment.status] + '22' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[comment.status] }]}>
              {comment.status}
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.text}>{comment.text}</Text>

      {comment.imageUrl && (
        <Image
          source={{ uri: comment.imageUrl }}
          style={[
            styles.image,
            comment.imageAspectRatio ? { aspectRatio: comment.imageAspectRatio } : undefined,
          ]}
          resizeMode="cover"
        />
      )}

      {isAdmin && comment.status === 'pending' && (
        <View style={styles.adminActions}>
          <TouchableOpacity
            style={[styles.adminBtn, styles.approveBtn]}
            onPress={() => onApprove?.(comment.id)}
          >
            <Ionicons name="checkmark" size={16} color={theme.colors.white} />
            <Text style={styles.adminBtnLabel}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adminBtn, styles.rejectBtn]}
            onPress={() => onReject?.(comment.id)}
          >
            <Ionicons name="close" size={16} color={theme.colors.white} />
            <Text style={styles.adminBtnLabel}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.round,
    backgroundColor: theme.colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    flex: 1,
  },
  date: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
  },
  statusBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.radius.round,
  },
  statusText: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.xs,
    textTransform: 'capitalize',
  },
  text: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    lineHeight: 22,
  },
  image: {
    width: '100%',
    borderRadius: theme.radius.sm,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.sand,
  },
  adminActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  adminBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.sm,
    gap: theme.spacing.xs,
  },
  approveBtn: { backgroundColor: theme.colors.success },
  rejectBtn: { backgroundColor: theme.colors.error },
  adminBtnLabel: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.white,
  },
});
