"use client";

import { useMemo, useState } from "react";
import { METRICS, type MetricKey } from "./metrics";
import { addDays, shortDate } from "@/lib/dates";
import type { HabitEntry } from "./analysis";

// An interactive line chart of the person's own numbers. Pick a measure and a time range.
// Hover, tap or use the keyboard on a dot to read its value. A table with the same numbers sits below for screen readers.
// No normal range and no colours for good or bad.

const RANGES = [14, 30, 90] as const;

export function TrendChart({ entries, today }: { entries: HabitEntry[]; today: string }) {
  const [metricKey, setMetricKey] = useState<MetricKey>("sleepHours");
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const [active, setActive] = useState<number | null>(null);

  const metric = METRICS.find((m) => m.key === metricKey)!;
  const from = addDays(today, -(range - 1));
  const points = useMemo(
    () =>
      entries
        .filter((e) => e.date >= from && e.date <= today && typeof e[metricKey] === "number")
        .map((e) => ({ date: e.date, value: e[metricKey] as number })),
    [entries, from, today, metricKey],
  );

  const W = 640;
  const H = 220;
  const pad = { left: 44, right: 16, top: 16, bottom: 32 };
  const maxV = Math.max(...points.map((p) => p.value), metric.key === "stress" ? 5 : 1) * 1.1;
  const span = range - 1;
  const x = (date: string) => pad.left + ((Date.parse(date) - Date.parse(from)) / 86_400_000 / span) * (W - pad.left - pad.right);
  const y = (v: number) => pad.top + (1 - v / maxV) * (H - pad.top - pad.bottom);
  const activePoint = active !== null ? points[active] : null;

  return (
    <div className="space-y-3" data-testid="trend-chart">
      <div className="flex flex-wrap items-end gap-3">
        <label className="space-y-1 text-sm font-medium text-navy">
          Measure
          <select
            value={metricKey}
            onChange={(e) => {
              setMetricKey(e.target.value as MetricKey);
              setActive(null);
            }}
            className="block min-h-11 rounded-lg border border-border bg-white px-3 text-sm"
          >
            {METRICS.map((m) => (
              <option key={m.key} value={m.key}>
                {m.short} ({m.unit})
              </option>
            ))}
          </select>
        </label>
        <div role="group" aria-label="Time range" className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={range === r}
              onClick={() => {
                setRange(r);
                setActive(null);
              }}
              className={`min-h-11 rounded-lg border px-4 text-sm font-medium ${range === r ? "border-teal-dark bg-teal-light text-navy" : "border-border bg-white text-muted"}`}
            >
              {r} days
            </button>
          ))}
        </div>
      </div>

      {points.length === 0 ? (
        <p className="text-sm text-muted">No {metric.short.toLowerCase()} entries in the last {range} days.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`${metric.short} over the last ${range} days. ${points.length} entries.`} className="w-full max-w-2xl">
            <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke="#c9d1de" />
            <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom} stroke="#c9d1de" />
            <text x={pad.left - 6} y={H - pad.bottom + 4} textAnchor="end" fontSize="11" fill="#68758a">
              0
            </text>
            <text x={pad.left - 6} y={pad.top + 8} textAnchor="end" fontSize="11" fill="#68758a">
              {Math.round(maxV * 10) / 10}
            </text>
            <text x={pad.left} y={H - 8} fontSize="10" fill="#68758a">
              {shortDate(from)}
            </text>
            <text x={W - pad.right} y={H - 8} textAnchor="end" fontSize="10" fill="#68758a">
              {shortDate(today)}
            </text>
            {points.length > 1 && <polyline points={points.map((p) => `${x(p.date)},${y(p.value)}`).join(" ")} fill="none" stroke="#0e8a7c" strokeWidth="2.5" />}
            {points.map((p, i) => (
              <circle
                key={p.date}
                cx={x(p.date)}
                cy={y(p.value)}
                r={active === i ? 7 : 5}
                fill="#0e8a7c"
                tabIndex={0}
                role="button"
                aria-label={`${shortDate(p.date)}: ${p.value} ${metric.unit}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                className="cursor-pointer outline-none focus-visible:stroke-navy focus-visible:stroke-2"
              />
            ))}
          </svg>
          <p aria-live="polite" className="min-h-6 text-sm font-medium text-navy" data-testid="chart-readout">
            {activePoint ? `${shortDate(activePoint.date)}: ${activePoint.value} ${metric.unit}` : "Tap or hover a dot to read its value."}
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer font-medium text-teal-dark">Show these numbers as a table</summary>
            <table className="mt-2 w-full max-w-md">
              <caption className="sr-only">
                {metric.short} entries, last {range} days
              </caption>
              <thead>
                <tr className="text-left text-muted">
                  <th scope="col" className="py-1 pr-4 font-medium">
                    Day
                  </th>
                  <th scope="col" className="py-1 font-medium">
                    {metric.unit}
                  </th>
                </tr>
              </thead>
              <tbody>
                {points.map((p) => (
                  <tr key={p.date} className="border-t border-border">
                    <td className="py-1 pr-4">{shortDate(p.date)}</td>
                    <td className="py-1 font-medium">{p.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}
