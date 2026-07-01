/* Panels.jsx — LeftSidebar (vendors + layers), Inspector (right detail),
   CommentThread. window.StudioPanels */
(function () {
  const { useState, useMemo, useRef } = React;
  const { STUDIO } = window;
  const { CATEGORIES, CAT_KEYS, LAYERS, STATUS, colorFor, PRESETS } = STUDIO;
  const Icon = window.Icon;

  const isBooth = (o) => o.kind === "booth";

  /* ───────────────── Left sidebar ───────────────── */
  function LeftSidebar({ doc, mode, selection, onSelect, onFocus, onEdit, layers, onToggleLayer, search, setSearch, catFilter, setCatFilter, statusFilter, setStatusFilter, onAddBooth, onAddElement }) {
    const [tab, setTab] = useState("vendors");
    const vendors = useMemo(() => doc.objects.filter(isBooth), [doc.objects]);
    const counts = useMemo(() => { const c = {}; CAT_KEYS.forEach((k)=>c[k]=0); vendors.forEach((v)=>{ if(c[v.category]!=null) c[v.category]++; }); return c; }, [vendors]);

    const filtered = useMemo(() => {
      const q = search.trim().toLowerCase();
      return vendors.filter((v) => {
        if (q && !(v.label||"").toLowerCase().includes(q)) return false;
        if (catFilter && v.category !== catFilter) return false;
        if (statusFilter && v.status !== statusFilter) return false;
        return true;
      }).sort((a,b)=>(a.label||"").localeCompare(b.label||""));
    }, [vendors, search, catFilter, statusFilter]);

    return (
      <aside style={{ width: 296, flexShrink: 0, background: "var(--panel)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "12px 12px 0" }}>
          <div className="seg" style={{ width: "100%" }}>
            {[["vendors","Vendors"],["layers","Layers"]].map(([k,l])=>(
              <button key={k} className={tab===k?"on":""} style={{ flex: 1, justifyContent: "center" }} onClick={()=>setTab(k)}>{l}</button>
            ))}
          </div>
        </div>

        {tab === "vendors" ? (
          <React.Fragment>
            <div style={{ padding: 12, display: "grid", gap: 9 }}>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }}><Icon name="search" size={15} /></span>
                <input className="tin" style={{ paddingLeft: 33 }} placeholder="Search vendors…" value={search} onChange={(e)=>setSearch(e.target.value)} />
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                <button onClick={()=>setCatFilter(null)} style={chip(catFilter===null)}>All · {vendors.length}</button>
                {CAT_KEYS.map((k)=>(
                  <button key={k} onClick={()=>setCatFilter(catFilter===k?null:k)} style={chip(catFilter===k, CATEGORIES[k].color)}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: CATEGORIES[k].color, display: "inline-block" }} />{counts[k]}
                  </button>
                ))}
              </div>
              {mode === "organizer" && (
                <button className="pill accent" style={{ width: "100%", justifyContent: "center", height: 38 }} onClick={onAddBooth}><Icon name="plus" size={15} /> Add booth</button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
              {filtered.map((v) => {
                const sel = selection.includes(v.id);
                return (
                  <div key={v.id} onClick={()=>{ onSelect([v.id]); onFocus(v.id); }} className="tccf-vrow" style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 9px", borderRadius: 10, cursor: "pointer", marginBottom: 2, background: sel ? "var(--sel)" : "transparent", border: `1px solid ${sel ? "var(--accent)" : "transparent"}`, transition: "background 140ms" }}>
                    <span style={{ width: 26, height: 26, borderRadius: 7, background: colorFor(v), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 10, flexShrink: 0 }}>{(v.label||"").slice(0,2).toUpperCase()}</span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--ink)" }}>{v.label}</div>
                      <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-faint)", marginTop: 2 }}>{v.category} · {Math.round(v.w)}×{Math.round(v.h)}′</div>
                    </div>
                    {v.status && <span style={{ width: 8, height: 8, borderRadius: 999, background: (STATUS[v.status]||STATUS.pending).color, flexShrink: 0 }} title={v.status} />}
                    {mode === "organizer" && onEdit && (
                      <button className="tccf-vedit" onClick={(e)=>{ e.stopPropagation(); onEdit(v.id); }} title="Edit details">Edit</button>
                    )}
                  </div>
                );
              })}
              {filtered.length === 0 && <div style={{ textAlign: "center", padding: 30, color: "var(--ink-faint)", fontSize: 13 }}>No vendors match</div>}
            </div>
          </React.Fragment>
        ) : (
          <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
            <div className="kicker" style={{ marginBottom: 10 }}>Map Layers</div>
            <div style={{ display: "grid", gap: 4 }}>
              {LAYERS.map((ly) => (
                <div key={ly.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 10, background: "var(--panel-2)" }}>
                  <span style={{ width: 10, height: 10, borderRadius: 3, background: ly.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13.5, color: "var(--ink)" }}>{ly.label}</span>
                  <button className="iconbtn" style={{ width: 30, height: 30 }} onClick={()=>onToggleLayer(ly.key)} title={layers[ly.key] ? "Hide" : "Show"}>
                    <Icon name={layers[ly.key] ? "eye" : "eyeOff"} size={16} style={{ opacity: layers[ly.key] ? 1 : 0.45 }} />
                  </button>
                </div>
              ))}
            </div>
            {mode === "organizer" && onAddElement && (
              <React.Fragment>
                <div className="kicker" style={{ margin: "18px 0 8px" }}>Add to Map</div>
                {[["structure","Structures"],["infra","Power & Water"],["booth","Booths"]].map(([grp, lbl]) => (
                  <div key={grp} style={{ marginBottom: 12 }}>
                    <div className="mono" style={{ fontSize: 9, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{lbl}</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {Object.entries(PRESETS).filter(([,p])=>p.group===grp).map(([key, p]) => (
                        <button key={key} onClick={()=>onAddElement(key)} className="tccf-addbtn">
                          <span style={{ width: 22, height: 22, borderRadius: 6, background: "var(--panel)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}><Icon name={p.icon} size={13} /></span>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.5, marginTop: 4, paddingTop: 10, borderTop: "1px solid var(--line)" }}>New items drop into view — drag to place, then edit in the panel. Double-click anything on the map to edit it.</div>
              </React.Fragment>
            )}
          </div>
        )}
      </aside>
    );
  }
  function chip(on, color) {
    return { display: "inline-flex", alignItems: "center", gap: 5, height: 26, padding: "0 9px", borderRadius: 999, border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--sel)" : "var(--panel-2)", color: on ? "var(--ink)" : "var(--ink-soft)", fontFamily: "var(--font-mono)", fontSize: 10, cursor: "pointer" };
  }

  /* ───────────────── Inspector (right) ───────────────── */
  function Inspector({ objs, mode, onUpdate, onDelete, onDuplicate, onClose, onUploadLogo }) {
    if (!objs.length) return null;
    const multi = objs.length > 1;
    const o = objs[0];
    const booth = isBooth(o);
    const fileRef = useRef(null);

    const patch = (p) => onUpdate(objs.map((x) => ({ id: x.id, ...p })));

    return (
      <aside className="anim-slide-in" style={{ width: 332, flexShrink: 0, background: "var(--panel)", borderLeft: "1px solid var(--line)", display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          {!multi && (
            <span style={{ width: 42, height: 42, borderRadius: 10, background: booth ? colorFor(o) : "var(--panel-2)", color: booth ? "#fff" : "var(--ink-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15, flexShrink: 0, overflow: "hidden" }}>
              {o.logo ? <img src={o.logo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (booth ? (o.label||"").slice(0,2).toUpperCase() : <Icon name="flag" size={18} />)}
            </span>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="kicker">{multi ? `${objs.length} selected` : booth ? o.category : o.kind}</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 19, fontWeight: 600, lineHeight: 1.1, color: "var(--ink)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{multi ? "Multiple objects" : (o.label || "Untitled")}</div>
          </div>
          <button className="iconbtn" style={{ width: 30, height: 30 }} onClick={onClose}><Icon name="x" size={16} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 18, display: "grid", gap: 16 }}>
          {!multi && (
            <Field label="Name"><input className="tin" value={o.label||""} onChange={(e)=>patch({ label: e.target.value })} /></Field>
          )}

          {booth && !multi && mode === "organizer" && (
            <React.Fragment>
              <Field label="Category">
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CAT_KEYS.map((k)=>(
                    <button key={k} onClick={()=>patch({ category: k })} style={{ ...chip(o.category===k, CATEGORIES[k].color), height: 30 }}>
                      <span style={{ width: 9, height: 9, borderRadius: 3, background: CATEGORIES[k].color }} />{CATEGORIES[k].label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Status">
                <div className="seg" style={{ width: "100%" }}>
                  {Object.keys(STATUS).map((s)=>(
                    <button key={s} className={o.status===s?"on":""} style={{ flex: 1, justifyContent: "center" }} onClick={()=>patch({ status: s })}>{STATUS[s].label}</button>
                  ))}
                </div>
              </Field>
              <Field label="Vendor logo">
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e)=>{ const f=e.target.files&&e.target.files[0]; if(f) onUploadLogo(o.id, f); }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="pill" style={{ flex: 1, justifyContent: "center" }} onClick={()=>fileRef.current&&fileRef.current.click()}>{o.logo ? "Replace" : "Upload"}</button>
                  {o.logo && <button className="pill" onClick={()=>patch({ logo: null })}>Remove</button>}
                </div>
              </Field>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Field label="Power (kW)"><input className="tin mono" type="number" value={o.powerKW||0} onChange={(e)=>patch({ powerKW: Number(e.target.value) })} /></Field>
                <Field label="Water">
                  <button className={"pill"+(o.water?" accent":"")} style={{ width: "100%", justifyContent: "center", height: 38 }} onClick={()=>patch({ water: !o.water })}><Icon name="droplet" size={14} />{o.water?"Needed":"None"}</button>
                </Field>
              </div>
              <Field label="Internal notes"><textarea className="tin" rows={3} placeholder="Load-in time, contacts, special requests…" value={o.notes||""} onChange={(e)=>patch({ notes: e.target.value })} /></Field>
            </React.Fragment>
          )}

          {/* structure / infrastructure fields */}
          {!booth && !multi && mode === "organizer" && (
            <React.Fragment>
              {o.kind === "generator" && <Field label="Capacity (kW)"><input className="tin mono" type="number" value={o.kW||0} onChange={(e)=>patch({ kW: Number(e.target.value) })} /></Field>}
              {o.kind === "power" && <Field label="Amperage (A)"><input className="tin mono" type="number" value={o.amps||0} onChange={(e)=>patch({ amps: Number(e.target.value) })} /></Field>}
              {o.kind === "water" && <Field label="Flow rate (GPM)"><input className="tin mono" type="number" value={o.gpm||0} onChange={(e)=>patch({ gpm: Number(e.target.value) })} /></Field>}
              {(o.kind === "power" || o.kind === "water") && <Field label="Marker size (ft)"><input className="tin mono" type="number" value={o.size||4.5} onChange={(e)=>patch({ size: Math.max(2, Number(e.target.value)) })} /></Field>}
            </React.Fragment>
          )}

          {mode === "organizer" && (
            <Field label={o.w == null ? "Position (ft)" : "Position & size (ft)"}>
              <div style={{ display: "grid", gridTemplateColumns: o.w == null ? "1fr 1fr" : "1fr 1fr 1fr 1fr", gap: 8 }}>
                {(o.w == null ? ["x","y"] : ["x","y","w","h"]).map((k)=>(
                  <label key={k} style={{ display: "grid", gap: 4 }}>
                    <span className="mono" style={{ fontSize: 9, color: "var(--ink-faint)", textTransform: "uppercase" }}>{k}</span>
                    <input className="tin mono" style={{ height: 34, padding: "0 8px", fontSize: 12 }} type="number" value={multi ? "" : Math.round(o[k])} placeholder={multi?"—":""} onChange={(e)=>patch({ [k]: Number(e.target.value) })} disabled={multi} />
                  </label>
                ))}
              </div>
              {!multi && o.w != null && (
                <button className="pill" style={{ marginTop: 8, width: "100%", justifyContent: "center" }} onClick={()=>patch({ rot: ((o.rot||0)+90)%360 })}><Icon name="rotate" size={14} /> Rotate 90°</button>
              )}
            </Field>
          )}

          {/* read-only vendor/attendee detail */}
          {booth && mode !== "organizer" && (
            <div style={{ display: "grid", gap: 12 }}>
              <Row label="Category" value={o.category} dot={colorFor(o)} />
              <Row label="Booth size" value={`${Math.round(o.w)} × ${Math.round(o.h)} ft`} />
              {mode === "vendor" && <Row label="Power supplied" value={`${o.powerKW||0} kW`} />}
              {mode === "vendor" && <Row label="Water access" value={o.water ? "Yes — nearby spigot" : "Not at booth"} />}
              {mode === "vendor" && <div style={{ background: "var(--panel-2)", borderRadius: 10, padding: 12, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}><strong style={{ color: "var(--ink)" }}>Load-in:</strong> Fri 4–7 PM via Vendor Load-In gate (west). Vehicles off-grounds by 7:30 PM.</div>}
            </div>
          )}
        </div>

        {mode === "organizer" && (
          <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
            <button className="pill" style={{ flex: 1, justifyContent: "center" }} onClick={onDuplicate}><Icon name="copy" size={14} /> Duplicate</button>
            <button className="pill" style={{ justifyContent: "center", color: "#c24a3a", borderColor: "rgba(194,74,58,0.4)" }} onClick={onDelete}><Icon name="trash" size={14} /></button>
          </div>
        )}
      </aside>
    );
  }

  function Field({ label, children }) { return <label style={{ display: "grid", gap: 7 }}><span className="kicker">{label}</span>{children}</label>; }
  function Row({ label, value, dot }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid var(--line)" }}>
        <span className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-faint)" }}>{label}</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13.5, color: "var(--ink)" }}>{dot && <span style={{ width: 9, height: 9, borderRadius: 3, background: dot }} />}{value}</span>
      </div>
    );
  }

  window.StudioPanels = { LeftSidebar, Inspector };
})();
