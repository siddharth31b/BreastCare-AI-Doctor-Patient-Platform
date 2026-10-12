# NariSetu – BreastCare AI — Comprehensive Demonstration & Deployment Setup Guide

This comprehensive guide outlines the end-to-end setup required to run a live demonstration of the **NariSetu** clinical platform across physical Android tablets, the Node.js backend, and the Next.js administrative portal.

---

## 1. Prerequisites & System Requirements

- **Node.js**: v18.x or later (v20+ recommended)
- **Package Manager**: `npm` (v9+)
- **Mobile Device**: Android Tablet running Android 10+ with **Expo Go** installed (or Android Emulator)
- **Local Network**: Tablet and host PC must be connected to the **same Wi-Fi network** for physical tablet testing.

---

## 2. Environment Configuration Summary

### A. Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development

# Database & Storage (Supabase)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_STORAGE_BUCKET=patient-photos

# Authentication (Firebase Admin)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-firebase-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Multilingual Voice Layer (DEMO MODE - No external keys needed)
LANGUAGE_PROVIDER=demo
```

### B. Doctor Tablet App (`doctor-app/.env`)
```env
# Point to your host computer's local Wi-Fi IP address
EXPO_PUBLIC_API_URL=http://192.168.1.X:5000/api
EXPO_PUBLIC_TABLET_ID=TABLET-CLINIC-01

# Public Firebase config for client SDK
EXPO_PUBLIC_FIREBASE_API_KEY=your-firebase-web-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-firebase-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
```

### C. Admin Web Dashboard (`admin-dashboard/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## 3. Step-by-Step Setup Instructions

### Step 1: Real Supabase Setup
1. Create a project at [supabase.com](https://supabase.com).
2. In Supabase Dashboard → **SQL Editor**, open and execute the contents of:
   ```
   backend/src/db/schema.sql
   ```
   This creates all 7 tables (`doctors`, `admins`, `patients`, `questions`, `assessments`, `answers`, `doctor_patient`), all performance indexes, and the private `patient-photos` storage bucket.
3. In Supabase Dashboard → **Project Settings** → **API**:
   - Copy **Project URL** into `SUPABASE_URL` in `backend/.env`.
   - Copy **service_role (secret)** into `SUPABASE_SERVICE_ROLE_KEY` in `backend/.env`.
4. In `backend/`, run the questionnaire seed script:
   ```bash
   cd backend
   npm run seed
   ```
   *Output: `[Supabase Seed] Successfully seeded 21 questions into Supabase!`*

---

### Step 2: Real Firebase Setup
1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Authentication** → **Email/Password**.
3. Create clinical demo users (refer to `DEMO_ACCOUNTS.md`):
   - `doctor@breastcare.ai` (Role: DOCTOR)
   - `admin@breastcare.ai` (Role: ADMIN)
4. Go to **Project Settings** → **Service Accounts** → **Generate New Private Key**.
5. Copy the credentials into `backend/.env` (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).

---

### Step 3: Start Node.js Backend
```bash
cd backend
npm install
npm test      # Verify all 19 automated integration tests pass
npm run dev   # Starts server on port 5000
```
Verify the server responds:
```bash
curl http://localhost:5000/api/health
# Response: {"status":"healthy","service":"breastcare-backend","version":"1.0.0"}
```

---

### Step 4: Physical Android Tablet Setup & Configuration
1. Find your host computer's local Wi-Fi IP address:
   - On Windows: Run `ipconfig` in PowerShell (look for *IPv4 Address* under Wi-Fi adapter, e.g., `192.168.1.55`).
   - On macOS/Linux: Run `ifconfig` or `ip a`.
2. Start the Expo development server:
   ```bash
   cd doctor-app
   npm install
   npx expo start
   ```
3. Open **Expo Go** on your Android tablet and scan the QR code displayed in the terminal.
4. On the Doctor Tablet **Login Screen**:
   - Look at the bottom badge: `📡 Backend: ... [Configure]`.
   - Tap **Configure**.
   - Enter your computer's IP address: `http://192.168.1.55:5000/api`.
   - Tap **Test Connection** — verify it shows `Connected! (Status: healthy, v1.0.0)`.
   - Tap **Save & Apply**.
   - Your physical tablet is now directly linked to your local backend and camera capture is active.

---

### Step 5: Start Admin Web Dashboard
```bash
cd admin-dashboard
npm install
npm run dev
```
Open your browser at `http://localhost:3000`.

---

## 4. Live Demonstration Workflow

Follow this clinical presentation workflow:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Tablet: Doctor Sign In                                   │
│    • Tap "Instant Doctor Demo Sign In" (or login via email) │
│    • Land on Tablet Dashboard (Tablet ID: TABLET-CLINIC-01) │
├─────────────────────────────────────────────────────────────┤
│ 2. Tablet: Register New Patient                             │
│    • Tap "+ Register Patient"                               │
│    • Enter Name: "Sunita Devi", Age: 48, Phone: 9811122233  │
│    • Tap "Proceed to Photo Capture"                         │
├─────────────────────────────────────────────────────────────┤
│ 3. Tablet: Face Photo Capture                               │
│    • Camera opens with clinical oval alignment guide        │
│    • Capture patient photo -> Review preview                │
│    • Tap "Use Photo & Proceed" -> Uploaded to storage       │
├─────────────────────────────────────────────────────────────┤
│ 4. Tablet: Multi-Phase Guided Chatbot                       │
│    • Phase 0: Baseline Risk Profile (Age, Family History)   │
│    • Multilingual voice demo: Toggle Hindi, Marathi, etc.   │
│    • Tap [ 🔊 Listen ] to hear translated prompt            │
│    • Tap [ 🎤 Speak ] to simulate voice answer              │
│    • Phase 1: Palpable Lump (Yes), Nipple Discharge (Yes)   │
│    • Phase 2: Size > 2cm, Hard texture                      │
│    • Phase 3: Systemic check                                │
├─────────────────────────────────────────────────────────────┤
│ 5. Tablet: Review & Submit                                  │
│    • Review weighted scores, safety overrides, recommendations│
│    • Tap "Finalize & Submit Assessment"                     │
├─────────────────────────────────────────────────────────────┤
│ 6. Admin Dashboard: Real-time Oversight                     │
│    • Sign in at http://localhost:3000/login                 │
│    • View newly triaged patient in Patient Directory        │
│    • Verify face photo is loaded from private signed URL    │
│    • Open Assessment to review full clinical questionnaire, │
│      BRM score, safety override alerts, and risk tier       │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. BHASHINI Multilingual Voice Demo Notes

- Operating mode: `LANGUAGE_PROVIDER=demo`
- Supported languages: **English**, **Hindi**, **Marathi**, **Bengali**, **Tamil**, **Telugu**.
- **Important**: The tablet UI displays a clear `DEMO / MOCK VOICE MODE` indicator to distinguish simulation from production.
- Production readiness: To connect the actual Indian National Language Translation Mission (ULCA/Dhruva) pipeline, provide `BHASHINI_API_KEY` and `BHASHINI_USER_ID` in `backend/.env`. Zero frontend code modifications are required.
