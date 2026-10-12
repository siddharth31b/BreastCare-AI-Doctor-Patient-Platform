# NariSetu – BreastCare AI — Production Deployment & External Services Guide

This document outlines the step-by-step instructions for provisioning external cloud services and deploying the NariSetu platform to production.

---

## 🔑 External Credentials Required for Production

### 1. Supabase (PostgreSQL Database & Storage)

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Go to **Project Settings** → **API**:
   - Copy **Project URL** (`https://xyzcompany.supabase.co`)
   - Copy **service_role secret key** (Keep secret! Only for backend!)
3. In the Supabase SQL Editor, run the full schema script located at:
   ```
   backend/src/db/schema.sql
   ```
   This creates all required tables, indexes, and the private `patient-photos` storage bucket.
4. Set the following variables in `backend/.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJh...
   SUPABASE_STORAGE_BUCKET=patient-photos
   ```

---

### 2. Firebase Authentication (Doctor & Admin Logins)

1. Create a Firebase Project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** → **Email/Password** sign-in provider.
3. Generate a Service Account Private Key:
   - Go to **Project Settings** → **Service accounts** → **Generate new private key**.
   - Download the JSON file.
4. Set the credentials in `backend/.env`:
   ```env
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project-id.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```
5. In `doctor-app/.env` and `admin-dashboard/.env`, set the public client keys:
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   ```

---

### 3. BHASHINI (India National Language Translation Mission)

- **Current Status**: Operating in **DEMO/MOCK MODE** (`LANGUAGE_PROVIDER=demo`).
- Development, tablet testing, and clinical evaluations do **NOT** require BHASHINI API keys.
- **When production credentials become available**:
  1. Update `backend/.env`:
     ```env
     LANGUAGE_PROVIDER=bhashini
     BHASHINI_ENDPOINT=https://dhruva-api.bhashini.gov.in/services/inference/pipeline
     BHASHINI_USER_ID=your-bhashini-user-id
     BHASHINI_API_KEY=your-bhashini-api-key
     ```
  2. The `BhashiniLanguageProvider` in `backend/src/services/language/BhashiniLanguageProvider.js` will automatically activate.
  3. **Zero frontend code changes are needed.**

---

## 📱 Android Tablet Build (doctor-app)

1. Ensure Expo CLI is installed:
   ```bash
   npm install -g eas-cli
   ```
2. In `doctor-app/`:
   ```bash
   cd doctor-app
   npx eas-cli build --platform android --profile preview
   ```
3. Install the resulting `.apk` on clinical Android tablet devices.
4. Set the device tablet identifier in `app.json` or through environment config (`EXPO_PUBLIC_TABLET_ID=TABLET-ONCOLOGY-01`).

---

## 🖥️ Admin Web Dashboard (admin-dashboard)

1. Build production bundle:
   ```bash
   cd admin-dashboard
   npm run build
   ```
2. Deploy to Vercel or any Node.js hosting platform:
   - Set environment variable: `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`
3. Run with:
   ```bash
   npm run start
   ```

---

## ⚙️ Backend Server Deployment (backend)

1. Run on Ubuntu / Debian / Container runtime:
   ```bash
   cd backend
   npm install --production
   node src/server.js
   ```
2. Or use PM2 process manager:
   ```bash
   pm2 start src/server.js --name "breastcare-backend"
   ```
3. Health check verification:
   ```bash
   curl http://localhost:5000/api/health
   ```
