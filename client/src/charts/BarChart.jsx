import { useState } from 'react';
import { formatCompact, formatINR } from '../utils.js';

/**
 * Responsive SVG bar chart.
 * data: [{ label, value }]
 */
export default function BarChart({ data, color = '#2a78d6', width = 640, height = 240, activeIndex, onBarClick }) {
  const [hover, setHover] = useState(null);

  const pad = { top: 16, right: 8, bottom: 28, left: 52 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const max = Math.max(...data.map((d) => d.value), 0);
  const niceMax = niceCeil(max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * niceMax);

  const slot = innerW / data.length;
  const barW = Math.min(slot * 0.6, 48);

  const y = (v) => pad.top + innerH - (niceMax ? (v / niceMax) * innerH : 0);

  return (
    <div className="chart position-relative">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="#e5e7eb" />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end">
              {formatCompact(t)}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = pad.left + slot * i + (slot - barW) / 2;
          const h = pad.top + innerH - y(d.value);
          return (
            <g key={d.label}>
              <rect
                className={`bar ${activeIndex === i ? 'active' : ''}`}
                x={x}
                y={y(d.value)}
                width={barW}
                height={Math.max(h, d.value > 0 ? 1 : 0)}
                rx="3"
                fill={activeIndex === i ? '#1e3a8a' : color}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onClick={() => onBarClick?.(i)}
              />
              <text x={x + barW / 2} y={height - 8} textAnchor="middle">
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="position-absolute bg-dark text-white small rounded px-2 py-1 pe-none"
          style={{
            left: `${((pad.left + slot * hover + slot / 2) / width) * 100}%`,
            top: `${(y(data[hover].value) / height) * 100}%`,
            transform: 'translate(-50%, -120%)',
            whiteSpace: 'nowrap',
          }}
        >
          {data[hover].label}: {formatINR(data[hover].value)}
        </div>
      )}
    </div>
  );
}

function niceCeil(value) {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 2, 2.5, 5, 10];
  const step = steps.find((s) => s * magnitude >= value);
  return step * magnitude;
}
