export type InterviewPhase = 'discovery' | 'diagnostic';

export type QuestionCategory =
  | 'agent_relationship'
  | 'local_knowledge'
  | 'process_familiarity'
  | 'communication_availability'
  | 'budget_fees'
  | 'loan_eligibility'
  | 'property_type'
  | 'lifestyle_cultural_fit';

export interface UserContext {
  isFirstTimeBuyer: boolean;
  hasAgent: boolean;
  supportNeeds: string[];
  location?: {
    city: string;
    state: string;
  };
  budget?: {
    min: number;
    max: number;
  };
  propertyType?: string[];
  timeline?: string;
}

export interface InterviewQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  explanation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface InterviewState {
  phase: InterviewPhase;
  userContext: UserContext;
  questions: InterviewQuestion[];
  currentCategory?: QuestionCategory;
} 