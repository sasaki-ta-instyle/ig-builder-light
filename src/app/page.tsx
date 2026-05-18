"use client";
import { useCallback, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { DesignToggle, type DesignSystem } from "@/components/DesignToggle";
import { PreviewIframe } from "@/components/PreviewIframe";
import { ActionBar } from "@/components/ActionBar";
import { ProgressLine, type Phase } from "@/components/ProgressLine";
import { RefinePanel } from "@/components/RefinePanel";
import { PublishPanel } from "@/components/PublishPanel";

type DoneMeta = { tokensIn: number; tokensOut: number; cacheRead: number; finishReason: string };

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function deriveDownloadName(srcName: string | undefined): string {
  if (!srcName) return "redesigned.html";
  const base = srcName.replace(/\.[^.]+$/, "");
  return `${base || "redesigned"}.html`;
}

function sanitizeHtml(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

type SseHandlers = {
  onProgress: (phase: Phase, detail: string) => void;
  onDelta: (chunk: string) => void;
  onDone: (meta: DoneMeta) => void;
  onError: (message: string) => void;
};

async function consumeSse(res: Response, handlers: SseHandlers) {
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `失敗しました (HTTP ${res.status})`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    const { value, done: streamDone } = await reader.read();
    if (streamDone) break;
    buf += decoder.decode(value, { stream: true });
    let idx = buf.indexOf("\n\n");
    while (idx !== -1) {
      const chunk = buf.slice(0, idx);
      buf = buf.slice(idx + 2);
      idx = buf.indexOf("\n\n");

      const lines = chunk.split("\n");
      let ev = "";
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event:")) ev = line.slice(6).trim();
        else if (line.startsWith("data:")) dataLine += line.slice(5).trim();
      }
      if (!ev) continue;

      try {
        const data = dataLine ? JSON.parse(dataLine) : {};
        if (ev === "progress") handlers.onProgress(data.phase, data.detail ?? "");
        else if (ev === "html_delta") handlers.onDelta(data.chunk ?? "");
        else if (ev === "done") {
          handlers.onDone({
            tokensIn: data.tokensIn,
            tokensOut: data.tokensOut,
            cacheRead: data.cacheRead ?? 0,
            finishReason: data.finishReason,
          });
        } else if (ev === "error") handlers.onError(data.message ?? "エラーが発生しました");
      } catch {
        /* malformed chunk, ignore */
      }
    }
  }
}

export default function HomePage() {
  const [file, setFile] = useState<File | null>(null);
  const [designSystem, setDesignSystem] = useState<DesignSystem>("liquid");
  const [phase, setPhase] = useState<Phase>("idle");
  const [detail, setDetail] = useState<string>("");
  const [html, setHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<DoneMeta | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isStreaming = phase === "reading" || phase === "thinking" || phase === "writing";

  const startStream = useCallback(
    async (
      fetcher: (signal: AbortSignal) => Promise<Response>,
      mode: "generate" | "refine",
    ) => {
      setError(null);
      setDone(null);
      setPhase("reading");
      setDetail("");
      if (mode === "generate") setHtml("");

      const controller = new AbortController();
      abortRef.current = controller;
      let acc = mode === "refine" ? "" : "";
      let firstDelta = true;

      try {
        const res = await fetcher(controller.signal);
        await consumeSse(res, {
          onProgress: (p, d) => {
            setPhase(p);
            setDetail(d);
          },
          onDelta: (chunk) => {
            if (mode === "refine" && firstDelta) {
              firstDelta = false;
              setHtml("");
            }
            acc += chunk;
            setHtml(acc);
          },
          onDone: (meta) => {
            const truncated = meta.finishReason === "max_tokens";
            setPhase(truncated ? "truncated" : "done");
            setDetail(truncated ? "max_tokens に達しました。「やり直す」で再生成してください。" : "");
            setDone(meta);
          },
          onError: (msg) => {
            setPhase("error");
            setError(msg);
          },
        });
      } catch (err: unknown) {
        if ((err as Error).name === "AbortError") return;
        setPhase("error");
        setError((err as Error).message ?? "失敗しました");
      }
    },
    [],
  );

  const generate = useCallback(() => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("designSystem", designSystem);
    return startStream(
      (signal) => fetch(`${BASE_PATH}/api/generate`, { method: "POST", body: fd, signal }),
      "generate",
    );
  }, [file, designSystem, startStream]);

  const refine = useCallback(
    (instruction: string) => {
      if (!html) return;
      return startStream(
        (signal) =>
          fetch(`${BASE_PATH}/api/refine`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentHtml: html, instruction, designSystem }),
            signal,
          }),
        "refine",
      );
    },
    [html, designSystem, startStream],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setDetail("");
  }, []);

  const cleaned = sanitizeHtml(html);
  const hasHtml = Boolean(html);
  const canRefine = hasHtml && !isStreaming;

  return (
    <>
      <header className="header">
        <div className="header__brand">
          <span className="header__lockup">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              className="header__logo"
              src="https://app.instyle.group/_shared/static/logo.svg"
              alt="instyle group"
            />
            <h1 className="header__title">HTML Builder</h1>
          </span>
          <span className="header__tag">BETA</span>
        </div>
      </header>

      <main className="main">
        <section className="controls">
          <div className="controls__inner">
            <div>
              <h2 className="controls__section-title">1. 資料を入れる</h2>
              <DropZone file={file} onFile={setFile} disabled={isStreaming} />
            </div>

            <div>
              <h2 className="controls__section-title">2. デザインを選ぶ</h2>
              <DesignToggle value={designSystem} onChange={setDesignSystem} disabled={isStreaming} />
            </div>

            <div>
              {isStreaming ? (
                <button type="button" className="btn-primary" onClick={cancel}>
                  中断する
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  disabled={!file}
                  onClick={generate}
                >
                  リデザインする
                </button>
              )}
            </div>

            {phase !== "idle" && (
              <ProgressLine
                phase={phase}
                detail={detail}
                tokensIn={done?.tokensIn}
                tokensOut={done?.tokensOut}
                cacheRead={done?.cacheRead}
              />
            )}

            {error && <div className="toast">{error}</div>}

            {hasHtml && (
              <div>
                <h2 className="controls__section-title">3. 微調整する</h2>
                <RefinePanel disabled={!canRefine} onSubmit={refine} />
              </div>
            )}

            {hasHtml && (
              <div>
                <h2 className="controls__section-title">4. 公開する</h2>
                <PublishPanel html={cleaned} disabled={isStreaming} basePath={BASE_PATH} />
              </div>
            )}
          </div>
        </section>

        <section className="preview">
          <div className="preview__header">
            <h2 className="preview__title">プレビュー</h2>
            <ActionBar
              html={cleaned}
              filename={deriveDownloadName(file?.name)}
              onRegenerate={generate}
              disabled={isStreaming || !file}
            />
          </div>
          <PreviewIframe html={cleaned} empty={!html} />
        </section>
      </main>

      <footer className="footer">instyle group · ig-builder light</footer>
    </>
  );
}
