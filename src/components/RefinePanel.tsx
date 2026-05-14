"use client";
import { useState } from "react";

const SUGGESTIONS = [
  "見出しをひとまわり大きく",
  "本文の文字を少し細く",
  "最後にお問い合わせのセクションを追加",
  "冒頭に注意書きを 1 行追加",
];

export function RefinePanel({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (instruction: string) => void;
}) {
  const [value, setValue] = useState("");

  const submit = () => {
    const v = value.trim();
    if (!v) return;
    onSubmit(v);
  };

  return (
    <div className="refine">
      <textarea
        className="refine__input"
        placeholder="例：見出しを大きく / 「お問い合わせ」を「相談する」に / 末尾にFAQセクションを追加 / 最後の段落を削除"
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
          }
        }}
      />
      <div className="refine__row">
        <div className="refine__hints">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              className="refine__hint"
              disabled={disabled}
              onClick={() => setValue((cur) => (cur ? `${cur}\n${s}` : s))}
            >
              {s}
            </button>
          ))}
        </div>
        <button type="button" className="btn-primary refine__apply" disabled={disabled || !value.trim()} onClick={submit}>
          適用する
        </button>
      </div>
    </div>
  );
}
