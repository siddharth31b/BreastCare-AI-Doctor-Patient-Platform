import { describe, expect, it } from "vitest";
import type { PatientReport } from "../types/questionnaire";
import { mergeReports } from "./report.service";

describe("mergeReports", () => {
  it("merges database studies with local mock reports without duplicates", () => {
    const localReports: PatientReport[] = [
      {
        id: "local-report",
        patientId: "demo-patient",
        title: "Mock report",
        category: "Other",
        uploadedAt: "01 Jan",
        validationStatus: "Uploaded",
        source: "Mock",
        downloadable: true,
        shareable: true,
        date: "01 Jan",
        status: "Uploaded",
        type: "clinical_note",
      },
    ];

    const studies = [
      {
        id: "study-1",
        patientId: "demo-patient",
        studyType: "Uploaded Report",
        createdAt: "2026-01-02T00:00:00.000Z",
        dicomUrl: "/uploads/reports/test.pdf",
        status: "QUEUED",
      },
    ];

    const merged = mergeReports(localReports, studies, "demo-patient");

    expect(merged).toHaveLength(2);
    expect(merged.find(report => report.id === "study-1")?.documentUrl).toBe("/uploads/reports/test.pdf");
    expect(merged.find(report => report.id === "study-1")?.title).toBe("Uploaded Report");
  });
});
