import React, { useEffect, useState } from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { Comment, Post } from '../types';
import { theme } from '../theme';

const PREVIEW_LIMIT = 3;

interface PostCardProps {
  post: Post;
  onPress: (postId: string) => void;
  onCommentPress: (postId: string) => void;
}

function docToComment(postId: string, d: any): Comment {
  const data = d.data();
  return {
    id: d.id,
    postId,
    authorName: data.authorName ?? 'Anonymous',
    text: data.text ?? '',
    imageUrl: data.imageUrl,
    imageAspectRatio: data.imageAspectRatio,
    status: data.status ?? 'approved',
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isDeleted: false,
  } as Comment;
}

export function PostCard({ post, onPress, onCommentPress }: PostCardProps) {
  const dateLabel = formatDate(post.createdAt);
  const [previewComments, setPreviewComments] = useState<Comment[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (post.commentCount === 0) {
      setPreviewComments([]);
      return;
    }
    const q = query(
      collection(db, 'posts', post.id, 'comments'),
      where('isDeleted', '==', false),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'asc'),
      limit(PREVIEW_LIMIT),
    );
    getDocs(q).then(snap => setPreviewComments(snap.docs.map(d => docToComment(post.id, d))));
  }, [post.id, post.commentCount]);

  async function handleShowMore() {
    const q = query(
      collection(db, 'posts', post.id, 'comments'),
      where('isDeleted', '==', false),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'asc'),
    );
    const snap = await getDocs(q);
    setAllComments(snap.docs.map(d => docToComment(post.id, d)));
    setIsExpanded(true);
  }

  const visibleComments = isExpanded ? allComments : previewComments;
  const hasMore = !isExpanded && post.commentCount > PREVIEW_LIMIT;

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
          style={[styles.image, { aspectRatio: post.imageAspectRatio ?? 4 / 3 }]}
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

      {/* Inline comment previews */}
      {visibleComments.length > 0 && (
        <View style={styles.commentsSection}>
          {visibleComments.map(comment => (
            <View key={comment.id} style={styles.commentRow}>
              <Text style={styles.commentText} numberOfLines={2}>
                <Text style={styles.commentAuthor}>{comment.authorName} </Text>
                {comment.text}
              </Text>
            </View>
          ))}
          {hasMore && (
            <TouchableOpacity onPress={handleShowMore} style={styles.moreLinkRow}>
              <Text style={styles.moreLink}>more</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
  commentsSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  commentRow: {
    flexDirection: 'row',
    flexShrink: 1,
  },
  commentAuthor: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
  },
  commentText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    lineHeight: 20,
    flex: 1,
  },
  moreLinkRow: {
    marginTop: theme.spacing.xs,
  },
  moreLink: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
});
