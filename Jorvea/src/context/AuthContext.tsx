/**
 * Authentication Context
 * 
 * Central authentication state management for the Jorvea application.
 * Provides global access to user authentication state and authentication methods.
 * 
 * Features:
 * - Global user state management
 * - Automatic authentication state persistence
 * - Real-time authentication state updates
 * - Secure session management
 * - Loading state management for smooth UX
 * - Logout functionality with cleanup
 * 
 * Integration:
 * - Firebase Authentication for user management
 * - AsyncStorage for authentication persistence
 * - Real-time listeners for authentication changes
 * - Automatic token refresh handling
 * 
 * @author Jorvea Development Team
 * @version 2.0.0
 * @created 2024-10-15
 * @updated 2025-01-27
 */

import { User } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import { checkStoredAuth, logoutUser, onAuthStateChange } from '../services/authService';
import { firebaseService } from '../services/firebaseService';

/**
 * AuthContext Type Definition
 * 
 * Defines the shape of the authentication context that components can access.
 * Provides comprehensive authentication state and methods.
 */
interface AuthContextType {
  user: User | null;           // Current authenticated user (Firebase User object)
  isLoading: boolean;          // Whether authentication state is being determined
  isAuthenticated: boolean;    // Quick boolean check for authentication status
  setUser: (user: User | null) => void; // Method to update user state
  logout: () => Promise<void>; // Method to logout user with cleanup
}

// Create the authentication context with undefined default
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider Component
 * 
 * Wraps the entire application to provide authentication context.
 * Manages global authentication state and provides it to all child components.
 * 
 * @param children - Child components that need access to authentication context
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Authentication state management
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Authentication Initialization Effect
   * 
   * Runs on component mount to initialize authentication state.
   * Checks for stored authentication and sets up real-time listeners.
   */
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    /**
     * Initialize Authentication State
     * 
     * Checks for previously stored authentication and sets up listeners.
     * Handles the initial authentication state determination.
     */
    const initializeAuth = async () => {
      try {
        // Check if user was previously authenticated and stored locally
        const isStoredAuth = await checkStoredAuth();
        
        if (isStoredAuth) {
          // Set up Firebase authentication state listener for real-time updates
          unsubscribe = onAuthStateChange(async (firebaseUser) => {
            if (firebaseUser) {
              // Create or update user profile in Firestore
              try {
                await firebaseService.createUserProfile(firebaseUser);
                console.log('User profile ensured in Firestore');
              } catch (error) {
                console.error('Error creating user profile:', error);
              }
              setUser(firebaseUser);
            } else {
              // Firebase user is null, clear local user state
              setUser(null);
            }
            setIsLoading(false);
          });
        } else {
          // No stored auth, user needs to login
          setUser(null);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setUser(null);
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const logout = async () => {
    await logoutUser();
    setUser(null);
  };

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    setUser,
    logout,
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
