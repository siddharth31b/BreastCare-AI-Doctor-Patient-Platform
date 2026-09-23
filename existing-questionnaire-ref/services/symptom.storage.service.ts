import { getQuestions, type RiskProfileData } from "./symptom.service";

const STORAGE_KEY = "breastcare_ai_symptom_responses";

export type StoredResponse = {
  id: string;
  timestamp: string;
  answers: Record<string, "Yes" | "No">;
  riskProfile?: RiskProfileData;
  brmScore?: number;
  symptomScore?: number;
  totalScore?: number;
  riskTier?: "Low" | "Moderate" | "High" | "Urgent";
  overrideTriggered?: string | null;
};

export const saveSymptomResponse = (response: StoredResponse) => {
  const existing = loadSymptomResponses();
  existing.push(response);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
};

export const loadSymptomResponses = (): StoredResponse[] => {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StoredResponse[];
  } catch (e) {
    console.warn("Unable to parse stored symptom responses", e);
    return [];
  }
};

export const clearSymptomResponses = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export const exportSymptomResponsesCsv = (responses: StoredResponse[]) => {
  const questions = getQuestions();
  const metaHeaders = [
    "id",
    "timestamp",
    "total_score",
    "tier",
    "escalation_override",
    "brm_score",
    "symptom_score",
    "age",
    "age_at_marriage",
    "age_at_first_child",
    "number_of_children",
    "breastfeeding",
    "contraceptives",
    "family_history",
    "smoking",
    "diet"
  ];
  const symptomHeaders = questions.flatMap(c => c.options.map(o => o.converted_name));
  const headers = [...metaHeaders, ...symptomHeaders];

  const rows = responses.map(resp => {
    const values = headers.map(header => {
      if (header === "id") return resp.id;
      if (header === "timestamp") return resp.timestamp;
      if (header === "total_score") return resp.totalScore ?? "";
      if (header === "tier") return resp.riskTier ?? "";
      if (header === "escalation_override") return resp.overrideTriggered || "None";
      if (header === "brm_score") return resp.brmScore ?? 0;
      if (header === "symptom_score") return resp.symptomScore ?? 0;
      if (header === "age") return resp.riskProfile?.age || "";
      if (header === "age_at_marriage") return resp.riskProfile?.ageAtMarriage || "";
      if (header === "age_at_first_child") return resp.riskProfile?.ageAtFirstChild || "";
      if (header === "number_of_children") return resp.riskProfile?.numberOfChildren || "";
      if (header === "breastfeeding") return resp.riskProfile?.breastfeeding || "";
      if (header === "contraceptives") return resp.riskProfile?.contraceptives || "";
      if (header === "family_history") return resp.riskProfile?.familyHistory || "";
      if (header === "smoking") return resp.riskProfile?.smoking || "";
      if (header === "diet") return resp.riskProfile?.diet || "";
      return resp.answers[header] || "No";
    });
    return values.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  return [headers.join(","), ...rows].join("\n");
};
