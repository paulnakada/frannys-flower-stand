// ─── User Types ────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'anonymous';

/**
 * AdminUser — authenticated via Firebase Email Link (magic link).
 * Stored in Firestore /users/{uid}.
 */
export interface AdminUser {
  id: string;           // Firebase UID
  displayName: string;
  email: string;
  role: 'admin';
  fcmToken?: string;
  createdAt: Date;
  isActive: boolean;
}

/**
 * AnonUser — never touches Firebase Auth.
 * Display name is stored in device AsyncStorage only.
 */
export interface AnonUser {
  role: 'anonymous';
  displayName: string;  // entered by user, persisted locally
}

export type AppUser = AdminUser | AnonUser;

// ─── Post Types ─────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  authorId: string;           // Always admin UID
  authorName: string;         // Denormalized for display
  text: string;
  imageUrl?: string;
  imageAspectRatio?: number;
  likeCount: number;
  commentCount: number;       // approved comments only
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// ─── Like Types ──────────────────────────────────────────────────────────────

export interface Like {
  id: string;
  postId: string;
  // For anonymous users, we use a device-generated UUID stored in AsyncStorage
  deviceId: string;
  createdAt: Date;
}

// ─── Comment Types ───────────────────────────────────────────────────────────

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  postId: string;
  authorName: string;         // Entered by user at comment time, stored in doc
  text: string;
  imageUrl?: string;
  imageAspectRatio?: number;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// ─── Navigation Types ────────────────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
  AdminLogin: undefined;    // accessible from feed header, no auth gate on root
};

export type MainTabParamList = {
  Feed: undefined;
  AdminDashboard: undefined;  // only visible when admin is signed in
  Profile: undefined;
};

export type FeedStackParamList = {
  FeedHome: undefined;
  PostDetail: { postId: string };
};

export type AdminStackParamList = {
  AdminHome: undefined;
  CreatePost: undefined;
  PendingComments: undefined;
  PostDetail: { postId: string };
};

// ─── API / Service Types ─────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  lastDocumentId?: string;
  hasMore: boolean;
}

export interface ApiError {
  code: string;
  message: string;
}

// ─── Form Types ──────────────────────────────────────────────────────────────

export interface CreatePostForm {
  text: string;
  imageUri?: string;
}

export interface CreateCommentForm {
  authorName: string;
  text: string;
  imageUri?: string;
}

// ─── Notification Types ──────────────────────────────────────────────────────

export type NotificationType = 'new_post';

export interface PushNotificationPayload {
  type: NotificationType;
  postId: string;
  title: string;
  body: string;
}

// ─── Admin Auth Config ───────────────────────────────────────────────────────

/** Hardcoded list of email addresses that are permitted admin access */
export const ADMIN_EMAILS: readonly string[] = [
  'franny@frannyflowers.com',  // 🌸 Replace with real admin email(s)
];

