import React from 'react';
import { router, usePathname } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import LoadingScreen from './LoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Redirect to sign-in if user is not authenticated
        if (pathname !== '/sign-in') {
          router.replace('/sign-in');
        }
      } else if (!user?.emailVerified) {
        // Redirect to email verification if user is not verified
        if (pathname !== '/email-verification') {
          router.replace('/email-verification');
        }
      }
      // Remove the problematic router.replace('/') call for authenticated users
    }
  }, [user, isLoading, isAuthenticated, pathname]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated || !user?.emailVerified) {
    return null; // Will redirect to appropriate screen
  }

  return <>{children}</>;
}
