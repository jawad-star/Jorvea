import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { ForgotPasswordScreen } from "../src/screens";
import { useAuth } from '../src/context/AuthContext';
import LoadingScreen from '../src/components/LoadingScreen';

export default function ForgotPasswordRoute() {
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

  // If user is authenticated, don't show forgot password screen (will redirect)
  if (isAuthenticated) {
    return <LoadingScreen />;
  }

  return <ForgotPasswordScreen />;
}
