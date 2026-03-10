const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Removes android.permission.CAMERA from the final AndroidManifest.
 * expo-image-picker declares it in its own manifest even when cameraPermission
 * is not configured, because the library natively supports camera access.
 * This plugin strips it out so the Play Store does not require a privacy policy
 * for camera usage (the app only uses the photo library picker).
 */
module.exports = function withoutCameraPermission(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const permissions = manifest['uses-permission'] ?? [];
    manifest['uses-permission'] = permissions.filter(
      (perm) => perm.$['android:name'] !== 'android.permission.CAMERA',
    );
    return config;
  });
};
