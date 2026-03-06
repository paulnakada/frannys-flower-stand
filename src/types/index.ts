// ─── User ────────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'anonymous';

export interface AdminUser {
  id: string;
  displayName: string;
  email: string;
  role: 'admin';
  fcmToken?: string;
  createdAt: Date;
  isActive: boolean;
}

export interface AnonUser {
  role: 'anonymous';
  displayName: string; // persisted in AsyncStorage only
}

export type AppUser = AdminUser | AnonUser;

export const ADMIN_EMAILS: readonly string[] = [
  'paulnakada@yahoo.com',
  'christine_hoang@yahoo.com',
];

// ─── Post ────────────────────────────────────────────────────────────────────

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  imageUrl?: string;
  imageAspectRatio?: number;
  likeCount: number;
  commentCount: number; // approved only
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// ─── Like ────────────────────────────────────────────────────────────────────

export interface Like {
  id: string;
  postId: string;
  deviceId: string; // device UUID stored in AsyncStorage
  createdAt: Date;
}

// ─── Comment ─────────────────────────────────────────────────────────────────

export type CommentStatus = 'pending' | 'approved' | 'rejected';

export interface Comment {
  id: string;
  postId: string;
  authorName: string;
  text: string;
  imageUrl?: string;
  imageAspectRatio?: number;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
  AdminLogin: undefined;
};

export type MainTabParamList = {
  Feed: undefined;
  Admin: undefined;
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

// ─── Misc ─────────────────────────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  lastDocumentId?: string;
  hasMore: boolean;
}

export interface CreatePostForm {
  text: string;
  imageUri?: string;
}

export interface CreateCommentForm {
  authorName: string;
  text: string;
  imageUri?: string;
}
