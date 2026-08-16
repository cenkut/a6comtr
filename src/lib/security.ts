/**
 * Shared security helpers for input sanitization and URL safety.
 */

const BLOCKED_URL_PROTOCOLS = /^(javascript|data|vbscript|file):/i;

/**
 * Reject dangerous URL schemes that could enable XSS via href.
 */
export function assertSafeHttpUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    throw new Error("URL empty");
  }
  if (BLOCKED_URL_PROTOCOLS.test(trimmed)) {
    throw new Error("Unsafe URL protocol");
  }
  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  const parsed = new URL(candidate);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Unsafe URL protocol");
  }
  return parsed.toString();
}

/** Allowed upload MIME types for company documents (future FAZ documents). */
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export const BLOCKED_UPLOAD_EXTENSIONS = new Set([
  ".exe",
  ".sh",
  ".bat",
  ".cmd",
  ".js",
  ".mjs",
  ".php",
  ".html",
  ".htm",
  ".svg",
  ".xml",
]);

export function isAllowedDocumentUpload(input: {
  mimeType: string;
  filename: string;
  sizeBytes: number;
  maxBytes: number;
}): boolean {
  if (input.sizeBytes <= 0 || input.sizeBytes > input.maxBytes) return false;
  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(input.mimeType)) return false;
  const lower = input.filename.toLowerCase();
  for (const ext of BLOCKED_UPLOAD_EXTENSIONS) {
    if (lower.endsWith(ext)) return false;
  }
  return true;
}
