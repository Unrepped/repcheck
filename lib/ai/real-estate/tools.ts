import { tool } from 'ai';
import { z } from 'zod';
import { type UserContext, type InterviewQuestion, type QuestionCategory, type InterviewPhase } from './types';
import { generateUUID } from '@/lib/utils';

const categoryEnum = z.enum([
  'agent_relationship',
  'local_knowledge',
  'process_familiarity',
  'communication_availability',
  'budget_fees',
  'loan_eligibility',
  'property_type',
  'lifestyle_cultural_fit',
]);

const phaseEnum = z.enum(['discovery', 'diagnostic']);

// Tool to update user context (returns the new context, not the full state)
export const updateUserContext = tool({
  description: 'Update the user context with new information',
  parameters: z.object({
    isFirstTimeBuyer: z.boolean().optional(),
    hasAgent: z.boolean().optional(),
    supportNeeds: z.array(z.string()).optional(),
    location: z.object({
      city: z.string(),
      state: z.string()
    }).optional(),
    budget: z.object({
      min: z.number(),
      max: z.number()
    }).optional(),
    propertyType: z.array(z.string()).optional(),
    timeline: z.string().optional()
  }),
  execute: async (params) => {
    return params as Partial<UserContext>;
  }
});

// Tool to create a new interview question (returns the question object)
export const addQuestion = tool({
  description: 'Add a new question to the interview list',
  parameters: z.object({
    category: categoryEnum,
    question: z.string(),
    explanation: z.string(),
    priority: z.enum(['high', 'medium', 'low'])
  }),
  execute: async ({ category, question, explanation, priority }) => {
    return {
      id: generateUUID(),
      category: category as QuestionCategory,
      question,
      explanation,
      priority
    } satisfies InterviewQuestion;
  }
});

// Tool to indicate a phase transition (returns the new phase)
export const transitionPhase = tool({
  description: 'Transition to the next phase of the interview',
  parameters: z.object({
    phase: phaseEnum
  }),
  execute: async ({ phase }) => {
    return { phase: phase as InterviewPhase };
  }
}); 