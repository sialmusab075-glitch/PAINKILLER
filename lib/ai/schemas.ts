import { z } from "zod";

// Field descriptions are sent to the model as part of the JSON schema, so they
// double as output instructions. Arrays may be empty (e.g. no grammar issues).
const bulletList = (description: string) =>
  z.array(z.string()).describe(`${description} At most 6 concise bullets.`);

/** Structured feedback. Kept small so the JSON reliably completes. */
export const resumeFeedbackSchema = z.object({
  score: z.number().describe("Overall resume quality score from 0 to 100."),
  summary: z.string().describe("Two or three sentences summarizing the resume's overall quality."),
  strengths: bulletList("What the resume does well."),
  weaknesses: bulletList("Most important problems holding the resume back."),
  suggestions: bulletList("Concrete, tactical improvements."),
  grammarIssues: bulletList("Specific grammar, spelling, or wording issues, quoting the text."),
  missingKeywords: bulletList("Relevant industry/role keywords the resume lacks."),
  atsOptimization: bulletList("Changes that improve parsing by applicant tracking systems."),
});

type ResumeFeedback = z.infer<typeof resumeFeedbackSchema>;

/** Feedback plus the plain-text rewrite, which is generated separately (see resume-analyzer.ts). */
export type ResumeAnalysis = ResumeFeedback & { improvedResume: string };
