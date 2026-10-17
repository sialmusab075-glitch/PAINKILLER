import { NextResponse } from "next/server";
import { requireApiSubscriber } from "@/lib/auth/session";
import { badRequest, toResponse } from "@/lib/errors";
import { extractResumeText } from "@/lib/resume/parse";
import { createAnalysis } from "@/lib/analysis/service";

export const runtime = "nodejs";

/**
 * Subscribers only (paymentProtected in proxy.ts, re-checked here).
 * Accepts one uploaded file, stores only its extracted text, and returns the AI analysis.
 */
export async function POST(request: Request) {
  try {
    const user = await requireApiSubscriber();
    const formData = await request.formData().catch(() => {
      throw badRequest("Upload your resume as a file.");
    });
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw badRequest("Upload your resume as a PDF, DOCX, or TXT file.");
    }

    const text = await extractResumeText(file);
    const { id, result } = await createAnalysis(user.id, { text, filename: file.name });
    return NextResponse.json({ analysisId: id, analysis: result });
  } catch (error) {
    return toResponse(error, "We couldn't analyze your resume right now. Please try again.");
  }
}
