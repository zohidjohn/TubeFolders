import { isFirebaseConfigured } from '../config.js';
import { getCurrentUser } from './auth.js';
import { loadLibrary, saveLibrary, saveUserProfile } from './firestore.js';
import {
  getLibrary,
  setLibrary,
  isLibraryDirty,
  clearDirty,
  setAuthMeta,
} from './storage.js';

export async function pullFromCloud() {
  if (!isFirebaseConfigured()) return null;
  const user = getCurrentUser();
  if (!user) return null;
  const remote = await loadLibrary(user.uid);
  await setLibrary(
    {
      folders: remote.folders,
      channels: remote.channels,
      updatedAt: remote.updatedAt || Date.now(),
    },
    { dirty: false }
  );
  await setAuthMeta({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  });
  return remote;
}

export async function pushToCloud() {
  if (!isFirebaseConfigured()) return null;
  const user = getCurrentUser();
  if (!user) return null;
  const local = await getLibrary();
  await saveUserProfile(user);
  await saveLibrary(user.uid, local);
  await clearDirty();
  await setAuthMeta({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  });
  return local;
}

/** Prefer newer side; if local dirty, push; else pull if remote newer or local empty. */
export async function syncLibrary() {
  if (!isFirebaseConfigured()) {
    return { ok: false, reason: 'not_configured' };
  }
  const user = getCurrentUser();
  if (!user) return { ok: false, reason: 'signed_out' };

  const local = await getLibrary();
  const dirty = await isLibraryDirty();
  const remote = await loadLibrary(user.uid);
  const localEmpty = !local.folders.length;
  const remoteEmpty = !remote.folders.length;
  const remoteTs = remote.updatedAt || 0;
  const localTs = local.updatedAt || 0;

  if (dirty || (remoteEmpty && !localEmpty)) {
    await pushToCloud();
    return { ok: true, action: 'push' };
  }
  if (!remoteEmpty && (localEmpty || remoteTs >= localTs)) {
    await pullFromCloud();
    return { ok: true, action: 'pull' };
  }
  if (!dirty && localEmpty && remoteEmpty) {
    await pushToCloud();
    return { ok: true, action: 'init' };
  }
  return { ok: true, action: 'noop' };
}
