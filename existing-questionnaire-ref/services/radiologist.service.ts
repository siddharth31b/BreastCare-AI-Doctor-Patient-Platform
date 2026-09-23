export interface RadiologyStudy {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  gender?: string;
  imagingType: "Mammogram (FFDM)" | "Digital Breast Tomosynthesis (3D)" | "Breast Ultrasound" | "Breast MRI";
  side: "Left" | "Right" | "Bilateral";
  uploadDate: string;
  uploadTime: string;
  priority: "URGENT" | "ROUTINE" | "STAT";
  status: "Pending" | "In Review" | "Reviewed" | "Draft" | "Repeat Requested";
  aiStatus: string;
  aiConfidence: number;
  aiFindingRegion: string;
  aiHeatmapAvailable: boolean;
  symptoms: string;
  medicalHistory: string;
  imageUrl: string;
  aiOverlayUrl: string;
  birads: "0" | "1" | "2" | "3" | "4A" | "4B" | "4C" | "5" | "6" | null;
  findingType: "Mass" | "Calcification" | "Architectural Distortion" | "Asymmetry" | "No Suspicious Finding" | null;
  clockPosition: string | null;
  quadrant: "Upper Outer" | "Upper Inner" | "Lower Outer" | "Lower Inner" | "Behind Nipple" | "Underarm" | null;
  sizeMm: number | null;
  margins: "Circumscribed" | "Indistinct" | "Spiculated" | "Microlobulated" | "Obscured" | null;
  density: "Fat-containing" | "Low density" | "Equal density" | "High density" | null;
  associatedFindings: string[];
  impression: string | null;
  recommendations: string | null;
  repeatRequired: boolean;
  repeatReason: string | null;
  submittedAt: string | null;
  assignedDoctor: string;
}

export interface RadiologyReportItem {
  id: string;
  studyId: string;
  patientName: string;
  patientId: string;
  imagingType: string;
  studyDate: string;
  birads: string;
  status: "Draft" | "Submitted" | "Returned";
  submittedAt: string;
  radiologistName: string;
  assignedDoctor: string;
  confidence: number;
  thumbnailUrl?: string;
}

export interface RegisteredPatient {
  id: string;
  name: string;
  age: number;
  gender: string;
  assignedDoctor: string;
}

const REGISTERED_PATIENTS: RegisteredPatient[] = [
  { id: "MS-9281", name: "Meera Sharma", age: 34, gender: "Female", assignedDoctor: "Dr. Sarah Iyer" },
  { id: "PAT-1082", name: "Meera Sharma", age: 34, gender: "Female", assignedDoctor: "Dr. Sarah Iyer" },
  { id: "BC-1002", name: "Sunita Deshmukh", age: 42, gender: "Female", assignedDoctor: "Dr. Sarah Iyer" },
  { id: "BC-1004", name: "Ananya Sharma", age: 38, gender: "Female", assignedDoctor: "Dr. Sarah Iyer" },
  { id: "BC-1008", name: "Priya Patel", age: 51, gender: "Female", assignedDoctor: "Dr. Alok Mehta" },
  { id: "BC-1011", name: "Meena Kulkarni", age: 46, gender: "Female", assignedDoctor: "Dr. Sarah Iyer" },
  { id: "BC-1015", name: "Kavita Rao", age: 49, gender: "Female", assignedDoctor: "Dr. Sarah Iyer" },
  { id: "BC-1020", name: "Aarti Verma", age: 54, gender: "Female", assignedDoctor: "Dr. Alok Mehta" },
  { id: "PAT-1083", name: "Sneha Kulkarni", age: 41, gender: "Female", assignedDoctor: "Dr. Sarah Iyer" },
];

const SEED_STUDIES: RadiologyStudy[] = [
  {
    id: "ST-9081",
    patientId: "BC-1002",
    patientName: "Sunita Deshmukh",
    patientAge: 42,
    gender: "Female",
    imagingType: "Mammogram (FFDM)",
    side: "Left",
    uploadDate: "2026-07-24",
    uploadTime: "09:15 AM",
    priority: "URGENT",
    status: "Pending",
    aiStatus: "Analyzed (94.2% confidence)",
    aiConfidence: 94.2,
    aiFindingRegion: "Upper Outer Quadrant - 2 o'clock",
    aiHeatmapAvailable: true,
    symptoms: "Painless firm lump in upper outer left breast (3 weeks duration). No skin dimpling.",
    medicalHistory: "Diabetes Type 2 (Metformin 500mg); Maternal Aunt breast cancer at 48.",
    imageUrl: "/dicom-mammogram-sample.png",
    aiOverlayUrl: "/dicom-mammogram-overlay.png",
    birads: null,
    findingType: "Mass",
    clockPosition: "2 o'clock",
    quadrant: "Upper Outer",
    sizeMm: 18,
    margins: "Indistinct",
    density: "High density",
    associatedFindings: ["Architectural Distortion"],
    impression: null,
    recommendations: null,
    repeatRequired: false,
    repeatReason: null,
    submittedAt: null,
    assignedDoctor: "Dr. Sarah Iyer",
  },
  {
    id: "ST-9082",
    patientId: "BC-1004",
    patientName: "Ananya Sharma",
    patientAge: 38,
    gender: "Female",
    imagingType: "Breast Ultrasound",
    side: "Right",
    uploadDate: "2026-07-24",
    uploadTime: "10:30 AM",
    priority: "ROUTINE",
    status: "Pending",
    aiStatus: "Analyzed (88.7% confidence)",
    aiConfidence: 88.7,
    aiFindingRegion: "Lower Inner Quadrant - 7 o'clock",
    aiHeatmapAvailable: true,
    symptoms: "Cyclic tenderness in right breast. No palpable mass noted.",
    medicalHistory: "Hypothyroidism (Thyronorm 50mcg). No family cancer history.",
    imageUrl: "/dicom-ultrasound-sample.png",
    aiOverlayUrl: "/dicom-ultrasound-overlay.png",
    birads: null,
    findingType: "No Suspicious Finding",
    clockPosition: "7 o'clock",
    quadrant: "Lower Inner",
    sizeMm: null,
    margins: "Circumscribed",
    density: "Low density",
    associatedFindings: [],
    impression: null,
    recommendations: null,
    repeatRequired: false,
    repeatReason: null,
    submittedAt: null,
    assignedDoctor: "Dr. Sarah Iyer",
  },
  {
    id: "ST-9079",
    patientId: "BC-1008",
    patientName: "Priya Patel",
    patientAge: 51,
    gender: "Female",
    imagingType: "Digital Breast Tomosynthesis (3D)",
    side: "Bilateral",
    uploadDate: "2026-07-24",
    uploadTime: "08:45 AM",
    priority: "URGENT",
    status: "Pending",
    aiStatus: "Analyzed (96.1% confidence)",
    aiConfidence: 96.1,
    aiFindingRegion: "Upper Outer Quadrant - 10 o'clock (Right)",
    aiHeatmapAvailable: true,
    symptoms: "Routine annual screening scan. Asymmetric density reported on prior mammogram.",
    medicalHistory: "Post-menopausal; HRT use for 2 years. Mother diagnosed with breast cancer at 55.",
    imageUrl: "/dicom-tomo-sample.png",
    aiOverlayUrl: "/dicom-tomo-overlay.png",
    birads: null,
    findingType: "Calcification",
    clockPosition: "10 o'clock",
    quadrant: "Upper Outer",
    sizeMm: 12,
    margins: "Microlobulated",
    density: "High density",
    associatedFindings: ["Skin thickening"],
    impression: null,
    recommendations: null,
    repeatRequired: false,
    repeatReason: null,
    submittedAt: null,
    assignedDoctor: "Dr. Alok Mehta",
  },
  {
    id: "ST-9075",
    patientId: "BC-1011",
    patientName: "Meena Kulkarni",
    patientAge: 46,
    gender: "Female",
    imagingType: "Mammogram (FFDM)",
    side: "Left",
    uploadDate: "2026-07-23",
    uploadTime: "04:20 PM",
    priority: "ROUTINE",
    status: "Reviewed",
    aiStatus: "Analysis Complete",
    aiConfidence: 91.0,
    aiFindingRegion: "Behind Nipple",
    aiHeatmapAvailable: true,
    symptoms: "Serous nipple discharge from left breast.",
    medicalHistory: "Hypertension (Amlodipine 5mg). No prior breast surgery.",
    imageUrl: "/dicom-mammogram-sample.png",
    aiOverlayUrl: "/dicom-mammogram-overlay.png",
    birads: "2",
    findingType: "No Suspicious Finding",
    clockPosition: "12 o'clock",
    quadrant: "Behind Nipple",
    sizeMm: null,
    margins: "Circumscribed",
    density: "Equal density",
    associatedFindings: ["Nipple retraction"],
    impression: "Benign retroareolar duct ectasia. No suspicious malignant feature observed.",
    recommendations: "Routine annual screening mammogram in 12 months.",
    repeatRequired: false,
    repeatReason: null,
    submittedAt: "2026-07-23 05:10 PM",
    assignedDoctor: "Dr. Sarah Iyer",
  },
  {
    id: "ST-9060",
    patientId: "BC-1015",
    patientName: "Kavita Rao",
    patientAge: 49,
    gender: "Female",
    imagingType: "Mammogram (FFDM)",
    side: "Right",
    uploadDate: "2026-07-22",
    uploadTime: "02:10 PM",
    priority: "STAT",
    status: "Repeat Requested",
    aiStatus: "Blurry / Motion Artifact",
    aiConfidence: 45.0,
    aiFindingRegion: "Image Quality Suboptimal",
    aiHeatmapAvailable: false,
    symptoms: "Post-procedure follow-up following core biopsy.",
    medicalHistory: "Prior benign fibroadenoma excision in 2021.",
    imageUrl: "/dicom-mammogram-sample.png",
    aiOverlayUrl: "/dicom-mammogram-overlay.png",
    birads: "0",
    findingType: null,
    clockPosition: null,
    quadrant: null,
    sizeMm: null,
    margins: null,
    density: null,
    associatedFindings: [],
    impression: "Image quality insufficient due to motion blur and compression artifact.",
    recommendations: "Repeat CC and MLO views of right breast required.",
    repeatRequired: true,
    repeatReason: "Patient motion artifact obscuring upper outer quadrant.",
    submittedAt: "2026-07-22 03:00 PM",
    assignedDoctor: "Dr. Sarah Iyer",
  },
];

let studiesStore: RadiologyStudy[] = [...SEED_STUDIES];

const notifyUpdate = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("radiologist-studies-updated"));
  }
};

export const RadiologistService = {
  getStudies: (): RadiologyStudy[] => {
    return studiesStore;
  },

  getStudyById: (id: string): RadiologyStudy | undefined => {
    return studiesStore.find((s) => s.id === id);
  },

  searchPatients: (query: string): RegisteredPatient[] => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return REGISTERED_PATIENTS.filter(
      (p) => p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    );
  },

  uploadStudy: (params: {
    patientId: string;
    patientName: string;
    patientAge: number;
    gender: string;
    assignedDoctor: string;
    imagingType: "Mammogram (FFDM)" | "Digital Breast Tomosynthesis (3D)" | "Breast Ultrasound" | "Breast MRI";
    side: "Left" | "Right" | "Bilateral";
    priority: "URGENT" | "ROUTINE" | "STAT";
    fileName?: string;
  }): RadiologyStudy => {
    const newId = `ST-${Math.floor(9090 + Math.random() * 890)}`;
    const now = new Date();
    const uploadDate = now.toISOString().split("T")[0];
    const uploadTime = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newStudy: RadiologyStudy = {
      id: newId,
      patientId: params.patientId,
      patientName: params.patientName,
      patientAge: params.patientAge,
      gender: params.gender || "Female",
      imagingType: params.imagingType,
      side: params.side,
      uploadDate,
      uploadTime,
      priority: params.priority,
      status: "Pending",
      aiStatus: "AI Processing",
      aiConfidence: 0,
      aiFindingRegion: "Running Deep Learning Detection Pipeline...",
      aiHeatmapAvailable: false,
      symptoms: "Fresh imaging study uploaded via PACS desk. Preliminary review pending.",
      medicalHistory: "Registered in clinical system. Referred by " + params.assignedDoctor,
      imageUrl: "/dicom-mammogram-sample.png",
      aiOverlayUrl: "/dicom-mammogram-overlay.png",
      birads: null,
      findingType: null,
      clockPosition: null,
      quadrant: null,
      sizeMm: null,
      margins: null,
      density: null,
      associatedFindings: [],
      impression: null,
      recommendations: null,
      repeatRequired: false,
      repeatReason: null,
      submittedAt: null,
      assignedDoctor: params.assignedDoctor,
    };

    studiesStore = [newStudy, ...studiesStore];
    notifyUpdate();

    // Background AI analysis simulation
    setTimeout(() => {
      const idx = studiesStore.findIndex((s) => s.id === newId);
      if (idx !== -1) {
        studiesStore[idx] = {
          ...studiesStore[idx],
          aiStatus: "AI Completed (95.8% confidence)",
          aiConfidence: 95.8,
          aiFindingRegion: "Upper Outer Quadrant - Suspicious region annotated",
          aiHeatmapAvailable: true,
        };
        notifyUpdate();
      }
    }, 1500);

    return newStudy;
  },

  saveDraft: (studyId: string, partial: Partial<RadiologyStudy>): RadiologyStudy => {
    const idx = studiesStore.findIndex((s) => s.id === studyId);
    if (idx !== -1) {
      studiesStore[idx] = {
        ...studiesStore[idx],
        ...partial,
        status: "Draft",
      };
      notifyUpdate();
      return studiesStore[idx];
    }
    throw new Error("Study not found");
  },

  submitReport: (studyId: string, finalData: Partial<RadiologyStudy>): RadiologyStudy => {
    const idx = studiesStore.findIndex((s) => s.id === studyId);
    if (idx !== -1) {
      const now = new Date();
      const formattedTime = `${now.toISOString().split("T")[0]} ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      studiesStore[idx] = {
        ...studiesStore[idx],
        ...finalData,
        status: finalData.repeatRequired ? "Repeat Requested" : "Reviewed",
        submittedAt: formattedTime,
      };
      notifyUpdate();
      return studiesStore[idx];
    }
    throw new Error("Study not found");
  },

  getReports: (): RadiologyReportItem[] => {
    return studiesStore
      .filter((s) => s.status === "Reviewed" || s.status === "Draft" || s.status === "Repeat Requested")
      .map((s) => ({
        id: `REP-${s.id}`,
        studyId: s.id,
        patientName: s.patientName,
        patientId: s.patientId,
        imagingType: s.imagingType,
        studyDate: s.uploadDate,
        birads: s.birads || "0",
        status: s.status === "Draft" ? "Draft" : s.status === "Repeat Requested" ? "Returned" : "Submitted",
        submittedAt: s.submittedAt || "In Progress",
        radiologistName: "Dr. Rajesh Kumar",
        assignedDoctor: s.assignedDoctor,
        confidence: s.aiConfidence || 94.0,
      }));
  },
};
