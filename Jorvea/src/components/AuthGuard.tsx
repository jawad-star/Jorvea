import React from 'react';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to sign-in if user is not authenticated
        router.replace('/sign-in');
      } else if (!user?.emailVerified) {
        // Redirect to email verification if user is not verified
        router.replace('/email-verification');
      }
    }
  }, [user, isLoading, isAuthenticated]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user?.emailVerified) {
    return null; // Will redirect to appropriate screen
  }

  return <>{children}</>;
}
