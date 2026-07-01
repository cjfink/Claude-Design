/* Canvas.jsx — the spatial workspace.
   Zoom / pan / fit, grid, layers, object rendering for every mode,
   multi-select + marquee, drag, resize, rotate, smart alignment guides,
   measurement tool, comment pins, attendee routing overlay.
   Exposes window.StudioCanvas. */
(function () {
  const { useRef, useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } = React;
  const { STUDIO } = window;
  const { CATEGORIES, STATUS, colorFor } = STUDIO;

  const SCALE = 4.2;             // px per foot at zoom=1
  const MIN_Z = 0.25, MAX_Z = 6;

  const PLACE_STYLE = {
    stage:     { fill: "#3A2C18", stroke: "#6a4a28", text: "#EBE5DB", icon: "mic", radius: 8 },
    food:      { fill: "#4A4B35", stroke: "#33341f", text: "#EBE5DB", icon: "utensils", radius: 8 },
    ticketing: { fill: "rgba(170,112,80,0.18)", stroke: "#AA7050", text: "#7a4a2c", icon: "ticket", radius: 8, dashed: true },
    restroom:  { fill: "#75878B", stroke: "#4f6064", text: "#F7F6F2", icon: "droplet", radius: 8 },
    building:  { fill: "#CFC9BC", stroke: "#9a9483", text: "#4A4B35", icon: "building", radius: 6 },
    patch:     { fill: "rgba(107,110,69,0.28)", stroke: "#6B6E45", text: "#3a3c24", icon: "target", radius: "50%" },
    entrance:  { fill: "#6B6E45", stroke: "#4A4B35", text: "#F7F6F2", icon: "door", radius: 6 },
    generator: { fill: "#C9A227", stroke: "#9a7c1d", text: "#3a2c10", icon: "bolt", radius: 6 },
  };

  function initials(s) { return (s || "").split(/\s+/).slice(0, 2).map((w) => w[0] || "").join("").toUpperCase().slice(0, 2); }
  const snap5 = (v) => Math.round(v / 5) * 5;

  const StudioCanvas = forwardRef(function StudioCanvas(props, ref) {
    const {
      doc, mode, theme, tool, layers, zoomGrid,
      selection, onSelectionChange, onUpdateObjects, onAddComment,
      arrowTargetId, routeTargetId, onMeasure, measurements,
      onZoomReport, vendorFocusId,
    } = props;

    const wrapRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const fitOnce = useRef(false);
    const lot = doc.lot;
    const lotPxW = lot.w * SCALE, lotPxH = lot.h * SCALE;
    const isEditing = mode === "organizer";

    const objects = doc.objects;
    const byId = useMemo(() => Object.fromEntries(objects.map((o) => [o.id, o])), [objects]);

    /* ---- camera ---- */
    const fit = useCallback((pad) => {
      const el = wrapRef.current; if (!el) return;
      pad = pad == null ? 92 : pad;
      const z = Math.min((el.clientWidth - pad * 2) / lotPxW, (el.clientHeight - pad * 2) / lotPxH);
      const cz = Math.max(MIN_Z, Math.min(MAX_Z, z));
      setZoom(cz);
      setPan({ x: (el.clientWidth - lotPxW * cz) / 2, y: (el.clientHeight - lotPxH * cz) / 2 });
    }, [lotPxW, lotPxH]);

    const centerOn = useCallback((o, z) => {
      const el = wrapRef.current; if (!el || !o) return;
      const cx = (o.x + (o.w || 6) / 2) * SCALE, cy = (o.y + (o.h || 6) / 2) * SCALE;
      const cz = z || 2.6;
      setZoom(cz);
      setPan({ x: el.clientWidth / 2 - cx * cz, y: el.clientHeight / 2 - cy * cz });
    }, []);

    useImperativeHandle(ref, () => ({
      fit, centerOn, zoomTo: (z) => setZoom(Math.max(MIN_Z, Math.min(MAX_Z, z))),
      getCamera: () => ({ zoom, pan }),
      getViewCenterFt: () => {
        const el = wrapRef.current; if (!el) return { x: lot.w/2, y: lot.h/2 };
        return { x: (el.clientWidth/2 - pan.x) / (SCALE*zoom), y: (el.clientHeight/2 - pan.y) / (SCALE*zoom) };
      },
    }), [fit, centerOn, zoom, pan, lot.w, lot.h]);

    useEffect(() => { if (!fitOnce.current) { fit(); fitOnce.current = true; } const r = () => fit(); window.addEventListener("resize", r); return () => window.removeEventListener("resize", r); }, [fit]);
    useEffect(() => { onZoomReport && onZoomReport(zoom); }, [zoom, onZoomReport]);

    // focus from search / vendor mode
    useEffect(() => { if (vendorFocusId != null && byId[vendorFocusId]) centerOn(byId[vendorFocusId], 2.4); }, [vendorFocusId]);
    useEffect(() => { if (arrowTargetId != null && byId[arrowTargetId]) centerOn(byId[arrowTargetId], 2.2); }, [arrowTargetId]);

    /* ---- wheel zoom (cursor-anchored) ---- */
    const onWheel = useCallback((e) => {
      const el = wrapRef.current; if (!el) return; e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      if (e.ctrlKey || e.metaKey || !e.shiftKey) {
        const d = -e.deltaY * 0.0016;
        setZoom((z) => { const nz = Math.max(MIN_Z, Math.min(MAX_Z, z * (1 + d))); const k = nz / z; setPan((p) => ({ x: mx - (mx - p.x) * k, y: my - (my - p.y) * k })); return nz; });
      } else { setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY })); }
    }, []);
    useEffect(() => { const el = wrapRef.current; if (!el) return; el.addEventListener("wheel", onWheel, { passive: false }); return () => el.removeEventListener("wheel", onWheel); }, [onWheel]);

    /* ---- coordinate helpers ---- */
    const toFt = useCallback((cx, cy) => { const r = wrapRef.current.getBoundingClientRect(); return { x: (cx - r.left - pan.x) / (SCALE * zoom), y: (cy - r.top - pan.y) / (SCALE * zoom) }; }, [pan, zoom]);

    /* ---- interaction state ---- */
    const drag = useRef(null);
    const [marquee, setMarquee] = useState(null);
    const [guides, setGuides] = useState([]);
    const [measureDraft, setMeasureDraft] = useState(null);
    const [spaceDown, setSpaceDown] = useState(false);

    // Hold SPACE to pan from anywhere (Figma-style), regardless of active tool.
    useEffect(() => {
      const dn = (e) => { if (e.code === "Space" && !/INPUT|TEXTAREA|SELECT/.test((e.target&&e.target.tagName)||"")) { e.preventDefault(); setSpaceDown(true); } };
      const up = (e) => { if (e.code === "Space") setSpaceDown(false); };
      window.addEventListener("keydown", dn);
      window.addEventListener("keyup", up);
      return () => { window.removeEventListener("keydown", dn); window.removeEventListener("keyup", up); };
    }, []);

    const selectable = (o) => {
      if (!isEditing) return false;
      if (o.kind === "booth") return layers.booths;
      if (["stage","food","ticketing","restroom","building","entrance","patch"].includes(o.kind)) return layers.places;
      if (o.kind === "generator" || o.kind === "power") return layers.power;
      if (o.kind === "water") return layers.water;
      return false;
    };

    /* ---- smart guides: compare moving rect to others ---- */
    function computeGuides(moving, others) {
      const gs = []; const TOL = 1.2; // feet
      const me = { l: moving.x, r: moving.x + moving.w, cx: moving.x + moving.w/2, t: moving.y, b: moving.y + moving.h, cy: moving.y + moving.h/2 };
      let snapX = null, snapY = null;
      others.forEach((o) => {
        if (!o.w) return;
        const ot = { l: o.x, r: o.x + o.w, cx: o.x + o.w/2, t: o.y, b: o.y + o.h, cy: o.y + o.h/2 };
        [["l","l"],["r","r"],["cx","cx"],["l","r"],["r","l"]].forEach(([a,b]) => {
          if (Math.abs(me[a]-ot[b]) < TOL) { gs.push({ vert: true, at: ot[b] }); if (snapX==null) snapX = ot[b] - (me[a]-moving.x); }
        });
        [["t","t"],["b","b"],["cy","cy"],["t","b"],["b","t"]].forEach(([a,b]) => {
          if (Math.abs(me[a]-ot[b]) < TOL) { gs.push({ vert: false, at: ot[b] }); if (snapY==null) snapY = ot[b] - (me[a]-moving.y); }
        });
      });
      return { gs, snapX, snapY };
    }

    /* ---- pointer on background ---- */
    const onBgDown = (e) => {
      const panMode = spaceDown || (isEditing && tool === "pan");
      if (e.target !== e.currentTarget && !e.target.dataset.bg && !panMode) return;
      const ftp = toFt(e.clientX, e.clientY);
      // SPACE-hold or Hand tool → pan from anywhere
      if (spaceDown || (isEditing && tool === "pan")) {
        drag.current = { type: "pan", sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
        e.currentTarget.setPointerCapture(e.pointerId); return;
      }
      if (isEditing && tool === "measure") { setMeasureDraft({ a: ftp, b: ftp }); drag.current = { type: "measure" }; e.currentTarget.setPointerCapture(e.pointerId); return; }
      if (isEditing && tool === "comment") { onAddComment && onAddComment(ftp); return; }
      if (isEditing && tool === "select") { // marquee
        onSelectionChange([]);
        setMarquee({ x0: ftp.x, y0: ftp.y, x1: ftp.x, y1: ftp.y });
        drag.current = { type: "marquee" }; e.currentTarget.setPointerCapture(e.pointerId); return;
      }
      // pan (non-edit modes)
      onSelectionChange && onSelectionChange([]);
      drag.current = { type: "pan", sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    };

    const onMove = (e) => {
      const d = drag.current; if (!d) return;
      const commitOnce = () => { if (!d.committed) { d.committed = true; props.onBeginChange && props.onBeginChange(); } };
      if (d.type === "pan") { setPan({ x: d.px + (e.clientX - d.sx), y: d.py + (e.clientY - d.sy) }); return; }
      if (d.type === "measure") { setMeasureDraft((m) => ({ ...m, b: toFt(e.clientX, e.clientY) })); return; }
      if (d.type === "marquee") { const p = toFt(e.clientX, e.clientY); setMarquee((m) => ({ ...m, x1: p.x, y1: p.y })); return; }
      if (d.type === "move") {
        const ft = toFt(e.clientX, e.clientY);
        const dx = ft.x - d.startFt.x, dy = ft.y - d.startFt.y;
        // compute guides from the primary object's prospective position
        if (!e.altKey) {
          const prim = { ...byId[d.primary], x: d.base[d.primary].x + dx, y: d.base[d.primary].y + dy };
          const others = objects.filter((o) => o.w && !d.ids.includes(o.id) && selectable(o));
          const { gs } = computeGuides(prim, others);
          setGuides(gs);
        } else { setGuides([]); }
        const patches = d.ids.map((id) => {
          let x = d.base[id].x + dx, y = d.base[id].y + dy;
          if (props.snapGrid && !e.altKey) { x = snap5(x); y = snap5(y); }
          const ow = byId[id].w || 0, oh = byId[id].h || 0;
          x = Math.max(0, Math.min(lot.w - ow, Math.round(x*10)/10));
          y = Math.max(0, Math.min(lot.h - oh, Math.round(y*10)/10));
          return { id, x, y };
        });
        commitOnce();
        onUpdateObjects(patches, { transient: true });
        return;
      }
      if (d.type === "resize") {
        const ft = toFt(e.clientX, e.clientY);
        let w = Math.max(5, ft.x - byId[d.id].x), h = Math.max(5, ft.y - byId[d.id].y);
        if (props.snapGrid && !e.altKey) { w = snap5(w); h = snap5(h); }
        commitOnce();
        onUpdateObjects([{ id: d.id, w: Math.round(w*10)/10, h: Math.round(h*10)/10 }], { transient: true });
        return;
      }
      if (d.type === "rotate") {
        const o = byId[d.id]; const r = wrapRef.current.getBoundingClientRect();
        const cx = r.left + pan.x + (o.x + o.w/2) * SCALE * zoom;
        const cy = r.top + pan.y + (o.y + o.h/2) * SCALE * zoom;
        let ang = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
        if (!e.altKey) ang = Math.round(ang / 15) * 15;
        commitOnce();
        onUpdateObjects([{ id: d.id, rot: Math.round(ang) }], { transient: true });
        return;
      }
      if (d.type === "ptsize") {
        const o = byId[d.id]; if (!o) { return; }
        const ft = toFt(e.clientX, e.clientY);
        let s = Math.max(2, Math.hypot(ft.x - o.x, ft.y - o.y) * 2);
        if (props.snapGrid && !e.altKey) s = Math.round(s);
        commitOnce();
        onUpdateObjects([{ id: d.id, size: Math.round(s*10)/10 }], { transient: true });
        return;
      }
      if (d.type === "emvtx" && emPath) {
        const ft = toFt(e.clientX, e.clientY);
        let x = ft.x, y = ft.y;
        if (props.snapGrid && !e.altKey) { x = snap5(x); y = snap5(y); }
        x = Math.max(0, Math.min(lot.w, Math.round(x*10)/10));
        y = Math.max(0, Math.min(lot.h, Math.round(y*10)/10));
        const path = emPath.path.map((p, i) => (i === d.idx ? { x, y } : p));
        commitOnce();
        props.onUpdateEmergency && props.onUpdateEmergency({ ...emPath, path }, { transient: true });
        return;
      }
    };

    const onUp = (e) => {
      const d = drag.current;
      if (d && d.type === "measure" && measureDraft) {
        const len = Math.hypot(measureDraft.b.x - measureDraft.a.x, measureDraft.b.y - measureDraft.a.y);
        if (len > 1) onMeasure && onMeasure(measureDraft);
        setMeasureDraft(null);
      }
      if (d && d.type === "marquee" && marquee) {
        const x0 = Math.min(marquee.x0, marquee.x1), x1 = Math.max(marquee.x0, marquee.x1);
        const y0 = Math.min(marquee.y0, marquee.y1), y1 = Math.max(marquee.y0, marquee.y1);
        const hit = objects.filter((o) => o.w && selectable(o) && o.x < x1 && o.x + o.w > x0 && o.y < y1 && o.y + o.h > y0).map((o) => o.id);
        if (hit.length) onSelectionChange(hit);
        setMarquee(null);
      }
      setGuides([]);
      drag.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    };

    const onObjDown = (e, o, kind) => {
      // SPACE-hold pans even over objects — let the background handler take it
      if (spaceDown) return;
      if (!isEditing || (tool !== "select")) { // allow click-to-select-detail in non-edit modes
        if (!isEditing) { e.stopPropagation(); props.onObjectClick && props.onObjectClick(o.id); }
        return;
      }
      if (!selectable(o)) return;
      e.stopPropagation();
      let ids = selection.includes(o.id) ? selection : (e.shiftKey ? [...selection, o.id] : [o.id]);
      if (e.shiftKey && selection.includes(o.id)) ids = selection.filter((x) => x !== o.id);
      onSelectionChange(ids);
      if (kind === "resize" || kind === "rotate") { drag.current = { type: kind, id: o.id }; }
      else {
        const base = {}; ids.forEach((id) => { base[id] = { x: byId[id].x, y: byId[id].y }; });
        drag.current = { type: "move", ids, base, primary: o.id, startFt: toFt(e.clientX, e.clientY) };
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    };

    const zoomBtn = (dir) => setZoom((z) => Math.max(MIN_Z, Math.min(MAX_Z, dir > 0 ? z * 1.25 : z / 1.25)));

    /* ---- emergency lane geometry ---- */
    const emPath = doc.emergency;

    /* ---- visibility per mode ---- */
    const showLayer = (key) => {
      if (mode === "utility") { if (["power","water","emergency"].includes(key)) return true; if (key === "booths" || key === "places" || key === "grid") return layers[key]; return layers[key]; }
      return layers[key];
    };

    const dimNonRoute = mode === "attendee" && routeTargetId != null;

    return (
      <div ref={wrapRef}
        className={spaceDown ? "cv-grab" : isEditing && tool === "pan" ? "cv-grab" : isEditing && (tool === "measure" || tool === "comment") ? "cv-cross" : isEditing && tool === "select" ? "cv-default" : "cv-grab"}
        style={{ position: "absolute", inset: 0, overflow: "hidden", background: "var(--canvas)", touchAction: "none", userSelect: "none" }}
        onPointerDown={onBgDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
        <div data-bg="1" style={{ position: "absolute", inset: 0 }} />

        <div style={{ position: "absolute", transformOrigin: "top left", transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`, width: lotPxW, height: lotPxH, pointerEvents: "none" }}>
          {/* Lot ground */}
          <div data-bg="1" style={{ position: "absolute", inset: 0, background: "var(--lot)", borderRadius: 10, boxShadow: "var(--shadow-md)", pointerEvents: "auto",
            backgroundImage: showLayer("grid") && zoomGrid ? "radial-gradient(circle at 1px 1px, var(--grid-dot) 1.4px, transparent 1.4px)" : "none",
            backgroundSize: `${5*SCALE}px ${5*SCALE}px` }} onPointerDown={(e)=>{ e.currentTarget.dataset.bg='1'; }} />

          {/* Perimeter measurement ruler (feet) */}
          {showLayer("grid") && (() => {
            const xt = [], yt = [];
            for (let ft = 0; ft <= lot.w; ft += 20) xt.push(ft);
            for (let ft = 0; ft <= lot.h; ft += 20) yt.push(ft);
            const fs = 9 / zoom, off = 6 / zoom, lab = 20 / zoom, tick = 5 / zoom;
            const lblStyle = { position: "absolute", fontFamily: "var(--font-mono)", fontSize: fs, color: "var(--ink-faint)", pointerEvents: "none", whiteSpace: "nowrap" };
            return (
              <React.Fragment>
                {/* top edge */}
                {xt.map((ft) => (
                  <React.Fragment key={"x"+ft}>
                    <div style={{ ...lblStyle, left: ft*SCALE, top: -lab, transform: "translateX(-50%)" }}>{ft}′</div>
                    <div style={{ position: "absolute", left: ft*SCALE, top: -tick, width: 1, height: tick, background: "var(--line-strong)", pointerEvents: "none" }} />
                  </React.Fragment>
                ))}
                {/* left edge */}
                {yt.map((ft) => (
                  <React.Fragment key={"y"+ft}>
                    <div style={{ ...lblStyle, left: -off, top: ft*SCALE, transform: "translate(-100%,-50%)" }}>{ft}′</div>
                    <div style={{ position: "absolute", left: -tick, top: ft*SCALE, width: tick, height: 1, background: "var(--line-strong)", pointerEvents: "none" }} />
                  </React.Fragment>
                ))}
                {/* overall dimension callouts */}
                <div style={{ ...lblStyle, left: lot.w*SCALE/2, top: -lab*2, transform: "translateX(-50%)", fontSize: 10/zoom, color: "var(--ink-soft)", letterSpacing: "0.1em" }}>{lot.w}′ WIDE</div>
                <div style={{ ...lblStyle, left: -lab*2, top: lot.h*SCALE/2, transform: "translate(-50%,-50%) rotate(-90deg)", fontSize: 10/zoom, color: "var(--ink-soft)", letterSpacing: "0.1em" }}>{lot.h}′ DEEP</div>
              </React.Fragment>
            );
          })()}

          {/* Emergency lane */}
          {showLayer("emergency") && emPath && (
            <svg style={{ position: "absolute", inset: 0, overflow: "visible" }} width={lotPxW} height={lotPxH}>
              <polyline points={emPath.path.map((p) => `${p.x*SCALE},${p.y*SCALE}`).join(" ")} fill="none"
                stroke="rgba(194,74,58,0.18)" strokeWidth={emPath.width*SCALE} strokeLinejoin="round" strokeLinecap="round" />
              <polyline points={emPath.path.map((p) => `${p.x*SCALE},${p.y*SCALE}`).join(" ")} fill="none"
                stroke="var(--c-emergency)" strokeWidth={2} strokeDasharray="10 8" strokeLinejoin="round" style={{ animation: "dash 1s linear infinite" }} />
              <text x={emPath.path[0].x*SCALE+8} y={emPath.path[0].y*SCALE-8} fill="var(--c-emergency)" fontFamily="var(--font-mono)" fontSize={11} fontWeight="700">EMERGENCY LANE · {emPath.width}′ CLEAR</text>
            </svg>
          )}

          {/* Emergency lane EDIT handles (organizer) */}
          {isEditing && showLayer("emergency") && emPath && (
            <React.Fragment>
              {emPath.path.slice(0, -1).map((p, i) => {
                const n = emPath.path[i+1]; const mx=(p.x+n.x)/2, my=(p.y+n.y)/2;
                return (
                  <div key={"emid"+i} title="Insert point"
                    onPointerDown={(e)=>{ if (spaceDown) return; e.stopPropagation(); }}
                    onClick={(e)=>{ e.stopPropagation(); const path=[...emPath.path]; path.splice(i+1,0,{x:Math.round(mx),y:Math.round(my)}); props.onUpdateEmergency({ ...emPath, path }); }}
                    style={{ position:"absolute", left:mx*SCALE, top:my*SCALE, width:14, height:14, transform:`translate(-50%,-50%) scale(${1/zoom})`, borderRadius:999, background:"var(--panel)", border:"1.5px dashed var(--c-emergency)", color:"var(--c-emergency)", cursor:"copy", zIndex:46, pointerEvents:"auto", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <window.Icon name="plus" size={9} stroke={2.5} />
                  </div>
                );
              })}
              {emPath.path.map((p, i) => (
                <div key={"emvtx"+i} title="Drag to move · double-click to remove"
                  onPointerDown={(e)=>{ if (spaceDown) return; e.stopPropagation(); drag.current={ type:"emvtx", idx:i }; e.currentTarget.setPointerCapture(e.pointerId); }}
                  onDoubleClick={(e)=>{ e.stopPropagation(); if (emPath.path.length<=2) { window.toast && window.toast("A lane needs at least 2 points","err"); return; } props.onUpdateEmergency({ ...emPath, path: emPath.path.filter((_,k)=>k!==i) }); }}
                  style={{ position:"absolute", left:p.x*SCALE, top:p.y*SCALE, width:16, height:16, transform:`translate(-50%,-50%) scale(${1/zoom})`, borderRadius:999, background:"var(--c-emergency)", border:"2.5px solid var(--panel)", cursor:"move", zIndex:47, pointerEvents:"auto", boxShadow:"var(--shadow-md)" }} />
              ))}
            </React.Fragment>
          )}

          {/* Objects */}
          {objects.map((o) => {
            const isPlace = ["stage","food","ticketing","restroom","building","entrance","patch"].includes(o.kind);
            const isBooth = o.kind === "booth";
            const isGen = o.kind === "generator";
            const isPower = o.kind === "power";
            const isWater = o.kind === "water";

            if (isBooth && !showLayer("booths")) return null;
            if (isPlace && !showLayer("places")) return null;
            if (isGen && !showLayer("power")) return null;
            if (isPower && !showLayer("power")) return null;
            if (isWater && !showLayer("water")) return null;

            // point markers (power drops, water)
            if (isPower) return <PowerDrop key={o.id} o={o} sel={selection.includes(o.id)} zoom={zoom} editing={isEditing} onDown={(e)=>onObjDown(e,o,"move")} onEdit={()=>props.onObjectEdit&&props.onObjectEdit(o.id)} onResize={(e)=>{ if(spaceDown) return; e.stopPropagation(); onSelectionChange([o.id]); drag.current={type:"ptsize",id:o.id}; e.currentTarget.setPointerCapture(e.pointerId); }} />;
            if (isWater) return <WaterTap key={o.id} o={o} sel={selection.includes(o.id)} zoom={zoom} editing={isEditing} onDown={(e)=>onObjDown(e,o,"move")} onEdit={()=>props.onObjectEdit&&props.onObjectEdit(o.id)} onResize={(e)=>{ if(spaceDown) return; e.stopPropagation(); onSelectionChange([o.id]); drag.current={type:"ptsize",id:o.id}; e.currentTarget.setPointerCapture(e.pointerId); }} />;

            const sel = selection.includes(o.id);
            const dim = (mode === "vendor" && vendorFocusId != null && o.id !== vendorFocusId) || (dimNonRoute && o.id !== routeTargetId && isBooth);
            const x = o.x*SCALE, y = o.y*SCALE, w = o.w*SCALE, h = o.h*SCALE;

            let bg, border, txt, radius = 8, dashed = false, icon = null;
            if (isBooth) {
              const cc = colorFor(o); bg = cc; border = "rgba(0,0,0,0.18)"; txt = "#FBFAF6"; radius = 7;
            } else {
              const ps = PLACE_STYLE[o.kind] || PLACE_STYLE.building;
              bg = ps.fill; border = ps.stroke; txt = ps.text; radius = ps.radius; dashed = ps.dashed; icon = ps.icon;
            }

            const clickable = isEditing ? selectable(o) : true;
            const labelOn = showLayer("labels");

            return (
              <div key={o.id}
                onPointerDown={(e) => onObjDown(e, o, "move")}
                onDoubleClick={(e) => { if (isEditing && selectable(o)) { e.stopPropagation(); props.onObjectEdit && props.onObjectEdit(o.id); } }}
                style={{ position: "absolute", left: x, top: y, width: w, height: h, transform: o.rot ? `rotate(${o.rot}deg)` : undefined, transformOrigin: "center",
                  background: bg, border: `${dashed ? "1.5px dashed" : "1px solid"} ${border}`, borderRadius: radius, color: txt,
                  pointerEvents: clickable ? "auto" : "none", cursor: isEditing ? (selectable(o) ? "move" : "default") : (clickable ? "pointer" : "default"),
                  opacity: dim ? 0.28 : 1, transition: "opacity 220ms, box-shadow 160ms",
                  boxShadow: sel ? "0 0 0 2px var(--accent), var(--shadow-md)" : (isBooth ? "var(--shadow-sm)" : "var(--shadow-sm)"),
                  display: "flex", alignItems: "center", justifyContent: "center", overflow: "visible", zIndex: sel ? 40 : isBooth ? 10 : 6 }}>

                {/* power need badge in utility mode */}
                {mode === "utility" && isBooth && o.powerKW != null && (
                  <div style={{ position: "absolute", top: -7, right: -7, background: "var(--c-power)", color: "#3a2c10", fontFamily: "var(--font-mono)", fontSize: 8.5, fontWeight: 700, padding: "1px 4px", borderRadius: 5, boxShadow: "var(--shadow-sm)" }}>{o.powerKW}kW</div>
                )}
                {/* status dot (organizer) */}
                {isEditing && isBooth && o.status && w > 16 && (
                  <div title={o.status} style={{ position: "absolute", top: 3, right: 3, width: 6, height: 6, borderRadius: 999, background: (STATUS[o.status]||STATUS.pending).color, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.7)" }} />
                )}

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: 2, textAlign: "center", pointerEvents: "none", lineHeight: 1.05 }}>
                  {icon && w > 28 && <window.Icon name={icon} size={Math.min(18, w*0.3)} stroke={1.6} />}
                  {isBooth ? (
                    <React.Fragment>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: Math.min(13, Math.max(7, w*0.3)) }}>{initials(o.label)}</div>
                      {labelOn && w > 30 && <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, fontSize: Math.min(8, Math.max(5, w*0.08)), maxWidth: w-4, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{o.label}</div>}
                    </React.Fragment>
                  ) : (
                    labelOn && w > 30 && <div style={{ fontFamily: "var(--font-mono)", fontSize: Math.min(10, Math.max(7, w*0.07)), textTransform: "uppercase", letterSpacing: "0.04em", maxWidth: w-6 }}>{o.label}</div>
                  )}
                </div>

                {/* selection handles */}
                {isEditing && sel && selection.length === 1 && (
                  <React.Fragment>
                    <div onPointerDown={(e) => onObjDown(e, o, "resize")} style={{ position: "absolute", right: -6, bottom: -6, width: 13, height: 13, background: "var(--accent)", border: "2px solid var(--panel)", borderRadius: 4, cursor: "nwse-resize", pointerEvents: "auto" }} />
                    {o.kind === "booth" || isPlace ? (
                      <div onPointerDown={(e) => onObjDown(e, o, "rotate")} style={{ position: "absolute", left: "50%", top: -22, width: 13, height: 13, marginLeft: -6.5, background: "var(--panel)", border: "2px solid var(--accent)", borderRadius: 999, cursor: "grab", pointerEvents: "auto" }} />
                    ) : null}
                  </React.Fragment>
                )}
              </div>
            );
          })}

          {/* Smart guides */}
          {guides.map((g, i) => g.vert
            ? <div key={i} style={{ position: "absolute", left: g.at*SCALE-0.5, top: -40, bottom: -40, width: 1, background: "var(--accent)", pointerEvents: "none", opacity: 0.9 }} />
            : <div key={i} style={{ position: "absolute", top: g.at*SCALE-0.5, left: -40, right: -40, height: 1, background: "var(--accent)", pointerEvents: "none", opacity: 0.9 }} />)}

          {/* Measurements (saved) */}
          <MeasureLayer measurements={measurements} draft={measureDraft} scale={SCALE} zoom={zoom} editing={isEditing} onDelete={props.onDeleteMeasurement} />

          {/* Comment pins */}
          {(doc.comments||[]).map((c) => mode === "organizer" && (
            <CommentPin key={c.id} c={c} scale={SCALE} zoom={zoom} onOpen={() => props.onOpenComment && props.onOpenComment(c.id)} />
          ))}

          {/* Attendee route */}
          {mode === "attendee" && routeTargetId != null && byId[routeTargetId] && (
            <RouteOverlay from={props.attendeePos} to={byId[routeTargetId]} scale={SCALE} zoom={zoom} />
          )}
          {/* Attendee blue dot */}
          {mode === "attendee" && props.attendeePos && (
            <div style={{ position: "absolute", left: props.attendeePos.x*SCALE-7, top: props.attendeePos.y*SCALE-7, width: 14, height: 14, borderRadius: 999, background: "var(--c-water)", border: "2.5px solid #fff", boxShadow: "0 1px 5px rgba(0,0,0,0.4)", animation: "blueDot 2s ease-out infinite", zIndex: 60, pointerEvents: "none" }} />
          )}

          {/* find-booth highlight */}
          {arrowTargetId != null && byId[arrowTargetId] && <Highlight o={byId[arrowTargetId]} scale={SCALE} zoom={zoom} />}
        </div>

        {/* marquee */}
        {marquee && (() => { const x0=Math.min(marquee.x0,marquee.x1)*SCALE*zoom+pan.x, y0=Math.min(marquee.y0,marquee.y1)*SCALE*zoom+pan.y, ww=Math.abs(marquee.x1-marquee.x0)*SCALE*zoom, hh=Math.abs(marquee.y1-marquee.y0)*SCALE*zoom;
          return <div style={{ position: "absolute", left: x0, top: y0, width: ww, height: hh, background: "var(--sel)", border: "1px solid var(--accent)", pointerEvents: "none", borderRadius: 3 }} />; })()}

        {/* zoom controls */}
        <div style={{ position: "absolute", left: 16, bottom: 16, display: "flex", alignItems: "center", gap: 8, zIndex: 50 }}>
          <div className="panel" style={{ display: "flex", alignItems: "center", padding: 4, gap: 2 }}>
            <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => zoomBtn(-1)}><window.Icon name="zoomOut" size={17} /></button>
            <div className="mono" style={{ width: 46, textAlign: "center", fontSize: 11, color: "var(--ink-soft)" }}>{Math.round(zoom*100)}%</div>
            <button className="iconbtn" style={{ width: 32, height: 32 }} onClick={() => zoomBtn(1)}><window.Icon name="zoomIn" size={17} /></button>
          </div>
          <button className="iconbtn panel" style={{ width: 38, height: 38 }} onClick={() => fit()} title="Fit to screen"><window.Icon name="fit" size={17} /></button>
        </div>

        {/* compass */}
        <div className="panel" style={{ position: "absolute", left: 16, top: 16, width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 40, color: "var(--ink-soft)" }}>
          <div style={{ position: "absolute", top: 3, fontFamily: "var(--font-mono)", fontSize: 8, fontWeight: 700, color: "var(--accent)" }}>N</div>
          <window.Icon name="compass" size={20} />
        </div>
      </div>
    );
  });

  /* ---- sub-components ---- */
  function PowerDrop({ o, sel, onDown, onEdit, editing, zoom, onResize }) {
    const s = (o.size || 4.5) * SCALE; const x = o.x*SCALE, y = o.y*SCALE;
    return (
      <div onPointerDown={editing ? onDown : undefined} onDoubleClick={editing ? onEdit : undefined}
        style={{ position: "absolute", left: x-s/2, top: y-s/2, width: s, height: s, borderRadius: Math.max(3, s*0.28), background: "var(--c-power)", border: "1.5px solid #9a7c1d", display: "flex", alignItems: "center", justifyContent: "center", color: "#3a2c10", boxShadow: sel ? "0 0 0 2px var(--accent), var(--shadow-md)" : "var(--shadow-sm)", zIndex: sel ? 40 : 12, cursor: editing ? "move" : "default", pointerEvents: editing ? "auto" : "none" }} title={`Power drop · ${o.amps}A`}>
        <window.Icon name="bolt" size={Math.max(8, s*0.58)} stroke={2} fill="#3a2c10" />
        {editing && sel && <div onPointerDown={onResize} style={{ position: "absolute", right: 0, bottom: 0, width: 12, height: 12, transform: `translate(50%,50%) scale(${1/zoom})`, background: "var(--accent)", border: "2px solid var(--panel)", borderRadius: 3, cursor: "nwse-resize", pointerEvents: "auto" }} />}
      </div>
    );
  }
  function WaterTap({ o, sel, onDown, onEdit, editing, zoom, onResize }) {
    const s = (o.size || 4.5) * SCALE; const x = o.x*SCALE, y = o.y*SCALE;
    return (
      <div onPointerDown={editing ? onDown : undefined} onDoubleClick={editing ? onEdit : undefined}
        style={{ position: "absolute", left: x-s/2, top: y-s/2, width: s, height: s, borderRadius: 999, background: "var(--c-water)", border: "1.5px solid #3f6678", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: sel ? "0 0 0 2px var(--accent), var(--shadow-md)" : "var(--shadow-sm)", zIndex: sel ? 40 : 12, cursor: editing ? "move" : "default", pointerEvents: editing ? "auto" : "none" }} title={`Water · ${o.gpm} GPM`}>
        <window.Icon name="droplet" size={Math.max(8, s*0.58)} stroke={2} fill="#fff" />
        {editing && sel && <div onPointerDown={onResize} style={{ position: "absolute", right: 0, bottom: 0, width: 12, height: 12, transform: `translate(50%,50%) scale(${1/zoom})`, background: "var(--accent)", border: "2px solid var(--panel)", borderRadius: 3, cursor: "nwse-resize", pointerEvents: "auto" }} />}
      </div>
    );
  }
  function MeasureLayer({ measurements, draft, scale, zoom, editing, onDelete }) {
    const saved = measurements || [];
    const all = [...saved]; if (draft) all.push(draft);
    if (!all.length) return null;
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", zIndex: 55 }}>
        {all.map((m, i) => {
          const ax=m.a.x*scale, ay=m.a.y*scale, bx=m.b.x*scale, by=m.b.y*scale;
          const len = Math.hypot(m.b.x-m.a.x, m.b.y-m.a.y);
          const mx=(ax+bx)/2, my=(ay+by)/2;
          const isSaved = i < saved.length;
          const canDel = editing && isSaved && onDelete;
          return (
            <g key={i} style={{ cursor: canDel ? "pointer" : "default", pointerEvents: canDel ? "auto" : "none" }}
              onPointerDown={canDel ? (e)=>e.stopPropagation() : undefined}
              onClick={canDel ? (e)=>{ e.stopPropagation(); onDelete(i); } : undefined}>
              {canDel && <line x1={ax} y1={ay} x2={bx} y2={by} stroke="transparent" strokeWidth={16/zoom} />}
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke="var(--accent)" strokeWidth={2/zoom} strokeDasharray={`${6/zoom} ${4/zoom}`} pointerEvents="none" />
              <circle cx={ax} cy={ay} r={3.5/zoom} fill="var(--accent)" pointerEvents="none" /><circle cx={bx} cy={by} r={3.5/zoom} fill="var(--accent)" pointerEvents="none" />
              <g transform={`translate(${mx},${my})`} pointerEvents="none">
                <rect x={-22/zoom} y={-9/zoom} width={44/zoom} height={18/zoom} rx={4/zoom} fill="var(--accent)" />
                <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fill="#fff" fontFamily="var(--font-mono)" fontSize={11/zoom} fontWeight="700">{len.toFixed(1)}′</text>
              </g>
            </g>
          );
        })}
      </svg>
    );
  }
  function CommentPin({ c, scale, zoom, onOpen }) {
    return (
      <div onPointerDown={(e)=>{e.stopPropagation(); onOpen();}} style={{ position: "absolute", left: c.x*scale-13, top: c.y*scale-26, width: 26, height: 26, cursor: "pointer", zIndex: 58, pointerEvents: "auto", transform: `scale(${1/zoom})`, transformOrigin: "bottom center" }}>
        <div style={{ width: 26, height: 26, borderRadius: "50% 50% 50% 2px", background: c.color || "#AA7050", border: "2px solid #fff", boxShadow: "var(--shadow-md)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 700, transform: "rotate(45deg)" }}>
          <span style={{ transform: "rotate(-45deg)" }}>{c.initials || "?"}</span>
        </div>
      </div>
    );
  }
  function RouteOverlay({ from, to, scale, zoom }) {
    if (!from) return null;
    const ax=from.x*scale, ay=from.y*scale, bx=(to.x+to.w/2)*scale, by=(to.y+to.h/2)*scale;
    // simple L-route
    const pts = `${ax},${ay} ${ax},${by} ${bx},${by}`;
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", zIndex: 50 }}>
        <polyline points={pts} fill="none" stroke="var(--c-water)" strokeWidth={4/zoom} strokeLinecap="round" strokeLinejoin="round" opacity="0.35" />
        <polyline points={pts} fill="none" stroke="var(--c-water)" strokeWidth={2.5/zoom} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${2/zoom} ${7/zoom}`} style={{ animation: "dash 0.8s linear infinite" }} />
      </svg>
    );
  }
  function Highlight({ o, scale, zoom }) {
    const x=o.x*scale, y=o.y*scale, w=o.w*scale, h=o.h*scale;
    return (
      <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", zIndex: 90 }}>
        <rect x={x-7} y={y-7} width={w+14} height={h+14} rx={8} fill="none" stroke="var(--accent)" strokeWidth={3/zoom} style={{ transformOrigin: `${x+w/2}px ${y+h/2}px`, animation: "pulseRing 1.3s ease-in-out infinite" }} />
      </svg>
    );
  }

  window.StudioCanvas = StudioCanvas;
  window.STUDIO_SCALE = SCALE;
})();
