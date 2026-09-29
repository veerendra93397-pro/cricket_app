import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDsuSrtwa08WT7A5csU45Tun32Cg29GpRQ',
  authDomain: 'cricket-app-27c1f.firebaseapp.com',
  projectId: 'cricket-app-27c1f',
  storageBucket: 'cricket-app-27c1f.firebasestorage.app',
  messagingSenderId: '410249701855',
  appId: '1:410249701855:web:1bf92ca615d9bf1a5cbc6a',
  measurementId: 'G-GPMTX4K609',
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
