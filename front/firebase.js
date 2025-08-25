// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzlRffm-PElgQ8EU5nkwl7BvoWXj60dPg",
  authDomain: "lecteur-livre-da45b.firebaseapp.com",
  projectId: "lecteur-livre-da45b",
  storageBucket: "lecteur-livre-da45b.firebasestorage.app",
  messagingSenderId: "890206343037",
  appId: "1:890206343037:web:47d0a70c1d3ded0699c614",
  measurementId: "G-8CVM8YNC0Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);