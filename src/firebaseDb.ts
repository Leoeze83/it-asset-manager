import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { app, firebaseConfig } from './firebaseApp';

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const firestore = {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
};

export async function testFirestoreConnection() {
  await getDocFromServer(doc(db, 'test', 'connection'));
}
