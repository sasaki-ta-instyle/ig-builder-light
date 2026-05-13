"use client";
import { useEffect, useRef, useState } from "react";

const THROTTLE_MS = 400;

export function PreviewIframe({ html, empty }: { html: string; empty?: boolean }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcdoc, setSrcdoc] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!html) {
      setSrcdoc("");
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSrcdoc(html), THROTTLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [html]);

  if (empty) {
    return (
      <div className="preview__frame-wrap">
        <div className="preview__placeholder">
          <div className="preview__placeholder-icon">✦</div>
          <p style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 15, color: "var(--color-text)" }}>
            ここにリデザインされたページが表示されます
          </p>
          <p style={{ margin: 0, fontSize: 12 }}>左側で資料を選び、「リデザインする」を押してください</p>
        </div>
      </div>
    );
  }

  return (
    <div className="preview__frame-wrap">
      <iframe
        ref={iframeRef}
        className="preview__frame"
        title="リデザインプレビュー"
        sandbox="allow-same-origin"
        srcDoc={srcdoc || "<!DOCTYPE html><html><body style='background:#fff;color:#82837A;font-family:system-ui;padding:48px;'>生成中…</body></html>"}
      />
    </div>
  );
}
