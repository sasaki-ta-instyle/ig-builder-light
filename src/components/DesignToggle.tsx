"use client";

export type DesignSystem = "flat" | "liquid";

export function DesignToggle({
  value,
  onChange,
  disabled,
}: {
  value: DesignSystem;
  onChange: (v: DesignSystem) => void;
  disabled?: boolean;
}) {
  return (
    <div className="toggle" role="group" aria-label="デザインシステム">
      <button
        type="button"
        className="toggle__btn"
        aria-pressed={value === "liquid"}
        disabled={disabled}
        onClick={() => onChange("liquid")}
      >
        リキッド
      </button>
      <button
        type="button"
        className="toggle__btn"
        aria-pressed={value === "flat"}
        disabled={disabled}
        onClick={() => onChange("flat")}
      >
        フラット
      </button>
    </div>
  );
}
