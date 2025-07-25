import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = '@jorvea_auth_token';
const USER_DATA_KEY = '@jorvea_user_data';

export const authStorage = {
  // Store authentication token
  setAuthToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing auth token:', error);
    }
  },

  // Get authentication token
  getAuthToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  },

  // Store user data
  setUserData: async (userData: any) => {
    try {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  },

  // Get user data
  getUserData: async (): Promise<any | null> => {
    try {
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  },

  // Clear all auth data
  clearAuthData: async () => {
    try {
      await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, USER_DATA_KEY]);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  // Check if user is logged in
  isLoggedIn: async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return token !== null;
    } catch (error) {
      console.error('Error checking login status:', error);
      return false;
    }
  }
};
