/* Organizer.jsx — PIN gate + full editor (stats, sidebar, detail, export). */
(function () {
  const { useState, useEffect, useMemo, useRef } = React;
  const { categorizeVendor, CATEGORY_COLORS, VENDOR_CATEGORIES, fillFor, EVENT, ORG_PIN } = window.TCCF;
  const { Sheet, MiniMap, Legend, StatusBadge, STATUS_META, Avatar } = window.TCCFUI;
  const { DetailPanel, exportMapPNG } = window.OrgDetail;
  const FOREST = "#4A4B35", CREMA = "#EBE5DB", CORAL = "#AA7050", LATTE = "#746137", INK = "#181818";

  const isVendorTent = (o) => o.category === "tent" && (o.type === "vendor" || o.type === "sponsor" || o.type === "food");

  const PRESETS = {
    vendor: { category: "tent", type: "vendor", label: "New Vendor", w: 10, h: 10, status: "unassigned" },
    sponsor: { category: "tent", type: "sponsor", label: "Sponsor", w: 15, h: 15, status: "unassigned" },
    food: { category: "tent", type: "food", label: "Food & Drink", w: 10, h: 10, status: "unassigned" },
    stage: { category: "misc", type: "stage", label: "Stage", w: 30, h: 30, bg: "#3A2C18", border: "#6a4a28", text_color: "#EBE5DB" },
    restroom: { category: "misc", type: "restroom", label: "Restrooms", w: 10, h: 10, bg: "#75878B", border: "#4f6064", text_color: "#F7F6F2" },
    entrance: { category: "misc", type: "entrance", label: "Entrance", w: 20, h: 10, bg: "#6B6E45", border: "#4A4B35", text_color: "#F7F6F2" },
    building: { category: "building", type: "building", label: "Building", w: 30, h: 30, bg: "#CFC9BC", border: "#9a9483", text_color: "#4A4B35" },
    zone: { category: "zone", type: "zone", label: "Zone", w: 30, h: 30, bg: "rgba(170,112,80,0.16)", border: CORAL, text_color: "#4A4B35" },
  };

  /* ───────── PIN gate ───────── */
  function PinGate({ onUnlock }) {
    const [pin, setPin] = useState("");
    const [err, setErr] = useState(false);
    const submit = (e) => {
      e.preventDefault();
      if (pin === (window.TCCF.ORG_PIN)) { sessionStorage.setItem("tccf_org_unlocked", "1"); onUnlock(); }
      else { setErr(true); }
    };
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: INK, padding: 20 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden", opacity: 0.05, pointerEvents: "none" }}>
          <img src="assets/tccf-stamp-circle-crown-only.png" alt="" style={{ position: "absolute", right: "-12%", bottom: "-18%", width: "60vmin", filter: "invert(1)" }} />
        </div>
        <form onSubmit={submit} style={{ width: "100%", maxWidth: 380, background: "var(--bg)", border: `1px solid ${INK}`, padding: 36, position: "relative", boxShadow: "var(--shadow-lift)" }}>
          <img src="assets/logo-primary-black.png" alt="The Charlotte Coffee Festival" style={{ height: 56, width: "auto", marginBottom: 22 }} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.18em", color: LATTE }}>Organizer Access</div>
          <h2 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 30, lineHeight: 1, margin: "8px 0 6px", color: INK }}>Edit the map</h2>
          <p style={{ fontSize: 14, color: "var(--fg-muted)", margin: "0 0 22px", lineHeight: 1.5 }}>Enter your festival PIN to place booths, upload logos, and publish.</p>
          <input type="password" value={pin} autoFocus placeholder="PIN" onChange={(e) => { setPin(e.target.value); setErr(false); }}
            className="tccf-input" style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.2em", textAlign: "center", fontSize: 16, padding: "12px" }} />
          {err && <div style={{ color: "#a23a28", fontSize: 13, marginTop: 8, fontFamily: "var(--font-mono)" }}>Incorrect PIN — try again</div>}
          <button type="submit" className="tccf-btn-dark" style={{ width: "100%", marginTop: 18, justifyContent: "center", padding: "13px" }}>Unlock</button>
          <a href="#/map" style={{ display: "block", textAlign: "center", marginTop: 16, fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: LATTE }}>← Back to public map</a>
        </form>
      </div>
    );
  }

  /* ───────── Stat tile ───────── */
  function Stat({ label, value, accent }) {
    return (
      <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: LATTE, whiteSpace: "nowrap" }}>{label}</div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 22, lineHeight: 1.1, color: accent || FOREST }}>{value}</div>
      </div>
    );
  }

  /* ───────── Vendor card (sidebar) ───────── */
  function VendorCard({ obj, active, onSelect, onEdit, compact }) {
    const cat = categorizeVendor(obj.label);
    const catColor = cat ? CATEGORY_COLORS[cat] : "var(--tccf-muted)";
    return (
      <div onClick={onSelect} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", cursor: "pointer", borderLeft: `3px solid ${active ? CORAL : catColor}`, background: active ? "rgba(170,112,80,0.1)" : "transparent" }}>
        <Avatar obj={obj} size={36} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: FOREST, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{obj.label || "Unnamed"}</div>
          {!compact && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
              {cat && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.06em", padding: "1px 6px", borderRadius: 999, background: `${catColor}22`, color: catColor }}>{cat}</span>}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: LATTE }}>{obj.booth_number || `#${obj.id}`} · {Math.round(obj.w)}×{Math.round(obj.h)}ft</span>
            </div>
          )}
        </div>
        {obj.status && <span style={{ width: 8, height: 8, borderRadius: 999, background: STATUS_META[obj.status] ? STATUS_META[obj.status].dot : "#9a9483", flexShrink: 0 }} title={obj.status} />}
        <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="tccf-mini-edit">Edit</button>
      </div>
    );
  }

  /* ───────── Organizer map ───────── */
  function OrganizerMap({ data, onLogout }) {
    const { objects, lot, updateObject, addObject, deleteObject, undo, canUndo, reset } = data;
    const [selectedId, setSelectedId] = useState(null);
    const [detailId, setDetailId] = useState(null);
    const [snap, setSnap] = useState(true);
    const [ruler, setRuler] = useState(false);
    const [tab, setTab] = useState("map");
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("all");
    const [filterStatus, setFilterStatus] = useState("all");
    const [sortBy, setSortBy] = useState("name");
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 880);
      check(); window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);

    const selected = useMemo(() => objects.find((o) => o.id === selectedId) || null, [objects, selectedId]);
    const detailObj = useMemo(() => objects.find((o) => o.id === detailId) || null, [objects, detailId]);
    const vendors = useMemo(() => objects.filter(isVendorTent), [objects]);

    // Keyboard: undo, nudge, delete, esc
    useEffect(() => {
      const onKey = (e) => {
        const typing = /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || "");
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") { e.preventDefault(); if (canUndo) { undo(); window.toast && window.toast("Undone"); } return; }
        if (typing) return;
        if (e.key === "Escape") { setSelectedId(null); return; }
        if (selectedId == null) return;
        const o = objects.find((x) => x.id === selectedId); if (!o) return;
        if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteObject(selectedId); setSelectedId(null); window.toast && window.toast("Deleted"); return; }
        const step = e.shiftKey ? 5 : 1;
        const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
        if (moves[e.key]) {
          e.preventDefault();
          const [dx, dy] = moves[e.key];
          updateObject(selectedId, { x: Math.max(0, Math.min(lot.w - o.w, o.x + dx)), y: Math.max(0, Math.min(lot.h - o.h, o.y + dy)) });
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [selectedId, objects, lot, undo, canUndo, updateObject, deleteObject]);

    const stats = useMemo(() => {
      const total = vendors.length;
      const confirmed = vendors.filter((o) => o.status === "confirmed").length;
      const open = vendors.filter((o) => o.status === "unassigned").length;
      const filled = total ? Math.round((confirmed / total) * 100) : 0;
      const byCat = {};
      VENDOR_CATEGORIES.forEach((c) => (byCat[c] = 0));
      vendors.forEach((v) => { const c = categorizeVendor(v.label); if (c) byCat[c] += 1; });
      return { total, confirmed, open, filled, byCat };
    }, [vendors]);

    const filteredVendors = useMemo(() => {
      const q = search.trim().toLowerCase();
      let list = vendors.filter((o) => {
        if (q && !(o.label || "").toLowerCase().includes(q) && !(o.booth_number || "").toLowerCase().includes(q)) return false;
        if (filterCat !== "all" && categorizeVendor(o.label) !== filterCat) return false;
        if (filterStatus !== "all" && o.status !== filterStatus) return false;
        return true;
      });
      return list.slice().sort((a, b) => sortBy === "name" ? (a.label || "").localeCompare(b.label || "") : (b.w * b.h) - (a.w * a.h));
    }, [vendors, search, filterCat, filterStatus, sortBy]);

    const handleAdd = (key) => { const p = PRESETS[key]; if (!p) return; const id = addObject({ x: 20, y: 20, ...p }); setSelectedId(id); window.toast && window.toast(`Added ${p.label}`); };
    const sharePublic = () => { try { navigator.clipboard.writeText(location.origin + location.pathname + "#/map"); window.toast && window.toast("Public map link copied"); } catch (e) { window.toast && window.toast("Open #/map to share", "err"); } };
    const onExport = async () => { window.toast && window.toast("Rendering PNG…"); await exportMapPNG(objects, lot); window.toast && window.toast("Map exported"); };

    return (
      <div style={{ height: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)", color: FOREST }}>
        {/* Header */}
        <header style={{ background: INK, color: CREMA, padding: "10px 18px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <img src="assets/logo-primary-crema.png" alt="TCCF" style={{ height: 30 }} />
          <div className="hide-sm" style={{ borderLeft: "1px solid rgba(235,229,219,0.25)", paddingLeft: 14 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 14, textTransform: "uppercase", letterSpacing: "0.04em" }}>Vendor Map · Editor</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.7, letterSpacing: "0.1em", marginTop: 2 }}>{EVENT.date} · {EVENT.venue}</div>
          </div>
          <nav className="hide-sm" style={{ display: "flex", gap: 2, marginLeft: 8, background: "rgba(255,255,255,0.08)", borderRadius: 999, padding: 3 }}>
            {[["map", "Map"], ["list", "Vendors"], ["settings", "Settings"]].map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "6px 14px", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", borderRadius: 999, border: "none", cursor: "pointer", background: tab === t ? CORAL : "transparent", color: tab === t ? CREMA : "rgba(235,229,219,0.75)" }}>{l}</button>
            ))}
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={sharePublic} className="tccf-btn-coral hide-sm">Share Public Map</button>
            <button onClick={onLogout} style={{ background: "none", border: "none", color: "rgba(235,229,219,0.7)", cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Log out</button>
          </div>
        </header>

        {isMobile && <div style={{ background: CORAL, color: CREMA, textAlign: "center", fontSize: 12, padding: "5px", fontFamily: "var(--font-mono)", letterSpacing: "0.06em" }}>READ-ONLY ON MOBILE — USE DESKTOP TO EDIT</div>}

        {/* Stats */}
        <div style={{ background: "var(--bg-alt)", borderBottom: "1px solid var(--rule-soft)", padding: "10px 18px", display: "flex", alignItems: "center", gap: 22, overflowX: "auto", flexShrink: 0 }}>
          <Stat label="Booths" value={stats.total} />
          <Stat label="Confirmed" value={stats.confirmed} accent="#5d6b3c" />
          <Stat label="Open" value={stats.open} accent="#9a9483" />
          <div className="hide-md" style={{ display: "flex", gap: 18, paddingLeft: 18, borderLeft: "1px solid var(--rule-soft)" }}>
            {VENDOR_CATEGORIES.map((c) => <Stat key={c} label={c} value={stats.byCat[c] || 0} />)}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <div className="hide-sm" style={{ fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: LATTE }}>Confirmed</div>
            <div style={{ width: 120, height: 6, background: "var(--bg)", border: "1px solid var(--rule-soft)", overflow: "hidden" }}><div style={{ height: "100%", width: `${stats.filled}%`, background: CORAL }} /></div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, width: 36, textAlign: "right" }}>{stats.filled}%</div>
          </div>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar */}
          {!isMobile && tab !== "settings" && (
            <aside style={{ width: 320, background: "var(--bg-alt)", borderRight: "1px solid var(--rule-soft)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
              <div style={{ padding: 12, borderBottom: "1px solid var(--rule-soft)", display: "grid", gap: 8 }}>
                <div style={{ position: "relative" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={LATTE} strokeWidth="2" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search vendors…" className="tccf-input" style={{ paddingLeft: 32, fontSize: 13 }} />
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="tccf-select" style={{ flex: 1 }}>
                    <option value="all">All Categories</option>
                    {VENDOR_CATEGORIES.map((c) => <option key={c} value={c}>{c} ({stats.byCat[c] || 0})</option>)}
                  </select>
                  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="tccf-select">
                    <option value="all">Any Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="unassigned">Open</option>
                  </select>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="tccf-select">
                    <option value="name">A–Z</option>
                    <option value="size">Size</option>
                  </select>
                </div>
              </div>
              {/* Add presets */}
              <div style={{ padding: 8, borderBottom: "1px solid var(--rule-soft)", display: "flex", flexWrap: "wrap", gap: 5 }}>
                {Object.entries(PRESETS).map(([k, p]) => (
                  <button key={k} onClick={() => handleAdd(k)} className="tccf-chip" title={`Add ${p.label}`}>+ {p.label}</button>
                ))}
              </div>
              {/* Vendor list */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ padding: "8px 12px", fontFamily: "var(--font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.12em", color: LATTE, position: "sticky", top: 0, background: "var(--bg-alt)", borderBottom: "1px solid var(--rule-soft)", zIndex: 2 }}>Vendors · {filteredVendors.length}</div>
                <div>
                  {filteredVendors.map((o) => <VendorCard key={o.id} obj={o} active={selectedId === o.id} onSelect={() => setSelectedId(o.id)} onEdit={() => { setSelectedId(o.id); setDetailId(o.id); }} />)}
                  {filteredVendors.length === 0 && <div style={{ padding: 30, textAlign: "center", fontSize: 13, color: LATTE }}>No matches</div>}
                </div>
              </div>
              {/* Footer actions */}
              <div style={{ padding: 8, borderTop: "1px solid var(--rule-soft)", display: "flex", gap: 6 }}>
                <button onClick={() => { undo(); window.toast && window.toast("Undone"); }} disabled={!canUndo} className="tccf-foot-btn">↶ Undo</button>
                <button onClick={() => setRuler((r) => !r)} className="tccf-foot-btn" style={ruler ? { background: CORAL, color: CREMA, borderColor: CORAL } : {}}>⟺ Ruler</button>
                <button onClick={onExport} className="tccf-foot-btn" style={{ background: FOREST, color: CREMA, borderColor: FOREST }}>↓ PNG</button>
              </div>
            </aside>
          )}

          {/* Main */}
          {tab === "settings" ? (
            <SettingsView snap={snap} setSnap={setSnap} reset={reset} />
          ) : tab === "list" ? (
            <ListView vendors={filteredVendors} onSelect={(id) => { setSelectedId(id); setDetailId(id); setTab("map"); }} />
          ) : (
            <main style={{ position: "relative", flex: 1 }}>
              <MapCanvas mode={isMobile ? "public" : "organizer"} objects={objects} lot={lot} selectedId={selectedId} onSelect={setSelectedId} onUpdateObject={updateObject} snap={snap} rulerActive={ruler && !isMobile} />
              <div style={{ position: "absolute", top: 14, left: 70 }}><Legend defaultOpen={false} /></div>
              <div style={{ position: "absolute", bottom: 14, right: 14 }}><MiniMap objects={objects} lot={lot} selectedId={selectedId} onJump={setSelectedId} /></div>
              {selected && (
                <button onClick={() => setDetailId(selected.id)} className="tccf-btn-coral" style={{ position: "absolute", top: 14, right: 14, boxShadow: "var(--shadow-lift)" }}>Edit “{selected.label}”</button>
              )}
            </main>
          )}
        </div>

        <Sheet open={!!detailObj} onClose={() => setDetailId(null)} width={400}>
          {detailObj && <DetailPanel obj={detailObj} onClose={() => setDetailId(null)} onUpdate={(patch) => updateObject(detailObj.id, patch)} onDelete={() => { deleteObject(detailObj.id); setDetailId(null); setSelectedId(null); window.toast && window.toast("Deleted"); }} />}
        </Sheet>
      </div>
    );
  }

  /* ───────── List view ───────── */
  function ListView({ vendors, onSelect }) {
    return (
      <main style={{ flex: 1, overflowY: "auto", padding: 28, background: "var(--bg)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 32, color: FOREST, margin: "0 0 18px" }}>All Vendors</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {vendors.map((o) => (
              <button key={o.id} onClick={() => onSelect(o.id)} className="tccf-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, background: "var(--bg-alt)", border: "1px solid var(--rule-soft)", cursor: "pointer", textAlign: "left" }}>
                <Avatar obj={o} size={46} round={2} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: FOREST, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{o.label}</div>
                  <div style={{ marginTop: 5 }}><StatusBadge status={o.status || "pending"} /></div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  /* ───────── Settings ───────── */
  function SettingsView({ snap, setSnap, reset }) {
    const [confirming, setConfirming] = useState(false);
    return (
      <main style={{ flex: 1, overflowY: "auto", padding: 28, background: "var(--bg)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", display: "grid", gap: 16 }}>
          <h2 style={{ fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 32, color: FOREST, margin: 0 }}>Map Settings</h2>
          <div className="tccf-card" style={{ background: "var(--bg-alt)", border: "1px solid var(--rule-soft)", padding: 18 }}>
            <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}>
              <div>
                <div style={{ fontWeight: 500, fontSize: 15, color: FOREST }}>Snap to grid</div>
                <div style={{ fontSize: 13, color: LATTE, marginTop: 2 }}>Snap booth positions to 5 ft increments</div>
              </div>
              <input type="checkbox" checked={snap} onChange={(e) => setSnap(e.target.checked)} style={{ width: 20, height: 20, accentColor: CORAL }} />
            </label>
          </div>
          <div className="tccf-card" style={{ background: "var(--bg-alt)", border: "1px solid var(--rule-soft)", padding: 18 }}>
            <div style={{ fontWeight: 500, fontSize: 15, color: FOREST }}>Reset layout</div>
            <div style={{ fontSize: 13, color: LATTE, margin: "2px 0 12px" }}>Restore the original seeded vendor layout. This clears all your edits.</div>
            {confirming ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => { reset(); setConfirming(false); window.toast && window.toast("Layout reset"); }} className="tccf-btn-danger" style={{ width: "auto" }}>Yes, reset everything</button>
                <button onClick={() => setConfirming(false)} className="tccf-btn-ghost">Cancel</button>
              </div>
            ) : <button onClick={() => setConfirming(true)} className="tccf-btn-ghost">Reset to seeded layout</button>}
          </div>
          <a href="#/map" style={{ fontFamily: "var(--font-mono)", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: CORAL }}>View public festival map →</a>
        </div>
      </main>
    );
  }

  window.PinGate = PinGate;
  window.OrganizerMap = OrganizerMap;
})();
