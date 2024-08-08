// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";  // Import for Realtime Database

// Your web app's Firebase configuration
const firebaseConfig = {
       apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
       authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
       projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
       storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
       messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
       appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
       measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string,
       databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL as string // Add the database URL here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(app);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app); // Realtime Database initialization

export { auth, database };
