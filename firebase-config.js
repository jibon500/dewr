
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAgvOSJFY8WqRoVXRWjWiOEdAmjvTz_pgU",
    authDomain: "task-app-a3b8a.firebaseapp.com",
    databaseURL: "https://task-app-a3b8a-default-rtdb.firebaseio.com",
    projectId: "task-app-a3b8a",
    storageBucket: "task-app-a3b8a.appspot.com",
    messagingSenderId: "154506156460",
    appId: "1:154506156460:web:78124e37a074fe43218209",
    measurementId: "G-Q2C5BLCWDT"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
} catch(e) {
    console.error("Firebase initialization error:", e);
}

const auth = firebase.auth();
const db = firebase.firestore();
