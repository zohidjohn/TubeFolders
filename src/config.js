/**
 * Firebase web app config (tubefolders-project).
 * oauthClientId: Google Cloud OAuth client for this extension ID
 *   clnkihfoeejlnhmjiobioepegefjfgdb
 * Redirect: https://clnkihfoeejlnhmjiobioepegefjfgdb.chromiumapp.org/
 */
export const firebaseConfig = {
  apiKey: 'AIzaSyDIeLPRNe656cnRrHQMeypd7T2nTMb7jv4',
  authDomain: 'tubefolders-project.firebaseapp.com',
  projectId: 'tubefolders-project',
  storageBucket: 'tubefolders-project.firebasestorage.app',
  messagingSenderId: '1033436935931',
  appId: '1:1033436935931:web:64585a0138fccc4286e25e',
  measurementId: 'G-ER20Z432MQ',
};

/** Google OAuth 2.0 client ID used with chrome.identity.launchWebAuthFlow */
export const oauthClientId =
  '1033436935931-3eghs4vuo8krmktffi9band8trj15tso.apps.googleusercontent.com';

export const isFirebaseConfigured = () =>
  Boolean(
    firebaseConfig.apiKey &&
      !firebaseConfig.apiKey.startsWith('YOUR_') &&
      oauthClientId &&
      !oauthClientId.startsWith('YOUR_')
  );

/** True when Firebase project keys are present (sign-in still needs oauthClientId). */
export const hasFirebaseProject = () =>
  Boolean(firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('YOUR_'));
