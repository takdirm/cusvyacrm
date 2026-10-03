import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';

const envFirebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

let templateAuth = null;
let configPromise = null;

async function resolveFirebaseConfig() {
  const missingEnvKeys = Object.entries(envFirebaseConfig)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingEnvKeys.length === 0) {
    return envFirebaseConfig;
  }

  if (!configPromise) {
    configPromise = fetch('/google-services.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('google-services.json is not available.');
        }

        return response.json();
      })
      .then((googleServices) => {
        const projectId = googleServices?.project_info?.project_id;
        const storageBucket = googleServices?.project_info?.storage_bucket;
        const apiKey = googleServices?.client?.[0]?.api_key?.[0]?.current_key;
        const appId = googleServices?.client?.[0]?.client_info?.mobilesdk_app_id;
        const messagingSenderId = googleServices?.project_info?.project_number;

        if (!projectId || !apiKey || !appId) {
          throw new Error('google-services.json is missing required Firebase values.');
        }

        return {
          apiKey,
          authDomain: `${projectId}.firebaseapp.com`,
          projectId,
          storageBucket,
          messagingSenderId,
          appId,
        };
      })
      .catch(() => {
        throw new Error(
          `Firebase config is missing. Set REACT_APP_FIREBASE_* env vars or provide /public/google-services.json.`,
        );
      });
  }

  return configPromise;
}

async function getTemplateAuth() {
  const firebaseConfig = await resolveFirebaseConfig();

  if (templateAuth) {
    return templateAuth;
  }

  const app = initializeApp(firebaseConfig, 'cusvya-template-web');
  templateAuth = getAuth(app);
  return templateAuth;
}

export async function signInTemplateFirebase(email, password) {
  const auth = await getTemplateAuth();
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken(true);
  return { idToken, user: credential.user };
}

export async function signOutTemplateFirebase() {
  if (!templateAuth) {
    return;
  }

  await signOut(templateAuth);
}
