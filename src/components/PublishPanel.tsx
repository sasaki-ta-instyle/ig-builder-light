"use client";
import { useState } from "react";

const FILENAME_RE = /^[a-z][a-z0-9_-]{0,63}$/;
type Category = "cpc" | "crhr";
type Status = "idle" | "submitting" | "exists" | "success" | "error";

function validateFilename(value: string): string | null {
  if (!value) return null;
  if (!FILENAME_RE.test(value)) {
    return "英小文字で始まり、英小文字・数字・ハイフン・アンダースコア（64 文字まで）";
  }
  return null;
}

export function PublishPanel({
  html,
  disabled,
  basePath,
}: {
  html: string;
  disabled: boolean;
  basePath: string;
}) {
  const [category, setCategory] = useState<Category>("cpc");
  const [filename, setFilename] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [existingUrl, setExistingUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filenameError = validateFilename(filename);
  const canSubmit =
    !disabled &&
    Boolean(html) &&
    filename.length > 0 &&
    !filenameError &&
    status !== "submitting";

  const submit = async (overwrite: boolean) => {
    setStatus("submitting");
    setErrorMessage(null);
    if (!overwrite) {
      setPublishedUrl(null);
      setExistingUrl(null);
    }

    try {
      const res = await fetch(`${basePath}/api/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html, filename, category, overwrite }),
      });

      const data: {
        ok?: boolean;
        code?: string;
        message?: string;
        url?: string;
        filename?: string;
      } = await res.json().catch(() => ({}));

      if (res.ok && data.ok && data.url) {
        setStatus("success");
        setPublishedUrl(data.url);
        return;
      }

      if (res.status === 409 && data.url) {
        setStatus("exists");
        setExistingUrl(data.url);
        return;
      }

      setStatus("error");
      setErrorMessage(data.message ?? `失敗しました (HTTP ${res.status})`);
    } catch (err: unknown) {
      setStatus("error");
      setErrorMessage((err as Error).message ?? "ネットワークエラー");
    }
  };

  const copy = async () => {
    if (!publishedUrl) return;
    try {
      await navigator.clipboard.writeText(publishedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* no-op */
    }
  };

  const reset = () => {
    setStatus("idle");
    setPublishedUrl(null);
    setExistingUrl(null);
    setErrorMessage(null);
  };

  return (
    <div className="publish">
      <div className="publish__row publish__row--top">
        <div className="publish__segment" role="radiogroup" aria-label="公開先サブドメイン">
          {(["cpc", "crhr"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={category === c}
              className={`publish__segment-btn${category === c ? " is-active" : ""}`}
              onClick={() => setCategory(c)}
              disabled={disabled || status === "submitting"}
            >
              {c}.instyle.group
            </button>
          ))}
        </div>
      </div>

      <div className="publish__row">
        <div className="publish__field">
          <input
            type="text"
            className="publish__input"
            placeholder="例: ig-canele-estimate"
            value={filename}
            onChange={(e) => {
              setFilename(e.target.value);
              if (status !== "idle" && status !== "submitting") reset();
            }}
            disabled={disabled || status === "submitting"}
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
          <span className="publish__suffix">.html</span>
        </div>
        <button
          type="button"
          className="btn-primary publish__apply"
          disabled={!canSubmit}
          onClick={() => submit(false)}
        >
          {status === "submitting" ? "公開中…" : "公開する"}
        </button>
      </div>

      {filenameError && <div className="publish__hint publish__hint--err">{filenameError}</div>}
      {!filenameError && filename && (
        <div className="publish__hint">
          公開URL: https://{category}.instyle.group/html/{filename}.html
        </div>
      )}

      {status === "exists" && existingUrl && (
        <div className="publish__exists">
          <div className="publish__exists-msg">
            同名ファイルが既に存在します。
            <a href={existingUrl} target="_blank" rel="noreferrer" className="publish__exists-link">
              現在の公開ファイルを開く
            </a>
          </div>
          <div className="publish__exists-row">
            <button
              type="button"
              className="btn-primary publish__overwrite"
              onClick={() => submit(true)}
            >
              上書きする
            </button>
            <button type="button" className="btn-ghost" onClick={reset}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {status === "success" && publishedUrl && (
        <div className="publish__result">
          <div className="publish__result-label">公開しました</div>
          <div className="publish__result-row">
            <input
              type="text"
              className="publish__result-url"
              value={publishedUrl}
              readOnly
              onFocus={(e) => e.currentTarget.select()}
            />
            <button type="button" className="btn-ghost" onClick={copy}>
              {copied ? "コピーしました" : "コピー"}
            </button>
            <a
              className="btn-ghost"
              href={publishedUrl}
              target="_blank"
              rel="noreferrer"
            >
              開く
            </a>
          </div>
        </div>
      )}

      {status === "error" && errorMessage && <div className="toast">{errorMessage}</div>}
    </div>
  );
}
