import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";
import { badRequest } from "@/lib/errors";
import {
  MAX_RESUME_FILE_BYTES,
  MAX_RESUME_TEXT_CHARS,
  MIN_RESUME_TEXT_CHARS,
} from "@/lib/resume/rules";

type ResumeKind = "pdf" | "docx" | "txt";

function kindFromName(filename: string): ResumeKind | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".docx")) return "docx";
  if (lower.endsWith(".txt")) return "txt";
  return null;
}

function startsWith(buffer: Buffer, signature: number[]) {
  return signature.every((byte, index) => buffer[index] === byte);
}

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04]; // DOCX is a ZIP container

async function parsePdf(buffer: Buffer) {
  try {
    // verbosity 0 silences pdf.js recovery warnings for slightly malformed files.
    const pdf = await getDocumentProxy(new Uint8Array(buffer), { verbosity: 0 });
    return (await extractText(pdf, { mergePages: true })).text;
  } catch (error) {
    if (error instanceof Error && /password/i.test(`${error.name} ${error.message}`)) {
      throw badRequest("This PDF is password-protected. Remove the password and upload it again.");
    }
    throw badRequest("We couldn't read this PDF. It may be damaged; try exporting it again.");
  }
}

async function parseDocx(buffer: Buffer) {
  try {
    return (await mammoth.extractRawText({ buffer })).value;
  } catch {
    throw badRequest("We couldn't read this Word document. Try saving it again as .docx or PDF.");
  }
}

function parseTxt(buffer: Buffer) {
  if (buffer.includes(0)) {
    throw badRequest("This doesn't look like a plain-text file. Upload a PDF, DOCX, or TXT.");
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    throw badRequest("This text file isn't UTF-8 encoded. Save it as UTF-8 or upload a PDF.");
  }
}

function normalizeResumeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Parses an uploaded resume into plain text with user-facing error messages.
 * The file's bytes only live in memory here; callers persist the text alone.
 */
export async function extractResumeText(file: File) {
  const kind = kindFromName(file.name);
  if (!kind) {
    throw badRequest(
      file.name.toLowerCase().endsWith(".doc")
        ? "Old .doc files aren't supported. Save it as .docx or PDF and upload again."
        : "Upload a PDF, DOCX, or TXT file.",
    );
  }
  if (file.size === 0) {
    throw badRequest("That file is empty.");
  }
  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw badRequest("Resume files must be 5 MB or smaller.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  if (kind === "pdf" && !startsWith(buffer, PDF_SIGNATURE)) {
    throw badRequest("This file has a .pdf name but isn't a PDF. Upload the original file.");
  }
  if (kind === "docx" && !startsWith(buffer, ZIP_SIGNATURE)) {
    throw badRequest("This file has a .docx name but isn't a Word document. Upload the original file.");
  }

  const raw =
    kind === "pdf" ? await parsePdf(buffer) : kind === "docx" ? await parseDocx(buffer) : parseTxt(buffer);
  const text = normalizeResumeText(raw);

  if (!text) {
    throw badRequest(
      kind === "pdf"
        ? "We couldn't find any text in this PDF. It looks like a scanned image; export a text-based PDF instead."
        : "We couldn't find any text in this file.",
    );
  }
  if (text.length < MIN_RESUME_TEXT_CHARS) {
    throw badRequest("This file has very little text. Upload your full resume.");
  }
  if (text.length > MAX_RESUME_TEXT_CHARS) {
    throw badRequest("This resume is too long. Trim it to under 30,000 characters.");
  }

  return text;
}
