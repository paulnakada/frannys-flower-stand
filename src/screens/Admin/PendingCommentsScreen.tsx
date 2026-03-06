import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Comment } from '../../types';
import { CommentItem } from '../../components/CommentItem';
import { EmptyState } from '../../components/ui';
import { theme } from '../../theme';

interface PendingComment extends Comment {
  postId: string;
}

export default function PendingCommentsScreen() {
  const [comments, setComments] = useState<PendingComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPendingComments();
  }, []);

  async function loadPendingComments() {
    setIsLoading(true);
    const postsSnap = await getDocs(query(collection(db, 'posts'), where('isDeleted', '==', false)));
    const all: PendingComment[] = [];

    await Promise.all(postsSnap.docs.map(async (postDoc) => {
      const q = query(
        collection(db, 'posts', postDoc.id, 'comments'),
        where('status', '==', 'pending'),
        where('isDeleted', '==', false),
      );
      const snap = await getDocs(q);
      snap.docs.forEach(d => {
        const data = d.data();
        all.push({
          id: d.id,
          postId: postDoc.id,
          authorName: data.authorName ?? 'Anonymous',
          text: data.text ?? '',
          imageUrl: data.imageUrl,
          imageAspectRatio: data.imageAspectRatio,
          status: 'pending',
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          isDeleted: false,
        });
      });
    }));

    all.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    setComments(all);
    setIsLoading(false);
  }

  async function handleApprove(commentId: string) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setComments(prev => prev.filter(c => c.id !== commentId));

    try {
      await updateDoc(doc(db, 'posts', comment.postId, 'comments', commentId), {
        status: 'approved',
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'posts', comment.postId), {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });
    } catch {
      Alert.alert('Error', 'Could not approve comment. Please refresh and try again.');
      loadPendingComments();
    }
  }

  async function handleReject(commentId: string) {
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    setComments(prev => prev.filter(c => c.id !== commentId));

    try {
      await updateDoc(doc(db, 'posts', comment.postId, 'comments', commentId), {
        status: 'rejected',
        updatedAt: serverTimestamp(),
      });
    } catch {
      Alert.alert('Error', 'Could not reject comment. Please refresh and try again.');
      loadPendingComments();
    }
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
      data={comments}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <CommentItem
          comment={item}
          isAdmin
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
      ListHeaderComponent={
        comments.length > 0 ? (
          <Text style={styles.countLabel}>{comments.length} pending</Text>
        ) : null
      }
      ListEmptyComponent={
        <EmptyState
          icon="✅"
          title="All caught up!"
          subtitle="No comments waiting for review."
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={loadPendingComments}
          tintColor={theme.colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: theme.colors.cream },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cream },
  countLabel: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    marginBottom: theme.spacing.md,
  },
});
