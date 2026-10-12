# NariSetu – BreastCare AI — Clinical & Administrative Account Setup Guide

This document specifies the required accounts for clinical doctor tablet operations and administrative oversight across the **NariSetu** platform.

---

## 1. Required Accounts Overview

| Account Type | Default Clinical Email | Role | Target Application | Initial Table Mapping |
| :--- | :--- | :--- | :--- | :--- |
| **Attending Doctor** | `doctor@breastcare.ai` | `DOCTOR` | Doctor Tablet App (Expo / React Native) | `doctors` |
| **System Administrator** | `admin@breastcare.ai` | `ADMIN` | Admin Web Dashboard (Next.js 16) | `admins` |

> [!IMPORTANT]
> In accordance with healthcare security standards, **passwords must never be hardcoded into source code or committed to Git**. Passwords should be generated securely and shared only through secure credential managers.

---

## 2. Live Firebase Setup Instructions

When connecting the system to a live Firebase project:

### Step 1: Enable Email/Password Authentication
1. Navigate to the [Firebase Console](https://console.firebase.google.com/).
2. Select your BreastCare project.
3. In the left navigation, click **Build** > **Authentication**.
4. Go to the **Sign-in method** tab.
5. Click **Email/Password**, toggle **Enable**, and click **Save**.

### Step 2: Create Doctor User
1. Go to the **Users** tab under Authentication.
2. Click **Add user**.
3. Enter:
   - **Email**: `doctor@breastcare.ai` (or your clinic's designated doctor email)
   - **Password**: *[Generate a strong, unique password of at least 12 characters]*
4. Click **Add user**.
5. Note the generated **User UID** (e.g. `doc_fb_...`).

### Step 3: Create Administrator User
1. Click **Add user** again.
2. Enter:
   - **Email**: `admin@breastcare.ai` (or hospital admin email)
   - **Password**: *[Generate a strong, unique administrative password]*
3. Click **Add user**.
4. Note the generated **User UID** (e.g. `admin_fb_...`).

### Step 4: Role Association in Database
Upon the first authenticated login with the Firebase ID Token:
- The backend's authentication middleware (`/api/auth/session`) verifies the token with Firebase Admin SDK.
- If the email/UID is not yet in the Supabase database:
  - Doctor accounts are auto-provisioned into the `doctors` table with `status = 'ACTIVE'` and default `tablet_id = 'TABLET-CLINIC-01'`.
  - Admin accounts are auto-provisioned into the `admins` table with `status = 'ACTIVE'`.
- Alternatively, you can pre-insert them into PostgreSQL:
  ```sql
  INSERT INTO doctors (firebase_uid, name, email, tablet_id, status)
  VALUES ('<DOCTOR_FIREBASE_UID>', 'Dr. Priya Sharma', 'doctor@breastcare.ai', 'TABLET-CLINIC-01', 'ACTIVE')
  ON CONFLICT (firebase_uid) DO NOTHING;

  INSERT INTO admins (firebase_uid, name, email, status)
  VALUES ('<ADMIN_FIREBASE_UID>', 'Hospital Super Admin', 'admin@breastcare.ai', 'ACTIVE')
  ON CONFLICT (firebase_uid) DO NOTHING;
  ```

---

## 3. Development / Offline Demo Mode Access

For local evaluation, tablet demonstration, and automated test runs when live Firebase project credentials are not configured in `.env`:

### Instant Doctor Tablet Demo
- Open Doctor Tablet App (`doctor-app`).
- Tap **"⚡ Instant Doctor Demo Sign In"**.
- Automatically establishes an authorized `DOCTOR` session bound to `Dr. Priya Sharma` (Tablet ID: `TABLET-CLINIC-01`).

### Instant Admin Dashboard Demo
- Navigate to `http://localhost:3000/login`.
- Click **"⚡ Instant Demo Admin Login"**.
- Automatically establishes an authorized `ADMIN` session with full visibility over all doctor stations, patients, face photos, and assessments.
