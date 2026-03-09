import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getIdToken } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from '../../services/firebase';
import { Comment, FeedStackParamList, Post } from '../../types';
import { CommentItem } from '../../components/CommentItem';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../theme';

type PostDetailRoute = RouteProp<FeedStackParamList, 'PostDetail'>;

function docToComment(d: any): Comment {
  const data = d.data();
  return {
    id: d.id,
    postId: data.postId,
    authorName: data.authorName ?? 'Anonymous',
    text: data.text ?? '',
    imageUrl: data.imageUrl,
    imageAspectRatio: data.imageAspectRatio,
    status: data.status ?? 'pending',
    createdAt: data.createdAt?.toDate() ?? new Date(),
    updatedAt: data.updatedAt?.toDate() ?? new Date(),
    isDeleted: data.isDeleted ?? false,
  };
}

export default function PostDetailScreen() {
  const { params } = useRoute<PostDetailRoute>();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Comment form state
  const [commentText, setCommentText] = useState('');
  const [commentName, setCommentName] = useState(user?.displayName ?? '');
  const [commentImageUri, setCommentImageUri] = useState<string | null>(null);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [params.postId]);

  async function loadPost() {
    const snap = await getDoc(doc(db, 'posts', params.postId));
    if (snap.exists()) {
      const data = snap.data();
      setPost({
        id: snap.id,
        authorId: data.authorId,
        authorName: data.authorName ?? 'Franny',
        text: data.text ?? '',
        imageUrl: data.imageUrl,
        imageAspectRatio: data.imageAspectRatio,
        commentCount: data.commentCount ?? 0,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        isDeleted: data.isDeleted ?? false,
      });
    }
    setIsLoadingPost(false);
  }

  async function loadComments() {
    const q = query(
      collection(db, 'posts', params.postId, 'comments'),
      where('isDeleted', '==', false),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'asc'),
    );
    const snap = await getDocs(q);
    setComments(snap.docs.map(docToComment));
    setIsLoadingComments(false);
  }

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCommentImageUri(result.assets[0].uri);
    }
  }

  async function submitComment() {
    if (!commentText.trim() || !commentName.trim()) {
      Alert.alert('Missing info', 'Please enter your name and a comment.');
      return;
    }
    setIsSending(true);
    try {
      let imageUrl: string | undefined;

      if (commentImageUri && auth.currentUser) {
        const filename = uuidv4();
        const storagePath = `comments/${filename}`;
        const bucket = 'franny-s-flower-stand.firebasestorage.app';
        const idToken = await getIdToken(auth.currentUser);
        const result = await FileSystem.uploadAsync(
          `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?uploadType=media&name=${encodeURIComponent(storagePath)}`,
          commentImageUri,
          {
            httpMethod: 'POST',
            uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
            headers: { Authorization: `Bearer ${idToken}`, 'Content-Type': 'image/jpeg' },
          },
        );
        if (result.status >= 200 && result.status < 300) {
          const { downloadTokens } = JSON.parse(result.body);
          imageUrl = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/${encodeURIComponent(storagePath)}?alt=media&token=${downloadTokens}`;
        }
      }

      await addDoc(collection(db, 'posts', params.postId, 'comments'), {
        postId: params.postId,
        authorName: commentName.trim(),
        text: commentText.trim(),
        ...(imageUrl ? { imageUrl } : {}),
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
      });

      setCommentText('');
      setCommentImageUri(null);
      Alert.alert('Sent!', 'Your comment is awaiting approval.');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? String(err));
    } finally {
      setIsSending(false);
    }
  }

  if (isLoadingPost) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Post not found.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        data={comments}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <CommentItem comment={item} isAdmin={isAdmin} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Post body */}
            {post.text.length > 0 && <Text style={styles.postText}>{post.text}</Text>}
            {post.imageUrl && (
              <Image
                source={{ uri: post.imageUrl }}
                style={[
                  styles.postImage,
                  post.imageAspectRatio ? { aspectRatio: post.imageAspectRatio } : undefined,
                ]}
                resizeMode="cover"
              />
            )}
            <View style={styles.divider} />
            <Text style={styles.commentsTitle}>
              Comments {comments.length > 0 ? `(${comments.length})` : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoadingComments ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: theme.spacing.lg }} />
          ) : (
            <Text style={styles.noComments}>No comments yet. Be the first!</Text>
          )
        }
        ListFooterComponent={
          <View style={styles.commentForm}>
            <View style={styles.divider} />
            <Text style={styles.formTitle}>Leave a comment</Text>
            <TextInput
              style={styles.input}
              placeholder="Your name"
              placeholderTextColor={theme.colors.taupe}
              value={commentName}
              onChangeText={setCommentName}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Write something kind..."
              placeholderTextColor={theme.colors.taupe}
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <View style={styles.formActions}>
              <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                <Ionicons
                  name={commentImageUri ? 'image' : 'image-outline'}
                  size={22}
                  color={commentImageUri ? theme.colors.primary : theme.colors.warmGray}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, (isSending || !commentText.trim()) && styles.sendBtnDisabled]}
                onPress={submitComment}
                disabled={isSending || !commentText.trim()}
              >
                {isSending ? (
                  <ActivityIndicator color={theme.colors.white} size="small" />
                ) : (
                  <Ionicons name="send" size={18} color={theme.colors.white} />
                )}
              </TouchableOpacity>
            </View>
            {commentImageUri && (
              <View style={styles.imagePreviewRow}>
                <Image source={{ uri: commentImageUri }} style={styles.imagePreview} />
                <TouchableOpacity onPress={() => setCommentImageUri(null)} style={styles.removeImageBtn}>
                  <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        }
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cream },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.cream },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  postText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.charcoal,
    lineHeight: 26,
    marginBottom: theme.spacing.md,
  },
  postImage: {
    width: '100%',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.sand,
    marginBottom: theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginVertical: theme.spacing.md,
  },
  commentsTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.md,
  },
  noComments: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.warmGray,
    textAlign: 'center',
    marginVertical: theme.spacing.lg,
  },
  errorText: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.warmGray,
  },
  commentForm: { marginTop: theme.spacing.md },
  formTitle: {
    fontFamily: theme.typography.fonts.display,
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.charcoal,
    marginBottom: theme.spacing.md,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 4,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.charcoal,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  imagePickerBtn: { padding: theme.spacing.sm },
  sendBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.round,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  imagePreviewRow: {
    marginTop: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.sand,
  },
  removeImageBtn: { marginLeft: theme.spacing.xs },
});
