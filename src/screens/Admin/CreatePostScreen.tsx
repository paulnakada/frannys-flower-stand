import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, getDocs, serverTimestamp } from 'firebase/firestore';
import { getIdToken } from 'firebase/auth';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';
import { theme } from '../../theme';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const { uri, width, height } = result.assets[0];
      setImageUri(uri);
      setImageAspectRatio(width && height ? width / height : null);
    }
  }

  async function publishPost() {
    if (!text.trim() && !imageUri) {
      Alert.alert('Nothing to post', 'Add some text or a photo first.');
      return;
    }
    if (user?.role !== 'admin') return;

    setIsPublishing(true);
    try {
      let imageUrl: string | undefined;

      if (imageUri) {
        const filename = uuidv4();
        const storagePath = `posts/${filename}`;
        const bucket = 'franny-s-flower-stand.firebasestorage.app';
        const idToken = await getIdToken(auth.currentUser!);
        const uploadUrl =
          `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o` +
          `?uploadType=media&name=${encodeURIComponent(storagePath)}`;

        const result = await FileSystem.uploadAsync(uploadUrl, imageUri, {
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'image/jpeg',
          },
        });

        if (result.status < 200 || result.status >= 300) {
          throw new Error(`Upload failed (${result.status}): ${result.body}`);
        }

        const { downloadTokens } = JSON.parse(result.body);
        imageUrl =
          `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o/` +
          `${encodeURIComponent(storagePath)}?alt=media&token=${downloadTokens}`;
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.id,
        authorName: user.displayName,
        text: text.trim(),
        ...(imageUrl ? { imageUrl, ...(imageAspectRatio ? { imageAspectRatio } : {}) } : {}),
        likeCount: 0,
        commentCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isDeleted: false,
      });

      // Send push notifications in background — don't block or fail the post
      sendNewPostNotification(text.trim()).catch(() => {});

      Alert.alert('Posted!', 'Your bloom is live.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? String(err));
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.textInput}
          placeholder="What's blooming today? Share an update, a photo, or a note for your customers..."
          placeholderTextColor={theme.colors.taupe}
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
        />

        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setImageUri(null)}
            >
              <Ionicons name="close-circle" size={28} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addImageBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={24} color={theme.colors.primary} />
            <Text style={styles.addImageLabel}>Add a photo</Text>
          </TouchableOpacity>
        )}

        <Button
          label="Publish Post"
          onPress={publishPost}
          isLoading={isPublishing}
          disabled={!text.trim() && !imageUri}
          style={styles.publishBtn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

async function sendNewPostNotification(postText: string) {
  const snap = await getDocs(collection(db, 'pushTokens'));
  const tokens = snap.docs.map(d => d.data().token as string).filter(Boolean);
  console.log('[Push] tokens found:', tokens);
  if (tokens.length === 0) return;

  const body = postText.slice(0, 120) || 'Check out the latest update!';
  const messages = tokens.map(token => ({
    to: token,
    title: "Franny's Flower Stand 🌸",
    body,
  }));

  for (let i = 0; i < messages.length; i += 100) {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    });
    const result = await response.json();
    console.log('[Push] Expo API response:', JSON.stringify(result));
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.cream },
  content: { padding: theme.spacing.md, flexGrow: 1 },
  textInput: {
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.charcoal,
    lineHeight: 26,
    minHeight: 140,
    textAlignVertical: 'top',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  addImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  addImageLabel: {
    fontFamily: theme.typography.fonts.bodyBold,
    fontSize: theme.typography.sizes.base,
    color: theme.colors.primary,
  },
  imagePreviewContainer: {
    marginBottom: theme.spacing.md,
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 240,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.sand,
  },
  removeImageBtn: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.round,
  },
  publishBtn: { marginTop: theme.spacing.md },
});
