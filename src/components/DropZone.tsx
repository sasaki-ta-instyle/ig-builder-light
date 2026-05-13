"use client";
import { useCallback, useState } from "react";

const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.gif,.docx,.doc,.pptx,.txt,.md,.markdown,.html,.htm";
const MAX_BYTES = 25 * 1024 * 1024;

export function DropZone({
  file,
  onFile,
  disabled,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    (f: File | null) => {
      setError(null);
      if (!f) {
        onFile(null);
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(`ファイルが大きすぎます（${(f.size / 1024 / 1024).toFixed(1)}MB > 25MB）`);
        return;
      }
      onFile(f);
    },
    [onFile],
  );

  return (
    <div>
      <label
        className="drop"
        data-dragging={dragging || undefined}
        data-has-file={Boolean(file) || undefined}
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0] ?? null;
          handleFile(f);
        }}
      >
        <input
          type="file"
          accept={ACCEPT}
          disabled={disabled}
          onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <>
            <div className="drop__icon">📄</div>
            <div className="drop__file">{file.name}</div>
            <div className="drop__filesize">{(file.size / 1024).toFixed(1)} KB</div>
            <div className="drop__sub" style={{ marginTop: 8 }}>クリックして別のファイルに変更</div>
          </>
        ) : (
          <>
            <div className="drop__icon">⤵︎</div>
            <p className="drop__title">資料をドロップ</p>
            <p className="drop__sub">PDF / 画像 / Word / PowerPoint / HTML / TXT（〜25MB）</p>
          </>
        )}
      </label>
      {error && <div className="toast">{error}</div>}
    </div>
  );
}
