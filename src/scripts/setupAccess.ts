import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function setCodes() {
  console.log('Attempting to set codes...');
  const docRef = doc(db, 'config', 'access');
  try {
    await setDoc(docRef, {
      adminCode: '1606', // User requested
      userCode: '0000'   // Default
    });
    console.log('Codes set successfully');
  } catch (err) {
    console.error('Error in setDoc:', err);
  }
}

setCodes().catch(console.error);
