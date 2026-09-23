const path = require('path');
const fs = require('fs');
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env')
});

const admin = require('firebase-admin');

let firebaseApp = null;
let isLiveFirebase = false;

function normalizePrivateKey(rawKey) {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  // Strip trailing commas (e.g. from copy-pasting JSON)
  if (key.endsWith(',')) key = key.slice(0, -1).trim();
  // Strip outer quotes if still wrapped
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // Strip trailing comma again if it was inside quotes
  if (key.endsWith(',')) key = key.slice(0, -1).trim();
  // Unescape literal \n into real newlines
  key = key.replace(/\\n/g, '\n');
  // Normalize Windows CRLF to standard LF
  key = key.replace(/\r\n/g, '\n');
  return key.trim();
}

function normalizeEmail(rawEmail) {
  if (!rawEmail) return undefined;
  let email = rawEmail.trim();
  if (email.endsWith(',')) email = email.slice(0, -1).trim();
  if ((email.startsWith('"') && email.endsWith('"')) || (email.startsWith("'") && email.endsWith("'"))) {
    email = email.slice(1, -1);
  }
  if (email.endsWith(',')) email = email.slice(0, -1).trim();
  return email.trim();
}

let projectId = process.env.FIREBASE_PROJECT_ID;
let clientEmail = normalizeEmail(process.env.FIREBASE_CLIENT_EMAIL);
let privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

// Optional fallback: load from local service account JSON file if configured or present
const localSaPath = path.resolve(__dirname, '../../firebase-service-account.json');
if ((!privateKey || !clientEmail) && fs.existsSync(localSaPath)) {
  try {
    const sa = JSON.parse(fs.readFileSync(localSaPath, 'utf8'));
    projectId = projectId || sa.project_id;
    clientEmail = clientEmail || normalizeEmail(sa.client_email);
    privateKey = privateKey || normalizePrivateKey(sa.private_key);
  } catch (err) {
    console.warn('[Firebase Admin] Note reading service account file:', err.message);
  }
}

if (
  projectId &&
  clientEmail &&
  privateKey &&
  !projectId.includes('your-firebase')
) {
  try {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    isLiveFirebase = true;

    console.log(
      '[Firebase Admin] Initialized successfully with project:',
      projectId
    );
  } catch (err) {
    console.warn(
      '[Firebase Admin] Initialization failed, running in fallback mode:',
      err.message
    );
  }
} else {
  console.log(
    '[Firebase Admin] Credentials not configured in .env. Using mock verification for development/testing.'
  );
}

/**
 * Verify Firebase ID Token
 * Supports real Firebase ID tokens when configured, plus designated test/demo tokens.
 */
async function verifyIdToken(token) {
  // 1. Development/Test mock verification (for automated tests and instant demo access)
  if (token === 'test-doctor-token' || token === 'demo-doctor-token') {
    return {
      uid: 'doc_demo_firebase_uid_1',
      email: 'doctor@breastcare.ai',
      name: 'Dr. Priya Sharma',
      role: 'DOCTOR'
    };
  }

  if (token === 'test-admin-token' || token === 'demo-admin-token') {
    return {
      uid: 'admin_demo_firebase_uid_1',
      email: 'admin@breastcare.ai',
      name: 'Super Admin',
      role: 'ADMIN'
    };
  }

  // Custom test token format: "mock:role:uid:email:name"
  if (token && token.startsWith('mock:')) {
    const [, role, uid, email, name] = token.split(':');
    return {
      uid: uid || 'custom_uid',
      email: email || `${role}@breastcare.ai`,
      name: name || `Test ${role}`,
      role: role.toUpperCase()
    };
  }

  // 2. Real Firebase ID token verification
  if (isLiveFirebase && firebaseApp) {
    return await admin.auth().verifyIdToken(token);
  }

  throw new Error('Invalid or unverified Firebase ID token');
}

module.exports = {
  admin,
  firebaseApp,
  isLiveFirebase,
  verifyIdToken
};