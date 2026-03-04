import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator } from 'react-native';

import { useAuth } from '../hooks/useAuth';
import { theme } from '../assets/theme';

// Screens
import FeedScreen from '../screens/Feed/FeedScreen';
import PostDetailScreen from '../screens/Feed/PostDetailScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CreatePostScreen from '../screens/Admin/CreatePostScreen';
import PendingCommentsScreen from '../screens/Admin/PendingCommentsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';
import AdminLoginScreen from '../screens/Auth/AdminLoginScreen';

import {
  RootStackParamList,
  MainTabParamList,
  FeedStackParamList,
  AdminStackParamList,
} from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

// ─── Feed Stack ───────────────────────────────────────────────────────────────

const FeedNavigator = () => {
  return (
    <FeedStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.cream },
        headerTintColor: theme.colors.charcoal,
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.display,
          fontSize: theme.typography.sizes.lg,
        },
      }}
    >
      <FeedStack.Screen
        name="FeedHome"
        component={FeedScreen}
        options={({ navigation }) => ({
          title: "Franny's Flower Stand",
          headerRight: () => (
            <AdminLoginButton onPress={() => navigation.navigate('AdminLogin' as any)} />
          ),
        })}
      />
      <FeedStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: '' }}
      />
    </FeedStack.Navigator>
  );
};

// Small "Admin" button shown in the feed header
const AdminLoginButton = ({ onPress }: { onPress: () => void }) => {
  const { isAdmin } = useAuth();
  if (isAdmin) return null; // Admin tab is visible, no need for this button
  return (
    <TouchableOpacity onPress={onPress} style={headerBtnStyles.btn} accessibilityLabel="Admin sign in">
      <Ionicons name="leaf-outline" size={18} color={theme.colors.warmGray} />
    </TouchableOpacity>
  );
};

const headerBtnStyles = StyleSheet.create({
  btn: { padding: 4, marginRight: 4 },
});

// ─── Admin Stack ──────────────────────────────────────────────────────────────

const AdminNavigator = () => (
  <AdminStack.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: theme.colors.cream },
      headerTintColor: theme.colors.charcoal,
      headerTitleStyle: {
        fontFamily: theme.typography.fonts.display,
        fontSize: theme.typography.sizes.lg,
      },
    }}
  >
    <AdminStack.Screen
      name="AdminHome"
      component={AdminDashboardScreen}
      options={{ title: 'Admin' }}
    />
    <AdminStack.Screen
      name="CreatePost"
      component={CreatePostScreen}
      options={{ title: 'New Post' }}
    />
    <AdminStack.Screen
      name="PendingComments"
      component={PendingCommentsScreen}
      options={{ title: 'Review Comments' }}
    />
    <AdminStack.Screen
      name="PostDetail"
      component={PostDetailScreen}
      options={{ title: '' }}
    />
  </AdminStack.Navigator>
);

// ─── Main Tab Navigator ───────────────────────────────────────────────────────

const MainNavigator = () => {
  const { isAdmin } = useAuth();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.taupe,
        tabBarLabelStyle: {
          fontFamily: theme.typography.fonts.body,
          fontSize: theme.typography.sizes.xs,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons: Record<string, { active: string; inactive: string }> = {
            Feed: { active: 'flower', inactive: 'flower-outline' },
            AdminDashboard: { active: 'leaf', inactive: 'leaf-outline' },
            Profile: { active: 'person', inactive: 'person-outline' },
          };
          const iconSet = icons[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
          return (
            <Ionicons
              name={(focused ? iconSet.active : iconSet.inactive) as any}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <MainTab.Screen
        name="Feed"
        component={FeedNavigator}
        options={{ tabBarLabel: 'Feed' }}
      />
      {isAdmin && (
        <MainTab.Screen
          name="AdminDashboard"
          component={AdminNavigator}
          options={{ tabBarLabel: 'Admin' }}
        />
      )}
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </MainTab.Navigator>
  );
};

// ─── Root Navigator ───────────────────────────────────────────────────────────

const LoadingScreen = () => (
  <View style={styles.loading}>
    <ActivityIndicator color={theme.colors.primary} size="large" />
  </View>
);

export const AppNavigator = () => {
  const { isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {/* Main app — always accessible, no login gate */}
        <RootStack.Screen name="Main" component={MainNavigator} />
        {/* Admin login presented as a full-screen modal */}
        <RootStack.Screen
          name="AdminLogin"
          component={AdminLoginScreen}
          options={{
            presentation: 'modal',
            headerShown: false,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cream,
  },
});
