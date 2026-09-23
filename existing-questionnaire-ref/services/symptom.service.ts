import questions from "../mocks/symptoms_questions.json";
import responses from "../mocks/symptom_responses_sample.json";
import answers from "../mocks/symptom_answers.json";

export type Option = {
  label: string;
  converted_name: string;
  weight?: number;
  relevance?: "H" | "M" | "L";
};

export type Category = {
  category: string;
  phase?: number;
  options: Option[];
};

export interface RiskProfileData {
  age: string;
  ageAtMarriage?: string;
  ageAtFirstChild?: string;
  numberOfChildren?: string;
  breastfeeding?: string;
  contraceptives?: string;
  familyHistory?: string;
  smoking?: string;
  diet?: string;
}

export const getQuestions = (): Category[] => questions as Category[];
export const getResponsesSample = (): any[] => responses as any[];

export const getAnswers = (): Record<string, string> => answers as Record<string, string>;

// Utility: Convert responses to a normalized boolean matrix
export const normalizeResponses = (rows: any[]) => {
  return rows.map(r => {
    const out: Record<string, boolean | number | string> = { id: r.id ?? null, Age: r.Age ?? null };
    Object.keys(r).forEach(k => {
      if (k === "id" || k === "Age") return;
      const v = String(r[k]).toLowerCase();
      out[k] = v === "yes" || v === "true" || v === "1";
    });
    return out;
  });
};
