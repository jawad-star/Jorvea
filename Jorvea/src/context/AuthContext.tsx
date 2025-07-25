import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthStateChange, checkStoredAuth, getStoredUserData } from '../services/authService';
import SplashScreen from '../components/SplashScreen';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // Check if user was previously logged in
        const isStoredAuth = await checkStoredAuth();
        
        if (isStoredAuth) {
          // Set up Firebase auth state listener
          unsubscribe = onAuthStateChange(async (firebaseUser) => {
            if (firebaseUser) {
              setUser(firebaseUser);
            } else {
              // If Firebase user is null but we have stored auth, clear it
              const { authStorage } = await import('../utils/authStorage');
              await authStorage.clearAuthData();
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

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    setUser,
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
