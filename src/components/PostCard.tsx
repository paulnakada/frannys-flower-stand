import React, { memo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../types';
import { theme } from '../../assets/theme';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface PostCardProps {
  post: Post;
  isLiked: boolean;
  onLike: (postId: string) => void;
  onPress: (postId: string) => void;
  onCommentPress?: (postId: string) => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_PADDING = theme.spacing.md;
const IMAGE_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;

export const PostCard = memo(
  ({ post, isLiked, onLike, onPress, onCommentPress }: PostCardProps) => {
    const imageHeight = post.imageUrl
      ? IMAGE_WIDTH / (post.imageAspectRatio ?? 1.5)
      : 0;

    return (
      <Pressable
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => onPress(post.id)}
        accessibilityRole="button"
        accessibilityLabel={`Post by ${post.author.displayName}`}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.authorRow}>
            <View style={styles.avatarContainer}>
              {post.author.avatarUrl ? (
                <Image
                  source={{ uri: post.author.avatarUrl }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons
                    name="flower"
                    size={18}
                    color={theme.colors.primary}
                  />
                </View>
              )}
            </View>
            <View>
              <Text style={styles.authorName}>{post.author.displayName}</Text>
              <Text style={styles.timestamp}>
                {formatDistanceToNow(post.createdAt)}
              </Text>
            </View>
          </View>
        </View>

        {/* Post Text */}
        <Text style={styles.text}>{post.text}</Text>

        {/* Post Image */}
        {post.imageUrl && (
          <Image
            source={{ uri: post.imageUrl }}
            style={[styles.image, { height: imageHeight }]}
            resizeMode="cover"
          />
        )}

        {/* Action Bar */}
        <View style={styles.actionBar}>
          {/* Like Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLike(post.id)}
            activeOpacity={0.7}
            accessibilityLabel={isLiked ? 'Unlike post' : 'Like post'}
            accessibilityRole="button"
          >
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={22}
              color={isLiked ? theme.colors.accentDark : theme.colors.warmGray}
            />
            {post.likeCount > 0 && (
              <Text
                style={[styles.actionCount, isLiked && styles.actionCountActive]}
              >
                {post.likeCount}
              </Text>
            )}
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => (onCommentPress ?? onPress)(post.id)}
            activeOpacity={0.7}
            accessibilityLabel="View comments"
            accessibilityRole="button"
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={theme.colors.warmGray}
            />
            {post.commentCount > 0 && (
              <Text style={styles.actionCount}>{post.commentCount}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Floral divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Ionicons name="flower" size={10} color={theme.colors.accentLight} />
          <View style={styles.dividerLine} />
        </View>
      </Pressable>
    );
  }
);

PostCard.displayName = 'PostCard';

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.cardBg,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardPressed: {
    opacity: 0.97,
    transform: [{ scale: 0.995 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: theme.colors.accentLight,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.sand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorName: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
  },
  timestamp: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
    marginTop: 1,
  },
  text: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    lineHeight: theme.typography.sizes.base * theme.typography.lineHeights.relaxed,
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  image: {
    width: '100%',
    backgroundColor: theme.colors.sand,
  },
  actionBar: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  actionCount: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
  actionCountActive: {
    color: theme.colors.accentDark,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
});
