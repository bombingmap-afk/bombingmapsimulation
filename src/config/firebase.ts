import { getFirestore } from 'firebase/firestore';
import { getFunctions } from "firebase/functions";
import { initializeApp } from 'firebase/app';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDeLj0KksVcCGvXjWs-mXn7Dyr8r3Y6gFw",
  authDomain: "bombingmap.firebaseapp.com",
  projectId: "bombingmap",
  storageBucket: "bombingmap.firebasestorage.app",
  messagingSenderId: "868119040139",
  appId: "1:868119040139:web:5a51e18344df5638a9848e",
  measurementId: "G-Q0CJT2PE5H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export const functions = getFunctions(app, "us-central1");

