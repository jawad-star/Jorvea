import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import TabNavigator from './TabNavigator';
import UserProfileScreen from '../screens/UserProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import CreateContentScreen from '../screens/CreateContentScreen';
import FollowRequestsScreen from '../screens/FollowRequestsScreen';
import FollowersFollowingScreen from '../screens/FollowersFollowingScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import DataMigrationScreen from '../screens/DataMigrationScreen';

export type RootStackParamList = {
  Main: undefined;
  UserProfile: { userId: string };
  EditProfile: undefined;
  CreateContent: { type: 'post' | 'reel' | 'story' };
  FollowRequests: undefined;
  FollowersFollowing: { userId: string; initialTab: 'followers' | 'following'; username?: string };
  Notifications: undefined;
  DataMigration: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="Main" 
        component={TabNavigator} 
      />
      <Stack.Screen 
        name="UserProfile" 
        component={UserProfileScreen} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
      />
      <Stack.Screen 
        name="CreateContent" 
        component={CreateContentScreen} 
      />
      <Stack.Screen 
        name="FollowRequests" 
        component={FollowRequestsScreen} 
      />
      <Stack.Screen 
        name="FollowersFollowing" 
        component={FollowersFollowingScreen} 
      />
      <Stack.Screen 
        name="Notifications" 
        component={NotificationsScreen} 
      />
      <Stack.Screen 
        name="DataMigration" 
        component={DataMigrationScreen} 
      />
    </Stack.Navigator>
  );
}
