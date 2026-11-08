import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  indexedDBLocalPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from '../config.js';

let app;
let authReady;

export function getFirebaseApp() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }
  return app;
}

export function getFirebaseAuth() {
  const auth = getAuth(getFirebaseApp());
  if (!authReady) {
    authReady = setPersistence(auth, indexedDBLocalPersistence).catch(() =>
      setPersistence(auth, browserLocalPersistence)
    );
  }
  return auth;
}

export function whenAuthReady() {
  getFirebaseAuth();
  return authReady || Promise.resolve();
}

export function getDb() {
  return getFirestore(getFirebaseApp());
}
