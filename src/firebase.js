// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB3EANQNeU_XfBspFMXxm5DU6j1zvJwz6g",
  authDomain: "scadente-ati-f0758.firebaseapp.com",
  projectId: "scadente-ati-f0758",
  storageBucket: "scadente-ati-f0758.appspot.com",
  messagingSenderId: "275624591305",
  appId: "1:275624591305:web:21b4974c6eede32463f218",
  measurementId: "G-9MBTFRC3ZN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };