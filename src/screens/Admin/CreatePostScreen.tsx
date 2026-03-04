import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { createPost } from '../../services/postService';
import { useAuth } from '../../hooks/useAuth';
import { Button, Input } from '../../components/ui';
import { theme } from '../../assets/theme';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCameraCapture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Permission needed', 'Camera access is required to take photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const adminId = user.role === 'admin' ? user.id : '';
  const adminName = user.role === 'admin' ? user.displayName : 'Franny';

  const handlePost = async () => {
    if (!adminId || !text.trim()) return;
    setIsPosting(true);
    try {
      await createPost(adminId, adminName, {
        text: text.trim(),
        imageUri: imageUri ?? undefined,
      });
      Alert.alert(
        '🌸 Posted!',
        'Your update has been shared with everyone.',
        [{ text: 'Great!', onPress: () => navigation.goBack() }]
      );
    } catch (e: any) {
      Alert.alert('Error posting', e.message);
    } finally {
      setIsPosting(false);
    }
  };

  const canPost = text.trim().length > 0 && !isPosting;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header hint */}
        <View style={styles.hint}>
          <Ionicons name="flower-outline" size={16} color={theme.colors.primary} />
          <Text style={styles.hintText}>
            This post will be sent to all your followers with a push notification
          </Text>
        </View>

        {/* Text input */}
        <Input
          label="Message"
          value={text}
          onChangeText={setText}
          placeholder="What's blooming today? Share a fresh update with your flower fans…"
          multiline
          numberOfLines={5}
        />

        {/* Image preview */}
        {imageUri ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => setImageUri(null)}
            >
              <Ionicons name="close-circle" size={28} color={theme.colors.white} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.imagePickerRow}>
            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={handlePickImage}
              activeOpacity={0.8}
            >
              <Ionicons name="images-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.imagePickerText}>Choose Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.imagePickerBtn}
              onPress={handleCameraCapture}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color={theme.colors.primary} />
              <Text style={styles.imagePickerText}>Take Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Post button */}
        <Button
          label={isPosting ? 'Posting…' : 'Publish Post'}
          onPress={handlePost}
          disabled={!canPost}
          isLoading={isPosting}
          style={styles.postButton}
          icon={
            !isPosting ? (
              <Ionicons name="flower" size={18} color={theme.colors.white} />
            ) : undefined
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: theme.colors.cream },
  scroll: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xxxl },
  hint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.accentLight,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  hintText: {
    flex: 1,
    fontFamily: theme.typography.fonts.body,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.charcoal,
    lineHeight: 20,
  },
  imagePreviewWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.lg,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.sand,
  },
  removeImageBtn: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
  },
  imagePickerRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  imagePickerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    borderWidth: 1.5,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontFamily: theme.typography.fonts.bodyMedium,
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.primary,
  },
  postButton: {
    marginTop: theme.spacing.md,
  },
});
