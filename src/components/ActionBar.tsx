"use client";
import { useState } from "react";

export function ActionBar({
  html,
  filename,
  onRegenerate,
  disabled,
}: {
  html: string;
  filename: string;
  onRegenerate: () => void;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const download = () => {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(html);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no-op */
    }
  };

  return (
    <div className="preview__actions">
      <button type="button" className="btn-ghost" onClick={onRegenerate} disabled={disabled}>
        やり直す
      </button>
      <button type="button" className="btn-ghost" onClick={copy} disabled={disabled || !html}>
        {copied ? "コピーしました" : "コピー"}
      </button>
      <button type="button" className="btn-ghost" onClick={download} disabled={disabled || !html}>
        ダウンロード
      </button>
    </div>
  );
}
