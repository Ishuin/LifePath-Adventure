import { z } from "zod";

export const pastStateSchema = z.object({
  summary: z.string().trim().min(1, "Describe this chapter of your past."),
  asOf: z.string().trim().optional(),
});

export const intakeSchema = z.object({
  goalTitle: z.string().trim().min(3, "Give your goal a short title."),
  goalDescription: z.string().trim().optional(),
  targetDate: z.string().trim().optional(),
  currentSummary: z.string().trim().min(1, "Describe where you are right now."),
  pastStates: z.array(pastStateSchema).default([]),
  budgetCents: z.number().int().nonnegative().optional(),
  hoursPerWeek: z.number().int().positive().max(168).optional(),
});

export type IntakeInput = z.infer<typeof intakeSchema>;
