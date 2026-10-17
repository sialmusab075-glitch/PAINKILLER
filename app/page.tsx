import { UploadCard } from "@/components/upload-card";
import { requireSubscriber } from "@/lib/auth/session";

export default async function HomePage() {
  await requireSubscriber();

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <section className="grid gap-10 lg:grid-cols-[1fr_420px] lg:items-center">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand">
            AI Resume Checker
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
            Stronger resumes, clearer wording, and better ATS alignment in minutes.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Upload your resume as a PDF, DOCX, or TXT file to get AI feedback on grammar,
            keyword coverage, ATS optimization, and a full improved draft.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-line bg-white p-6 shadow-soft">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-brand">How it works</p>
          <div className="mt-4 space-y-4 text-sm text-muted">
            <div className="rounded-2xl bg-canvas p-4">
              We extract the text from your file and never store the file itself.
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              AI returns a structured score plus strengths, weaknesses, and suggestions.
            </div>
            <div className="rounded-2xl bg-canvas p-4">
              Every analysis includes a downloadable improved resume and is saved to your history.
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 lg:mt-16">
        <UploadCard />
      </section>
    </div>
  );
}
