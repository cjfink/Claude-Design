/* Chrome.jsx — TopBar, ToolDock, ModeSwitcher, VersionMenu, ShareMenu,
   AttendeeBar (mobile-style search + route). window.StudioChrome */
(function () {
  const { useState, useRef, useEffect } = React;
  const { STUDIO } = window;
  const { EVENT, TEAM, CATEGORIES, CAT_KEYS, colorFor } = STUDIO;
  const Icon = window.Icon;

  const MODES = [
    { key: "organizer", label: "Organizer", icon: "settings" },
    { key: "utility", label: "Utility", icon: "bolt" },
    { key: "vendor", label: "Vendor", icon: "flag" },
    { key: "attendee", label: "Attendee", icon: "nav" },
  ];

  /* ───────── TopBar ───────── */
  function TopBar({ mode, setMode, theme, setTheme, layouts, activeIndex, setActiveIndex, onDuplicateLayout, onRename, published, onTogglePublished, onDeleteLayout, onShare, onExport, onDownloadBackup, onRestoreBackup }) {
    const [verOpen, setVerOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const restoreRef = useRef(null);
    const active = layouts[activeIndex];

    return (
      <header style={{ height: 56, flexShrink: 0, background: "var(--topbar)", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 14, padding: "0 14px", position: "relative", zIndex: 70 }}>
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <img src={theme === "dark" ? "assets/logo-primary-crema.png" : "assets/logo-primary-black.png"} alt="TCCF" style={{ height: 28 }} />
          <div className="hide-md" style={{ borderLeft: "1px solid var(--line)", paddingLeft: 11 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 12.5, fontWeight: 600, lineHeight: 1, color: "var(--ink)" }}>Festival Studio</div>
            <div className="mono" style={{ fontSize: 9, color: "var(--ink-faint)", marginTop: 3, letterSpacing: "0.1em" }}>{EVENT.date}</div>
          </div>
        </div>

        {/* version menu */}
        <div style={{ position: "relative" }}>
          <button className="pill" onClick={()=>setVerOpen((v)=>!v)} style={{ maxWidth: 230 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: published ? "#5d6b3c" : "#b07d2e", flexShrink: 0 }} />
            {editingName ? (
              <input autoFocus defaultValue={active.name} onClick={(e)=>e.stopPropagation()} onBlur={(e)=>{ onRename(e.target.value||active.name); setEditingName(false); }} onKeyDown={(e)=>{ if(e.key==="Enter"){ onRename(e.target.value||active.name); setEditingName(false);} }} style={{ background: "transparent", border: "none", outline: "none", color: "var(--ink)", font: "inherit", width: 150 }} />
            ) : (
              <span onDoubleClick={(e)=>{ e.stopPropagation(); setEditingName(true); }} style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textTransform: "none", letterSpacing: 0, fontFamily: "var(--font-body)", fontSize: 12.5 }}>{active.name}</span>
            )}
            <Icon name="chevronDown" size={14} />
          </button>
          {verOpen && (
            <React.Fragment>
              <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onClick={()=>setVerOpen(false)} />
              <div className="panel anim-pop" style={{ position: "absolute", top: 44, left: 0, width: 280, padding: 8, zIndex: 2, boxShadow: "var(--shadow-lg)" }}>
                <div className="kicker" style={{ padding: "4px 8px 8px" }}>Layout Versions</div>
                {layouts.map((l, i) => (
                  <div key={i} onClick={()=>{ setActiveIndex(i); setVerOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 8px", borderRadius: 9, cursor: "pointer", background: i===activeIndex ? "var(--sel)" : "transparent" }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: l.published ? "#5d6b3c" : "#b07d2e" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.name}</div>
                      <div className="mono" style={{ fontSize: 9, color: "var(--ink-faint)", marginTop: 1 }}>{l.objects.filter(o=>o.kind==="booth").length} booths · {l.published ? "Published" : "Draft"}</div>
                    </div>
                    {i===activeIndex && <Icon name="check" size={15} style={{ color: "var(--accent)" }} />}
                    {layouts.length > 1 && <button className="iconbtn" style={{ width: 26, height: 26 }} onClick={(e)=>{ e.stopPropagation(); onDeleteLayout(i); }}><Icon name="trash" size={13} /></button>}
                  </div>
                ))}
                <div style={{ borderTop: "1px solid var(--line)", marginTop: 6, paddingTop: 6, display: "grid", gap: 4 }}>
                  <button className="pill" style={{ width: "100%", justifyContent: "flex-start", border: "none" }} onClick={()=>{ onDuplicateLayout(); setVerOpen(false); }}><Icon name="copy" size={14} /> Duplicate this layout</button>
                  <button className="pill" style={{ width: "100%", justifyContent: "flex-start", border: "none" }} onClick={onTogglePublished}><Icon name={published?"eyeOff":"check"} size={14} /> {published ? "Unpublish (set draft)" : "Publish layout"}</button>
                </div>
              </div>
            </React.Fragment>
          )}
        </div>

        {/* center: mode switcher */}
        <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)" }} className="hide-sm">
          <div className="seg">
            {MODES.map((m)=>(
              <button key={m.key} className={mode===m.key?"on":""} onClick={()=>setMode(m.key)}><Icon name={m.icon} size={13} />{m.label}</button>
            ))}
          </div>
        </div>

        {/* right cluster */}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {/* presence */}
          <div className="hide-md" style={{ display: "flex", alignItems: "center" }}>
            {TEAM.map((t, i) => (
              <div key={t.name} title={t.name+" · editing"} style={{ width: 28, height: 28, borderRadius: 999, background: t.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, border: "2px solid var(--topbar)", marginLeft: i ? -8 : 0 }}>{t.initials}</div>
            ))}
            <div style={{ marginLeft: 8, display: "flex", alignItems: "center", gap: 5 }} className="mono">
              <span style={{ width: 7, height: 7, borderRadius: 999, background: "#5d6b3c", boxShadow: "0 0 0 3px rgba(93,107,60,0.2)" }} />
              <span style={{ fontSize: 9.5, color: "var(--ink-faint)" }}>LIVE</span>
            </div>
          </div>

          <button className="iconbtn" onClick={()=>setTheme(theme==="dark"?"light":"dark")} title="Toggle theme"><Icon name={theme==="dark"?"sun":"moon"} size={18} /></button>

          {/* export / backup */}
          <div style={{ position: "relative" }} className="hide-sm">
            <button className="pill" onClick={()=>setExportOpen((s)=>!s)}><Icon name="download" size={15} /> Export <Icon name="chevronDown" size={13} /></button>
            {exportOpen && (
              <React.Fragment>
                <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onClick={()=>setExportOpen(false)} />
                <input ref={restoreRef} type="file" accept="application/json,.json" hidden onChange={(e)=>{ const f=e.target.files&&e.target.files[0]; if(f) onRestoreBackup(f); e.target.value=""; setExportOpen(false); }} />
                <div className="panel anim-pop" style={{ position: "absolute", top: 44, right: 0, width: 280, padding: 8, zIndex: 2, boxShadow: "var(--shadow-lg)" }}>
                  <div className="kicker" style={{ padding: "4px 8px 8px" }}>Export & Backup</div>
                  {[["download","Export map as PNG","Current view · high-res image", ()=>{ onExport(); setExportOpen(false); }],
                    ["copy","Download backup","Saves all layouts to a .json file", ()=>{ onDownloadBackup(); setExportOpen(false); }],
                    ["undo","Restore from backup…","Load a .json backup file", ()=>{ restoreRef.current && restoreRef.current.click(); }]].map(([ic,t,d,fn])=>(
                    <button key={t} onClick={fn} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 8px", borderRadius: 9, border: "none", background: "transparent", textAlign: "left", cursor: "pointer" }} onMouseEnter={(e)=>e.currentTarget.style.background="var(--panel-2)"} onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--panel-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}><Icon name={ic} size={16} /></span>
                      <div><div style={{ fontSize: 13.5, color: "var(--ink)" }}>{t}</div><div className="mono" style={{ fontSize: 9.5, color: "var(--ink-faint)", marginTop: 2 }}>{d}</div></div>
                    </button>
                  ))}
                </div>
              </React.Fragment>
            )}
          </div>

          {/* share */}
          <div style={{ position: "relative" }}>
            <button className="pill accent" onClick={()=>setShareOpen((s)=>!s)}><Icon name="share" size={14} /> Share</button>
            {shareOpen && (
              <React.Fragment>
                <div style={{ position: "fixed", inset: 0, zIndex: 1 }} onClick={()=>setShareOpen(false)} />
                <div className="panel anim-pop" style={{ position: "absolute", top: 44, right: 0, width: 300, padding: 14, zIndex: 2, boxShadow: "var(--shadow-lg)" }}>
                  <div className="kicker" style={{ marginBottom: 10 }}>Share this layout</div>
                  {[["nav","Attendee map","Public link · search & navigate"],["flag","Vendor packet","Booth + load-in details"],["bolt","Utility map","For power & ops teams"]].map(([ic,t,d])=>(
                    <button key={t} onClick={()=>{ onShare(t); setShareOpen(false); }} style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 8px", borderRadius: 9, border: "none", background: "transparent", textAlign: "left", cursor: "pointer" }} onMouseEnter={(e)=>e.currentTarget.style.background="var(--panel-2)"} onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
                      <span style={{ width: 34, height: 34, borderRadius: 9, background: "var(--panel-2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", flexShrink: 0 }}><Icon name={ic} size={17} /></span>
                      <div><div style={{ fontSize: 13.5, color: "var(--ink)" }}>{t}</div><div className="mono" style={{ fontSize: 9.5, color: "var(--ink-faint)", marginTop: 2 }}>{d}</div></div>
                    </button>
                  ))}
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </header>
    );
  }

  /* ───────── Floating tool dock (organizer) ───────── */
  function ToolDock({ tool, setTool, onUndo, onRedo, canUndo, canRedo, snapGrid, setSnapGrid }) {
    const tools = [
      { key: "select", icon: "cursor", label: "Select / move (V)" },
      { key: "pan", icon: "hand", label: "Pan — or hold Space (H)" },
      { key: "measure", icon: "ruler", label: "Measure (M)" },
      { key: "comment", icon: "comment", label: "Comment (C)" },
    ];
    return (
      <div className="panel anim-slide-up" style={{ position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 4, padding: 5, zIndex: 50, boxShadow: "var(--shadow-lg)" }}>
        {tools.map((t)=>(
          <button key={t.key} className={"iconbtn"+(tool===t.key?" active":"")} onClick={()=>setTool(t.key)} title={t.label}><Icon name={t.icon} size={18} /></button>
        ))}
        <div style={{ width: 1, height: 24, background: "var(--line)", margin: "0 3px" }} />
        <button className={"iconbtn"+(snapGrid?" active":"")} onClick={()=>setSnapGrid(!snapGrid)} title="Snap to grid"><Icon name="grid" size={18} /></button>
        <div style={{ width: 1, height: 24, background: "var(--line)", margin: "0 3px" }} />
        <button className="iconbtn" onClick={onUndo} disabled={!canUndo} title="Undo (⌘Z)"><Icon name="undo" size={18} /></button>
        <button className="iconbtn" onClick={onRedo} disabled={!canRedo} title="Redo (⌘⇧Z)"><Icon name="redo" size={18} /></button>
      </div>
    );
  }

  /* ───────── Attendee bar (mobile-style overlay) ───────── */
  function AttendeeBar({ doc, onFocus, routeTarget, setRouteTarget }) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [favs, setFavs] = useState(() => { try { return JSON.parse(localStorage.getItem("tccf_favs")||"[]"); } catch(e){ return []; } });
    const [catF, setCatF] = useState(null);
    const booths = doc.objects.filter((o)=>o.kind==="booth");
    const matches = booths.filter((b)=> (!catF || b.category===catF) && (!q.trim() || (b.label||"").toLowerCase().includes(q.toLowerCase()))).slice(0, 40);
    const target = routeTarget!=null ? booths.find((b)=>b.id===routeTarget) : null;

    const toggleFav = (id) => { setFavs((f)=>{ const n = f.includes(id) ? f.filter((x)=>x!==id) : [...f, id]; try{localStorage.setItem("tccf_favs",JSON.stringify(n));}catch(e){} return n; }); };

    // estimate walking time: rough, 1 ft ~ 0.32s walking; assume from main entrance
    const walkMin = target ? Math.max(1, Math.round((Math.abs(132-(target.x+target.w/2)) + Math.abs(382-(target.y+target.h/2))) * 0.32 / 60)) : 0;

    return (
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 45, pointerEvents: "none" }}>
        <div style={{ maxWidth: 440, margin: "14px auto 0", padding: "0 14px", pointerEvents: "auto" }}>
          {/* search card */}
          <div className="panel" style={{ padding: 8, boxShadow: "var(--shadow-lg)" }}>
            <div style={{ position: "relative" }}>
              <span style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--ink-faint)" }}><Icon name="search" size={17} /></span>
              <input className="tin" style={{ height: 44, paddingLeft: 38, fontSize: 15, background: "var(--panel)" }} placeholder="Find a vendor or booth…" value={q} onChange={(e)=>{ setQ(e.target.value); setOpen(true); }} onFocus={()=>setOpen(true)} />
              {q && <button className="iconbtn" style={{ position: "absolute", right: 4, top: 4, width: 36, height: 36 }} onClick={()=>{ setQ(""); }}><Icon name="x" size={16} /></button>}
            </div>
            {/* category chips */}
            <div style={{ display: "flex", gap: 6, marginTop: 8, overflowX: "auto", paddingBottom: 2 }}>
              <button onClick={()=>setCatF(null)} style={attChip(catF===null)}>All</button>
              {CAT_KEYS.map((k)=>(<button key={k} onClick={()=>setCatF(catF===k?null:k)} style={attChip(catF===k, CATEGORIES[k].color)}><span style={{width:7,height:7,borderRadius:999,background:CATEGORIES[k].color}} />{k}</button>))}
            </div>
          </div>

          {/* results */}
          {open && (q.trim() || catF) && (
            <div className="panel anim-slide-up" style={{ marginTop: 8, maxHeight: "52vh", overflowY: "auto", boxShadow: "var(--shadow-lg)", pointerEvents: "auto" }}>
              {matches.length === 0 && <div style={{ padding: 26, textAlign: "center", color: "var(--ink-faint)", fontSize: 14 }}>No vendors found</div>}
              {matches.map((b)=>(
                <div key={b.id} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 12px", borderBottom: "1px solid var(--line)" }}>
                  <span style={{ width: 32, height: 32, borderRadius: 8, background: colorFor(b), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 11, flexShrink: 0 }}>{(b.label||"").slice(0,2).toUpperCase()}</span>
                  <div style={{ flex: 1, minWidth: 0, cursor: "pointer" }} onClick={()=>{ onFocus(b.id); setOpen(false); }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.label}</div>
                    <div className="mono" style={{ fontSize: 9.5, color: "var(--ink-faint)", marginTop: 1 }}>{b.category}</div>
                  </div>
                  <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={()=>toggleFav(b.id)}><Icon name="star" size={16} fill={favs.includes(b.id)?"var(--accent)":"none"} style={{ color: favs.includes(b.id)?"var(--accent)":"var(--ink-faint)" }} /></button>
                  <button className="pill accent" style={{ height: 32, padding: "0 11px" }} onClick={()=>{ setRouteTarget(b.id); onFocus(b.id); setOpen(false); }}><Icon name="nav" size={13} /></button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* route card (bottom) */}
        {target && (
          <div style={{ position: "fixed", left: 0, right: 0, bottom: 16, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
            <div className="panel anim-slide-up" style={{ width: "min(440px, calc(100% - 28px))", padding: 14, display: "flex", alignItems: "center", gap: 13, boxShadow: "var(--shadow-lg)", pointerEvents: "auto" }}>
              <span style={{ width: 44, height: 44, borderRadius: 11, background: colorFor(target), color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>{(target.label||"").slice(0,2).toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="kicker" style={{ color: "var(--c-water)" }}>Navigating to</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{target.label}</div>
                <div className="mono" style={{ fontSize: 10, color: "var(--ink-soft)", marginTop: 2, display: "flex", gap: 10 }}><span><Icon name="clock" size={11} style={{verticalAlign:"-1px"}} /> ~{walkMin} min walk</span><span>{target.category}</span></div>
              </div>
              <button className="iconbtn" style={{ width: 40, height: 40 }} onClick={()=>setRouteTarget(null)}><Icon name="x" size={18} /></button>
            </div>
          </div>
        )}
      </div>
    );
  }
  function attChip(on, color) {
    return { display: "inline-flex", alignItems: "center", gap: 5, height: 30, padding: "0 12px", borderRadius: 999, border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`, background: on ? "var(--sel)" : "var(--panel)", color: on ? "var(--ink)" : "var(--ink-soft)", fontFamily: "var(--font-mono)", fontSize: 10.5, whiteSpace: "nowrap", cursor: "pointer", flexShrink: 0 };
  }

  /* ───────── mode banner for non-organizer ───────── */
  function ModeBanner({ mode }) {
    const meta = {
      utility: { icon: "bolt", t: "Utility & Power View", d: "Generators, power drops, water, and emergency lanes. Booth power needs shown as badges." },
      vendor: { icon: "flag", t: "Vendor View", d: "What vendors see — their booth, neighbors, utilities, and load-in instructions." },
      attendee: { icon: "nav", t: "Attendee Map", d: "The public, mobile-friendly experience. Search, favorite, and navigate to any booth." },
    }[mode];
    if (!meta) return null;
    return (
      <div className="panel anim-slide-up hide-sm" style={{ position: "absolute", left: 16, top: 70, maxWidth: 280, padding: "12px 14px", zIndex: 40, display: "flex", gap: 11 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: "var(--panel-2)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Icon name={meta.icon} size={17} /></span>
        <div><div style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{meta.t}</div><div style={{ fontSize: 12, color: "var(--ink-soft)", marginTop: 3, lineHeight: 1.45 }}>{meta.d}</div></div>
      </div>
    );
  }

  window.StudioChrome = { TopBar, ToolDock, AttendeeBar, ModeBanner };
})();
