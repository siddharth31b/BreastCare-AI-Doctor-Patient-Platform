import type { User, UserRole } from "../types";

export interface DistrictMetric {
  name: string;
  clinicians: number;
  patients: number;
  radiologists: number;
  nurses: number;
  livesAffected: number;
  centerName?: string;
}

export interface StateReachData {
  id: string; // e.g., "AP", "AR", "MP", "CG", "MH", "DL", "KA", "TN", "WB"
  name: string;
  clinicians: number;
  patients: number;
  radiologists: number;
  nurses: number;
  fieldWorkers: number;
  admins: number;
  districts: DistrictMetric[];
  activeCenters: string[];
  lastLoginAt?: string;
  lastLoginUser?: string;
  lastLoginRole?: string;
}

export interface ReachSummary {
  totalStates: number;
  totalDistricts: number;
  totalLivesAffected: number;
  totalClinicians: number;
  totalPatients: number;
  totalRadiologists: number;
  totalNurses: number;
  totalLoginsToday: number;
}

export interface LoginEvent {
  id: string;
  userName: string;
  userRole: UserRole | string;
  stateId: string;
  stateName: string;
  district: string;
  centerName: string;
  timestamp: string;
}

const STORAGE_KEY = "breastcare_platform_reach_v1";
const LOGINS_STORAGE_KEY = "breastcare_recent_logins_v1";

// Initial seed data aligned with the reference dashboard screenshot:
// "Reached 2 states, 2 districts — affecting 9 lives"
// State: Andhra Pradesh (1 clinician), Arunachal Pradesh (1 clinician), etc.
const INITIAL_STATES: Record<string, StateReachData> = {
  AP: {
    id: "AP",
    name: "Andhra Pradesh",
    clinicians: 1,
    patients: 5,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["AIIMS Mangalagiri Clinical Center", "Visakhapatnam District Hospital"],
    districts: [
      {
        name: "Guntur",
        clinicians: 1,
        patients: 3,
        radiologists: 1,
        nurses: 1,
        livesAffected: 5,
        centerName: "AIIMS Mangalagiri"
      },
      {
        name: "Visakhapatnam",
        clinicians: 0,
        patients: 2,
        radiologists: 0,
        nurses: 0,
        livesAffected: 4,
        centerName: "Visakhapatnam District Hospital"
      }
    ]
  },
  AR: {
    id: "AR",
    name: "Arunachal Pradesh",
    clinicians: 1,
    patients: 3,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Tomo Riba Institute of Health (TRIHMS)"],
    districts: [
      {
        name: "Papum Pare",
        clinicians: 1,
        patients: 3,
        radiologists: 0,
        nurses: 1,
        livesAffected: 4,
        centerName: "TRIHMS Naharlagun"
      }
    ]
  },
  MP: {
    id: "MP",
    name: "Madhya Pradesh",
    clinicians: 2,
    patients: 18,
    radiologists: 2,
    nurses: 3,
    fieldWorkers: 4,
    admins: 1,
    activeCenters: ["IIT Indore Main Campus Health Centre", "MY Hospital Indore"],
    districts: [
      {
        name: "Indore",
        clinicians: 2,
        patients: 12,
        radiologists: 2,
        nurses: 2,
        livesAffected: 24,
        centerName: "IIT Indore Campus Hospital"
      },
      {
        name: "Ujjain",
        clinicians: 0,
        patients: 6,
        radiologists: 0,
        nurses: 1,
        livesAffected: 10,
        centerName: "Ujjain Civil Hospital"
      }
    ]
  },
  CG: {
    id: "CG",
    name: "Chhattisgarh",
    clinicians: 1,
    patients: 14,
    radiologists: 1,
    nurses: 2,
    fieldWorkers: 3,
    admins: 0,
    activeCenters: ["AIIMS Raipur Regional Oncology Care"],
    districts: [
      {
        name: "Raipur",
        clinicians: 1,
        patients: 14,
        radiologists: 1,
        nurses: 2,
        livesAffected: 22,
        centerName: "AIIMS Raipur"
      }
    ]
  },
  MH: {
    id: "MH",
    name: "Maharashtra",
    clinicians: 2,
    patients: 21,
    radiologists: 2,
    nurses: 4,
    fieldWorkers: 2,
    admins: 1,
    activeCenters: ["Tata Memorial Hospital Mumbai", "Pune District Research Unit"],
    districts: [
      {
        name: "Mumbai",
        clinicians: 1,
        patients: 15,
        radiologists: 1,
        nurses: 3,
        livesAffected: 28,
        centerName: "Tata Memorial Centre"
      },
      {
        name: "Pune",
        clinicians: 1,
        patients: 6,
        radiologists: 1,
        nurses: 1,
        livesAffected: 12,
        centerName: "Pune Oncology Research Desk"
      }
    ]
  },
  DL: {
    id: "DL",
    name: "Delhi",
    clinicians: 2,
    patients: 16,
    radiologists: 1,
    nurses: 2,
    fieldWorkers: 1,
    admins: 1,
    activeCenters: ["AIIMS New Delhi", "Safdarjung Hospital"],
    districts: [
      {
        name: "South Delhi",
        clinicians: 2,
        patients: 16,
        radiologists: 1,
        nurses: 2,
        livesAffected: 25,
        centerName: "AIIMS New Delhi"
      }
    ]
  },
  KA: {
    id: "KA",
    name: "Karnataka",
    clinicians: 1,
    patients: 9,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 2,
    admins: 0,
    activeCenters: ["Kidwai Memorial Institute of Oncology, Bengaluru"],
    districts: [
      {
        name: "Bengaluru Urban",
        clinicians: 1,
        patients: 9,
        radiologists: 1,
        nurses: 1,
        livesAffected: 18,
        centerName: "Kidwai Memorial Institute"
      }
    ]
  },
  TN: {
    id: "TN",
    name: "Tamil Nadu",
    clinicians: 1,
    patients: 8,
    radiologists: 1,
    nurses: 2,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Cancer Institute (WIA) Adyar, Chennai"],
    districts: [
      {
        name: "Chennai",
        clinicians: 1,
        patients: 8,
        radiologists: 1,
        nurses: 2,
        livesAffected: 15,
        centerName: "Adyar Cancer Institute"
      }
    ]
  },
  WB: {
    id: "WB",
    name: "West Bengal",
    clinicians: 1,
    patients: 7,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Chittaranjan National Cancer Institute (CNCI), Kolkata"],
    districts: [
      {
        name: "Kolkata",
        clinicians: 1,
        patients: 7,
        radiologists: 1,
        nurses: 1,
        livesAffected: 14,
        centerName: "CNCI Kolkata"
      }
    ]
  },
  GJ: {
    id: "GJ",
    name: "Gujarat",
    clinicians: 1,
    patients: 6,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Gujarat Cancer & Research Institute, Ahmedabad"],
    districts: [
      {
        name: "Ahmedabad",
        clinicians: 1,
        patients: 6,
        radiologists: 1,
        nurses: 1,
        livesAffected: 11,
        centerName: "GCRI Ahmedabad"
      }
    ]
  },
  TS: {
    id: "TS",
    name: "Telangana",
    clinicians: 1,
    patients: 5,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["MNJ Institute of Oncology & Regional Cancer Centre, Hyderabad"],
    districts: [
      {
        name: "Hyderabad",
        clinicians: 1,
        patients: 5,
        radiologists: 1,
        nurses: 1,
        livesAffected: 10,
        centerName: "MNJ Institute of Oncology"
      }
    ]
  },
  KL: {
    id: "KL",
    name: "Kerala",
    clinicians: 1,
    patients: 6,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Regional Cancer Centre (RCC), Thiruvananthapuram"],
    districts: [
      {
        name: "Thiruvananthapuram",
        clinicians: 1,
        patients: 6,
        radiologists: 1,
        nurses: 1,
        livesAffected: 12,
        centerName: "RCC Thiruvananthapuram"
      }
    ]
  },
  UP: {
    id: "UP",
    name: "Uttar Pradesh",
    clinicians: 1,
    patients: 11,
    radiologists: 1,
    nurses: 2,
    fieldWorkers: 3,
    admins: 0,
    activeCenters: ["Sanjay Gandhi PGIMS Lucknow", "KGMU Lucknow"],
    districts: [
      {
        name: "Lucknow",
        clinicians: 1,
        patients: 11,
        radiologists: 1,
        nurses: 2,
        livesAffected: 19,
        centerName: "SGPGIMS Lucknow"
      }
    ]
  },
  BR: {
    id: "BR",
    name: "Bihar",
    clinicians: 1,
    patients: 8,
    radiologists: 0,
    nurses: 2,
    fieldWorkers: 2,
    admins: 0,
    activeCenters: ["AIIMS Patna Regional Unit"],
    districts: [
      {
        name: "Patna",
        clinicians: 1,
        patients: 8,
        radiologists: 0,
        nurses: 2,
        livesAffected: 14,
        centerName: "AIIMS Patna"
      }
    ]
  },
  RJ: {
    id: "RJ",
    name: "Rajasthan",
    clinicians: 1,
    patients: 7,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 2,
    admins: 0,
    activeCenters: ["AIIMS Jodhpur", "SMS Hospital Jaipur"],
    districts: [
      {
        name: "Jodhpur",
        clinicians: 1,
        patients: 7,
        radiologists: 1,
        nurses: 1,
        livesAffected: 13,
        centerName: "AIIMS Jodhpur"
      }
    ]
  },
  OD: {
    id: "OD",
    name: "Odisha",
    clinicians: 1,
    patients: 6,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 2,
    admins: 0,
    activeCenters: ["AIIMS Bhubaneswar"],
    districts: [
      {
        name: "Khurda",
        clinicians: 1,
        patients: 6,
        radiologists: 1,
        nurses: 1,
        livesAffected: 11,
        centerName: "AIIMS Bhubaneswar"
      }
    ]
  },
  AS: {
    id: "AS",
    name: "Assam",
    clinicians: 1,
    patients: 5,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 2,
    admins: 0,
    activeCenters: ["Dr. B. Borooah Cancer Institute, Guwahati"],
    districts: [
      {
        name: "Kamrup Metropolitan",
        clinicians: 1,
        patients: 5,
        radiologists: 1,
        nurses: 1,
        livesAffected: 9,
        centerName: "BBCI Guwahati"
      }
    ]
  },
  PB: {
    id: "PB",
    name: "Punjab",
    clinicians: 1,
    patients: 4,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Homi Bhabha Cancer Hospital, Sangrur / New Chandigarh"],
    districts: [
      {
        name: "Sangrur",
        clinicians: 1,
        patients: 4,
        radiologists: 1,
        nurses: 1,
        livesAffected: 8,
        centerName: "Homi Bhabha Cancer Hospital"
      }
    ]
  },
  HR: {
    id: "HR",
    name: "Haryana",
    clinicians: 1,
    patients: 4,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["National Cancer Institute (AIIMS Jhajjar)"],
    districts: [
      {
        name: "Jhajjar",
        clinicians: 1,
        patients: 4,
        radiologists: 1,
        nurses: 1,
        livesAffected: 8,
        centerName: "NCI AIIMS Jhajjar"
      }
    ]
  },
  JH: {
    id: "JH",
    name: "Jharkhand",
    clinicians: 1,
    patients: 3,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["RIMS Ranchi Medical Oncology"],
    districts: [
      {
        name: "Ranchi",
        clinicians: 1,
        patients: 3,
        radiologists: 0,
        nurses: 1,
        livesAffected: 6,
        centerName: "RIMS Ranchi"
      }
    ]
  },
  UT: {
    id: "UT",
    name: "Uttarakhand",
    clinicians: 1,
    patients: 3,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["AIIMS Rishikesh"],
    districts: [
      {
        name: "Dehradun",
        clinicians: 1,
        patients: 3,
        radiologists: 1,
        nurses: 1,
        livesAffected: 7,
        centerName: "AIIMS Rishikesh"
      }
    ]
  },
  HP: {
    id: "HP",
    name: "Himachal Pradesh",
    clinicians: 1,
    patients: 2,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["AIIMS Bilaspur"],
    districts: [
      {
        name: "Bilaspur",
        clinicians: 1,
        patients: 2,
        radiologists: 0,
        nurses: 1,
        livesAffected: 5,
        centerName: "AIIMS Bilaspur"
      }
    ]
  },
  JK: {
    id: "JK",
    name: "Jammu and Kashmir",
    clinicians: 1,
    patients: 3,
    radiologists: 1,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["SKIMS Srinagar", "AIIMS Jammu"],
    districts: [
      {
        name: "Srinagar",
        clinicians: 1,
        patients: 3,
        radiologists: 1,
        nurses: 1,
        livesAffected: 6,
        centerName: "SKIMS Soura"
      }
    ]
  },
  GA: {
    id: "GA",
    name: "Goa",
    clinicians: 1,
    patients: 2,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 0,
    admins: 0,
    activeCenters: ["Goa Medical College (GMC), Bambolim"],
    districts: [
      {
        name: "North Goa",
        clinicians: 1,
        patients: 2,
        radiologists: 0,
        nurses: 1,
        livesAffected: 4,
        centerName: "GMC Bambolim"
      }
    ]
  },
  TR: {
    id: "TR",
    name: "Tripura",
    clinicians: 1,
    patients: 2,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Regional Cancer Centre, Agartala"],
    districts: [
      {
        name: "West Tripura",
        clinicians: 1,
        patients: 2,
        radiologists: 0,
        nurses: 1,
        livesAffected: 4,
        centerName: "RCC Agartala"
      }
    ]
  },
  MN: {
    id: "MN",
    name: "Manipur",
    clinicians: 1,
    patients: 2,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["RIMS Imphal"],
    districts: [
      {
        name: "Imphal West",
        clinicians: 1,
        patients: 2,
        radiologists: 0,
        nurses: 1,
        livesAffected: 4,
        centerName: "RIMS Imphal"
      }
    ]
  },
  ML: {
    id: "ML",
    name: "Meghalaya",
    clinicians: 1,
    patients: 2,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["NEIGRIHMS Shillong"],
    districts: [
      {
        name: "East Khasi Hills",
        clinicians: 1,
        patients: 2,
        radiologists: 0,
        nurses: 1,
        livesAffected: 4,
        centerName: "NEIGRIHMS Shillong"
      }
    ]
  },
  MZ: {
    id: "MZ",
    name: "Mizoram",
    clinicians: 1,
    patients: 2,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 1,
    admins: 0,
    activeCenters: ["Civil Hospital Aizawl"],
    districts: [
      {
        name: "Aizawl",
        clinicians: 1,
        patients: 2,
        radiologists: 0,
        nurses: 1,
        livesAffected: 3,
        centerName: "Civil Hospital Aizawl"
      }
    ]
  },
  NL: {
    id: "NL",
    name: "Nagaland",
    clinicians: 1,
    patients: 1,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 0,
    admins: 0,
    activeCenters: ["Naga Hospital Authority Kohima"],
    districts: [
      {
        name: "Kohima",
        clinicians: 1,
        patients: 1,
        radiologists: 0,
        nurses: 1,
        livesAffected: 3,
        centerName: "Naga Hospital Kohima"
      }
    ]
  },
  SK: {
    id: "SK",
    name: "Sikkim",
    clinicians: 1,
    patients: 1,
    radiologists: 0,
    nurses: 1,
    fieldWorkers: 0,
    admins: 0,
    activeCenters: ["STNM Hospital Gangtok"],
    districts: [
      {
        name: "East Sikkim",
        clinicians: 1,
        patients: 1,
        radiologists: 0,
        nurses: 1,
        livesAffected: 3,
        centerName: "STNM Hospital"
      }
    ]
  }
};

const INITIAL_LOGINS: LoginEvent[] = [
  {
    id: "log-001",
    userName: "Dr. Sarah Iyer",
    userRole: "DOCTOR",
    stateId: "MP",
    stateName: "Madhya Pradesh",
    district: "Indore",
    centerName: "IIT Indore Main Campus Hospital",
    timestamp: "Just now"
  },
  {
    id: "log-002",
    userName: "Dr. K. S. Rao",
    userRole: "DOCTOR",
    stateId: "AP",
    stateName: "Andhra Pradesh",
    district: "Guntur",
    centerName: "AIIMS Mangalagiri",
    timestamp: "2 mins ago"
  },
  {
    id: "log-003",
    userName: "Meera Sharma",
    userRole: "PATIENT",
    stateId: "CG",
    stateName: "Chhattisgarh",
    district: "Raipur",
    centerName: "AIIMS Raipur Oncology Unit",
    timestamp: "5 mins ago"
  },
  {
    id: "log-004",
    userName: "Dr. Rajesh Kumar",
    userRole: "RADIOLOGIST",
    stateId: "MH",
    stateName: "Maharashtra",
    district: "Mumbai",
    centerName: "Tata Memorial Centre",
    timestamp: "12 mins ago"
  },
  {
    id: "log-005",
    userName: "Dr. T. Jamoh",
    userRole: "DOCTOR",
    stateId: "AR",
    stateName: "Arunachal Pradesh",
    district: "Papum Pare",
    centerName: "TRIHMS Naharlagun",
    timestamp: "28 mins ago"
  }
];

export class PlatformReachService {
  private static statesCache: Record<string, StateReachData> | null = null;
  private static loginsCache: LoginEvent[] | null = null;
  private static channel: BroadcastChannel | null = null;

  private static getChannel(): BroadcastChannel | null {
    if (typeof window === "undefined") return null;
    if (!this.channel) {
      try {
        this.channel = new BroadcastChannel("breastcare_platform_reach_channel");
      } catch {
        // Fallback for environments where BroadcastChannel is unavailable
      }
    }
    return this.channel;
  }

  static getStates(): Record<string, StateReachData> {
    if (this.statesCache) return this.statesCache;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          this.statesCache = JSON.parse(stored);
          return this.statesCache!;
        } catch (e) {
          console.error("Error reading stored reach states", e);
        }
      }
    }

    this.statesCache = { ...INITIAL_STATES };
    return this.statesCache;
  }

  static getRecentLogins(): LoginEvent[] {
    if (this.loginsCache) return this.loginsCache;

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOGINS_STORAGE_KEY);
      if (stored) {
        try {
          this.loginsCache = JSON.parse(stored);
          return this.loginsCache!;
        } catch (e) {
          console.error("Error reading stored logins", e);
        }
      }
    }

    this.loginsCache = [...INITIAL_LOGINS];
    return this.loginsCache;
  }

  private static saveStates(states: Record<string, StateReachData>) {
    this.statesCache = states;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
        window.dispatchEvent(new CustomEvent("platform-reach-updated", { detail: { states } }));
        const ch = this.getChannel();
        if (ch) ch.postMessage({ type: "reach-updated" });
      } catch (e) {
        console.error("Failed to persist reach states", e);
      }
    }
  }

  private static saveLogins(logins: LoginEvent[]) {
    this.loginsCache = logins;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(LOGINS_STORAGE_KEY, JSON.stringify(logins.slice(0, 30)));
        window.dispatchEvent(new CustomEvent("platform-logins-updated", { detail: { logins } }));
      } catch (e) {
        console.error("Failed to persist logins", e);
      }
    }
  }

  /**
   * Determine state mapping for user based on hospital or institution info
   */
  static inferUserState(user: User | Partial<User>): { stateId: string; district: string; centerName: string } {
    const inst = (user.institution || "").toLowerCase();
    const hosp = (user.hospitalName || "").toLowerCase();
    const text = `${inst} ${hosp}`;

    if (text.includes("mangalagiri") || text.includes("andhra") || text.includes("visakhapatnam")) {
      return { stateId: "AP", district: "Guntur", centerName: "AIIMS Mangalagiri" };
    }
    if (text.includes("raipur") || text.includes("chhattisgarh")) {
      return { stateId: "CG", district: "Raipur", centerName: "AIIMS Raipur" };
    }
    if (text.includes("arunachal") || text.includes("trihms") || text.includes("naharlagun")) {
      return { stateId: "AR", district: "Papum Pare", centerName: "TRIHMS Naharlagun" };
    }
    if (text.includes("tata") || text.includes("mumbai") || text.includes("pune") || text.includes("maharashtra")) {
      return { stateId: "MH", district: "Mumbai", centerName: "Tata Memorial Centre" };
    }
    if (text.includes("delhi") || text.includes("safdarjung")) {
      return { stateId: "DL", district: "South Delhi", centerName: "AIIMS New Delhi" };
    }
    if (text.includes("bengaluru") || text.includes("karnataka") || text.includes("kidwai")) {
      return { stateId: "KA", district: "Bengaluru Urban", centerName: "Kidwai Memorial Institute" };
    }

    // Default to Madhya Pradesh (IIT Indore HQ)
    return {
      stateId: "MP",
      district: "Indore",
      centerName: user.hospitalName || user.institution || "IIT Indore Health Care Unit"
    };
  }

  /**
   * Record a user login and update state and aggregate metrics in real-time
   */
  static recordUserLogin(user: User, overrideStateId?: string): LoginEvent {
    const states = { ...this.getStates() };
    const inferred = this.inferUserState(user);
    const stateId = overrideStateId || inferred.stateId;

    let state = states[stateId];
    if (!state) {
      // Create record if state doesn't exist
      state = {
        id: stateId,
        name: stateId,
        clinicians: 0,
        patients: 0,
        radiologists: 0,
        nurses: 0,
        fieldWorkers: 0,
        admins: 0,
        districts: [],
        activeCenters: [inferred.centerName]
      };
      states[stateId] = state;
    }

    // Increment corresponding role metric
    switch (user.role) {
      case "DOCTOR":
        state.clinicians = (state.clinicians || 0) + 1;
        break;
      case "PATIENT":
        state.patients = (state.patients || 0) + 1;
        break;
      case "RADIOLOGIST":
        state.radiologists = (state.radiologists || 0) + 1;
        break;
      case "BREAST_CARE_NURSE":
        state.nurses = (state.nurses || 0) + 1;
        break;
      case "COMMUNITY_HEALTH_WORKER":
        state.fieldWorkers = (state.fieldWorkers || 0) + 1;
        break;
      case "HOSPITAL_ADMIN":
      case "SUPER_ADMIN":
        state.admins = (state.admins || 0) + 1;
        break;
      default:
        state.clinicians = (state.clinicians || 0) + 1;
    }

    state.lastLoginAt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    state.lastLoginUser = user.name;
    state.lastLoginRole = user.role;

    // Check district
    const existingDistrict = state.districts.find(d => d.name.toLowerCase() === inferred.district.toLowerCase());
    if (existingDistrict) {
      if (user.role === "DOCTOR") existingDistrict.clinicians += 1;
      else if (user.role === "PATIENT") existingDistrict.patients += 1;
      else existingDistrict.clinicians += 1;
      existingDistrict.livesAffected += user.role === "PATIENT" ? 1 : 2;
    } else {
      state.districts.push({
        name: inferred.district,
        clinicians: user.role === "DOCTOR" ? 1 : 0,
        patients: user.role === "PATIENT" ? 1 : 0,
        radiologists: user.role === "RADIOLOGIST" ? 1 : 0,
        nurses: user.role === "BREAST_CARE_NURSE" ? 1 : 0,
        livesAffected: user.role === "PATIENT" ? 2 : 4,
        centerName: inferred.centerName
      });
    }

    this.saveStates(states);

    // Record login event
    const newEvent: LoginEvent = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userName: user.name,
      userRole: user.role,
      stateId,
      stateName: state.name,
      district: inferred.district,
      centerName: inferred.centerName,
      timestamp: "Just now"
    };

    const currentLogins = this.getRecentLogins();
    this.saveLogins([newEvent, ...currentLogins]);

    return newEvent;
  }

  /**
   * Calculate summary figures
   */
  static getSummaryMetrics(activeStatesOnly: boolean = false): ReachSummary {
    const states = Object.values(this.getStates());
    
    // States that have at least 1 user logged in or active
    const activeStates = states.filter(s => 
      (s.clinicians + s.patients + s.radiologists + s.nurses + s.fieldWorkers + s.admins) > 0
    );

    const targetStates = activeStatesOnly ? activeStates : states;

    let totalDistricts = 0;
    let totalLivesAffected = 0;
    let totalClinicians = 0;
    let totalPatients = 0;
    let totalRadiologists = 0;
    let totalNurses = 0;

    targetStates.forEach(s => {
      totalClinicians += s.clinicians;
      totalPatients += s.patients;
      totalRadiologists += s.radiologists;
      totalNurses += s.nurses;
      totalDistricts += s.districts.length > 0 ? s.districts.length : 1;
      
      const districtLives = s.districts.reduce((acc, d) => acc + d.livesAffected, 0);
      totalLivesAffected += districtLives > 0 ? districtLives : (s.patients * 2 + s.clinicians * 4);
    });

    return {
      totalStates: activeStates.length,
      totalDistricts,
      totalLivesAffected,
      totalClinicians,
      totalPatients,
      totalRadiologists,
      totalNurses,
      totalLoginsToday: this.getRecentLogins().length + 14
    };
  }

  /**
   * Reset data to initial demo state matching the reference screenshot
   */
  static resetToInitialScreenshotBaseline() {
    this.saveStates({ ...INITIAL_STATES });
    this.saveLogins([...INITIAL_LOGINS]);
  }
}
