import "server-only";
import { analyzeResume } from "@/lib/ai/resume-analyzer";
import { db } from "@/lib/db";
import { AppError } from "@/lib/errors";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { ResumeAnalysis } from "@/lib/ai/schemas";
import type { AnalysisStatus, AnalysisView } from "@/lib/analysis/types";

const viewInclude = {
  resume: { select: { filename: true } },
} satisfies Prisma.AnalysisInclude;

type AnalysisWithResume = Prisma.AnalysisGetPayload<{ include: typeof viewInclude }>;

function toView(analysis: AnalysisWithResume): AnalysisView {
  return {
    id: analysis.id,
    status: analysis.status as AnalysisStatus,
    createdAt: analysis.createdAt.toISOString(),
    filename: analysis.resume.filename,
    result: (analysis.result as ResumeAnalysis | null) ?? null,
    error: analysis.error,
  };
}

export async function createAnalysis(
  userId: string,
  input: { text: string; filename: string | null },
) {
  const analysis = await db.analysis.create({
    data: {
      user: { connect: { id: userId } },
      status: "pending",
      resume: {
        create: { userId, text: input.text, filename: input.filename },
      },
    },
    select: { id: true },
  });

  let result: ResumeAnalysis;
  try {
    result = await analyzeResume(input.text);
    await db.analysis.update({
      where: { id: analysis.id },
      data: { status: "completed", score: result.score, result },
    });
  } catch (error) {
    const failure = toAiError(error);
    await db.analysis.update({
      where: { id: analysis.id },
      data: { status: "failed", error: failure.publicMessage },
    });
    throw failure;
  }

  return { id: analysis.id, result };
}

/** Logs the provider error and returns a message the user can act on. */
function toAiError(error: unknown): AppError {
  console.error("AI analysis failed", error);
  const status = (error as { status?: number })?.status;
  if (status === 429) {
    return new AppError(503, "Our AI is busy right now. Please try again in a minute.");
  }
  return new AppError(502, "The AI analysis failed. Please try again.");
}

/** Null when the analysis doesn't exist or belongs to someone else. */
export async function getAnalysisForUser(analysisId: string, userId: string) {
  const analysis = await db.analysis.findFirst({
    where: { id: analysisId, userId },
    include: viewInclude,
  });
  return analysis ? toView(analysis) : null;
}

export async function listAnalysesForUser(userId: string) {
  const analyses = await db.analysis.findMany({
    where: { userId },
    include: viewInclude,
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return analyses.map(toView);
}
