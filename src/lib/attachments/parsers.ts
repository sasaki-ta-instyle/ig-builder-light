import "server-only";

const MAX_TEXT_BYTES = 200 * 1024;

function trimText(s: string): string {
  if (Buffer.byteLength(s, "utf8") <= MAX_TEXT_BYTES) return s;
  return Buffer.from(s, "utf8").subarray(0, MAX_TEXT_BYTES).toString("utf8");
}

export async function extractPdfText(buf: Buffer): Promise<string> {
  const mod = await import("pdf-parse");
  const pdfParse =
    (mod as unknown as { default?: (b: Buffer) => Promise<{ text: string }> })
      .default ??
    (mod as unknown as (b: Buffer) => Promise<{ text: string }>);
  const out = await pdfParse(buf);
  return trimText(out.text ?? "");
}

export async function extractDocxText(buf: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer: buf });
  return trimText(result.value ?? "");
}

export async function extractPptxText(buf: Buffer): Promise<string> {
  const AdmZip = (await import("adm-zip")).default;
  const zip = new AdmZip(buf);
  const entries = zip.getEntries();
  const slidesXml: string[] = [];
  for (const entry of entries) {
    if (
      entry.entryName.startsWith("ppt/slides/slide") &&
      entry.entryName.endsWith(".xml")
    ) {
      slidesXml.push(entry.getData().toString("utf8"));
    }
    if (
      entry.entryName.startsWith("ppt/notesSlides/notesSlide") &&
      entry.entryName.endsWith(".xml")
    ) {
      slidesXml.push(entry.getData().toString("utf8"));
    }
  }
  const out: string[] = [];
  for (const xml of slidesXml) {
    const matches = xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g);
    const lines: string[] = [];
    for (const m of matches) {
      lines.push(decodeXmlEntities(m[1]).trim());
    }
    if (lines.length) out.push(lines.join("\n"));
  }
  return trimText(out.join("\n\n---\n\n"));
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

export function extractPlainText(buf: Buffer): string {
  return trimText(buf.toString("utf8"));
}
