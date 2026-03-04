/**
 * Firebase Cloud Functions
 * functions/src/index.ts
 *
 * Triggered when admin creates a new post → sends push to all users with FCM tokens.
 *
 * Deploy: firebase deploy --only functions
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

// ─── Trigger: New Post Created ────────────────────────────────────────────────

export const onPostCreated = functions.firestore
  .document('posts/{postId}')
  .onCreate(async (snap, context) => {
    const post = snap.data();

    // Only send for non-deleted posts from admin users
    if (post.isDeleted) return;

    // Get all users with FCM tokens (active users only)
    const usersSnap = await admin
      .firestore()
      .collection('users')
      .where('isActive', '==', true)
      .where('role', '==', 'user')  // Only notify regular users, not admin
      .get();

    const tokens: string[] = [];
    usersSnap.forEach(doc => {
      const user = doc.data();
      if (user.fcmToken) tokens.push(user.fcmToken);
    });

    if (tokens.length === 0) {
      console.log('No FCM tokens found, skipping notification.');
      return;
    }

    // Build the notification
    const truncatedText =
      post.text.length > 100 ? post.text.substring(0, 97) + '…' : post.text;

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: "🌸 New from Franny's Flower Stand",
        body: truncatedText,
      },
      data: {
        type: 'new_post',
        postId: context.params.postId,
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
      android: {
        notification: {
          channelId: 'frannys-posts',
          priority: 'high',
          color: '#5A8F5A',
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(message);

    // Clean up stale tokens that returned 'not-registered' error
    const staleTokens: string[] = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error?.code === 'messaging/registration-token-not-registered'
      ) {
        staleTokens.push(tokens[idx]);
      }
    });

    if (staleTokens.length > 0) {
      const batch = admin.firestore().batch();
      usersSnap.forEach(doc => {
        if (staleTokens.includes(doc.data().fcmToken)) {
          batch.update(doc.ref, { fcmToken: admin.firestore.FieldValue.delete() });
        }
      });
      await batch.commit();
      console.log(`Cleaned ${staleTokens.length} stale tokens.`);
    }

    console.log(
      `Push sent to ${response.successCount}/${tokens.length} devices.`
    );
  });
