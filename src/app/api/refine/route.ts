import { streamRefine } from "@/lib/claude/stream";
import type { DesignSystem } from "@/lib/prompt/buildSystemPrompt";
import { frame, comment } from "@/lib/sse/encoder";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

let inflight = 0;
const MAX_INFLIGHT = 3;
const MAX_HTML_BYTES = 1_500_000;
const MAX_INSTRUCTION_BYTES = 8_000;

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

  let body: { currentHtml?: unknown; instruction?: unknown; designSystem?: unknown };
  try {
    body = await req.json();
  } catch {
    return badRequest("JSON として解釈できませんでした");
  }

  const currentHtml = typeof body.currentHtml === "string" ? body.currentHtml : "";
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  const designSystemRaw = typeof body.designSystem === "string" ? body.designSystem.toLowerCase() : "liquid";

  if (!currentHtml) return badRequest("currentHtml が空です");
  if (Buffer.byteLength(currentHtml, "utf8") > MAX_HTML_BYTES) {
    return badRequest("HTML が大きすぎます", "size_limit");
  }
  if (!instruction) return badRequest("指示を入力してください");
  if (Buffer.byteLength(instruction, "utf8") > MAX_INSTRUCTION_BYTES) {
    return badRequest("指示が長すぎます（8KB まで）", "size_limit");
  }
  if (designSystemRaw !== "flat" && designSystemRaw !== "liquid") {
    return badRequest("designSystem は flat か liquid を指定してください");
  }
  const designSystem = designSystemRaw as DesignSystem;

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
        controller.enqueue(
          frame({ event: "progress", data: { phase: "reading", detail: "指示を受け取りました" } }),
        );

        for await (const evt of streamRefine({
          currentHtml,
          instruction,
          designSystem,
          signal: req.signal,
        })) {
          if (evt.type === "phase") {
            controller.enqueue(
              frame({
                event: "progress",
                data: {
                  phase: evt.phase,
                  detail: evt.phase === "thinking" ? "変更点を組み立てています" : "HTML を更新しています",
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
