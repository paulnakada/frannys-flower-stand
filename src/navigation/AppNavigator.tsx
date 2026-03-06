import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { theme } from '../theme';
import {
  RootStackParamList,
  MainTabParamList,
  FeedStackParamList,
  AdminStackParamList,
} from '../types';

// Screens
import FeedScreen from '../screens/Feed/FeedScreen';
import PostDetailScreen from '../screens/Feed/PostDetailScreen';
import AdminLoginScreen from '../screens/Auth/AdminLoginScreen';
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';
import CreatePostScreen from '../screens/Admin/CreatePostScreen';
import PendingCommentsScreen from '../screens/Admin/PendingCommentsScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const FeedStack = createNativeStackNavigator<FeedStackParamList>();
const AdminStack = createNativeStackNavigator<AdminStackParamList>();

function FeedNavigator() {
  return (
    <FeedStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.cream },
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.display,
          color: theme.colors.charcoal,
        },
        headerTintColor: theme.colors.primary,
      }}
    >
      <FeedStack.Screen
        name="FeedHome"
        component={FeedScreen}
        options={{ headerShown: false }}
      />
      <FeedStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
    </FeedStack.Navigator>
  );
}

function AdminNavigator() {
  return (
    <AdminStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.cream },
        headerTitleStyle: {
          fontFamily: theme.typography.fonts.display,
          color: theme.colors.charcoal,
        },
        headerTintColor: theme.colors.primary,
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
        options={{ title: 'Pending Comments' }}
      />
      <AdminStack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ title: 'Post' }}
      />
    </AdminStack.Navigator>
  );
}

function MainTabs() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.taupe,
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontFamily: theme.typography.fonts.body,
          fontSize: theme.typography.sizes.xs,
        },
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Feed: 'flower-outline',
            Admin: 'shield-checkmark-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedNavigator} options={{ title: 'Blooms' }} />
      {isAdmin && (
        <Tab.Screen name="Admin" component={AdminNavigator} options={{ title: 'Admin' }} />
      )}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.cream }}>
        <ActivityIndicator color={theme.colors.primary} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Screen
          name="AdminLogin"
          component={AdminLoginScreen}
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Admin Sign In',
            headerStyle: { backgroundColor: theme.colors.cream },
            headerTitleStyle: {
              fontFamily: theme.typography.fonts.display,
              color: theme.colors.charcoal,
            },
            headerTintColor: theme.colors.primary,
          }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
