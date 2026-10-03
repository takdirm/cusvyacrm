import * as firebase from 'firebase/app';

const getRuntimeConfigValue = (key, defaultValue = '') => {
  return window.runtimeConfig?.[key] || process.env[key] || defaultValue;
};

const firebaseConfig = {
  apiKey: getRuntimeConfigValue('REACT_APP_FIREBASE_API_KEY'),
  authDomain: getRuntimeConfigValue('REACT_APP_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getRuntimeConfigValue('REACT_APP_FIREBASE_DATABASE_URL'),
  projectId: getRuntimeConfigValue('REACT_APP_FIREBASE_PROJECT_ID'),
  storageBucket: getRuntimeConfigValue('REACT_APP_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getRuntimeConfigValue('REACT_APP_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getRuntimeConfigValue('REACT_APP_FIREBASE_APP_ID'),
  measurementId: getRuntimeConfigValue('REACT_APP_FIREBASE_MEASUREMENT_ID'),
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase;
