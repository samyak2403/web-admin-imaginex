// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCYmYit-u4vOW8CoHUteS0ACSwXNgWAcR8",
    authDomain: "imaginex-beta-c087f.firebaseapp.com",
    projectId: "imaginex-beta-c087f",
    storageBucket: "imaginex-beta-c087f.firebasestorage.app",
    messagingSenderId: "724781388472",
    appId: "1:724781388472:web:5eb756479172b244d41a4d",
    measurementId: "G-593RP5D0L5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Admin emails (users allowed to access admin panel)
const ADMIN_EMAILS = [
    'admin@imaginex.com',
    'teacher@imaginex.com'
    // Add more admin emails here
];
