import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { listOwners, removeOwner } from "../owner";
import AppHeader from "../components/AppHeader.jsx";
import { DailyChart, HourChart, InsightList, Kpi, RangeToggle } from "../components/Charts.jsx";
import "./Insights.css";
import { PageLoader } from "../components/Loading.jsx";

const STATUS_LABEL = { open: "Open", break: "On break", closed: "Closed" };
const mins = (v) => (v == null ? "–" : `${Math.round(v)}m`);

export default function MyShops() {
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");
  const [legacy, setLegacy] = useState(() => listOwners());
const [list, setList] = useState(null);   // fast: shops only
  const [data, setData] = useState(null);    // slower: live numbers + analytics
  const [overviewLoading, setOverviewLoading] = useState(true);

  // Stage 1: just the shops, so the page is usable immediately.
  const loadList = useCallback(
    () =>
      api
        .myStores()
        .then((l) => {
          setList(l);
          setError("");
        })
        .catch((err) => {
          if (err.status !== 401) setError(err.message);
        }),
    []
  );

  // Stage 2: live numbers and analytics. Old data stays on screen while refreshing.
  const loadOverview = useCallback(() => {
    setOverviewLoading(true);
    return api
      .overview(days)
      .then((d) => {
        setData(d);
        setError("");
      })
      .catch((err) => {
        if (err.status !== 401) setError(err.message);
      })
      .finally(() => setOverviewLoading(false));
  }, [days]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadOverview();
    const timer = setInterval(loadOverview, 30000);
    return () => clearInterval(timer);
  }, [loadOverview]);


  

  // Shops created before accounts existed: attach them using the old key saved on this device.
  async function claimLegacy(publicId) {
    setError("");
    try {
      const saved = JSON.parse(localStorage.getItem(`owner:${publicId}`) || "null");
      await api.claimStore(publicId, saved?.owner_key || "");
      removeOwner(publicId);
      setLegacy(listOwners());
      await load();
    } catch (err) {
      setError(err.message);
    }
  }



    // Rich cards once the overview arrives, plain cards until then.
  const cards = data?.shops || list || [];
  const hasLive = !!data;
  const summary = data?.summary;
  const claimable = legacy.filter((l) => !cards.some((s) => s.public_id === l.publicId));
  const waitingNow = cards.reduce((n, s) => n + (s.waiting_now ?? 0), 0);
  const openCount = cards.filter((s) => s.status === "open").length;


  let dropoff = null;
  if (summary && summary.totals.joined > 0) {
    dropoff = Math.round(
      ((summary.totals.cancelled + summary.totals.no_show) / summary.totals.joined) * 100
    );
  }

  return (
    <div className="ins-page">
      <AppHeader variant="light" />

            <main className="ins-container">
        <div className="ins-head">
          <div>
            <p className="ins-eyebrow">YOUR BUSINESS</p>
            <h1>Your shops</h1>
            <p className="ins-sub">
              {cards.length === 0
                ? "Choose a shop to manage its queue."
                : hasLive
                ? `${waitingNow} ${waitingNow === 1 ? "customer" : "customers"} waiting now across ${openCount} open ${openCount === 1 ? "shop" : "shops"}`
                : `${cards.length} ${cards.length === 1 ? "shop" : "shops"}`}
            </p>
          </div>
          <div className="ins-actions">
            <Link className="ins-btn primary" to="/register">+ Add shop</Link>
          </div>
        </div>

        {error && <p className="ins-error">{error}</p>}
        {list === null && !error && <PageLoader text="Loading your shops…" />}

        {list && cards.length === 0 && claimable.length === 0 && (
          <div className="ins-card ins-empty">
            <h2>No shops yet</h2>
            <p className="ins-muted">Set up your first shop to start managing a queue.</p>
            <p><Link className="ins-btn primary" to="/register">Set up a shop</Link></p>
          </div>
        )}

        {/* 1. Shops: the main thing owners come here for */}
        {cards.length > 0 && (
          <div className="ins-shop-list">
            {cards.map((shop) => (
              <div className="ins-shop" key={shop.public_id}>
                <div>
                  <h3>{shop.name}</h3>
                  <div className="ins-shop-meta">
                    <span className={`ins-pill ${shop.status}`}>
                      {STATUS_LABEL[shop.status] || shop.status}
                    </span>
                    {shop.address && <span>{shop.address}</span>}
                  </div>
                </div>

                <div className="ins-shop-stats">
                  {hasLive ? (
                    <>
                      <div><strong>{shop.waiting_now}</strong><span>Waiting</span></div>
                      <div><strong>{shop.today.done}</strong><span>Served today</span></div>
                      <div><strong>{shop.totals.joined}</strong><span>{days}d total</span></div>
                      <div><strong>{mins(shop.avg_wait_minutes)}</strong><span>Avg. wait</span></div>
                    </>
                  ) : (
                    [0, 1, 2, 3].map((i) => <div key={i} className="ld-skeleton" />)
                  )}
                </div>

                <div className="ins-shop-actions">
                  <Link className="ins-btn primary" to={`/shop/${shop.public_id}/manage`}>
                    Manage queue
                  </Link>
                  <Link className="ins-btn" to={`/shop/${shop.public_id}/insights`}>
                    Insights
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {claimable.length > 0 && (
          <section className="ins-card">
            <h2>Older shops on this device</h2>
            <p className="ins-muted">
              These were created before accounts existed. Add them to your account to manage them.
            </p>
            <div className="ins-shop-list">
              {claimable.map((shop) => (
                <div className="ins-shop" key={shop.publicId}>
                  <div><h3>{shop.name}</h3></div>
                  <div />
                  <div className="ins-shop-actions">
                    <button className="ins-btn" onClick={() => claimLegacy(shop.publicId)}>
                      Add to my account
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 2. Business overview: secondary */}
        {!summary && list && list.length > 0 && overviewLoading && (
          <div className="ins-card">
            <div className="ld-skeleton" style={{ height: 120 }} />
          </div>
        )}
        {summary && (
          <div style={{ opacity: overviewLoading ? 0.6 : 1, transition: "opacity .2s" }}>
            <div className="ins-head ins-section-head">
              <div>
                <h2 className="ins-section-title">Business overview</h2>
                <p className="ins-sub">All shops combined · last {days} days</p>
              </div>
              <RangeToggle days={days} onChange={setDays} />
            </div>

            <div className="ins-kpis">
              <Kpi
                label="Customers"
                value={summary.totals.joined}
                change={summary.change.joined}
                hint="joined the queue"
              />
              <Kpi
                label="Served"
                value={summary.totals.done}
                change={summary.change.done}
                hint="completed"
              />
              <Kpi
                label="Avg. wait"
                value={mins(summary.avg_wait_minutes)}
                hint="from joining to being called"
              />
              <Kpi
                label="Drop-off"
                value={dropoff == null ? "–" : `${dropoff}%`}
                hint="left the queue or missed their turn"
              />
            </div>

            <section className="ins-card">
              <h2>Insights</h2>
              <InsightList items={summary.insights} />
            </section>

            <div className="ins-grid">
              <section className="ins-card">
                <h2>Customers per day</h2>
                <DailyChart daily={summary.daily} />
                <div className="ins-legend">
                  <span><i style={{ background: "#4f46e5" }} />Served</span>
                  <span><i style={{ background: "#e0e7ff" }} />Other</span>
                </div>
              </section>
              <section className="ins-card">
                <h2>Busiest hours</h2>
                <HourChart hours={summary.hours} />
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}