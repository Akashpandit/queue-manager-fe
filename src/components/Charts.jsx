export function RangeToggle({ days, onChange }) {
  return (
    <div className="ins-range" role="group" aria-label="Time range">
      {[7, 30].map((d) => (
        <button
          key={d}
          type="button"
          className={days === d ? "on" : ""}
          onClick={() => onChange(d)}
        >
          {d} days
        </button>
      ))}
    </div>
  );
}

export function Kpi({ label, value, change, hint }) {
  return (
    <div className="ins-kpi">
      <span className="ins-kpi-label">{label}</span>
      <strong className="ins-kpi-value">{value}</strong>
      {change != null ? (
        <span className={`ins-change ${change >= 0 ? "up" : "down"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change)}% vs previous period
        </span>
      ) : (
        <span className="ins-kpi-hint">{hint}</span>
      )}
    </div>
  );
}

function dayLabel(date, short) {
  const d = new Date(`${date}T00:00:00`);
  return short
    ? d.toLocaleDateString(undefined, { weekday: "short" })
    : String(d.getDate());
}

export function DailyChart({ daily }) {
  const max = Math.max(1, ...daily.map((d) => d.joined));
  const short = daily.length <= 7;
  return (
    <div className="ins-chart" role="img" aria-label="Customers per day">
      {daily.map((d, i) => (
        <div
          className="ins-col"
          key={d.date}
          title={`${d.date}: ${d.joined} joined, ${d.done} served`}
        >
          <span className="ins-col-num">{d.joined || ""}</span>
          <div className="ins-col-track">
            <div className="ins-bar" style={{ height: `${(d.joined / max) * 100}%` }}>
              <div
                className="ins-bar-done"
                style={{ height: d.joined ? `${(d.done / d.joined) * 100}%` : 0 }}
              />
            </div>
          </div>
          <span className="ins-col-label">
            {short || i % 5 === 0 ? dayLabel(d.date, short) : ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export function HourChart({ hours }) {
  const active = hours.map((v, h) => (v > 0 ? h : -1)).filter((h) => h >= 0);
  const lo = Math.min(8, active[0] ?? 8);
  const hi = Math.max(20, active[active.length - 1] ?? 20);
  const slice = [];
  for (let h = lo; h <= hi; h++) slice.push([h, hours[h]]);
  const max = Math.max(1, ...slice.map(([, v]) => v));
  const label = (h) => `${h % 12 || 12}${h < 12 ? "a" : "p"}`;

  return (
    <div className="ins-chart ins-chart-hours" role="img" aria-label="Customers by hour">
      {slice.map(([h, v]) => (
        <div className="ins-col" key={h} title={`${label(h)}: ${v} customers`}>
          <span className="ins-col-num">{v || ""}</span>
          <div className="ins-col-track">
            <div
              className={`ins-bar ins-bar-hour ${v === max && v > 0 ? "peak" : ""}`}
              style={{ height: `${(v / max) * 100}%` }}
            />
          </div>
          <span className="ins-col-label">{h % 2 === 0 ? label(h) : ""}</span>
        </div>
      ))}
    </div>
  );
}

export function InsightList({ items }) {
  if (!items?.length) {
    return <p className="ins-muted">No insights yet. Check back after a few busy days.</p>;
  }
  const icon = { info: "i", tip: "↑", warn: "!" };
  return (
    <ul className="ins-insights">
      {items.map((item, i) => (
        <li key={i} className={`ins-insight ${item.level}`}>
          <span className="ins-insight-icon">{icon[item.level] || "i"}</span>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  );
}