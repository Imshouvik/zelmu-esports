import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: 'AIzaSyAzlIfdJaMq3w-moUyHJWtR45y2vuUK9rs',
  authDomain: 'zelmu-6e7f3.firebaseapp.com',
  projectId: 'zelmu-6e7f3',
  storageBucket: 'zelmu-6e7f3.firebasestorage.app',
  messagingSenderId: '320824312979',
  appId: '1:320824312979:web:efd15b423728d1b02b3966',
  measurementId: 'G-ML3C4P95S8',
};

const app = initializeApp(firebaseConfig);

// Only initialize messaging on the client side
let messaging;
let getTokenFn;
let onMessageFn;

if (typeof window !== 'undefined') {
  try {
    messaging = getMessaging(app);
    getTokenFn = getToken;
    onMessageFn = onMessage;
  } catch (error) {
    console.warn('Firebase messaging not available:', error);
    messaging = null;
    getTokenFn = null;
    onMessageFn = null;
  }
}

export { messaging, getTokenFn as getToken, onMessageFn as onMessage }; 