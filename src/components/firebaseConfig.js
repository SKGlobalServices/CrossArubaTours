import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";  // Importar autenticación y proveedor de Google
import { getFirestore } from "firebase/firestore";  // Importar Firestore

const firebaseConfig = {
  apiKey: "AIzaSyBSNnlONJZpwJExLYnff-PDMZW9BgzVz3o",
  authDomain: "cross-aruba-tours.firebaseapp.com",
  databaseURL: "https://cross-aruba-tours-default-rtdb.firebaseio.com",
  projectId: "cross-aruba-tours",
  storageBucket: "cross-aruba-tours.firebasestorage.app",
  messagingSenderId: "1050876826013",
  appId: "1:1050876826013:web:2f64b6770c66878793df74",
};

const app = initializeApp(firebaseConfig);

const database = getDatabase(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const firestore = getFirestore(app);

export { database, auth, provider, firestore };
