// A small line chart drawn as SVG, plus a table with the same numbers (the table is what screen readers use).
// It draws only the numbers the person typed. It has no "normal range" line and says nothing about good or bad.

type Point = { date: string; value: number };

export function LineChart({ title, unit, points }: { title: string; unit: string; points: Point[] }) {
  const W = 560;
  const H = 200;
  const pad = { left: 44, right: 16, top: 16, bottom: 36 };
  const max = Math.max(...points.map((p) => p.value), 1) * 1.1;
  const x = (i: number) => pad.left + (points.length === 1 ? (W - pad.left - pad.right) / 2 : (i * (W - pad.left - pad.right)) / (points.length - 1));
  const y = (v: number) => pad.top + (1 - v / max) * (H - pad.top - pad.bottom);
  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const summary = `${title}: ${points.map((p) => `${p.value} on ${p.date}`).join(", ")}.`;

  return (
    <figure className="space-y-2" data-testid="lab-chart">
      <figcaption className="text-sm font-semibold text-navy">
        {title} <span className="font-normal text-muted">({unit})</span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={summary} className="w-full max-w-xl">
        <line x1={pad.left} y1={H - pad.bottom} x2={W - pad.right} y2={H - pad.bottom} stroke="#c9d1de" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={H - pad.bottom} stroke="#c9d1de" />
        <text x={pad.left - 6} y={H - pad.bottom + 4} textAnchor="end" fontSize="11" fill="#68758a">
          0
        </text>
        <text x={pad.left - 6} y={pad.top + 8} textAnchor="end" fontSize="11" fill="#68758a">
          {Math.round(max)}
        </text>
        {points.length > 1 && <polyline points={line} fill="none" stroke="#0e8a7c" strokeWidth="2.5" />}
        {points.map((p, i) => (
          <g key={`${p.date}-${i}`}>
            <circle cx={x(i)} cy={y(p.value)} r="5" fill="#0e8a7c" />
            <text x={x(i)} y={y(p.value) - 10} textAnchor="middle" fontSize="11" fill="#101b35">
              {p.value}
            </text>
            <text x={x(i)} y={H - pad.bottom + 16} textAnchor="middle" fontSize="10" fill="#68758a">
              {p.date}
            </text>
          </g>
        ))}
      </svg>
      <table className="w-full max-w-xl text-sm">
        <caption className="sr-only">{title} by date</caption>
        <thead>
          <tr className="text-left text-muted">
            <th scope="col" className="py-1 pr-4 font-medium">
              Date
            </th>
            <th scope="col" className="py-1 font-medium">
              Value you entered ({unit})
            </th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={`${p.date}-${i}`} className="border-t border-border">
              <td className="py-1 pr-4">{p.date}</td>
              <td className="py-1 font-medium">{p.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
