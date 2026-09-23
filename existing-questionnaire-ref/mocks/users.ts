import type { User } from "../types";

export interface DemoUser extends User {
  passwordHash: string;
}

export const DEMO_PASSWORD = "Demo@123";

export const DEMO_USERS: DemoUser[] = [
  {
    id: "demo-patient",
    name: "Meera Sharma",
    email: "patient@demo.breastcare.ai",
    role: "PATIENT",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Meera+Sharma&backgroundColor=005f56",
    institution: "IIT Indore Clinical Research Portal",
    passwordHash: DEMO_PASSWORD
  },
  {
    id: "demo-doctor",
    name: "Dr. Sarah Iyer",
    email: "doctor@demo.breastcare.ai",
    role: "DOCTOR",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Sarah+Iyer&backgroundColor=005f56",
    institution: "IIT Indore Research Hospital",
    hospitalName: "IIT Indore Main Campus Hospital",
    passwordHash: DEMO_PASSWORD
  },
  {
    id: "demo-radiologist",
    name: "Dr. Rajesh Kumar",
    email: "radiologist@demo.breastcare.ai",
    role: "RADIOLOGIST",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Rajesh+Kumar&backgroundColor=005f56",
    institution: "IIT Indore Imaging Lab",
    hospitalName: "IIT Indore Main Campus Hospital",
    passwordHash: DEMO_PASSWORD
  },
  {
    id: "demo-hospital",
    name: "Amit Patel",
    email: "hospital@demo.breastcare.ai",
    role: "HOSPITAL_ADMIN",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Amit+Patel&backgroundColor=005f56",
    institution: "IIT Indore Administration Office",
    hospitalName: "IIT Indore Main Campus Hospital",
    passwordHash: DEMO_PASSWORD
  },
  {
    id: "demo-researcher",
    name: "Dr. Sunita Sharma",
    email: "researcher@demo.breastcare.ai",
    role: "RESEARCHER",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Sunita+Sharma&backgroundColor=005f56",
    institution: "Drishti CPS Research Hub",
    passwordHash: DEMO_PASSWORD
  },
  {
    id: "demo-fieldworker",
    name: "Pooja Devi",
    email: "fieldworker@demo.breastcare.ai",
    role: "COMMUNITY_HEALTH_WORKER",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Pooja+Devi&backgroundColor=005f56",
    institution: "Drishti CPS Field Outreach",
    passwordHash: DEMO_PASSWORD
  },
  {
    id: "demo-nurse",
    name: "Sister Lakshmi",
    email: "nurse@demo.breastcare.ai",
    role: "BREAST_CARE_NURSE",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Lakshmi&backgroundColor=005f56",
    institution: "IIT Indore Clinical Nursing Desk",
    hospitalName: "IIT Indore Main Campus Hospital",
    passwordHash: DEMO_PASSWORD
  },
  {
    id: "demo-admin",
    name: "Super Admin",
    email: "admin@demo.breastcare.ai",
    role: "SUPER_ADMIN",
    avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=005f56",
    institution: "NariSetu AI System Admin",
    passwordHash: DEMO_PASSWORD
  }
];
