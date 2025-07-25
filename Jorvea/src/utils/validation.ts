/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates password strength
 */
export const isValidPassword = (password: string): boolean => {
  // At least 6 characters
  return password.length >= 6;
};

/**
 * Formats error messages for display
 */
export const formatErrorMessage = (error: any): string => {
  if (error?.code) {
    switch (error.code) {
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'Email is already registered';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection';
      default:
        return error.message || 'An error occurred';
    }
  }
  return error?.message || 'An unexpected error occurred';
};
