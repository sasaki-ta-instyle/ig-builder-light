import { extractAttachment, MAX_SIZE } from "@/lib/attachments";
import { streamRedesign } from "@/lib/claude/stream";
import type { DesignSystem } from "@/lib/prompt/buildSystemPrompt";
import { frame, comment } from "@/lib/sse/encoder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

let inflight = 0;
const MAX_INFLIGHT = 3;

function badRequest(message: string, code = "bad_request"): Response {
  return Response.json({ ok: false, code, message }, { status: 400 });
}

export async function POST(req: Request): Promise<Response> {
  if (inflight >= MAX_INFLIGHT) {
    return Response.json(
      { ok: false, code: "busy", message: "現在他のリクエストを処理中です。少し時間を空けてください。" },
      { status: 503 },
    );
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > MAX_SIZE + 1024 * 1024) {
    return badRequest("ファイルサイズが上限（25MB）を超えています", "size_limit");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("multipart/form-data として解釈できませんでした");
  }

  const file = form.get("file");
  const designSystemRaw = String(form.get("designSystem") ?? "liquid").toLowerCase();
  if (designSystemRaw !== "flat" && designSystemRaw !== "liquid") {
    return badRequest("designSystem は flat か liquid を指定してください");
  }
  const designSystem = designSystemRaw as DesignSystem;

  if (!(file instanceof File)) {
    return badRequest("file フィールドが見つかりません");
  }
  if (file.size === 0) {
    return badRequest("空のファイルは扱えません");
  }
  if (file.size > MAX_SIZE) {
    return badRequest("ファイルサイズが上限（25MB）を超えています", "size_limit");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  inflight += 1;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(comment("keepalive"));
        } catch {
          /* closed */
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(heartbeat);
        inflight = Math.max(0, inflight - 1);
      };

      try {
        controller.enqueue(frame({ event: "progress", data: { phase: "reading", detail: `${file.name} を読み取っています` } }));

        const extracted = await extractAttachment({
          filename: file.name,
          mimeType: file.type || "application/octet-stream",
          buffer,
        });

        for await (const evt of streamRedesign({
          attachment: extracted,
          designSystem,
          signal: req.signal,
        })) {
          if (evt.type === "phase") {
            controller.enqueue(
              frame({
                event: "progress",
                data: {
                  phase: evt.phase,
                  detail: evt.phase === "thinking" ? "情報構造を組み立てています" : "HTML を生成しています",
                },
              }),
            );
          } else if (evt.type === "text_delta") {
            controller.enqueue(frame({ event: "html_delta", data: { chunk: evt.text } }));
          } else if (evt.type === "done") {
            controller.enqueue(
              frame({
                event: "done",
                data: {
                  htmlLength: 0,
                  tokensIn: evt.tokensIn,
                  tokensOut: evt.tokensOut,
                  cacheRead: evt.cacheRead,
                  finishReason: evt.finishReason,
                },
              }),
            );
          }
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        const aborted = req.signal.aborted || /aborted/i.test(message);
        controller.enqueue(
          frame({
            event: "error",
            data: {
              code: aborted ? "aborted" : "upstream_error",
              message: aborted ? "クライアントによって中断されました" : message,
              retriable: !aborted,
            },
          }),
        );
      } finally {
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
    cancel() {
      inflight = Math.max(0, inflight - 1);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
