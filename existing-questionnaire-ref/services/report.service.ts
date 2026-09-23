import type { PatientReport } from "../types/questionnaire";

interface DiagnosticStudyLike {
  id: string;
  patientId?: string;
  studyType?: string;
  createdAt?: string | Date;
  dicomUrl?: string | null;
  status?: string | null;
}

export function mergeReports(
  localReports: PatientReport[] = [],
  studies: DiagnosticStudyLike[] = [],
  patientId: string,
): PatientReport[] {
  const normalizedLocal = localReports.filter((report) => report.patientId === patientId);

  const databaseReports: PatientReport[] = studies
    .filter((study) => study.patientId === patientId || !study.patientId)
    .map((study, index) => ({
      id: study.id || `study-${index}`,
      patientId,
      title: study.studyType || "Uploaded Report",
      category: "Other",
      uploadedAt: study.createdAt ? new Date(study.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recently uploaded",
      validationStatus: study.status === "COMPLETED" ? "Validated" : "Uploaded",
      source: "Patient Upload",
      documentUrl: study.dicomUrl || undefined,
      downloadable: Boolean(study.dicomUrl),
      shareable: Boolean(study.dicomUrl),
      date: study.createdAt ? new Date(study.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "Recently uploaded",
      status: study.status || "Uploaded",
      type: "clinical_note",
    }));

  return [...databaseReports, ...normalizedLocal];
}
