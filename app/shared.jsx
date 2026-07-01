/* shared.jsx — MiniMap, Legend, slide-out Sheet, badges. Shared by both views. */
(function () {
  const { useState, useEffect } = React;
  const { VENDOR_CATEGORIES, CATEGORY_COLORS } = window.TCCF;
  const FOREST = "#4A4B35", CREMA = "#EBE5DB", LATTE = "#746137", CORAL = "#AA7050";

  /* Slide-out right sheet with scrim */
  function Sheet({ open, onClose, children, width = 380 }) {
    useEffect(() => {
      const onKey = (e) => { if (e.key === "Escape") onClose(); };
      if (open) window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    return (
      <React.Fragment>
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(24,24,24,0.4)", opacity: open ? 1 : 0, pointerEvents: open ? "auto" : "none", transition: "opacity 240ms cubic-bezier(0.2,0.7,0.2,1)", zIndex: 80 }} />
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: width, background: "var(--tccf-off-white)", boxShadow: "var(--shadow-lift)", transform: open ? "translateX(0)" : "translateX(105%)", transition: "transform 320ms cubic-bezier(0.2,0.7,0.2,1)", zIndex: 81, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </React.Fragment>
    );
  }

  /* MiniMap — schematic overview, click to jump */
  function MiniMap({ objects, lot, selectedId, onJump, arrowId }) {
    const { fillFor } = window.TCCF;
    const W = 132, H = Math.round(W * (lot.h / lot.w));
    return (
      <div style={{ width: W, height: H, background: "#BAB492", border: `1px solid ${FOREST}`, overflow: "hidden", boxShadow: "0 2px 10px rgba(24,24,24,0.2)" }} title="Overview">
        <svg viewBox={`0 0 ${lot.w} ${lot.h}`} width={W} height={H} preserveAspectRatio="none">
          {objects.map((o) => {
            const f = fillFor(o);
            const hot = selectedId === o.id || arrowId === o.id;
            return <rect key={o.id} x={o.x} y={o.y} width={Math.max(o.w, 2)} height={Math.max(o.h, 2)} fill={f.bg} stroke={hot ? CORAL : "none"} strokeWidth={hot ? 4 : 0} onClick={() => onJump && onJump(o.id)} style={{ cursor: onJump ? "pointer" : "default" }} />;
          })}
        </svg>
      </div>
    );
  }

  /* Legend — collapsible */
  function Legend({ defaultOpen = true, place = "bottom-right" }) {
    const [open, setOpen] = useState(defaultOpen);
    const places = [
      { bg: "#3A2C18", border: "#6a4a28", l: "Stage" },
      { bg: "#6B6E45", border: "#4A4B35", l: "Entrance" },
      { bg: "rgba(170,112,80,0.16)", border: CORAL, l: "Ticketing" },
      { bg: "#CFC9BC", border: "#9a9483", l: "Building" },
      { bg: "#75878B", border: "#4f6064", l: "Restrooms" },
      { bg: "#4A4B35", border: "#33341f", l: "Food & Drink" },
    ];
    return (
      <div className="tccf-card" style={{ width: 210, maxWidth: "78vw", background: "rgba(247,246,242,0.96)", backdropFilter: "blur(8px)", border: `1px solid ${FOREST}`, overflow: "hidden" }}>
        <button onClick={() => setOpen((o) => !o)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: FOREST }}>
          <span>Map Legend</span>
          <span style={{ transition: "transform 200ms", transform: open ? "rotate(0)" : "rotate(-90deg)" }}>▾</span>
        </button>
        {open && (
          <div style={{ padding: "2px 12px 12px", maxHeight: "48vh", overflowY: "auto" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: LATTE, margin: "4px 0 6px" }}>Vendors</div>
            <div style={{ display: "grid", gap: 5 }}>
              {VENDOR_CATEGORIES.map((c) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: FOREST }}>
                  <span style={{ width: 12, height: 12, borderRadius: 2, background: CATEGORY_COLORS[c], border: "1px solid rgba(24,24,24,0.15)", flexShrink: 0 }} />{c}
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid var(--rule-soft)", marginTop: 10, paddingTop: 8 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: LATTE, marginBottom: 6 }}>Places</div>
              <div style={{ display: "grid", gap: 5 }}>
                {places.map((p) => (
                  <div key={p.l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: FOREST }}>
                    <span style={{ width: 12, height: 12, borderRadius: 2, background: p.bg, border: `1px solid ${p.border}`, flexShrink: 0 }} />{p.l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const STATUS_META = {
    confirmed: { label: "Confirmed", fg: "#3f4426", bg: "#dfe2c8", dot: "#6B6E45" },
    pending: { label: "Pending", fg: "#7a4a1a", bg: "#f1e0cb", dot: "#C29A6B" },
    unassigned: { label: "Open", fg: "#6b6354", bg: "#e6e1d6", dot: "#9a9483" },
  };
  function StatusBadge({ status }) {
    const m = STATUS_META[status] || STATUS_META.pending;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", padding: "2px 7px", borderRadius: 999, background: m.bg, color: m.fg }}>
        <span style={{ width: 6, height: 6, borderRadius: 999, background: m.dot }} />{m.label}
      </span>
    );
  }

  function Avatar({ obj, size = 40, round = 2 }) {
    const init = (obj.label || "").split(/\s+/).slice(0, 2).map((s) => s[0] || "").join("").toUpperCase().slice(0, 2);
    return (
      <div style={{ width: size, height: size, borderRadius: round, background: obj.logo_url ? "#fff" : "var(--tccf-muted)", color: FOREST, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: size * 0.34, overflow: "hidden", flexShrink: 0, border: "1px solid rgba(24,24,24,0.12)" }}>
        {obj.logo_url ? <img src={obj.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (init || "?")}
      </div>
    );
  }

  window.TCCFUI = { Sheet, MiniMap, Legend, StatusBadge, STATUS_META, Avatar };
})();
