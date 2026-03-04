import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { FeedStackParamList, Post, Comment } from '../../types';
import { getPost, toggleLike, getDeviceLikedPosts } from '../../services/postService';
import { createComment, subscribeToApprovedComments } from '../../services/commentService';
import { CommentItem } from '../../components/CommentItem';
import { useAuth } from '../../hooks/useAuth';
import { theme } from '../../assets/theme';

type PostDetailRoute = RouteProp<FeedStackParamList, 'PostDetail'>;

// ─── Name Prompt Modal ────────────────────────────────────────────────────────

interface NamePromptProps {
  visible: boolean;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const NamePromptModal = ({ visible, onConfirm, onCancel }: NamePromptProps) => {
  const [name, setName] = useState('');
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={nameStyles.overlay}>
        <View style={nameStyles.sheet}>
          <View style={nameStyles.flowerRow}>
            <Ionicons name="flower" size={28} color={theme.colors.accent} />
          </View>
          <Text style={nameStyles.title}>What's your name?</Text>
          <Text style={nameStyles.subtitle}>
            Just enter your first name so Franny knows who's saying hi 🌸
          </Text>
          <TextInput
            style={nameStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={theme.colors.taupe}
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={() => name.trim() && onConfirm(name.trim())}
          />
          <TouchableOpacity
            style={[nameStyles.confirmBtn, !name.trim() && nameStyles.confirmBtnDisabled]}
            onPress={() => onConfirm(name.trim())}
            disabled={!name.trim()}
            activeOpacity={0.8}
          >
            <Text style={nameStyles.confirmBtnText}>Continue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={nameStyles.cancelBtn} onPress={onCancel}>
            <Text style={nameStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PostDetailScreen() {
  const { params } = useRoute<PostDetailRoute>();
  const { user, deviceId, setDisplayName } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const load = async () => {
      const p = await getPost(params.postId);
      setPost(p);
      if (deviceId && p) {
        const liked = await getDeviceLikedPosts(deviceId, [p.id]);
        setIsLiked(liked.has(p.id));
      }
      setIsLoading(false);
    };
    load();

    const unsubscribe = subscribeToApprovedComments(params.postId, setComments);
    return unsubscribe;
  }, [params.postId, deviceId]);

  const handleLike = async () => {
    if (!post || !deviceId) return;
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setPost(p => p ? { ...p, likeCount: p.likeCount + (wasLiked ? -1 : 1) } : p);
    await toggleLike(post.id, deviceId);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
    });
    if (!result.canceled) setCommentImage(result.assets[0].uri);
  };

  // Called when user taps the send button
  const handleSendTapped = () => {
    if (!commentText.trim()) return;

    // Check if we already have a display name (anon or admin)
    const displayName = user.role === 'admin'
      ? user.displayName
      : user.displayName;

    if (!displayName) {
      // First time commenter — ask for their name
      setShowNamePrompt(true);
    } else {
      submitComment(displayName);
    }
  };

  const handleNameConfirmed = async (name: string) => {
    setShowNamePrompt(false);
    await setDisplayName(name);
    submitComment(name);
  };

  const submitComment = async (authorName: string) => {
    if (!post || !commentText.trim()) return;
    setIsSubmitting(true);
    try {
      await createComment(post.id, {
        authorName,
        text: commentText.trim(),
        imageUri: commentImage ?? undefined,
      });
      setCommentText('');
      setCommentImage(null);
      Alert.alert(
        '🌸 Comment submitted',
        'Your comment is awaiting Franny's approval before it appears.',
        [{ text: 'Got it' }]
      );
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !post) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <>
      <NamePromptModal
        visible={showNamePrompt}
        onConfirm={handleNameConfirmed}
        onCancel={() => setShowNamePrompt(false)}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={88}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Post */}
          <View style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="flower" size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.authorName}>{post.authorName}</Text>
                <Text style={styles.timestamp}>
                  {post.createdAt.toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  })}
                </Text>
              </View>
            </View>

            <Text style={styles.postText}>{post.text}</Text>

            {post.imageUrl && (
              <Image
                source={{ uri: post.imageUrl }}
                style={styles.postImage}
                resizeMode="cover"
              />
            )}

            <TouchableOpacity style={styles.likeRow} onPress={handleLike} activeOpacity={0.7}>
              <Ionicons
                name={isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={isLiked ? theme.colors.accentDark : theme.colors.warmGray}
              />
              <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
                {post.likeCount > 0
                  ? `${post.likeCount} ${post.likeCount === 1 ? 'like' : 'likes'}`
                  : 'Be the first to like this'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comments */}
          <Text style={styles.sectionTitle}>
            {comments.length > 0 ? `${comments.length} Comments` : 'Comments'}
          </Text>

          {comments.length === 0 && (
            <Text style={styles.noComments}>
              No comments yet. Be the first!
            </Text>
          )}

          {comments.map(c => (
            <CommentItem key={c.id} comment={c} />
          ))}
          <View style={{ height: theme.spacing.xl }} />
        </ScrollView>

        {/* Comment input bar */}
        <View style={styles.commentBar}>
          {commentImage && (
            <View style={styles.imagePreviewRow}>
              <Image source={{ uri: commentImage }} style={styles.imagePreview} />
              <TouchableOpacity
                onPress={() => setCommentImage(null)}
                style={{ marginLeft: theme.spacing.xs }}
              >
                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.inputRow}>
            <TouchableOpacity onPress={handlePickImage} style={styles.photoBtn}>
              <Ionicons name="image-outline" size={22} color={theme.colors.primary} />
            </TouchableOpacity>
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment…"
              placeholderTextColor={theme.colors.taupe}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!commentText.trim() || isSubmitting) && styles.sendBtnDisabled]}
              onPress={handleSendTapped}
              disabled={!commentText.trim() || isSubmitting}
            >
              {isSubmitting
                ? <ActivityIndicator color={theme.colors.white} size="small" />
                : <Ionicons name="send" size={16} color={theme.colors.white} />
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
  postCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  avatarPlaceholder: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: theme.colors.sand,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: theme.colors.accentLight,
  },
  authorName: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
  },
  timestamp: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.warmGray,
  },
  postText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    lineHeight: 24,
    marginBottom: theme.spacing.md,
  },
  postImage: {
    width: '100%', height: 240,
    borderRadius: theme.radius.md,
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.sand,
  },
  likeRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1, borderTopColor: theme.colors.border,
  },
  likeCount: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
  likeCountActive: { color: theme.colors.accentDark },
  sectionTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.md,
  },
  noComments: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  commentBar: {
    backgroundColor: theme.colors.white,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 28 : theme.spacing.md,
  },
  imagePreviewRow: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  imagePreview: {
    width: 56, height: 56,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.sand,
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
  photoBtn: { padding: theme.spacing.xs, marginBottom: 2 },
  commentInput: {
    flex: 1,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnDisabled: { backgroundColor: theme.colors.taupe },
});

const nameStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : theme.spacing.xl,
    alignItems: 'center',
  },
  flowerRow: { marginBottom: theme.spacing.sm },
  title: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.xl,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: theme.spacing.lg,
  },
  input: {
    width: '100%',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  confirmBtn: {
    width: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.round,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  confirmBtnDisabled: { opacity: 0.45 },
  confirmBtnText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.white,
  },
  cancelBtn: { paddingVertical: theme.spacing.sm },
  cancelBtnText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.warmGray,
  },
});
