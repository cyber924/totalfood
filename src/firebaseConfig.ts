import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../firebase-applet-config.json';

// New Firebase project provided by user: studio-1139705993-b3bee
const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || "AIzaSyCUohSuUaJ-FaffkWiV72U5UZm4J3A67NQ",
  authDomain: firebaseConfigJson.authDomain || "studio-1139705993-b3bee.firebaseapp.com",
  projectId: firebaseConfigJson.projectId || "studio-1139705993-b3bee",
  storageBucket: firebaseConfigJson.storageBucket || "studio-1139705993-b3bee.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "495687556291",
  appId: firebaseConfigJson.appId || "1:495687556291:web:8ab68aa140ee2c774ed676",
  measurementId: firebaseConfigJson.measurementId || "",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const db = (firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)')
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

