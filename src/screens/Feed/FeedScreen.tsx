import React from 'react';
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
import { useFeed } from '../../hooks/useFeed';
import { PostCard } from '../../components/PostCard';
import { EmptyState } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { FeedStackParamList, RootStackParamList } from '../../types';
import { theme } from '../../theme';

type FeedNavProp = NativeStackNavigationProp<FeedStackParamList, 'FeedHome'>;
type RootNavProp = NativeStackNavigationProp<RootStackParamList>;

export default function FeedScreen() {
  const feedNav = useNavigation<FeedNavProp>();
  const rootNav = useNavigation<RootNavProp>();
  const { user } = useAuth();
  const { posts, isLoading, isLoadingMore, hasMore, loadMore, refresh } = useFeed();

  const handlePostPress = (postId: string) => feedNav.navigate('PostDetail', { postId });

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
          onPress={handlePostPress}
          onCommentPress={handlePostPress}
        />
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <View style={styles.headerTitle}>
            <Ionicons name="flower" size={20} color={theme.colors.accent} />
            <Text style={styles.headerText}>Today's Bouquets</Text>
            <Ionicons name="flower" size={20} color={theme.colors.accent} />
          </View>
          <Text style={styles.headerSubtitle}>Get notified when Franny's Flower Stand will be open!</Text>
          {user?.role !== 'admin' && (
            <TouchableOpacity style={styles.loginBtn} onPress={() => rootNav.navigate('AdminLogin')}>
              <Ionicons name="shield-checkmark-outline" size={18} color={theme.colors.warmGray} />
            </TouchableOpacity>
          )}
        </View>
      }
      ListEmptyComponent={
        <EmptyState
          icon="🌸"
          title="No bouquets yet"
          subtitle="Check back soon for fresh updates from Franny!"
        />
      }
      ListFooterComponent={
        isLoadingMore ? (
          <View style={styles.footerLoader}>
            <ActivityIndicator color={theme.colors.primary} size="small" />
          </View>
        ) : (
          <View style={styles.listFooter} />
        )
      }
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
  list: { flex: 1, backgroundColor: theme.colors.cream },
  content: { paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xxxl },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cream },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
  },
  headerText: {
    fontFamily: theme.typography.fonts.displayItalic,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
  },
  headerSubtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  loginBtn: {
    position: 'absolute',
    right: theme.spacing.md,
    padding: theme.spacing.xs,
  },
  footerLoader: { paddingVertical: theme.spacing.lg, alignItems: 'center' },
  listFooter: { height: theme.spacing.xl },
});
