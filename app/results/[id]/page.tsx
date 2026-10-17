import { notFound } from "next/navigation";
import { ResultsView } from "@/components/results-view";
import { requireSubscriber } from "@/lib/auth/session";
import { getAnalysisForUser } from "@/lib/analysis/service";

export default async function AnalysisResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireSubscriber();
  const { id } = await params;

  const analysis = await getAnalysisForUser(id, user.id);
  if (!analysis) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">Results</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Your resume analysis</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Review your score, strengths, weaknesses, and download an improved draft.
        </p>
      </div>

      <ResultsView analysis={analysis} />
    </div>
  );
}
