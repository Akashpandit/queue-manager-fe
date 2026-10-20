import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api";
import AppHeader from "../components/AppHeader.jsx";
import { DailyChart, HourChart, InsightList, Kpi, RangeToggle } from "../components/Charts.jsx";
import "./Insights.css";


const mins = (v) => (v == null ? "–" : `${Math.round(v)}m`);

export default function ShopInsights() {
  const { publicId } = useParams();
  const [days, setDays] = useState(7);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .analytics(publicId, days)
      .then((d) => {
        if (active) {
          setData(d);
          setError("");
        }
      })
      .catch((err) => {
        if (!active) return;
        if (err.status === 403) setForbidden(true);
        else if (err.status !== 401) setError(err.message);
      });
    return () => {
      active = false;
    };
  }, [publicId, days]);

  if (forbidden) {
    return (
      <div className="ins-page">
        <AppHeader variant="light" />
        <main className="ins-container">
          <div className="ins-card ins-empty">
            <h2>No access</h2>
            <p className="ins-muted">This shop belongs to a different account.</p>
            <Link className="ins-btn primary" to="/shops">Back to my shops</Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="ins-page">
      <AppHeader variant="light" />
      <main className="ins-container">
        <div className="ins-head">
          <div>
            <p className="ins-eyebrow">INSIGHTS</p>
            <h1>{data?.store_name || "Shop insights"}</h1>
            <p className="ins-sub">Last {days} days</p>
          </div>
          <div className="ins-actions">
            <RangeToggle days={days} onChange={setDays} />
            <Link className="ins-btn" to={`/shop/${publicId}/manage`}>← Dashboard</Link>
          </div>
        </div>

        {error && <p className="ins-error">{error}</p>}
        {!data && !error && <p className="ins-muted">Loading insights…</p>}

        {data && (
          <>
            <div className="ins-kpis">
              <Kpi label="Customers" value={data.totals.joined} change={data.change.joined} hint="joined the queue" />
              <Kpi label="Served" value={data.totals.done} change={data.change.done} hint="completed" />
              <Kpi label="Avg. wait" value={mins(data.avg_wait_minutes)} hint="from joining to being called" />
              <Kpi label="Avg. service" value={mins(data.avg_service_minutes)} hint="actual time per customer" />
            </div>

            <section className="ins-card">
              <h2>Insights</h2>
              <InsightList items={data.insights} />
            </section>

            <div className="ins-grid">
              <section className="ins-card">
                <h2>Customers per day</h2>
                <DailyChart daily={data.daily} />
                <div className="ins-legend">
                  <span><i style={{ background: "#4f46e5" }} />Served</span>
                  <span><i style={{ background: "#e0e7ff" }} />Other</span>
                </div>
              </section>
              <section className="ins-card">
                <h2>Busiest hours</h2>
                <HourChart hours={data.hours} />
              </section>
            </div>

            <section className="ins-card">
              <h2>Services</h2>
              {data.services.length === 0 ? (
                <p className="ins-muted">No data for this period yet.</p>
              ) : (
                <table className="ins-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Customers</th>
                      <th>Set time</th>
                      <th>Actual avg.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.services.map((s) => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{s.count}</td>
                        <td>{s.configured_minutes ? `${s.configured_minutes}m` : "–"}</td>
                        <td>{mins(s.avg_minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}