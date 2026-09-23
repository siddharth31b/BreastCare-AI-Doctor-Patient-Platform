const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const admin = require('firebase-admin');

function normalizePrivateKey(rawKey) {
  if (!rawKey) return undefined;
  let key = rawKey.trim();
  // Strip accidental trailing comma (common when copying from JSON)
  if (key.endsWith(',')) {
    key = key.slice(0, -1).trim();
  }
  // Strip wrapping quotes if present
  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {
    key = key.slice(1, -1);
  }
  // Strip trailing comma again if it was inside the quotes
  if (key.endsWith(',')) {
    key = key.slice(0, -1).trim();
  }
  // Convert literal \n to actual newlines
  key = key.replace(/\\n/g, '\n');
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

async function verify() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = normalizeEmail(process.env.FIREBASE_CLIENT_EMAIL);
  const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  console.log('[Diagnostic] Project ID:', projectId);
  console.log('[Diagnostic] Client Email:', clientEmail);
  console.log('[Diagnostic] Key present:', !!privateKey);
  console.log('[Diagnostic] Key starts with header:', privateKey ? privateKey.startsWith('-----BEGIN PRIVATE KEY-----') : false);
  console.log('[Diagnostic] Key ends with footer:', privateKey ? privateKey.endsWith('-----END PRIVATE KEY-----') : false);

  try {
    const app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    }, 'diagnostic-app');

    console.log('[Firebase Admin] Initialized successfully with project:', projectId);
    await app.delete();
    process.exit(0);
  } catch (err) {
    console.error('[Firebase Admin] Initialization failed:', err.message);
    process.exit(1);
  }
}

verify();
