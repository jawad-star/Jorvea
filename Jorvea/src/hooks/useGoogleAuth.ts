import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { auth } from '../config/firebase';
import Constants from 'expo-constants';

import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: Constants.expoConfig?.extra?.webClientId,
    androidClientId: Constants.expoConfig?.extra?.androidClientId,
    iosClientId: Constants.expoConfig?.extra?.iosClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(user => {
          console.log('Google Sign-in success:', user.user);
          router.replace('/'); // Redirect to home page
        })
        .catch(err => console.error('Google Sign-in error:', err));
    }
  }, [response]);

  return { promptAsync };
}
