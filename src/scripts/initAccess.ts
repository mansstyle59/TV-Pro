import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function initAccess() {
  console.log('Attempting to initialize access codes...');
  try {
    const docRef = doc(db, 'config', 'access');
    await setDoc(docRef, {
      adminCode: '1606',
      userCode: '0000'
    });
    console.log('Successfully initialized config/access');
  } catch (err) {
    console.error('Failed to initialize:', err);
  }
}

initAccess();
