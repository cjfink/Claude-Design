/* app.jsx — composition root: state, modes, keyboard, toasts, comments. */
(function () {
  const { useState, useEffect, useRef, useCallback } = React;
  const { STUDIO } = window;
  const { DEFAULT_LAYERS, CATEGORIES, CAT_KEYS } = STUDIO;
  const { LeftSidebar, Inspector } = window.StudioPanels;
  const { TopBar, ToolDock, AttendeeBar, ModeBanner } = window.StudioChrome;
  const Icon = window.Icon;

  function Toasts() {
    const [items, setItems] = useState([]);
    useEffect(() => { window.toast = (msg, kind) => { const id = Math.random().toString(36).slice(2); setItems((x)=>[...x,{id,msg,kind}]); setTimeout(()=>setItems((x)=>x.filter((i)=>i.id!==id)), 2600); }; }, []);
    return (
      <div style={{ position: "fixed", bottom: 76, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", gap: 8, zIndex: 300, alignItems: "center", pointerEvents: "none" }}>
        {items.map((t)=>(<div key={t.id} className="anim-slide-up" style={{ background: t.kind==="err"?"#7a2d1e":"var(--ink)", color: "var(--bg)", padding: "10px 16px", borderRadius: 10, fontFamily: "var(--font-mono)", fontSize: 12, letterSpacing: "0.03em", boxShadow: "var(--shadow-lg)" }}>{t.msg}</div>))}
      </div>
    );
  }

  function CommentPopover({ comment, onResolve, onClose }) {
    if (!comment) return null;
    return (
      <div className="panel anim-pop" style={{ position: "absolute", right: 18, bottom: 90, width: 280, padding: 14, zIndex: 60, boxShadow: "var(--shadow-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}>
          <span style={{ width: 28, height: 28, borderRadius: 999, background: comment.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700 }}>{comment.initials}</span>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{comment.author}</div><div className="mono" style={{ fontSize: 9, color: "var(--ink-faint)" }}>just now</div></div>
          <button className="iconbtn" style={{ width: 26, height: 26 }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div style={{ fontSize: 13.5, color: "var(--ink)", lineHeight: 1.5 }}>{comment.text}</div>
        <button className="pill" style={{ width: "100%", justifyContent: "center", marginTop: 11 }} onClick={()=>onResolve(comment.id)}><Icon name="check" size={14} /> Resolve</button>
      </div>
    );
  }

  function App() {
    const studio = window.useStudio();
    const { active } = studio;
    const canvasRef = useRef(null);

    const [theme, setTheme] = useState(() => localStorage.getItem("tccf_theme") || "light");
    const [mode, setMode] = useState("organizer");
    const [tool, setTool] = useState("select");
    const [snapGrid, setSnapGrid] = useState(true);
    const [layers, setLayers] = useState({ ...DEFAULT_LAYERS });
    const [selection, setSelection] = useState([]);
    const [inspectorOpen, setInspectorOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState(null);
    const [statusFilter, setStatusFilter] = useState(null);
    const [vendorFocusId, setVendorFocusId] = useState(null);
    const [arrowTargetId, setArrowTargetId] = useState(null);
    const [routeTarget, setRouteTarget] = useState(null);
    const [openComment, setOpenComment] = useState(null);
    const [zoomPct, setZoomPct] = useState(1);

    useEffect(() => { document.documentElement.setAttribute("data-theme", theme); localStorage.setItem("tccf_theme", theme); }, [theme]);

    // mode-driven layer presets
    useEffect(() => {
      if (mode === "utility") setLayers((l)=>({ ...l, power: true, water: true, emergency: true, labels: true, booths: true, places: true }));
      else if (mode === "attendee") setLayers((l)=>({ ...l, power: false, water: false, emergency: false, labels: true, booths: true, places: true }));
      else if (mode === "vendor") setLayers((l)=>({ ...l, power: true, water: true, emergency: false, labels: true }));
      else setLayers({ ...DEFAULT_LAYERS });
      setSelection([]); setTool("select"); setRouteTarget(null); setArrowTargetId(null); setInspectorOpen(false);
      if (mode !== "vendor") setVendorFocusId(null);
    }, [mode]);

    const attendeePos = { x: 132, y: 382 }; // at the main entrance

    const selObjs = selection.map((id)=>active.objects.find((o)=>o.id===id)).filter(Boolean);

    // keyboard
    useEffect(() => {
      const onKey = (e) => {
        const typing = /INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"");
        if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="z") { e.preventDefault(); if (e.shiftKey) { studio.redo(); } else { studio.undo(); } return; }
        if (typing) return;
        if (mode !== "organizer") return;
        if (e.key==="v"||e.key==="V") setTool("select");
        if (e.key==="h"||e.key==="H") setTool("pan");
        if (e.key==="m"||e.key==="M") setTool("measure");
        if (e.key==="c"||e.key==="C") setTool("comment");
        if (e.key==="Escape") { setSelection([]); setTool("select"); setInspectorOpen(false); }
        if (!selection.length) return;
        if (e.key==="Enter") { e.preventDefault(); setInspectorOpen(true); return; }
        if (e.key==="Delete"||e.key==="Backspace") { e.preventDefault(); studio.deleteObjects(selection); setSelection([]); window.toast("Deleted"); return; }
        if ((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==="d") { e.preventDefault(); const n=studio.duplicateObjects(selection); setSelection(n); window.toast("Duplicated"); return; }
        const step = e.shiftKey?5:1;
        const mv = { ArrowLeft:[-step,0], ArrowRight:[step,0], ArrowUp:[0,-step], ArrowDown:[0,step] }[e.key];
        if (mv) { e.preventDefault(); const patches = selObjs.map((o)=>({ id:o.id, x: Math.max(0,Math.min(active.lot.w-o.w,o.x+mv[0])), y: Math.max(0,Math.min(active.lot.h-o.h,o.y+mv[1])) })); studio.updateObjects(patches); }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [mode, selection, selObjs, studio, active.lot]);

    const toggleLayer = (key) => setLayers((l)=>({ ...l, [key]: !l[key] }));

    const addBooth = () => {
      const cam = canvasRef.current && canvasRef.current.getCamera ? canvasRef.current.getCamera() : null;
      const id = studio.addObject({ kind: "booth", label: "New Vendor", category: "Coffee Shop", status: "unassigned", powerKW: 2, water: false, x: 40, y: 150, w: 10, h: 10, rot: 0 });
      setSelection([id]); setTool("select");
      setTimeout(()=>{ const o = studio.active.objects.find((x)=>x.id===id); if (o && canvasRef.current) canvasRef.current.centerOn(o, 2.4); }, 30);
      window.toast("Booth added — drag into place");
    };

    const addElement = (key) => {
      const preset = STUDIO.PRESETS[key]; if (!preset) return;
      // place near the center of the current view, snapped to 5ft
      let c = canvasRef.current && canvasRef.current.getViewCenterFt ? canvasRef.current.getViewCenterFt() : { x: active.lot.w/2, y: active.lot.h/2 };
      const w = preset.make.w || 0, h = preset.make.h || 0;
      const snap = (v) => Math.round(v / 5) * 5;
      const x = Math.max(0, Math.min(active.lot.w - w, snap(c.x - w/2)));
      const y = Math.max(0, Math.min(active.lot.h - h, snap(c.y - h/2)));
      const id = studio.addObject({ ...preset.make, x, y });
      // make sure the layer it belongs to is visible
      if (preset.layer && !layers[preset.layer]) setLayers((l)=>({ ...l, [preset.layer]: true }));
      setSelection([id]); setTool("select"); setInspectorOpen(true);
      window.toast(`${preset.name} added — drag to place`);
    };

    const onUploadLogo = async (id, file) => { try { const url = await window.studioExport.logoToDataURL(file); studio.updateObjects([{ id, logo: url }]); window.toast("Logo added"); } catch(e){ window.toast("Upload failed","err"); } };

    const addComment = (ftp) => {
      const me = STUDIO.TEAM[0];
      const text = prompt("Add a comment at this spot:");
      if (!text) return;
      studio.addComment({ x: ftp.x, y: ftp.y, text, author: me.name, initials: me.initials, color: me.color });
      setTool("select"); window.toast("Comment added");
    };

    const onShare = (kind) => {
      if (kind === "Attendee map") setMode("attendee");
      else if (kind === "Vendor packet") setMode("vendor");
      else if (kind === "Utility map") setMode("utility");
      window.toast(`Shareable ${kind.toLowerCase()} link copied`);
    };
    const onExport = async () => { window.toast("Rendering PNG…"); await window.studioExport.exportPNG(active, { mode }); window.toast("Map exported"); };

    const downloadBackup = () => {
      try {
        const blob = new Blob([JSON.stringify(studio.state, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const d = new Date().toISOString().slice(0,10);
        a.href = url; a.download = `tccf-festival-layout-${d}.json`; a.click();
        URL.revokeObjectURL(url);
        window.toast("Backup downloaded");
      } catch (e) { window.toast("Backup failed", "err"); }
    };
    const restoreBackup = (file) => {
      const reader = new FileReader();
      reader.onload = () => {
        try { const parsed = JSON.parse(reader.result); studio.importState(parsed); setSelection([]); setInspectorOpen(false); window.toast("Backup restored"); }
        catch (e) { window.toast("Couldn't read that backup file", "err"); }
      };
      reader.onerror = () => window.toast("Couldn't read file", "err");
      reader.readAsText(file);
    };

    const onObjectClick = (id) => { setSelection([id]); setInspectorOpen(true); if (mode==="vendor") setVendorFocusId(id); };
    const onObjectEdit = (id) => { setSelection([id]); setInspectorOpen(true); };

    const showLeft = mode === "organizer";
    const showInspector = inspectorOpen && !!selObjs.length && mode !== "attendee";

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <TopBar mode={mode} setMode={setMode} theme={theme} setTheme={setTheme}
          layouts={studio.layouts} activeIndex={studio.activeIndex} setActiveIndex={studio.setActiveIndex}
          onDuplicateLayout={studio.duplicateLayout} onRename={studio.renameLayout}
          published={active.published} onTogglePublished={studio.togglePublished} onDeleteLayout={studio.deleteLayout}
          onShare={onShare} onExport={onExport} onDownloadBackup={downloadBackup} onRestoreBackup={restoreBackup} />

        <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
          {showLeft && (
            <div className="hide-sm" style={{ display: "flex" }}>
              <LeftSidebar doc={active} mode={mode} selection={selection} onSelect={setSelection} onFocus={(id)=>{ const o=active.objects.find((x)=>x.id===id); if(o&&canvasRef.current) canvasRef.current.centerOn(o,2.4); }}
                onEdit={(id)=>{ setSelection([id]); setInspectorOpen(true); const o=active.objects.find((x)=>x.id===id); if(o&&canvasRef.current) canvasRef.current.centerOn(o,2.4); }}
                layers={layers} onToggleLayer={toggleLayer} search={search} setSearch={setSearch}
                catFilter={catFilter} setCatFilter={setCatFilter} statusFilter={statusFilter} setStatusFilter={setStatusFilter} onAddBooth={addBooth} onAddElement={addElement} />
            </div>
          )}

          <div style={{ flex: 1, position: "relative" }}>
            <window.StudioCanvas ref={canvasRef}
              doc={active} mode={mode} theme={theme} tool={tool} layers={layers} zoomGrid={layers.grid}
              snapGrid={snapGrid} selection={selection} onSelectionChange={setSelection}
              onUpdateObjects={(p, opts)=>studio.updateObjects(p, opts)} onAddComment={addComment} onBeginChange={()=>studio.beginChange()}
              arrowTargetId={arrowTargetId} routeTargetId={routeTarget} attendeePos={attendeePos}
              onMeasure={(m)=>studio.addMeasurement(m)} measurements={active.measurements} onDeleteMeasurement={(i)=>{ studio.deleteMeasurement(i); window.toast("Measurement removed"); }}
              onUpdateEmergency={(em, opts)=>studio.setEmergency(em, opts)}
              vendorFocusId={mode==="vendor"?vendorFocusId:null} onObjectClick={onObjectClick} onObjectEdit={onObjectEdit}
              onZoomReport={setZoomPct} onOpenComment={(id)=>setOpenComment(active.comments.find((c)=>c.id===id))} />

            {mode === "organizer" && (
              <ToolDock tool={tool} setTool={setTool} onUndo={studio.undo} onRedo={studio.redo} canUndo={studio.canUndo} canRedo={studio.canRedo} snapGrid={snapGrid} setSnapGrid={setSnapGrid} />
            )}
            {mode === "organizer" && tool === "measure" && (
              <div className="panel anim-slide-up" style={{ position: "absolute", left: "50%", bottom: 76, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 12, padding: "8px 8px 8px 14px", zIndex: 50 }}>
                <span style={{ fontSize: 12.5, color: "var(--ink-soft)", whiteSpace: "nowrap" }}>Drag to measure · click a line to delete</span>
                {(active.measurements||[]).length > 0 && (
                  <button className="pill" style={{ height: 30 }} onClick={()=>{ studio.clearMeasurements(); window.toast("Measurements cleared"); }}><Icon name="trash" size={13} /> Clear all ({(active.measurements||[]).length})</button>
                )}
              </div>
            )}
            {mode === "organizer" && layers.emergency && (
              <div className="panel anim-slide-up" style={{ position: "absolute", left: "50%", bottom: tool === "measure" ? 124 : 76, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 12, padding: "8px 8px 8px 14px", zIndex: 50 }}>
                <Icon name="alert" size={15} style={{ color: "var(--c-emergency)" }} />
                {active.emergency ? (
                  <React.Fragment>
                    <span style={{ fontSize: 12.5, color: "var(--ink-soft)", whiteSpace: "nowrap" }} className="hide-sm">Emergency lane · drag points · double-click to remove a point</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <button className="iconbtn" style={{ width: 28, height: 28 }} title="Narrower" onClick={()=>studio.setEmergency({ ...active.emergency, width: Math.max(4, active.emergency.width-2) })}>−</button>
                      <span className="mono" style={{ fontSize: 12, width: 44, textAlign: "center", color: "var(--ink)" }}>{active.emergency.width}′</span>
                      <button className="iconbtn" style={{ width: 28, height: 28 }} title="Wider" onClick={()=>studio.setEmergency({ ...active.emergency, width: Math.min(40, active.emergency.width+2) })}>+</button>
                    </div>
                    <button className="pill" style={{ height: 30 }} onClick={()=>{ studio.setEmergency(null); window.toast("Emergency lane removed"); }}><Icon name="trash" size={13} /> Remove</button>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <span style={{ fontSize: 12.5, color: "var(--ink-soft)" }}>No emergency lane on this layout</span>
                    <button className="pill accent" style={{ height: 30 }} onClick={()=>{ const w=active.lot.w, h=active.lot.h; studio.setEmergency({ width: 16, path: [{x:Math.round(w*0.2),y:Math.round(h*0.5)},{x:Math.round(w*0.8),y:Math.round(h*0.5)}] }); window.toast("Lane added — drag the points to shape it"); }}><Icon name="plus" size={14} /> Add lane</button>
                  </React.Fragment>
                )}
              </div>
            )}
            {/* Floating edit affordance — selection no longer auto-opens the panel */}
            {mode === "organizer" && selObjs.length > 0 && !inspectorOpen && (
              <button className="pill accent anim-pop" style={{ position: "absolute", top: 16, right: 16, zIndex: 50, boxShadow: "var(--shadow-lg)" }} onClick={()=>setInspectorOpen(true)}>
                <Icon name="settings" size={14} /> {selObjs.length > 1 ? `Edit ${selObjs.length} selected` : "Edit details"}
              </button>
            )}
            {mode === "attendee" && (
              <AttendeeBar doc={active} onFocus={(id)=>{ const o=active.objects.find((x)=>x.id===id); if(o&&canvasRef.current) canvasRef.current.centerOn(o,2.6); setArrowTargetId(id); }} routeTarget={routeTarget} setRouteTarget={setRouteTarget} />
            )}
            {mode !== "organizer" && mode !== "attendee" && <ModeBanner mode={mode} />}
            {mode === "vendor" && !vendorFocusId && (
              <div className="panel anim-slide-up" style={{ position: "absolute", left: "50%", bottom: 18, transform: "translateX(-50%)", padding: "11px 16px", display: "flex", alignItems: "center", gap: 9, zIndex: 40 }}>
                <Icon name="flag" size={15} style={{ color: "var(--accent)" }} /><span style={{ fontSize: 13, color: "var(--ink)" }}>Tap any booth to preview the vendor's view</span>
              </div>
            )}

            <CommentPopover comment={openComment} onResolve={(id)=>{ studio.resolveComment(id); setOpenComment(null); window.toast("Comment resolved"); }} onClose={()=>setOpenComment(null)} />
          </div>

          {showInspector && (
            <div className="hide-sm" style={{ display: "flex" }}>
              <Inspector objs={selObjs} mode={mode} onUpdate={(p)=>studio.updateObjects(p)}
                onDelete={()=>{ studio.deleteObjects(selection); setSelection([]); window.toast("Deleted"); }}
                onDuplicate={()=>{ const n=studio.duplicateObjects(selection); setSelection(n); window.toast("Duplicated"); }}
                onClose={()=>setInspectorOpen(false)} onUploadLogo={onUploadLogo} />
            </div>
          )}
        </div>

        <Toasts />
      </div>
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(<App />);
})();
