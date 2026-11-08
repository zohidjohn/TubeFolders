import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config.js';
import { syncLibrary, pushToCloud } from './lib/sync.js';
import { setAuthMeta } from './lib/storage.js';

function initFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (!getApps().length) initializeApp(firebaseConfig);
  return getAuth();
}

const auth = initFirebase();

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await setAuthMeta({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      try {
        await syncLibrary();
      } catch (err) {
        console.warn('[TubeFolders] sync failed', err);
      }
    } else {
      await setAuthMeta(null);
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === 'tf-sync') {
    (async () => {
      try {
        if (!isFirebaseConfigured()) {
          sendResponse({ ok: false, reason: 'not_configured' });
          return;
        }
        const result = await pushToCloud();
        sendResponse({ ok: Boolean(result), action: 'push' });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }
  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TubeFolders] installed');
});
