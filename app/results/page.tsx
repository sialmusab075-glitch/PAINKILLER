import Link from "next/link";
import { requireSubscriber } from "@/lib/auth/session";
import { listAnalysesForUser } from "@/lib/analysis/service";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

export default async function ResultsPage() {
  const user = await requireSubscriber();
  const analyses = await listAnalysesForUser(user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">Results</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink">Your analyses</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Every resume you&apos;ve analyzed, newest first.
        </p>
      </div>

      {analyses.length === 0 ? (
        <div className="rounded-[1.75rem] border border-line bg-white p-8 text-center shadow-soft">
          <h2 className="text-2xl font-semibold text-ink">No analysis found</h2>
          <p className="mt-3 text-sm text-muted">
            Run a resume analysis first, then your results will appear here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white"
          >
            Go to homepage
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {analyses.map((analysis) => (
            <li key={analysis.id}>
              <Link
                href={`/results/${analysis.id}`}
                className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-line bg-white px-5 py-4 shadow-soft transition hover:border-brand"
              >
                <div>
                  <p className="font-medium text-ink">{analysis.filename ?? "Resume"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {dateFormatter.format(new Date(analysis.createdAt))}
                    {analysis.status === "failed" ? " · Failed" : ""}
                  </p>
                </div>
                <span className="text-2xl font-semibold text-ink">
                  {analysis.result ? analysis.result.score : "—"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
