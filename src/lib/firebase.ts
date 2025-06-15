
import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDTi6OXgsu-83DgXjFwIW0igoytj0pCSH4",
  authDomain: "pantrypal-iyxgb.firebaseapp.com",
  projectId: "pantrypal-iyxgb",
  storageBucket: "pantrypal-iyxgb.firebasestorage.app",
  messagingSenderId: "118142853197",
  appId: "1:118142853197:web:2e3e7bf14e7c117e6d3c04"
};

let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth: Auth = getAuth(app);

export { app, auth };
