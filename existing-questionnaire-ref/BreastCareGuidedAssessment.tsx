import React from "react";
import type { QuestionnaireAnswer } from "../../types/questionnaire";
import { BreastCareSymptomChatbot } from "./BreastCareSymptomChatbot";

interface GuidedAssessmentProps {
  onSubmitted?: () => void;
  onSwitchToManual?: (answers: QuestionnaireAnswer[], note: string) => void;
  onClose?: () => void;
  hideHeader?: boolean;
}

export const BreastCareGuidedAssessment: React.FC<GuidedAssessmentProps> = ({ 
  onSubmitted, 
  onSwitchToManual, 
  onClose,
  hideHeader = false
}) => {
  return (
    <BreastCareSymptomChatbot
      onSubmitted={onSubmitted}
      onSwitchToManual={onSwitchToManual}
      onClose={onClose}
      hideHeader={hideHeader}
      isModal={false}
    />
  );
};
