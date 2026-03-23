// Compatibility module for legacy imports.
// New code should import from ./firebaseAuth and ./firebaseDb.
export { auth } from './firebaseAuth';
export { db, testFirestoreConnection } from './firebaseDb';
