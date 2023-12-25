// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
// Your web app's Firebase configuration
const firebaseConfig = {
       apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
       authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
       projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
       storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
       messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
       appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
       measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

const analytics = getAnalytics(app);
export default auth;
