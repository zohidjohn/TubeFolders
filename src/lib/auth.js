import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signOut as fbSignOut,
} from 'firebase/auth';
import { oauthClientId, isFirebaseConfigured } from '../config.js';
import { getFirebaseAuth, whenAuthReady } from './firebase.js';

async function readyAuth() {
  await whenAuthReady();
  return getFirebaseAuth();
}

function getRedirectUrl() {
  return typeof chrome !== 'undefined' && chrome.identity
    ? chrome.identity.getRedirectURL()
    : '';
}

function buildAuthUrl() {
  const redirectUri = encodeURIComponent(getRedirectUrl());
  const clientId = encodeURIComponent(oauthClientId);
  // response_type=token (implicit) must NOT include nonce — Google returns
  // "Parameter not allowed for this message type: nonce"
  return (
    'https://accounts.google.com/o/oauth2/v2/auth' +
    `?client_id=${clientId}` +
    `&response_type=token` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${encodeURIComponent('email profile')}` +
    `&prompt=select_account`
  );
}

function parseAccessToken(redirectUrl) {
  const hash = redirectUrl.split('#')[1] || '';
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  if (!token) {
    throw new Error('No access_token in OAuth redirect');
  }
  return token;
}

export function watchAuth(callback) {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}

export function getCurrentUser() {
  return getFirebaseAuth().currentUser;
}

export async function signInWithGoogle() {
  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Edit src/config.js with your project values.'
    );
  }
  const authUrl = buildAuthUrl();
  const redirectUrl = await new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (responseUrl) => {
        if (chrome.runtime.lastError || !responseUrl) {
          reject(new Error(chrome.runtime.lastError?.message || 'Auth cancelled'));
          return;
        }
        resolve(responseUrl);
      }
    );
  });
  const accessToken = parseAccessToken(redirectUrl);
  const credential = GoogleAuthProvider.credential(null, accessToken);
  const auth = await readyAuth();
  const result = await signInWithCredential(auth, credential);
  return result.user;
}

export async function signOut() {
  const auth = await readyAuth();
  await fbSignOut(auth);
}
