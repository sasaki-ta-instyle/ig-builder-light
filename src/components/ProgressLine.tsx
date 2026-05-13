"use client";

export type Phase = "idle" | "reading" | "thinking" | "writing" | "done" | "truncated" | "error";

const LABEL: Record<Phase, string> = {
  idle: "待機中",
  reading: "資料を読み取っています",
  thinking: "情報構造を組み立てています",
  writing: "HTML を生成しています",
  done: "完成しました",
  truncated: "出力上限で途中停止しました",
  error: "エラーが発生しました",
};

export function ProgressLine({
  phase,
  detail,
  tokensIn,
  tokensOut,
  cacheRead,
}: {
  phase: Phase;
  detail?: string;
  tokensIn?: number;
  tokensOut?: number;
  cacheRead?: number;
}) {
  return (
    <div className="progress" data-phase={phase}>
      <span className="progress__dot" aria-hidden="true" />
      <div>
        <div style={{ fontWeight: 600 }}>{LABEL[phase]}</div>
        {detail && <div className="progress__detail">{detail}</div>}
      </div>
      {(phase === "done" || phase === "truncated") && (tokensIn ?? 0) > 0 && (
        <div className="progress__usage">
          in {tokensIn?.toLocaleString()} / out {tokensOut?.toLocaleString()}
          {(cacheRead ?? 0) > 0 && ` / cache ${cacheRead?.toLocaleString()}`}
        </div>
      )}
    </div>
  );
}
