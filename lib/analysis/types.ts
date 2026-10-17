import type { ResumeAnalysis } from "@/lib/ai/schemas";

export type AnalysisStatus = "pending" | "completed" | "failed";

/** Serializable analysis shape passed from server components to the client. */
export type AnalysisView = {
  id: string;
  status: AnalysisStatus;
  createdAt: string;
  filename: string | null;
  result: ResumeAnalysis | null;
  error: string | null;
};
