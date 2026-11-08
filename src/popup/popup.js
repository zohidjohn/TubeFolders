import { isFirebaseConfigured } from '../config.js';
import { watchAuth } from '../lib/auth.js';
import {
  exportLibraryJson,
  downloadBackup,
  importLibraryJson,
} from '../lib/backup.js';
import { getLibrary, onLibraryChange, getAuthMeta } from '../lib/storage.js';
import { syncLibrary, pullFromCloud } from '../lib/sync.js';

const els = {
  signedOut: document.getElementById('auth-signed-out'),
  signedIn: document.getElementById('auth-signed-in'),
  userAvatar: document.getElementById('user-avatar'),
  userName: document.getElementById('user-name'),
  userEmail: document.getElementById('user-email'),
  btnSignIn: document.getElementById('btn-signin'),
  btnSignOut: document.getElementById('btn-signout'),
  folderSummary: document.getElementById('folder-summary'),
  btnExport: document.getElementById('btn-export'),
  btnImport: document.getElementById('btn-import'),
  btnSync: document.getElementById('btn-sync'),
  importFile: document.getElementById('import-file'),
  status: document.getElementById('status'),
};

let currentUser = null;

function setStatus(message, isError = false) {
  els.status.textContent = message || '';
  els.status.classList.toggle('error', Boolean(isError));
}

function setAuthUi(user) {
  currentUser = user;
  const signedIn = Boolean(user);
  els.signedIn.classList.toggle('tf-hidden', !signedIn);
  els.signedOut.classList.toggle('tf-hidden', signedIn);
  if (user) {
    els.userName.textContent = user.displayName || 'Signed in';
    els.userEmail.textContent = user.email || '';
    els.userAvatar.src = user.photoURL || '';
    els.userAvatar.style.display = user.photoURL ? 'block' : 'none';
  }
}

async function refresh() {
  const library = await getLibrary();
  const folders = library.folders || [];
  const channelCount = Object.keys(library.channels || {}).length;
  if (!folders.length) {
    els.folderSummary.textContent =
      'No folders yet. Create them from the TubeFolders section on YouTube.';
    return;
  }
  els.folderSummary.textContent = `${folders.length} folder${
    folders.length === 1 ? '' : 's'
  } · ${channelCount} saved channel${channelCount === 1 ? '' : 's'}`;
}

els.btnSignIn.addEventListener('click', async () => {
  try {
    setStatus('Opening Google sign-in…');
    const response = await chrome.runtime.sendMessage({ type: 'tf-signin' });
    if (!response?.ok) throw new Error(response?.error || 'Sign-in failed');
    setAuthUi(response.user);
    await refresh();
    setStatus(`Signed in as ${response.user?.displayName || response.user?.email || 'user'}`);
  } catch (err) {
    setStatus(err.message || 'Sign-in failed', true);
  }
});

els.btnSignOut.addEventListener('click', async () => {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'tf-signout' });
    if (!response?.ok) throw new Error(response?.error || 'Sign-out failed');
    setAuthUi(null);
    setStatus('Signed out (local folders kept)');
  } catch (err) {
    setStatus(err.message || 'Sign-out failed', true);
  }
});

els.btnExport.addEventListener('click', async () => {
  try {
    const json = await exportLibraryJson();
    downloadBackup(json);
    setStatus('Backup downloaded');
  } catch (err) {
    setStatus(err.message || 'Export failed', true);
  }
});

els.btnImport.addEventListener('click', () => els.importFile.click());

els.importFile.addEventListener('change', async () => {
  const file = els.importFile.files?.[0];
  els.importFile.value = '';
  if (!file) return;
  try {
    const text = await file.text();
    await importLibraryJson(text, { merge: false });
    if (currentUser) {
      await chrome.runtime.sendMessage({ type: 'tf-sync' });
    }
    await refresh();
    setStatus('Backup imported');
  } catch (err) {
    setStatus(err.message || 'Import failed', true);
  }
});

els.btnSync.addEventListener('click', async () => {
  try {
    if (!isFirebaseConfigured()) {
      setStatus('Firebase is not configured', true);
      return;
    }
    if (!currentUser) {
      setStatus('Sign in to sync', true);
      return;
    }
    const result = await syncLibrary();
    await refresh();
    setStatus(`Sync ${result.action || 'done'}`);
  } catch (err) {
    setStatus(err.message || 'Sync failed', true);
  }
});

async function restoreAuthUi() {
  const meta = await getAuthMeta();
  if (meta?.uid || meta?.email || meta?.displayName) {
    setAuthUi(meta);
    return meta;
  }
  return null;
}

refresh();
onLibraryChange(() => refresh());
restoreAuthUi();

if (isFirebaseConfigured()) {
  watchAuth(async (user) => {
    if (user) {
      setAuthUi({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      });
      try {
        await pullFromCloud();
        await refresh();
      } catch {
        /* offline */
      }
    } else {
      const meta = await getAuthMeta();
      if (meta) setAuthUi(meta);
      else setAuthUi(null);
    }
  });
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.authMeta) {
    const meta = changes.authMeta.newValue;
    if (meta) setAuthUi(meta);
    else setAuthUi(null);
  }
});
