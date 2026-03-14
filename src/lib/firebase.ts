import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore, doc, getDocFromServer } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Import the Firebase configuration provided by AI Studio
import firebaseConfig from '../../firebase-applet-config.json';

export const isFirebaseConfigured = !!(firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    // Use the specific firestoreDatabaseId if provided in the config
    db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || '(default)');
    storage = getStorage(app);
    
    // Test connection
    const testConnection = async () => {
      try {
        if (db) await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { auth, db, storage };
