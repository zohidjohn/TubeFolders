import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from './firebase.js';

function libraryRef(uid) {
  return doc(getDb(), 'users', uid, 'data', 'library');
}

function profileRef(uid) {
  return doc(getDb(), 'users', uid);
}

export async function saveUserProfile(user) {
  await setDoc(
    profileRef(user.uid),
    {
      email: user.email || '',
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function loadLibrary(uid) {
  const snap = await getDoc(libraryRef(uid));
  if (!snap.exists()) {
    return { folders: [], channels: {}, updatedAt: null };
  }
  const data = snap.data();
  return {
    folders: Array.isArray(data.folders) ? data.folders : [],
    channels: data.channels && typeof data.channels === 'object' ? data.channels : {},
    updatedAt: data.updatedAt?.toMillis?.() ?? null,
  };
}

export async function saveLibrary(uid, library) {
  await setDoc(libraryRef(uid), {
    folders: library.folders || [],
    channels: library.channels || {},
    updatedAt: serverTimestamp(),
  });
}

export function toMillis(value) {
  if (!value) return 0;
  if (typeof value === 'number') return value;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value.toMillis === 'function') return value.toMillis();
  return 0;
}
