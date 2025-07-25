import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { SignUpScreen } from "../src/screens";
import { useAuth } from '../src/context/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';

export default function SignUpRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to home
    if (!isLoading && isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading]);

  // Show loading while checking auth state
  if (isLoading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, don't show sign-up screen (will redirect)
  if (isAuthenticated) {
    return <LoadingScreen />;
  }

  return <SignUpScreen />;
}
