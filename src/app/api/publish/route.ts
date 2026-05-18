import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

let inflight = 0;
const MAX_INFLIGHT = 3;
const MAX_HTML_BYTES = 1_500_000;
const FILENAME_RE = /^[a-z][a-z0-9_-]{0,63}$/;
const ALLOWED_CATEGORIES = ["cpc", "crhr"] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];

function jsonError(status: number, code: string, message: string, extra: Record<string, unknown> = {}): Response {
  return Response.json({ ok: false, code, message, ...extra }, { status });
}

export async function POST(req: Request): Promise<Response> {
  if (inflight >= MAX_INFLIGHT) {
    return jsonError(503, "busy", "現在他のリクエストを処理中です。少し時間を空けてください。");
  }

  let body: { html?: unknown; filename?: unknown; category?: unknown; overwrite?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "bad_request", "JSON として解釈できませんでした");
  }

  const html = typeof body.html === "string" ? body.html : "";
  const filename = typeof body.filename === "string" ? body.filename : "";
  const categoryRaw = typeof body.category === "string" ? body.category : "";
  const overwrite = body.overwrite === true;

  if (!ALLOWED_CATEGORIES.includes(categoryRaw as Category)) {
    return jsonError(400, "bad_category", "category は cpc または crhr を指定してください");
  }
  const category = categoryRaw as Category;

  if (!FILENAME_RE.test(filename)) {
    return jsonError(
      400,
      "bad_filename",
      "ファイル名は英小文字で始まり、英小文字・数字・ハイフン・アンダースコアのみ（64 文字以内）にしてください",
    );
  }

  if (!html) {
    return jsonError(400, "empty_html", "html が空です");
  }
  const bytes = Buffer.byteLength(html, "utf8");
  if (bytes > MAX_HTML_BYTES) {
    return jsonError(413, "size_limit", "HTML が大きすぎます（1.5MB まで）");
  }

  const baseDir = process.env.PUBLISH_BASE_DIR;
  if (!baseDir) {
    return jsonError(503, "publish_disabled", "公開機能は本番環境でのみ利用できます");
  }

  const targetDir = path.join(baseDir, category, "html");
  const targetFile = path.join(targetDir, `${filename}.html`);
  const resolved = path.resolve(targetFile);
  const resolvedDir = path.resolve(targetDir);
  if (!resolved.startsWith(resolvedDir + path.sep)) {
    return jsonError(400, "bad_filename", "不正なパスです");
  }

  inflight += 1;
  try {
    const publicUrl = `https://${category}.instyle.group/html/${filename}.html`;

    let exists = false;
    try {
      await fs.access(resolved);
      exists = true;
    } catch {
      /* not exists */
    }

    if (exists && !overwrite) {
      return Response.json(
        {
          ok: false,
          code: "exists",
          message: "同名のファイルが既に存在します",
          url: publicUrl,
          filename: `${filename}.html`,
        },
        { status: 409 },
      );
    }

    try {
      await fs.mkdir(resolvedDir, { recursive: true });
      await fs.writeFile(resolved, html, { encoding: "utf8", mode: 0o644 });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return jsonError(500, "write_failed", `書き込みに失敗しました: ${message}`);
    }

    return Response.json({
      ok: true,
      url: publicUrl,
      filename: `${filename}.html`,
      bytes,
      overwritten: exists,
    });
  } finally {
    inflight = Math.max(0, inflight - 1);
  }
}
