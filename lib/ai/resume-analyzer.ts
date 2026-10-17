import "server-only";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getChatModel } from "@/lib/ai/model";
import { resumeFeedbackPrompt, resumeRewritePrompt } from "@/lib/ai/prompts";
import { resumeFeedbackSchema, type ResumeAnalysis } from "@/lib/ai/schemas";

/**
 * Two calls in parallel: small structured feedback (strict JSON), and the long
 * rewrite as plain text. Keeping the rewrite out of the JSON means a long resume
 * can't make the structured output run out of tokens and fail validation.
 */
export async function analyzeResume(resume: string): Promise<ResumeAnalysis> {
  const feedbackChain = resumeFeedbackPrompt.pipe(
    getChatModel({ temperature: 0.3, maxTokens: 3000 }).withStructuredOutput(
      resumeFeedbackSchema,
      { name: "resume_feedback" },
    ),
  );
  const rewriteChain = resumeRewritePrompt
    .pipe(getChatModel({ temperature: 0.2, maxTokens: 3500 }))
    .pipe(new StringOutputParser());

  const [feedback, improvedResume] = await Promise.all([
    feedbackChain.invoke({ resume }),
    rewriteChain.invoke({ resume }),
  ]);

  return {
    ...feedback,
    score: Math.round(Math.min(100, Math.max(0, feedback.score))),
    improvedResume: toPlainText(improvedResume),
  };
}

/** The rewrite is downloaded as .txt, so strip any markdown the model slips in. */
function toPlainText(text: string) {
  return text
    .replace(/^```[a-z]*\n?|```$/gim, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[ \t]+$/gm, "")
    .trim();
}
