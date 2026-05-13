import "server-only";
import path from "node:path";
import {
  extractPdfText,
  extractDocxText,
  extractPptxText,
  extractPlainText,
} from "./parsers";

export const MAX_SIZE = 25 * 1024 * 1024;

export type AttachmentKind = "pdf" | "image" | "docx" | "pptx" | "text" | "html";

const EXT_MAP: Record<string, AttachmentKind> = {
  ".pdf": "pdf",
  ".png": "image",
  ".jpg": "image",
  ".jpeg": "image",
  ".webp": "image",
  ".gif": "image",
  ".docx": "docx",
  ".doc": "docx",
  ".pptx": "pptx",
  ".txt": "text",
  ".md": "text",
  ".markdown": "text",
  ".html": "html",
  ".htm": "html",
};

const MIME_MAP: Record<string, AttachmentKind> = {
  "application/pdf": "pdf",
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/gif": "image",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "docx",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "text",
  "text/markdown": "text",
  "text/html": "html",
};

export function detectKind(filename: string, mime: string): AttachmentKind | null {
  const ext = path.extname(filename).toLowerCase();
  return EXT_MAP[ext] ?? MIME_MAP[mime.toLowerCase()] ?? null;
}

export const IMAGE_MEDIA_TYPES: Record<string, "image/png" | "image/jpeg" | "image/webp" | "image/gif"> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export function detectImageMediaType(filename: string, mime: string): "image/png" | "image/jpeg" | "image/webp" | "image/gif" {
  const lowered = mime.toLowerCase();
  if (lowered === "image/png") return "image/png";
  if (lowered === "image/jpeg" || lowered === "image/jpg") return "image/jpeg";
  if (lowered === "image/webp") return "image/webp";
  if (lowered === "image/gif") return "image/gif";
  const ext = path.extname(filename).toLowerCase();
  return IMAGE_MEDIA_TYPES[ext] ?? "image/png";
}

export type ExtractedAttachment =
  | { kind: "pdf"; filename: string; size: number; pdfBase64: string }
  | { kind: "image"; filename: string; size: number; mediaType: "image/png" | "image/jpeg" | "image/webp" | "image/gif"; base64: string }
  | { kind: "docx" | "pptx" | "text" | "html"; filename: string; size: number; text: string };

export async function extractAttachment(args: {
  filename: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<ExtractedAttachment> {
  const { filename, mimeType, buffer } = args;

  if (buffer.length > MAX_SIZE) {
    throw new Error(
      `ファイルが大きすぎます（${(buffer.length / 1024 / 1024).toFixed(1)}MB > 25MB）`,
    );
  }

  const kind = detectKind(filename, mimeType);
  if (!kind) {
    throw new Error("対応していないファイル形式です (.pdf / 画像 / .docx / .pptx / .txt / .md / .html)");
  }

  switch (kind) {
    case "pdf":
      return { kind, filename, size: buffer.length, pdfBase64: buffer.toString("base64") };
    case "image":
      return {
        kind,
        filename,
        size: buffer.length,
        mediaType: detectImageMediaType(filename, mimeType),
        base64: buffer.toString("base64"),
      };
    case "docx":
      return { kind, filename, size: buffer.length, text: await extractDocxText(buffer) };
    case "pptx":
      return { kind, filename, size: buffer.length, text: await extractPptxText(buffer) };
    case "text":
      return { kind, filename, size: buffer.length, text: extractPlainText(buffer) };
    case "html":
      return { kind, filename, size: buffer.length, text: extractPlainText(buffer) };
  }
}

export async function extractPdfTextFallback(buf: Buffer): Promise<string> {
  return extractPdfText(buf);
}
