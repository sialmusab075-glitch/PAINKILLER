// Upload rules shared by the client pre-check and the server parser (lib/resume/parse.ts).
// Kept separate so the client bundle never pulls in the PDF/DOCX parsers.
export const MAX_RESUME_FILE_BYTES = 5 * 1024 * 1024;
export const MIN_RESUME_TEXT_CHARS = 200;
export const MAX_RESUME_TEXT_CHARS = 30_000;
export const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

export function hasAcceptedExtension(filename: string) {
  const lower = filename.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((extension) => lower.endsWith(extension));
}
