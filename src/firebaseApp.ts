import { initializeApp } from 'firebase/app';
// @ts-ignore
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export { firebaseConfig };
