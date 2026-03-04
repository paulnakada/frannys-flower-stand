import React from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFeed } from '../../hooks/useFeed';
import { PostCard } from '../../components/PostCard';
import { theme } from '../../assets/theme';
import { FeedStackParamList } from '../../types';

type FeedNavProp = NativeStackNavigationProp<FeedStackParamList, 'FeedHome'>;

const FeedHeader = () => (
  <View style={styles.header}>
    <Ionicons name="flower" size={22} color={theme.colors.accent} />
    <Text style={styles.headerTitle}>Today's Blooms</Text>
    <Ionicons name="flower" size={22} color={theme.colors.accent} />
  </View>
);

const EmptyFeed = () => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyIcon}>🌸</Text>
    <Text style={styles.emptyTitle}>Nothing blooming yet</Text>
    <Text style={styles.emptySubtitle}>
      Check back soon for fresh updates from Franny!
    </Text>
  </View>
);

const FooterLoader = ({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) return <View style={styles.listFooter} />;
  return (
    <View style={styles.footerLoader}>
      <ActivityIndicator color={theme.colors.primary} size="small" />
    </View>
  );
};

export default function FeedScreen() {
  const navigation = useNavigation<FeedNavProp>();
  const {
    posts,
    likedPostIds,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    handleToggleLike,
  } = useFeed();

  const handlePostPress = (postId: string) => {
    navigation.navigate('PostDetail', { postId });
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
      data={posts}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <PostCard
          post={item}
          isLiked={likedPostIds.has(item.id)}
          onLike={handleToggleLike}
          onPress={handlePostPress}
          onCommentPress={handlePostPress}
        />
      )}
      ListHeaderComponent={<FeedHeader />}
      ListEmptyComponent={<EmptyFeed />}
      ListFooterComponent={<FooterLoader isLoading={isLoadingMore} />}
      onEndReached={hasMore ? loadMore : undefined}
      onEndReachedThreshold={0.4}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={refresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
    backgroundColor: theme.colors.cream,
  },
  content: {
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontFamily: theme.typography.fonts.displayItalic,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
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
    textAlign: 'center',
    lineHeight: 22,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cream,
  },
  footerLoader: {
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
  },
  listFooter: { height: theme.spacing.xl },
});
