"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoadingOverlay } from "@/components/loading-overlay";
import {
  ACCEPTED_EXTENSIONS,
  MAX_RESUME_FILE_BYTES,
  hasAcceptedExtension,
} from "@/lib/resume/rules";

/** Quick client-side checks; the server re-validates and explains anything else. */
function precheck(file: File) {
  if (!hasAcceptedExtension(file.name)) {
    return "Upload a PDF, DOCX, or TXT file.";
  }
  if (file.size === 0) {
    return "That file is empty.";
  }
  if (file.size > MAX_RESUME_FILE_BYTES) {
    return "Resume files must be 5 MB or smaller.";
  }
  return null;
}

export function UploadCard() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onFileChange(file: File | null) {
    setSelectedFile(file);
    setError(file ? precheck(file) : null);
  }

  function handleSubmit() {
    if (!selectedFile) {
      setError("Choose your resume file first.");
      return;
    }
    const problem = precheck(selectedFile);
    if (problem) {
      setError(problem);
      return;
    }

    startTransition(async () => {
      try {
        setError(null);
        const formData = new FormData();
        formData.append("file", selectedFile);

        const response = await fetch("/api/analyze", { method: "POST", body: formData });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Analysis failed.");
        }

        router.push(`/results/${payload.analysisId}`);
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "Something went wrong while analyzing the resume.",
        );
      }
    });
  }

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-line bg-white p-6 shadow-soft sm:p-8">
      {isPending ? <LoadingOverlay label="Analyzing your resume..." /> : null}

      <div className="mx-auto max-w-2xl space-y-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">Upload resume</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
            Fast AI feedback for clarity, keywords, and ATS fit
          </h2>
        </div>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex min-h-44 w-full flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-line bg-canvas px-6 text-center transition hover:border-brand"
        >
          <span className="text-base font-medium text-ink">
            {selectedFile ? selectedFile.name : "Choose a PDF, DOCX, or TXT file"}
          </span>
          <span className="mt-2 text-sm text-muted">
            Up to 5 MB. We keep only the extracted text, never the file itself.
          </span>
        </button>

        <input
          ref={fileRef}
          type="file"
          accept={`${ACCEPTED_EXTENSIONS.join(",")},application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain`}
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] || null)}
        />

        {error ? (
          <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !selectedFile}
          className="w-full rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Analyze Resume
        </button>
      </div>
    </div>
  );
}
