/* MapCanvas.jsx — pan / zoom / pinch / fit, grid, object render,
   drag + resize (organizer), ruler tool, find-booth highlight.
   Exported to window for the public + organizer views. */
(function () {
  const { useRef, useState, useEffect, useCallback, useMemo } = React;
  const { fillFor, categorizeVendor } = window.TCCF;

  const SNAP_FT = 5;
  const FOREST = "#4A4B35", CORAL = "#AA7050", CREMA = "#EBE5DB", INK = "#181818";

  function initials(label) {
    return (label || "").split(/\s+/).slice(0, 2).map((s) => s[0] || "").join("").toUpperCase().slice(0, 2);
  }

  function MapCanvas(props) {
    const {
      mode, objects, lot, selectedId, onSelect, onUpdateObject,
      vendorObjectId = null, arrowTargetId = null, snap = true,
      rulerActive = false, dimUnassigned = false,
    } = props;

    const wrapRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [fitDone, setFitDone] = useState(false);

    const lotPxW = lot.w * lot.scale;
    const lotPxH = lot.h * lot.scale;
    const arrowTarget = arrowTargetId != null ? objects.find((o) => o.id === arrowTargetId) : null;

    const fit = useCallback(() => {
      const el = wrapRef.current; if (!el) return;
      const pad = 48;
      const z = Math.min((el.clientWidth - pad * 2) / lotPxW, (el.clientHeight - pad * 2) / lotPxH);
      setZoom(z);
      setPan({ x: (el.clientWidth - lotPxW * z) / 2, y: (el.clientHeight - lotPxH * z) / 2 });
    }, [lotPxW, lotPxH]);

    useEffect(() => {
      if (!fitDone) { fit(); setFitDone(true); }
      const onR = () => fit();
      window.addEventListener("resize", onR);
      return () => window.removeEventListener("resize", onR);
    }, [fit, fitDone]);

    // Vendor view: recenter on their tent
    useEffect(() => {
      if (mode !== "vendor" || vendorObjectId == null) return;
      const o = objects.find((x) => x.id === vendorObjectId);
      const el = wrapRef.current; if (!o || !el) return;
      const z = 2.4;
      const cx = (o.x + o.w / 2) * lot.scale, cy = (o.y + o.h / 2) * lot.scale;
      setZoom(z);
      setPan({ x: el.clientWidth / 2 - cx * z, y: el.clientHeight / 2 - cy * z });
    }, [mode, vendorObjectId, objects, lot.scale]);

    // Wheel zoom (cursor anchored)
    const onWheel = useCallback((e) => {
      if (!wrapRef.current) return;
      e.preventDefault();
      const r = wrapRef.current.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const delta = -e.deltaY * 0.0015;
      setZoom((z) => {
        const nz = Math.min(8, Math.max(0.2, z * (1 + delta)));
        const ratio = nz / z;
        setPan((p) => ({ x: mx - (mx - p.x) * ratio, y: my - (my - p.y) * ratio }));
        return nz;
      });
    }, []);
    useEffect(() => {
      const el = wrapRef.current; if (!el) return;
      el.addEventListener("wheel", onWheel, { passive: false });
      return () => el.removeEventListener("wheel", onWheel);
    }, [onWheel]);

    // Pan + ruler
    const panState = useRef(null);
    const [rulers, setRulers] = useState([]);
    const rulerDrag = useRef(null);

    const clientToFt = (cx, cy) => {
      const r = wrapRef.current.getBoundingClientRect();
      return { x: (cx - r.left - pan.x) / (lot.scale * zoom), y: (cy - r.top - pan.y) / (lot.scale * zoom) };
    };

    const onBgDown = (e) => {
      if (rulerActive) {
        e.stopPropagation();
        const p = clientToFt(e.clientX, e.clientY);
        setRulers((rs) => { rulerDrag.current = rs.length; return [...rs, { ax: p.x, ay: p.y, bx: p.x, by: p.y }]; });
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      if (e.target !== e.currentTarget) return;
      onSelect && onSelect(null);
      panState.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onBgMove = (e) => {
      if (rulerDrag.current != null) {
        const p = clientToFt(e.clientX, e.clientY);
        const idx = rulerDrag.current;
        setRulers((rs) => rs.map((r, i) => (i === idx ? { ...r, bx: p.x, by: p.y } : r)));
        return;
      }
      if (!panState.current) return;
      const s = panState.current;
      setPan({ x: s.px + (e.clientX - s.x), y: s.py + (e.clientY - s.y) });
    };
    const onBgUp = (e) => {
      panState.current = null;
      if (rulerDrag.current != null) {
        const idx = rulerDrag.current;
        setRulers((rs) => rs.filter((r, i) => i !== idx || Math.hypot(r.bx - r.ax, r.by - r.ay) > 0.5));
      }
      rulerDrag.current = null;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    const removeRuler = (idx) => setRulers((rs) => rs.filter((_, i) => i !== idx));
    useEffect(() => { if (!rulerActive) setRulers([]); }, [rulerActive]);

    // Pinch
    const pinch = useRef(null);
    useEffect(() => {
      const el = wrapRef.current; if (!el) return;
      const dist = (t) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const ts = (e) => { if (e.touches.length === 2) pinch.current = { d: dist(e.touches), z: zoom }; };
      const tm = (e) => { if (e.touches.length === 2 && pinch.current) { e.preventDefault(); setZoom(Math.min(8, Math.max(0.2, pinch.current.z * (dist(e.touches) / pinch.current.d)))); } };
      const te = () => { pinch.current = null; };
      el.addEventListener("touchstart", ts, { passive: false });
      el.addEventListener("touchmove", tm, { passive: false });
      el.addEventListener("touchend", te);
      return () => { el.removeEventListener("touchstart", ts); el.removeEventListener("touchmove", tm); el.removeEventListener("touchend", te); };
    }, [zoom]);

    const zoomIn = () => setZoom((z) => Math.min(8, z * 1.2));
    const zoomOut = () => setZoom((z) => Math.max(0.2, z / 1.2));

    // Object drag / resize
    const drag = useRef(null);
    const onObjectDown = (e, o, kind) => {
      if (mode !== "organizer") return;
      e.stopPropagation();
      onSelect && onSelect(o.id);
      drag.current = { id: o.id, mode: kind, sx: e.clientX, sy: e.clientY, ox: o.x, oy: o.y, ow: o.w, oh: o.h };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onObjectMove = (e) => {
      const d = drag.current; if (!d) return;
      const dx = (e.clientX - d.sx) / (lot.scale * zoom);
      const dy = (e.clientY - d.sy) / (lot.scale * zoom);
      const sf = (v) => (snap ? Math.round(v / SNAP_FT) * SNAP_FT : Math.round(v * 10) / 10);
      if (d.mode === "move") {
        onUpdateObject && onUpdateObject(d.id, {
          x: Math.max(0, Math.min(lot.w - d.ow, sf(d.ox + dx))),
          y: Math.max(0, Math.min(lot.h - d.oh, sf(d.oy + dy))),
        });
      } else {
        onUpdateObject && onUpdateObject(d.id, { w: Math.max(SNAP_FT, sf(d.ow + dx)), h: Math.max(SNAP_FT, sf(d.oh + dy)) });
      }
    };
    const onObjectUp = (e) => { drag.current = null; try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (err) {} };

    // Grid
    const gridStyle = useMemo(() => {
      const cell = SNAP_FT * lot.scale;
      if (snap) return { backgroundImage: "radial-gradient(circle at 1px 1px, rgba(24,24,24,0.16) 1px, transparent 1px)", backgroundSize: `${cell}px ${cell}px` };
      return {
        backgroundImage: "linear-gradient(to right, rgba(24,24,24,0.07) 1px, transparent 1px),linear-gradient(to bottom, rgba(24,24,24,0.07) 1px, transparent 1px)",
        backgroundSize: `${cell}px ${cell}px`,
      };
    }, [snap, lot.scale]);

    const xTicks = Array.from({ length: Math.floor(lot.w / 20) + 1 }, (_, i) => i * 20);
    const yTicks = Array.from({ length: Math.floor(lot.h / 20) + 1 }, (_, i) => i * 20);
    const cutout = { x: 0, y: 250, w: 71, h: 145 };

    return (
      <div ref={wrapRef}
        className={rulerActive ? "mc-wrap mc-cross" : "mc-wrap mc-grab"}
        style={{ position: "absolute", inset: 0, overflow: "hidden", background: "#cfcab9", userSelect: "none", touchAction: "none" }}>
        <div style={{ position: "absolute", inset: 0 }}
          onPointerDown={onBgDown}
          onPointerMove={(e) => { onBgMove(e); onObjectMove(e); }}
          onPointerUp={(e) => { onBgUp(e); onObjectUp(e); }}
          onPointerCancel={(e) => { onBgUp(e); onObjectUp(e); }}>
          <div style={{ position: "absolute", transformOrigin: "top left", transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, width: lotPxW, height: lotPxH }}>
            {/* Lot base — festival lawn (brand sage) */}
            <div style={{ position: "absolute", inset: 0, background: "#BAB492", boxShadow: "0 2px 40px rgba(24,24,24,0.18)", ...gridStyle }} />

            {/* Non-property cutout */}
            <div style={{ position: "absolute", left: cutout.x * lot.scale, top: cutout.y * lot.scale, width: cutout.w * lot.scale, height: cutout.h * lot.scale, background: "#2c2d20", border: "2px dashed rgba(235,229,219,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.12em", color: "rgba(235,229,219,0.55)", transform: "rotate(-90deg)", whiteSpace: "nowrap" }}>Not part of property</div>
            </div>

            {/* Dimension ticks */}
            {xTicks.map((ft) => (
              <div key={`xt-${ft}`} style={{ position: "absolute", left: ft * lot.scale, top: -20, color: FOREST, fontFamily: "var(--font-mono)", transform: "translateX(-50%)", fontSize: `${10 / Math.max(zoom * 0.6, 0.6)}px` }}>{ft}'</div>
            ))}
            {yTicks.map((ft) => (
              <div key={`yt-${ft}`} style={{ position: "absolute", left: -24, top: ft * lot.scale, color: FOREST, fontFamily: "var(--font-mono)", transform: "translateY(-50%)", fontSize: `${10 / Math.max(zoom * 0.6, 0.6)}px` }}>{ft}'</div>
            ))}

            {/* Objects */}
            {objects.map((o) => {
              const isVendorTent = mode === "vendor" && o.id === vendorObjectId;
              const dim = mode === "vendor" && o.id !== vendorObjectId;
              const isVendor = o.type === "vendor" || o.type === "sponsor" || o.type === "food";
              const selected = selectedId === o.id;
              const isClickable = !dim && (mode !== "vendor" || isVendorTent);
              const f = fillFor(o);
              const showLogo = !!o.logo_url && isVendor;
              const unassignedDim = dimUnassigned && o.status === "unassigned";
              const wpx = o.w * lot.scale, hpx = o.h * lot.scale;
              const radius = o.category === "tent" ? 2 : o.category === "building" ? 3 : 0;
              const z = o.category === "zone" ? 1 : selected ? 30 : isVendorTent ? 20 : 5;

              const style = {
                position: "absolute", overflow: "hidden",
                left: o.x * lot.scale, top: o.y * lot.scale, width: wpx, height: hpx,
                background: showLogo ? "#fff" : f.bg, border: `1px solid ${f.border || "rgba(24,24,24,0.4)"}`,
                color: f.text_color || INK,
                opacity: dim ? 0.3 : unassignedDim ? 0.45 : 1,
                transform: isVendorTent ? "scale(1.18)" : undefined, transformOrigin: "center",
                cursor: mode === "organizer" ? "move" : isClickable ? "pointer" : "default",
                zIndex: z, transition: "box-shadow 200ms, opacity 200ms, transform 200ms", borderRadius: radius,
                boxShadow: selected ? `0 0 0 3px ${CORAL}, 0 0 16px 2px rgba(170,112,80,0.5)`
                  : isVendor ? "0 1px 2px rgba(24,24,24,0.18)" : undefined,
              };
              const init = initials(o.label);
              return (
                <div key={o.id} className={isVendorTent ? "mc-pulse" : ""} style={style}
                  onPointerDown={(e) => onObjectDown(e, o, "move")}
                  onClick={(e) => { e.stopPropagation(); if (mode !== "organizer" && isClickable) onSelect && onSelect(o.id); }}>
                  {showLogo ? (
                    <React.Fragment>
                      <img src={o.logo_url} alt={o.label || ""} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                      {wpx > 30 && (
                        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "1px 2px", fontSize: 8, lineHeight: 1.1, textAlign: "center", fontWeight: 500, background: "rgba(74,75,53,0.85)", color: CREMA, fontFamily: "var(--font-display)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{o.label}</div>
                      )}
                    </React.Fragment>
                  ) : isVendor ? (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 1, padding: "0 2px", textAlign: "center", pointerEvents: "none" }}>
                      <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, lineHeight: 1, fontSize: `${Math.min(15, Math.max(7, wpx * 0.34))}px` }}>{init || "?"}</div>
                      {wpx > 26 && <div style={{ fontFamily: "var(--font-display)", fontWeight: 500, lineHeight: 1.05, width: "100%", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontSize: `${Math.min(9, Math.max(5, wpx * 0.082))}px` }}>{o.label}</div>}
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, padding: "0 3px", textAlign: "center", pointerEvents: "none", fontFamily: "var(--font-mono)" }}>
                      {wpx > 26 && <div style={{ fontSize: `${Math.min(11, Math.max(7, wpx * 0.085))}px`, textTransform: "uppercase", letterSpacing: "0.06em", lineHeight: 1.1 }}>{o.label}</div>}
                    </div>
                  )}
                  {/* Status corner dot (organizer) */}
                  {mode === "organizer" && isVendor && o.status && wpx > 18 && (
                    <div style={{ position: "absolute", top: 2, right: 2, width: 6, height: 6, borderRadius: 999, background: o.status === "confirmed" ? "#6B6E45" : o.status === "pending" ? "#C29A6B" : "#9a9483", boxShadow: "0 0 0 1px rgba(255,255,255,0.6)" }} />
                  )}
                  {mode === "organizer" && selected && (
                    <div style={{ position: "absolute", bottom: -1, right: -1, width: 12, height: 12, background: CORAL, cursor: "se-resize", borderRadius: 2 }}
                      onPointerDown={(e) => onObjectDown(e, o, "resize")} />
                  )}
                </div>
              );
            })}

            {/* Rulers */}
            {rulers.length > 0 && (
              <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }} width={lotPxW} height={lotPxH}>
                {rulers.map((rl, i) => {
                  const ax = rl.ax * lot.scale, ay = rl.ay * lot.scale, bx = rl.bx * lot.scale, by = rl.by * lot.scale;
                  const distFt = Math.hypot(rl.bx - rl.ax, rl.by - rl.ay);
                  const mx = (ax + bx) / 2, my = (ay + by) / 2;
                  const len = Math.hypot(bx - ax, by - ay) || 1;
                  const off = 12 / zoom;
                  const lx = mx + (-(by - ay) / len) * off, ly = my + ((bx - ax) / len) * off;
                  const isD = rulerDrag.current === i;
                  return (
                    <g key={i} style={{ pointerEvents: isD ? "none" : "auto", cursor: "pointer" }}
                      onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); removeRuler(i); }}>
                      <line x1={ax} y1={ay} x2={bx} y2={by} stroke="transparent" strokeWidth={14 / zoom} />
                      <line x1={ax} y1={ay} x2={bx} y2={by} stroke={CORAL} strokeWidth={2 / zoom} strokeDasharray={`${6 / zoom} ${4 / zoom}`} pointerEvents="none" />
                      <circle cx={ax} cy={ay} r={4 / zoom} fill={CORAL} pointerEvents="none" />
                      <circle cx={bx} cy={by} r={4 / zoom} fill={CORAL} pointerEvents="none" />
                      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={INK} stroke={CREMA} strokeWidth={3 / zoom} paintOrder="stroke" fontFamily="var(--font-mono)" fontSize={11 / zoom} fontWeight={700} pointerEvents="none">{distFt.toFixed(1)}'</text>
                    </g>
                  );
                })}
              </svg>
            )}

            {/* Find-booth highlight */}
            {arrowTarget && (() => {
              const x = arrowTarget.x * lot.scale, y = arrowTarget.y * lot.scale, w = arrowTarget.w * lot.scale, h = arrowTarget.h * lot.scale;
              const cx = x + w / 2, pad = 6 / zoom, fs = 11 / zoom;
              const text = arrowTarget.label || "";
              const lw = Math.max(40 / zoom, text.length * fs * 0.58 + (8 / zoom) * 2), lh = fs + (4 / zoom) * 2;
              const ly = y - 10 / zoom - lh, tailH = 6 / zoom;
              return (
                <svg style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none", zIndex: 9999 }} width={lotPxW} height={lotPxH}>
                  <rect x={x - pad} y={y - pad} width={w + pad * 2} height={h + pad * 2} rx={4 / zoom} fill="none" stroke={CORAL} strokeWidth={3 / zoom} className="mc-bounce" style={{ transformOrigin: `${cx}px ${y + h / 2}px` }} />
                  <rect x={cx - lw / 2} y={ly} width={lw} height={lh} rx={2 / zoom} fill={CORAL} stroke={CREMA} strokeWidth={1.5 / zoom} />
                  <polygon points={`${cx - 5 / zoom},${ly + lh} ${cx + 5 / zoom},${ly + lh} ${cx},${ly + lh + tailH}`} fill={CORAL} stroke={CREMA} strokeWidth={1.5 / zoom} />
                  <text x={cx} y={ly + lh / 2} textAnchor="middle" dominantBaseline="central" fill={CREMA} fontFamily="var(--font-display)" fontSize={fs} fontWeight={700}>{text}</text>
                </svg>
              );
            })()}
          </div>
        </div>

        {/* Compass */}
        <div style={{ position: "absolute", top: 14, left: 14, width: 46, height: 46, borderRadius: 999, background: CREMA, border: `1px solid ${FOREST}`, display: "flex", alignItems: "center", justifyContent: "center", color: FOREST, pointerEvents: "none", boxShadow: "0 2px 8px rgba(24,24,24,0.15)" }}>
          <div style={{ position: "absolute", top: -2, fontSize: 9, fontWeight: 700, color: CORAL, fontFamily: "var(--font-mono)" }}>N</div>
          <span style={{ fontSize: 16 }}>✦</span>
        </div>

        {/* Zoom controls */}
        <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, padding: "5px 8px", background: FOREST, color: CREMA, borderRadius: 2 }}>{Math.round(zoom * 100)}%</div>
          <button className="mc-zbtn" onClick={zoomOut} aria-label="Zoom out">−</button>
          <button className="mc-zbtn" onClick={zoomIn} aria-label="Zoom in">+</button>
          <button className="mc-fit" onClick={fit}>Fit</button>
        </div>
      </div>
    );
  }

  window.MapCanvas = MapCanvas;
})();
