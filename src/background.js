import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { firebaseConfig, isFirebaseConfigured } from './config.js';
import { syncLibrary, pushToCloud } from './lib/sync.js';
import { setAuthMeta, getAuthMeta } from './lib/storage.js';
import { signInWithGoogle, signOut } from './lib/auth.js';

function initFirebase() {
  if (!isFirebaseConfigured()) return null;
  if (!getApps().length) initializeApp(firebaseConfig);
  return getAuth();
}

const auth = initFirebase();

async function persistUser(user) {
  if (!user) {
    await setAuthMeta(null);
    return null;
  }
  const meta = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
  };
  await setAuthMeta(meta);
  return meta;
}

if (auth) {
  onAuthStateChanged(auth, async (user) => {
    await persistUser(user);
    if (user) {
      try {
        await syncLibrary();
      } catch (err) {
        console.warn('[TubeFolders] sync failed', err);
      }
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  const type = message?.type;

  if (type === 'tf-sync') {
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

  if (type === 'tf-signin') {
    (async () => {
      try {
        const user = await signInWithGoogle();
        const meta = await persistUser(user);
        try {
          await syncLibrary();
        } catch {
          /* local still ok */
        }
        sendResponse({ ok: true, user: meta });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (type === 'tf-signout') {
    (async () => {
      try {
        await signOut();
        await persistUser(null);
        sendResponse({ ok: true });
      } catch (err) {
        sendResponse({ ok: false, error: err.message });
      }
    })();
    return true;
  }

  if (type === 'tf-get-auth') {
    (async () => {
      const meta = await getAuthMeta();
      sendResponse({ ok: true, user: meta });
    })();
    return true;
  }

  return false;
});

chrome.runtime.onInstalled.addListener(() => {
  console.log('[TubeFolders] installed');
});
