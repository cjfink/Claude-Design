/* PublicMap.jsx — public / vendor-facing view. Find My Booth, legend, minimap. */
(function () {
  const { useState, useMemo, useEffect } = React;
  const { categorizeVendor, CATEGORY_COLORS, VENDOR_CATEGORIES, EVENT } = window.TCCF;
  const { Sheet, MiniMap, Legend, Avatar } = window.TCCFUI;
  const FOREST = "#4A4B35", CREMA = "#EBE5DB", CORAL = "#AA7050", LATTE = "#746137";

  const isVendorTent = (o) => o.category === "tent" && (o.type === "vendor" || o.type === "sponsor" || o.type === "food");

  function PublicMap({ objects, lot, loading }) {
    const [selectedId, setSelectedId] = useState(null);
    const [arrowId, setArrowId] = useState(null);
    const [search, setSearch] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [catFilter, setCatFilter] = useState(null);

    const selected = useMemo(() => objects.find((o) => o.id === selectedId) || null, [objects, selectedId]);

    const matches = useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return [];
      return objects.filter(isVendorTent).filter((o) => (o.label || "").toLowerCase().includes(q)).slice(0, 8);
    }, [objects, search]);

    const findBooth = (o) => { setArrowId(o.id); setSearch(o.label || ""); setShowResults(false); };
    const onSearchChange = (v) => { setSearch(v); setShowResults(true); if (arrowId !== null) setArrowId(null); };

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        {/* Header */}
        <header style={{ background: FOREST, color: CREMA, borderBottom: "1px solid rgba(24,24,24,0.25)" }}>
          <div style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
              <img src="assets/logo-primary-crema.png" alt="The Charlotte Coffee Festival" style={{ height: 38, width: "auto" }} />
              <div style={{ minWidth: 0, borderLeft: "1px solid rgba(235,229,219,0.28)", paddingLeft: 14 }} className="hide-sm">
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.85 }}>{EVENT.date}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.2em", opacity: 0.65, marginTop: 3 }}>{EVENT.venue}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <a href="#/organizer" className="tccf-link-quiet hide-sm" style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(235,229,219,0.7)", textDecoration: "none" }}>Organizer →</a>
              <a href={EVENT.tickets} target="_blank" rel="noopener noreferrer" className="tccf-btn-coral">Get Tickets</a>
            </div>
          </div>

          {/* Find My Booth */}
          <div style={{ padding: "0 24px 18px", maxWidth: 640, position: "relative" }}>
            <div style={{ position: "relative" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={FOREST} strokeWidth="1.8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", opacity: 0.55 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
              <input value={search} onChange={(e) => onSearchChange(e.target.value)} onFocus={() => setShowResults(true)}
                placeholder="Find my booth — search vendor name"
                style={{ width: "100%", padding: "13px 42px 13px 44px", borderRadius: 999, border: "none", background: CREMA, color: FOREST, fontSize: 14, fontFamily: "var(--font-body)", outline: "none" }} />
              {search && <button onClick={() => { setSearch(""); setShowResults(false); setArrowId(null); }} aria-label="Clear" style={{ position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: FOREST, opacity: 0.6, fontSize: 16 }}>✕</button>}
            </div>
            {showResults && matches.length > 0 && (
              <div className="tccf-card" style={{ position: "absolute", left: 24, right: 24, marginTop: 8, background: "var(--tccf-off-white)", boxShadow: "var(--shadow-lift)", overflow: "hidden", zIndex: 60, maxHeight: 300, overflowY: "auto" }}>
                {matches.map((o) => (
                  <button key={o.id} onClick={() => findBooth(o)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "9px 12px", background: "none", border: "none", borderBottom: "1px solid var(--rule-soft)", cursor: "pointer", textAlign: "left", color: FOREST }}>
                    <Avatar obj={o} size={32} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: LATTE, marginTop: 1 }}>{o.booth_number || `BOOTH #${o.id}`}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* Map */}
        <main style={{ position: "relative", flex: 1, overflow: "hidden" }}>
          {loading ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", color: FOREST }}>Loading map…</div>
          ) : (
            <React.Fragment>
              <MapCanvas mode="public" objects={objects} lot={lot} selectedId={selectedId} arrowTargetId={arrowId} onSelect={setSelectedId} dimUnassigned={true} />
              {/* Top-right minimap */}
              <div style={{ position: "absolute", top: 14, right: 14 }}><MiniMap objects={objects} lot={lot} selectedId={selectedId} arrowId={arrowId} onJump={setArrowId} /></div>
              {/* Bottom-right legend */}
              <div style={{ position: "absolute", bottom: 14, right: 14 }}><Legend defaultOpen={true} /></div>
            </React.Fragment>
          )}
        </main>

        {/* Public detail sheet — vendor-safe info only */}
        <Sheet open={!!selected} onClose={() => setSelectedId(null)} width={360}>
          {selected && <PublicDetail obj={selected} onClose={() => setSelectedId(null)} />}
        </Sheet>
      </div>
    );
  }

  function PublicDetail({ obj, onClose }) {
    const cat = categorizeVendor(obj.label);
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ background: FOREST, color: CREMA, padding: "22px 24px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <Avatar obj={obj} size={56} round={3} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 22, lineHeight: 1.05, color: CREMA }}>{obj.label}</h3>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.8, marginTop: 6, letterSpacing: "0.08em" }}>{obj.booth_number || `BOOTH #${obj.id}`} · {Math.round(obj.w)}×{Math.round(obj.h)} FT</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: CREMA, cursor: "pointer", fontSize: 18, opacity: 0.8 }}>✕</button>
        </div>
        <div style={{ padding: 24, flex: 1 }}>
          {cat && <span style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 10px", borderRadius: 999, color: "#fff", background: CATEGORY_COLORS[cat] }}>{cat}</span>}
          <p style={{ marginTop: 18, color: "var(--fg)", lineHeight: 1.55, fontSize: 15 }}>Look for this booth on the festival map — it's highlighted now. Booth footprint is {Math.round(obj.w)} ft × {Math.round(obj.h)} ft.</p>
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: "1px solid var(--rule-soft)", fontFamily: "var(--font-mono)", fontSize: 11, color: LATTE, letterSpacing: "0.06em", lineHeight: 1.7 }}>
            <div>{EVENT.date}</div>
            <div>{EVENT.venue}</div>
          </div>
        </div>
      </div>
    );
  }

  window.PublicMap = PublicMap;
})();
