"use client";
import { useCallback, useRef, useState } from "react";
import { DropZone } from "@/components/DropZone";
import { DesignToggle, type DesignSystem } from "@/components/DesignToggle";
import { PreviewIframe } from "@/components/PreviewIframe";
import { ActionBar } from "@/components/ActionBar";
import { ProgressLine, type Phase } from "@/components/ProgressLine";

type DoneMeta = { tokensIn: number; tokensOut: number; cacheRead: number; finishReason: string };

function deriveDownloadName(srcName: string | undefined): string {
  if (!srcName) return "redesigned.html";
  const base = srcName.replace(/\.[^.]+$/, "");
  return `${base || "redesigned"}.html`;
}

function sanitizeHtml(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
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

  const generate = useCallback(async () => {
    if (!file) return;
    setError(null);
    setDone(null);
    setHtml("");
    setPhase("reading");
    setDetail("");

    const controller = new AbortController();
    abortRef.current = controller;

    const fd = new FormData();
    fd.append("file", file);
    fd.append("designSystem", designSystem);

    try {
      const res = await fetch("./api/generate", {
        method: "POST",
        body: fd,
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `生成に失敗しました (HTTP ${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let acc = "";

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
            if (ev === "progress") {
              setPhase(data.phase);
              setDetail(data.detail ?? "");
            } else if (ev === "html_delta") {
              acc += data.chunk;
              setHtml(acc);
            } else if (ev === "done") {
              setPhase("done");
              setDetail("");
              setDone({
                tokensIn: data.tokensIn,
                tokensOut: data.tokensOut,
                cacheRead: data.cacheRead ?? 0,
                finishReason: data.finishReason,
              });
            } else if (ev === "error") {
              setPhase("error");
              setError(data.message ?? "エラーが発生しました");
            }
          } catch {
            /* malformed chunk, ignore */
          }
        }
      }
    } catch (err: unknown) {
      if ((err as Error).name === "AbortError") return;
      setPhase("error");
      setError((err as Error).message ?? "生成に失敗しました");
    }
  }, [file, designSystem]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setPhase("idle");
    setDetail("");
  }, []);

  const cleaned = sanitizeHtml(html);

  return (
    <>
      <header className="header">
        <div className="header__brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="header__logo"
            src="https://app.instyle.group/_shared/static/logo.svg"
            alt="instyle group"
          />
          <h1 className="header__title">Builder Light</h1>
          <span className="header__tag">BETA</span>
        </div>
        <div className="header__sub">資料を入れると、instyle.group デザインで一枚の HTML に。</div>
      </header>

      <main className="main">
        <section className="controls">
          <div className="glass-panel">
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
            </div>
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
