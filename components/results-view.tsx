"use client";

import { useRouter } from "next/navigation";
import type { AnalysisView } from "@/lib/analysis/types";

function SectionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="rounded-[1.5rem] border border-line bg-white p-5 shadow-soft">
      <h3 className="text-lg font-semibold text-ink">{title}</h3>
      <ul className="mt-4 space-y-3 text-sm text-muted">
        {items.length ? (
          items.map((item, index) => (
            <li key={`${title}-${index}`} className="rounded-2xl bg-canvas px-4 py-3">
              {item}
            </li>
          ))
        ) : (
          <li className="rounded-2xl bg-canvas px-4 py-3">Nothing to flag here.</li>
        )}
      </ul>
    </section>
  );
}

function downloadImprovedResume(content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "improved-resume.txt";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ResultsView({ analysis }: { analysis: AnalysisView }) {
  const router = useRouter();
  const result = analysis.result;

  if (!result) {
    return (
      <div className="rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-soft">
        <h2 className="text-2xl font-semibold text-ink">
          {analysis.status === "failed" ? "This analysis failed" : "Analysis in progress"}
        </h2>
        <p className="mt-3 text-sm text-muted">
          {analysis.error ?? "Your results will appear here once the analysis finishes."}
        </p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mt-6 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
        >
          Analyze another resume
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] border border-line bg-white p-6 shadow-soft">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">Resume score</p>
          <div className="mt-4 flex items-end gap-3">
            <span className="text-6xl font-semibold tracking-tight text-ink">{result.score}</span>
            <span className="pb-2 text-lg text-muted">/ 100</span>
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">{result.summary}</p>
        </div>

        <div className="rounded-[1.75rem] border border-line bg-gradient-to-br from-brand to-ink p-6 text-white shadow-soft">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/70">
            Improved draft
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Your AI-improved resume is ready.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80">
            Download a rewritten version of your resume as a starting draft. Review it and keep
            every fact accurate before sending it out.
          </p>
          <button
            type="button"
            onClick={() => downloadImprovedResume(result.improvedResume)}
            className="mt-6 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:opacity-90"
          >
            Download Improved Resume
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Strengths" items={result.strengths} />
        <SectionCard title="Weaknesses" items={result.weaknesses} />
        <SectionCard title="Suggestions" items={result.suggestions} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <SectionCard title="Grammar Issues" items={result.grammarIssues} />
        <SectionCard title="Missing Keywords" items={result.missingKeywords} />
        <SectionCard title="ATS Optimization" items={result.atsOptimization} />
      </section>
    </div>
  );
}
