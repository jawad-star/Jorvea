import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { auth } from '../src/config/firebase';
import Constants from 'expo-constants';

import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: Constants.expoConfig?.extra?.webClientId,
    webClientId: Constants.expoConfig?.extra?.webClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(user => console.log('Google Sign-in success:', user.user))
        .catch(err => console.error('Google Sign-in error:', err));
    }
  }, [response]);

  return { promptAsync };
}

export default useGoogleAuth;
