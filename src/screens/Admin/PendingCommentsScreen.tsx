import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Comment } from '../../types';
import {
  subscribeToPendingComments,
  approveComment,
  rejectComment,
} from '../../services/commentService';
import { getPost } from '../../services/postService';
import { CommentItem } from '../../components/CommentItem';
import { theme } from '../../assets/theme';

export default function PendingCommentsScreen() {
  const navigation = useNavigation<any>();
  const [pendingComments, setPendingComments] = useState<
    Array<Comment & { postId: string; postText?: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToPendingComments(async comments => {
      // Fetch post titles for context
      const withPostTitles = await Promise.all(
        comments.map(async c => {
          const post = await getPost(c.postId);
          return { ...c, postText: post?.text };
        })
      );
      setPendingComments(withPostTitles);
      setIsLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleApprove = async (postId: string, commentId: string) => {
    try {
      await approveComment(postId, commentId);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleReject = (postId: string, commentId: string) => {
    Alert.alert(
      'Reject Comment',
      'This comment will be hidden and the user will not be notified.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectComment(postId, commentId);
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

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
      data={pendingComments}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <CommentItem
          comment={item}
          isAdmin
          onApprove={id => handleApprove(item.postId, id)}
          onReject={id => handleReject(item.postId, id)}
          showPostLink
          postTitle={item.postText ? `"${item.postText.substring(0, 60)}…"` : undefined}
          onPostPress={() =>
            navigation.navigate('PostDetail', { postId: item.postId })
          }
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyTitle}>All caught up!</Text>
          <Text style={styles.emptySubtitle}>
            No comments waiting for review.
          </Text>
        </View>
      }
      ListHeaderComponent={
        pendingComments.length > 0 ? (
          <View style={styles.listHeader}>
            <Ionicons name="time-outline" size={16} color={theme.colors.warning} />
            <Text style={styles.listHeaderText}>
              {pendingComments.length} comment
              {pendingComments.length !== 1 ? 's' : ''} waiting for your review
            </Text>
          </View>
        ) : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: theme.colors.cream },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.pendingBadge,
  },
  listHeaderText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
  },
  emptyIcon: { fontSize: 48, marginBottom: theme.spacing.md },
  emptyTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.warmGray,
  },
});
