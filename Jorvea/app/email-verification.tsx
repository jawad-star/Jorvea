import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { EmailVerificationScreen } from "../src/screens";
import { useAuth } from '../src/context/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';

export default function EmailVerificationRoute() {
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // If user is not authenticated at all, redirect to sign-in
      if (!isAuthenticated) {
        router.replace('/sign-in');
      }
      // If user is authenticated and email is verified, redirect to home
      else if (user?.emailVerified) {
        router.replace('/');
      }
    }
  }, [user, isAuthenticated, isLoading]);

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is not authenticated, don't show verification screen (will redirect)
  if (!isAuthenticated) {
    return <LoadingScreen />;
  }

  // If user is verified, don't show verification screen (will redirect)
  if (user?.emailVerified) {
    return <LoadingScreen />;
  }

  return <EmailVerificationScreen />;
}
