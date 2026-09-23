# BreastCare AI - Clinical Patient Assessment and Triage Platform

A hospital-grade clinical triage and patient assessment platform designed for early breast health screening. The system integrates doctor tablet stations, multilingual speech assistance, standardized clinical risk stratification, physician validation workflows, and centralized hospital administration.

---

## 1. System Architecture

The platform is structured into three primary subsystems:

```
BreastCare-System/
├── backend/            Node.js and Express REST API (Supabase & Firebase Admin SDK)
├── doctor-app/         React Native (Expo SDK 57) Doctor Tablet Application
├── admin-dashboard/    Next.js 16 (App Router) Clinical Administration Web Portal
├── DEPLOYMENT.md       Production Deployment and Credentials Guide
├── DEMO_ACCOUNTS.md    Verified Demo Doctor and Administrator Credentials
└── DEMO_SETUP.md       End-to-End System Demonstration Walkthrough
```

### Subsystem Responsibilities

1. **Backend API (`backend/`)**:
   - Central REST API built on Express and Node.js.
   - Dual authentication: Live Firebase Admin SDK with fallback token verification.
   - PostgreSQL persistence through Supabase client with row-level role enforcement.
   - Deterministic clinical risk stratification engine based on standardized oncological screening protocols.
   - Automated test suite covering 28 unit and integration test scenarios.

2. **Doctor Tablet Application (`doctor-app/`)**:
   - Cross-platform tablet application built with React Native and Expo SDK 57.
   - Offline-capable clinical questionnaire engine with voice assistance in 6 languages.
   - Integrated camera workflow for patient facial identification.
   - Physician review module allowing assigned clinicians to evaluate patient records, record clinical impressions, and electronically sign off on assessments.
   - Runs across physical Android tablets (via Expo Go), desktop web browsers, and Android emulators.

3. **Admin Dashboard (`admin-dashboard/`)**:
   - Modern hospital administration portal built with Next.js 16 and TypeScript.
   - Centralized registry of doctors, registered tablet devices, and patient cohorts.
   - Real-time clinical assessment monitoring with risk distribution metrics.
   - Full patient electronic medical record inspection, including questionnaire transcripts, risk breakdowns, and physician sign-off status.

---

## 2. Technology Stack

- **Backend Runtime**: Node.js 20+, Express.js, CORS, Morgan
- **Database & Storage**: Supabase (PostgreSQL), Supabase Storage
- **Authentication**: Firebase Admin SDK, Bearer Token RBAC
- **Doctor Application**: React Native 0.86, Expo 57, TypeScript, React Navigation 7, AsyncStorage
- **Admin Portal**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Vanilla CSS
- **Test Framework**: Node.js Native Test Runner (`node --test`)

---

## 3. Clinical Assessment Protocol

The screening protocol executes across sequential clinical phases:

### Phase 0: Baseline Risk Modifier (BRM)
Evaluates demographic and epidemiological risk factors:
- Age stratification (>40 years).
- First-degree family history of breast or ovarian malignancy.
- Parity and breastfeeding duration.
- Prolonged oral contraceptive usage (>5 years).
- Age at menarche and menopausal status.
- Prior breast biopsy or benign proliferative disease.

### Phase 1: Primary Breast Screening
Bilateral clinical symptom inspection:
- Palpable lump or focal thickening.
- Nipple retraction, inversion, or asymmetry.
- Spontaneous nipple discharge (serous or bloody).
- Skin dimpling, peau d'orange, or contour alteration.
- Erythema, eczema, or active ulceration.
- Focal or non-cyclical breast pain.

### Phase 2: Regional Spread Screening
Lymphatic basin assessment:
- Palpable ipsilateral or bilateral axillary lymphadenopathy.
- Supraclavicular or cervical lymph node enlargement.
- Localized arm lymphedema or weakness.

### Phase 3: Systemic and Distant Metastatic Screening
Evaluation of constitutional and organ-specific symptoms:
- Pulmonary: Persistent dry cough, dyspnea, pleuritic chest pain.
- Central Nervous System: Focal motor deficit, persistent new headache, visual disturbance.
- Musculoskeletal: Localized skeletal pain, pathologic fracture risk.
- Abdominal: Right upper quadrant tenderness, unexplained jaundice, hepatomegaly.

### Phase 4: Risk Stratification and Scoring
- **Risk Multipliers**: Weighted coefficients applied to high-risk primary findings.
- **Safety Escalation Overrides**:
  - *Metastatic Pattern Alert*: Concurrent Phase 1 primary findings and Phase 3 systemic symptoms automatically escalate the assessment to Urgent.
  - *Classic Malignancy Triad*: Coexistence of lump, nipple retraction, and skin dimpling triggers immediate tertiary referral.
  - *Ulcerative Lesion Alert*: Open ulceration, erosion, or bleeding prompts expedited oncology review.
- **Risk Tiers**: Low, Moderate, High, Urgent.
- **Output**: Standardized clinical risk summary, triage recommendation, and immediate action steps.

---

## 4. Physician Validation Workflow

All patient assessments progress through a verified clinical lifecycle:

1. **Patient Registration**: Patient profile created with demographic details and optional identification photo.
2. **Assessment Execution**: Clinical questionnaire administered with language and voice support.
3. **Automated Risk Stratification**: Clinical engine computes risk score and tier.
4. **Assessment Submission**: Status transitions to `PENDING_DOCTOR_REVIEW`.
5. **Medical Record Review**: Assigned physician inspects complete questionnaire responses, clinical timeline, and risk factors.
6. **Physician Determination**:
   - **Validate & Sign-Off**: Physician adds clinical impressions, confirms or updates recommendations, and signs off. Status transitions to `DOCTOR_VALIDATED`.
   - **Request Reassessment**: If findings require re-examination, the physician submits a reassessment order with clinical rationale. Status updates to `REASSESSMENT_REQUESTED`.
7. **Administrative Oversight**: Central dashboard reflects validation status, validation timestamp, and supervising physician identity.

---

## 5. Security and Role-Based Access Control

- **Doctor-Patient Isolation**: Strict row-level and middleware authorization ensures doctors can only query, modify, and validate patients assigned to their clinic station. Cross-doctor data access attempts return HTTP 403 Forbidden.
- **Role Separation**: Clear segregation between DOCTOR and ADMIN privileges. Administrative accounts cannot perform clinical sign-offs, and doctor accounts cannot modify platform-wide configurations.
- **Protected Health Information (PHI)**: Patient identification photos are stored in secure Supabase Storage buckets with generated URLs. Raw binary data is never persisted in SQL records.
- **Secret Hygiene**: Environment variables and service credentials (`.env`, `firebase-service-account.json`, cryptographic keys) are isolated from source control.

---

## 6. Multilingual and Voice Assistance Layer

- Integrated Indian language support designed for rural and regional healthcare outreach.
- Configurable via `LANGUAGE_PROVIDER` in `backend/.env`.
- Supported Languages: English, Hindi, Marathi, Bengali, Tamil, Telugu.
- Functional Capabilities:
  - Text-to-Speech (TTS): Reads questions to patients in their primary language.
  - Speech-to-Text (STT): Captures patient vocal affirmative or negative responses.
  - Pipeline Configuration: Defaults to simulation mode (`demo`) for local offline development; switches to Indian National Language Translation Mission (BHASHINI / ULCA) in production without client code changes.

---

## 7. Installation and Local Setup

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher
- Git

### Step 1: Backend Setup

```bash
cd backend
npm install
npm test
npm start
```

- Local Server: `http://localhost:5000`
- Health Endpoint: `http://localhost:5000/api/health`
- All 28 automated integration tests should pass successfully.

### Step 2: Doctor Tablet Application Setup

```bash
cd doctor-app
npm install
npx tsc --noEmit
```

Execution Modes:

- **Web Browser (Desktop Preview)**:
  ```bash
  npm run web
  ```
  Opens at `http://localhost:8081`.

- **Physical Tablet (Expo Go)**:
  ```bash
  npx expo start
  ```
  Open the Expo Go application on the tablet (connected to the same local network) and scan the displayed QR code.

- **Android Virtual Device (Emulator)**:
  ```bash
  npm run android
  ```

### Step 3: Admin Web Dashboard Setup

```bash
cd admin-dashboard
npm install
npm run build
npm run dev
```

- Admin Portal: `http://localhost:3000`

---

## 8. Verification and Quality Gates

| Component | Verification Command | Expected Outcome |
| :--- | :--- | :--- |
| **Backend Integration Tests** | `cd backend && npm test` | 28 passing tests (0 failures) |
| **Doctor App Type Safety** | `cd doctor-app && npx tsc --noEmit` | 0 TypeScript errors |
| **Admin Dashboard Build** | `cd admin-dashboard && npm run build` | 9/9 routes compiled, 0 errors |
| **Backend API Health** | `curl http://localhost:5000/api/health` | HTTP 200 `status: healthy` |

---

## 9. Demo Credentials

| Role | Email | Password | Station ID |
| :--- | :--- | :--- | :--- |
| **Attending Doctor** | `doctor@breastcare.ai` | Any (Demo Mode) | `TABLET-CLINIC-01` |
| **Super Administrator** | `admin@breastcare.ai` | Any (Demo Mode) | Central |

Refer to `DEMO_ACCOUNTS.md` for additional test doctor accounts and station identifiers.
