const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Firebase uses .cjs files for React Native builds.
// Expo SDK 53+ enables package exports by default, which causes Metro to
// resolve firebase/auth to the browser build instead of the RN build.
// Disabling it forces Metro to use the react-native field in package.json.
config.resolver.sourceExts.push('cjs');
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
