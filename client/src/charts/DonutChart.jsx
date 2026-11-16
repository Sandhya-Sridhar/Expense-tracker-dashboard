import { useState } from 'react';
import { formatINR } from '../utils.js';

/**
 * SVG donut chart built from arc paths.
 * data: [{ label, value, color }]
 */
export default function DonutChart({ data, size = 220 }) {
  const [hover, setHover] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  const r = size / 2;
  const inner = r * 0.62;

  if (!total) {
    return <p className="text-muted text-center my-5">No spending recorded for this period.</p>;
  }

  let angle = -Math.PI / 2;
  const slices = data.map((d) => {
    const sweep = (d.value / total) * Math.PI * 2;
    const start = angle;
    angle += sweep;
    return { ...d, start, end: angle, pct: (d.value / total) * 100 };
  });

  const focus = hover !== null ? slices[hover] : null;

  return (
    <div className="row align-items-center g-3">
      <div className="col-sm-6 chart">
        <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Spending by category">
          {slices.map((s, i) => (
            <path
              key={s.label}
              d={arcPath(r, r, r - 2, inner, s.start, s.end)}
              fill={s.color}
              stroke="#fff"
              strokeWidth="2"
              opacity={hover === null || hover === i ? 1 : 0.35}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
          <text x={r} y={r - 6} textAnchor="middle" style={{ fontSize: 12 }}>
            {focus ? focus.label : 'Total'}
          </text>
          <text x={r} y={r + 16} textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: '#111827' }}>
            {formatINR(focus ? focus.value : total)}
          </text>
        </svg>
      </div>
      <div className="col-sm-6">
        <ul className="list-unstyled small mb-0">
          {slices.map((s, i) => (
            <li
              key={s.label}
              className={`d-flex justify-content-between py-1 ${hover === i ? 'fw-semibold' : ''}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <span>
                <span className="legend-swatch" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="text-muted">{s.pct.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function arcPath(cx, cy, outer, inner, start, end) {
  // A full circle can't be drawn with one arc; nudge the end angle slightly
  if (end - start >= Math.PI * 2) end = start + Math.PI * 2 - 0.0001;
  const large = end - start > Math.PI ? 1 : 0;
  const p = (radius, a) => [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  const [x1, y1] = p(outer, start);
  const [x2, y2] = p(outer, end);
  const [x3, y3] = p(inner, end);
  const [x4, y4] = p(inner, start);
  return `M ${x1} ${y1} A ${outer} ${outer} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
}
