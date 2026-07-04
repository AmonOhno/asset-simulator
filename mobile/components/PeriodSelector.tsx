import { useEffect, useRef, type CSSProperties } from "react";
import { SelectInput } from "./SelectInput";
import { NumericInput } from "./NumericInput";
import { DateInput } from "./DateInput";
import {
  computePeriodRange,
  shiftPeriodRange,
  type PeriodPreset,
  type PeriodRange,
  type PeriodSettings,
  type HolidayAdjustment,
} from "./periodSelector.utils";

interface PeriodSelectorProps {
  range: PeriodRange;
  onChange: (range: PeriodRange) => void;
  preset: PeriodPreset;
  onPresetChange: (preset: PeriodPreset) => void;
  settings: PeriodSettings;
  onSettingsChange: (settings: PeriodSettings) => void;
}

const presetOptions = [
  { label: "週単位", value: "week" },
  { label: "月単位", value: "month" },
  { label: "年単位", value: "year" },
  { label: "カスタム", value: "custom" },
];

const dayOfWeekOptions = ["日", "月", "火", "水", "木", "金", "土"].map((d, i) => ({
  label: `${d}曜日`,
  value: i,
}));

const holidayOptions = [
  { label: "ずらしなし", value: "none" },
  { label: "前倒し", value: "before" },
  { label: "後倒し", value: "after" },
];

const styles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  } satisfies CSSProperties,
  row: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    alignItems: "center",
  } satisfies CSSProperties,
  navButton: {
    flexShrink: 0,
    width: 36,
    height: 32,
    borderRadius: 8,
    border: "1px solid #D1D5DB",
    backgroundColor: "#F9FAFB",
    color: "#374151",
    fontSize: 16,
    fontWeight: 700,
    cursor: "pointer",
  } satisfies CSSProperties,
  separator: {
    alignSelf: "center",
    color: "#6B7280",
  } satisfies CSSProperties,
};

export function PeriodSelector({
  range,
  onChange,
  preset,
  onPresetChange,
  settings,
  onSettingsChange,
}: PeriodSelectorProps) {
  // 親が毎レンダーで新しい onChange を渡しても効果が再実行されないよう ref 経由で参照する。
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  // プリセット/設定が変わったとき（custom 以外）に範囲を再計算して通知する。
  // range を依存に含めないことで、矢印操作や親の更新による再計算ループを防ぐ。
  const didMountRef = useRef(false);
  useEffect(() => {
    // 再マウント時に保持済みの範囲（矢印移動後の値を含む）を初期設定で上書きしないよう、初回実行だけスキップ
    if (!didMountRef.current) { didMountRef.current = true; return; }
    if (preset === "custom") return;
    const next = computePeriodRange(preset, settings);
    if (next) onChangeRef.current(next);
  }, [preset, settings]);

  const updateSetting = <K extends keyof PeriodSettings>(key: K, value: PeriodSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  const handleShift = (direction: "prev" | "next") => {
    const next = shiftPeriodRange(preset, settings, range, direction);
    if (next) onChange(next);
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.row}>
        {preset !== "custom" && (
          <>
            <button type="button" aria-label="前の期間へ" style={styles.navButton} onClick={() => handleShift("prev")}>
              ←
            </button>
            <button type="button" aria-label="次の期間へ" style={styles.navButton} onClick={() => handleShift("next")}>
              →
            </button>
          </>
        )}
        <SelectInput
          options={presetOptions}
          value={preset}
          onChange={(v) => onPresetChange(v as PeriodPreset)}
          sizeVariant="S"
          fontSize="S"
        />

        {preset === "week" && (
          <SelectInput
            options={dayOfWeekOptions}
            value={settings.startDayOfWeek}
            onChange={(v) => updateSetting("startDayOfWeek", Number(v))}
            sizeVariant="S"
            fontSize="S"
          />
        )}

        {preset === "month" && (
          <>
            <NumericInput
              value={settings.startDayOfMonth}
              unit="日開始"
              min={1}
              max={31}
              onBlur={(v) => updateSetting("startDayOfMonth", v)}
              sizeVariant="S"
              fontSize="S"
            />
            <SelectInput
              options={holidayOptions}
              value={settings.holidayAdjustment}
              onChange={(v) => updateSetting("holidayAdjustment", v as HolidayAdjustment)}
              sizeVariant="S"
              fontSize="S"
            />
          </>
        )}

        {preset === "year" && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <NumericInput
              value={settings.startMonth}
              unit="月"
              min={1}
              max={12}
              onBlur={(v) => updateSetting("startMonth", v)}
              sizeVariant="S"
              fontSize="S"
            />
            <NumericInput
              value={settings.startMonthDay}
              unit="日"
              min={1}
              max={31}
              onBlur={(v) => updateSetting("startMonthDay", v)}
              sizeVariant="S"
              fontSize="S"
            />
          </div>
        )}
      </div>

      <div style={styles.row}>
        <DateInput
          value={range.startDate}
          readOnly={preset !== "custom"}
          onChange={(v) => onChange({ ...range, startDate: v })}
          sizeVariant="S"
        />
        <span style={styles.separator}>〜</span>
        <DateInput
          value={range.endDate}
          readOnly={preset !== "custom"}
          onChange={(v) => onChange({ ...range, endDate: v })}
          sizeVariant="S"
        />
      </div>
    </div>
  );
}
