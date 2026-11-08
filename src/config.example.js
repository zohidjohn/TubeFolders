/**
 * Copy to config.js (or edit config.js directly) with Firebase Console values.
 */
export const firebaseConfig = {
  apiKey: 'AIza...',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-project',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: '1:123456789:web:abcdef',
};

export const oauthClientId = '123456789-xxxx.apps.googleusercontent.com';

export const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      !firebaseConfig.apiKey.startsWith('YOUR_') &&
      oauthClientId &&
      !oauthClientId.startsWith('YOUR_')
  );
