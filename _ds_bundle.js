/* @ds-bundle: {"format":3,"namespace":"TCCFDesignSystem_b0488d","components":[{"name":"MerchTeaser","sourcePath":"lovable/MerchTeaser.tsx"}],"sourceHashes":{"app/MapCanvas.jsx":"2e48f2f72dde","app/Organizer.jsx":"f706d4820c58","app/OrganizerDetail.jsx":"42e6a2e862d3","app/PublicMap.jsx":"ef37740ac6c5","app/data.js":"c892a8786b59","app/hooks.jsx":"2b3a14c5e592","app/main.jsx":"f7d9b999d9e5","app/shared.jsx":"410141dd0126","design-canvas.jsx":"bd8746af6e58","image-slot.js":"9309434cb09c","lovable/MerchTeaser.tsx":"d84f5aae3e8f","poster-100days.jsx":"b33a1bbe0016","poster.jsx":"72025dffd43e","posts.jsx":"ebf36f01cccd","studio/Canvas.jsx":"9281a392016e","studio/Chrome.jsx":"83b6d11f1867","studio/Panels.jsx":"82c8a668fc7f","studio/app.jsx":"b9d8741f2c52","studio/data.js":"9b09ec27f4c5","studio/export.jsx":"b47a803a0475","studio/icons.jsx":"93087f136b7a","studio/useStudio.jsx":"313f1494ae02","tweaks-panel.jsx":"6591467622ed"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.TCCFDesignSystem_b0488d = window.TCCFDesignSystem_b0488d || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// app/MapCanvas.jsx
try { (() => {
/* MapCanvas.jsx — pan / zoom / pinch / fit, grid, object render,
   drag + resize (organizer), ruler tool, find-booth highlight.
   Exported to window for the public + organizer views. */
(function () {
  const {
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo
  } = React;
  const {
    fillFor,
    categorizeVendor
  } = window.TCCF;
  const SNAP_FT = 5;
  const FOREST = "#4A4B35",
    CORAL = "#AA7050",
    CREMA = "#EBE5DB",
    INK = "#181818";
  function initials(label) {
    return (label || "").split(/\s+/).slice(0, 2).map(s => s[0] || "").join("").toUpperCase().slice(0, 2);
  }
  function MapCanvas(props) {
    const {
      mode,
      objects,
      lot,
      selectedId,
      onSelect,
      onUpdateObject,
      vendorObjectId = null,
      arrowTargetId = null,
      snap = true,
      rulerActive = false,
      dimUnassigned = false
    } = props;
    const wrapRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({
      x: 0,
      y: 0
    });
    const [fitDone, setFitDone] = useState(false);
    const lotPxW = lot.w * lot.scale;
    const lotPxH = lot.h * lot.scale;
    const arrowTarget = arrowTargetId != null ? objects.find(o => o.id === arrowTargetId) : null;
    const fit = useCallback(() => {
      const el = wrapRef.current;
      if (!el) return;
      const pad = 48;
      const z = Math.min((el.clientWidth - pad * 2) / lotPxW, (el.clientHeight - pad * 2) / lotPxH);
      setZoom(z);
      setPan({
        x: (el.clientWidth - lotPxW * z) / 2,
        y: (el.clientHeight - lotPxH * z) / 2
      });
    }, [lotPxW, lotPxH]);
    useEffect(() => {
      if (!fitDone) {
        fit();
        setFitDone(true);
      }
      const onR = () => fit();
      window.addEventListener("resize", onR);
      return () => window.removeEventListener("resize", onR);
    }, [fit, fitDone]);

    // Vendor view: recenter on their tent
    useEffect(() => {
      if (mode !== "vendor" || vendorObjectId == null) return;
      const o = objects.find(x => x.id === vendorObjectId);
      const el = wrapRef.current;
      if (!o || !el) return;
      const z = 2.4;
      const cx = (o.x + o.w / 2) * lot.scale,
        cy = (o.y + o.h / 2) * lot.scale;
      setZoom(z);
      setPan({
        x: el.clientWidth / 2 - cx * z,
        y: el.clientHeight / 2 - cy * z
      });
    }, [mode, vendorObjectId, objects, lot.scale]);

    // Wheel zoom (cursor anchored)
    const onWheel = useCallback(e => {
      if (!wrapRef.current) return;
      e.preventDefault();
      const r = wrapRef.current.getBoundingClientRect();
      const mx = e.clientX - r.left,
        my = e.clientY - r.top;
      const delta = -e.deltaY * 0.0015;
      setZoom(z => {
        const nz = Math.min(8, Math.max(0.2, z * (1 + delta)));
        const ratio = nz / z;
        setPan(p => ({
          x: mx - (mx - p.x) * ratio,
          y: my - (my - p.y) * ratio
        }));
        return nz;
      });
    }, []);
    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      el.addEventListener("wheel", onWheel, {
        passive: false
      });
      return () => el.removeEventListener("wheel", onWheel);
    }, [onWheel]);

    // Pan + ruler
    const panState = useRef(null);
    const [rulers, setRulers] = useState([]);
    const rulerDrag = useRef(null);
    const clientToFt = (cx, cy) => {
      const r = wrapRef.current.getBoundingClientRect();
      return {
        x: (cx - r.left - pan.x) / (lot.scale * zoom),
        y: (cy - r.top - pan.y) / (lot.scale * zoom)
      };
    };
    const onBgDown = e => {
      if (rulerActive) {
        e.stopPropagation();
        const p = clientToFt(e.clientX, e.clientY);
        setRulers(rs => {
          rulerDrag.current = rs.length;
          return [...rs, {
            ax: p.x,
            ay: p.y,
            bx: p.x,
            by: p.y
          }];
        });
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      if (e.target !== e.currentTarget) return;
      onSelect && onSelect(null);
      panState.current = {
        x: e.clientX,
        y: e.clientY,
        px: pan.x,
        py: pan.y
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onBgMove = e => {
      if (rulerDrag.current != null) {
        const p = clientToFt(e.clientX, e.clientY);
        const idx = rulerDrag.current;
        setRulers(rs => rs.map((r, i) => i === idx ? {
          ...r,
          bx: p.x,
          by: p.y
        } : r));
        return;
      }
      if (!panState.current) return;
      const s = panState.current;
      setPan({
        x: s.px + (e.clientX - s.x),
        y: s.py + (e.clientY - s.y)
      });
    };
    const onBgUp = e => {
      panState.current = null;
      if (rulerDrag.current != null) {
        const idx = rulerDrag.current;
        setRulers(rs => rs.filter((r, i) => i !== idx || Math.hypot(r.bx - r.ax, r.by - r.ay) > 0.5));
      }
      rulerDrag.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };
    const removeRuler = idx => setRulers(rs => rs.filter((_, i) => i !== idx));
    useEffect(() => {
      if (!rulerActive) setRulers([]);
    }, [rulerActive]);

    // Pinch
    const pinch = useRef(null);
    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const dist = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
      const ts = e => {
        if (e.touches.length === 2) pinch.current = {
          d: dist(e.touches),
          z: zoom
        };
      };
      const tm = e => {
        if (e.touches.length === 2 && pinch.current) {
          e.preventDefault();
          setZoom(Math.min(8, Math.max(0.2, pinch.current.z * (dist(e.touches) / pinch.current.d))));
        }
      };
      const te = () => {
        pinch.current = null;
      };
      el.addEventListener("touchstart", ts, {
        passive: false
      });
      el.addEventListener("touchmove", tm, {
        passive: false
      });
      el.addEventListener("touchend", te);
      return () => {
        el.removeEventListener("touchstart", ts);
        el.removeEventListener("touchmove", tm);
        el.removeEventListener("touchend", te);
      };
    }, [zoom]);
    const zoomIn = () => setZoom(z => Math.min(8, z * 1.2));
    const zoomOut = () => setZoom(z => Math.max(0.2, z / 1.2));

    // Object drag / resize
    const drag = useRef(null);
    const onObjectDown = (e, o, kind) => {
      if (mode !== "organizer") return;
      e.stopPropagation();
      onSelect && onSelect(o.id);
      drag.current = {
        id: o.id,
        mode: kind,
        sx: e.clientX,
        sy: e.clientY,
        ox: o.x,
        oy: o.y,
        ow: o.w,
        oh: o.h
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onObjectMove = e => {
      const d = drag.current;
      if (!d) return;
      const dx = (e.clientX - d.sx) / (lot.scale * zoom);
      const dy = (e.clientY - d.sy) / (lot.scale * zoom);
      const sf = v => snap ? Math.round(v / SNAP_FT) * SNAP_FT : Math.round(v * 10) / 10;
      if (d.mode === "move") {
        onUpdateObject && onUpdateObject(d.id, {
          x: Math.max(0, Math.min(lot.w - d.ow, sf(d.ox + dx))),
          y: Math.max(0, Math.min(lot.h - d.oh, sf(d.oy + dy)))
        });
      } else {
        onUpdateObject && onUpdateObject(d.id, {
          w: Math.max(SNAP_FT, sf(d.ow + dx)),
          h: Math.max(SNAP_FT, sf(d.oh + dy))
        });
      }
    };
    const onObjectUp = e => {
      drag.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };

    // Grid
    const gridStyle = useMemo(() => {
      const cell = SNAP_FT * lot.scale;
      if (snap) return {
        backgroundImage: "radial-gradient(circle at 1px 1px, rgba(24,24,24,0.16) 1px, transparent 1px)",
        backgroundSize: `${cell}px ${cell}px`
      };
      return {
        backgroundImage: "linear-gradient(to right, rgba(24,24,24,0.07) 1px, transparent 1px),linear-gradient(to bottom, rgba(24,24,24,0.07) 1px, transparent 1px)",
        backgroundSize: `${cell}px ${cell}px`
      };
    }, [snap, lot.scale]);
    const xTicks = Array.from({
      length: Math.floor(lot.w / 20) + 1
    }, (_, i) => i * 20);
    const yTicks = Array.from({
      length: Math.floor(lot.h / 20) + 1
    }, (_, i) => i * 20);
    const cutout = {
      x: 0,
      y: 250,
      w: 71,
      h: 145
    };
    return /*#__PURE__*/React.createElement("div", {
      ref: wrapRef,
      className: rulerActive ? "mc-wrap mc-cross" : "mc-wrap mc-grab",
      style: {
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#cfcab9",
        userSelect: "none",
        touchAction: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0
      },
      onPointerDown: onBgDown,
      onPointerMove: e => {
        onBgMove(e);
        onObjectMove(e);
      },
      onPointerUp: e => {
        onBgUp(e);
        onObjectUp(e);
      },
      onPointerCancel: e => {
        onBgUp(e);
        onObjectUp(e);
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        transformOrigin: "top left",
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        width: lotPxW,
        height: lotPxH
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        background: "#BAB492",
        boxShadow: "0 2px 40px rgba(24,24,24,0.18)",
        ...gridStyle
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: cutout.x * lot.scale,
        top: cutout.y * lot.scale,
        width: cutout.w * lot.scale,
        height: cutout.h * lot.scale,
        background: "#2c2d20",
        border: "2px dashed rgba(235,229,219,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: "rgba(235,229,219,0.55)",
        transform: "rotate(-90deg)",
        whiteSpace: "nowrap"
      }
    }, "Not part of property")), xTicks.map(ft => /*#__PURE__*/React.createElement("div", {
      key: `xt-${ft}`,
      style: {
        position: "absolute",
        left: ft * lot.scale,
        top: -20,
        color: FOREST,
        fontFamily: "var(--font-mono)",
        transform: "translateX(-50%)",
        fontSize: `${10 / Math.max(zoom * 0.6, 0.6)}px`
      }
    }, ft, "'")), yTicks.map(ft => /*#__PURE__*/React.createElement("div", {
      key: `yt-${ft}`,
      style: {
        position: "absolute",
        left: -24,
        top: ft * lot.scale,
        color: FOREST,
        fontFamily: "var(--font-mono)",
        transform: "translateY(-50%)",
        fontSize: `${10 / Math.max(zoom * 0.6, 0.6)}px`
      }
    }, ft, "'")), objects.map(o => {
      const isVendorTent = mode === "vendor" && o.id === vendorObjectId;
      const dim = mode === "vendor" && o.id !== vendorObjectId;
      const isVendor = o.type === "vendor" || o.type === "sponsor" || o.type === "food";
      const selected = selectedId === o.id;
      const isClickable = !dim && (mode !== "vendor" || isVendorTent);
      const f = fillFor(o);
      const showLogo = !!o.logo_url && isVendor;
      const unassignedDim = dimUnassigned && o.status === "unassigned";
      const wpx = o.w * lot.scale,
        hpx = o.h * lot.scale;
      const radius = o.category === "tent" ? 2 : o.category === "building" ? 3 : 0;
      const z = o.category === "zone" ? 1 : selected ? 30 : isVendorTent ? 20 : 5;
      const style = {
        position: "absolute",
        overflow: "hidden",
        left: o.x * lot.scale,
        top: o.y * lot.scale,
        width: wpx,
        height: hpx,
        background: showLogo ? "#fff" : f.bg,
        border: `1px solid ${f.border || "rgba(24,24,24,0.4)"}`,
        color: f.text_color || INK,
        opacity: dim ? 0.3 : unassignedDim ? 0.45 : 1,
        transform: isVendorTent ? "scale(1.18)" : undefined,
        transformOrigin: "center",
        cursor: mode === "organizer" ? "move" : isClickable ? "pointer" : "default",
        zIndex: z,
        transition: "box-shadow 200ms, opacity 200ms, transform 200ms",
        borderRadius: radius,
        boxShadow: selected ? `0 0 0 3px ${CORAL}, 0 0 16px 2px rgba(170,112,80,0.5)` : isVendor ? "0 1px 2px rgba(24,24,24,0.18)" : undefined
      };
      const init = initials(o.label);
      return /*#__PURE__*/React.createElement("div", {
        key: o.id,
        className: isVendorTent ? "mc-pulse" : "",
        style: style,
        onPointerDown: e => onObjectDown(e, o, "move"),
        onClick: e => {
          e.stopPropagation();
          if (mode !== "organizer" && isClickable) onSelect && onSelect(o.id);
        }
      }, showLogo ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
        src: o.logo_url,
        alt: o.label || "",
        style: {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover"
        }
      }), wpx > 30 && /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: "1px 2px",
          fontSize: 8,
          lineHeight: 1.1,
          textAlign: "center",
          fontWeight: 500,
          background: "rgba(74,75,53,0.85)",
          color: CREMA,
          fontFamily: "var(--font-display)",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis"
        }
      }, o.label)) : isVendor ? /*#__PURE__*/React.createElement("div", {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
          padding: "0 2px",
          textAlign: "center",
          pointerEvents: "none"
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          lineHeight: 1,
          fontSize: `${Math.min(15, Math.max(7, wpx * 0.34))}px`
        }
      }, init || "?"), wpx > 26 && /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          lineHeight: 1.05,
          width: "100%",
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          fontSize: `${Math.min(9, Math.max(5, wpx * 0.082))}px`
        }
      }, o.label)) : /*#__PURE__*/React.createElement("div", {
        style: {
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          padding: "0 3px",
          textAlign: "center",
          pointerEvents: "none",
          fontFamily: "var(--font-mono)"
        }
      }, wpx > 26 && /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: `${Math.min(11, Math.max(7, wpx * 0.085))}px`,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          lineHeight: 1.1
        }
      }, o.label)), mode === "organizer" && isVendor && o.status && wpx > 18 && /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          top: 2,
          right: 2,
          width: 6,
          height: 6,
          borderRadius: 999,
          background: o.status === "confirmed" ? "#6B6E45" : o.status === "pending" ? "#C29A6B" : "#9a9483",
          boxShadow: "0 0 0 1px rgba(255,255,255,0.6)"
        }
      }), mode === "organizer" && selected && /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          bottom: -1,
          right: -1,
          width: 12,
          height: 12,
          background: CORAL,
          cursor: "se-resize",
          borderRadius: 2
        },
        onPointerDown: e => onObjectDown(e, o, "resize")
      }));
    }), rulers.length > 0 && /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none"
      },
      width: lotPxW,
      height: lotPxH
    }, rulers.map((rl, i) => {
      const ax = rl.ax * lot.scale,
        ay = rl.ay * lot.scale,
        bx = rl.bx * lot.scale,
        by = rl.by * lot.scale;
      const distFt = Math.hypot(rl.bx - rl.ax, rl.by - rl.ay);
      const mx = (ax + bx) / 2,
        my = (ay + by) / 2;
      const len = Math.hypot(bx - ax, by - ay) || 1;
      const off = 12 / zoom;
      const lx = mx + -(by - ay) / len * off,
        ly = my + (bx - ax) / len * off;
      const isD = rulerDrag.current === i;
      return /*#__PURE__*/React.createElement("g", {
        key: i,
        style: {
          pointerEvents: isD ? "none" : "auto",
          cursor: "pointer"
        },
        onPointerDown: e => e.stopPropagation(),
        onClick: e => {
          e.stopPropagation();
          removeRuler(i);
        }
      }, /*#__PURE__*/React.createElement("line", {
        x1: ax,
        y1: ay,
        x2: bx,
        y2: by,
        stroke: "transparent",
        strokeWidth: 14 / zoom
      }), /*#__PURE__*/React.createElement("line", {
        x1: ax,
        y1: ay,
        x2: bx,
        y2: by,
        stroke: CORAL,
        strokeWidth: 2 / zoom,
        strokeDasharray: `${6 / zoom} ${4 / zoom}`,
        pointerEvents: "none"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: ax,
        cy: ay,
        r: 4 / zoom,
        fill: CORAL,
        pointerEvents: "none"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: bx,
        cy: by,
        r: 4 / zoom,
        fill: CORAL,
        pointerEvents: "none"
      }), /*#__PURE__*/React.createElement("text", {
        x: lx,
        y: ly,
        textAnchor: "middle",
        dominantBaseline: "middle",
        fill: INK,
        stroke: CREMA,
        strokeWidth: 3 / zoom,
        paintOrder: "stroke",
        fontFamily: "var(--font-mono)",
        fontSize: 11 / zoom,
        fontWeight: 700,
        pointerEvents: "none"
      }, distFt.toFixed(1), "'"));
    })), arrowTarget && (() => {
      const x = arrowTarget.x * lot.scale,
        y = arrowTarget.y * lot.scale,
        w = arrowTarget.w * lot.scale,
        h = arrowTarget.h * lot.scale;
      const cx = x + w / 2,
        pad = 6 / zoom,
        fs = 11 / zoom;
      const text = arrowTarget.label || "";
      const lw = Math.max(40 / zoom, text.length * fs * 0.58 + 8 / zoom * 2),
        lh = fs + 4 / zoom * 2;
      const ly = y - 10 / zoom - lh,
        tailH = 6 / zoom;
      return /*#__PURE__*/React.createElement("svg", {
        style: {
          position: "absolute",
          inset: 0,
          overflow: "visible",
          pointerEvents: "none",
          zIndex: 9999
        },
        width: lotPxW,
        height: lotPxH
      }, /*#__PURE__*/React.createElement("rect", {
        x: x - pad,
        y: y - pad,
        width: w + pad * 2,
        height: h + pad * 2,
        rx: 4 / zoom,
        fill: "none",
        stroke: CORAL,
        strokeWidth: 3 / zoom,
        className: "mc-bounce",
        style: {
          transformOrigin: `${cx}px ${y + h / 2}px`
        }
      }), /*#__PURE__*/React.createElement("rect", {
        x: cx - lw / 2,
        y: ly,
        width: lw,
        height: lh,
        rx: 2 / zoom,
        fill: CORAL,
        stroke: CREMA,
        strokeWidth: 1.5 / zoom
      }), /*#__PURE__*/React.createElement("polygon", {
        points: `${cx - 5 / zoom},${ly + lh} ${cx + 5 / zoom},${ly + lh} ${cx},${ly + lh + tailH}`,
        fill: CORAL,
        stroke: CREMA,
        strokeWidth: 1.5 / zoom
      }), /*#__PURE__*/React.createElement("text", {
        x: cx,
        y: ly + lh / 2,
        textAnchor: "middle",
        dominantBaseline: "central",
        fill: CREMA,
        fontFamily: "var(--font-display)",
        fontSize: fs,
        fontWeight: 700
      }, text));
    })())), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 14,
        left: 14,
        width: 46,
        height: 46,
        borderRadius: 999,
        background: CREMA,
        border: `1px solid ${FOREST}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: FOREST,
        pointerEvents: "none",
        boxShadow: "0 2px 8px rgba(24,24,24,0.15)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: -2,
        fontSize: 9,
        fontWeight: 700,
        color: CORAL,
        fontFamily: "var(--font-mono)"
      }
    }, "N"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 16
      }
    }, "\u2726")), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 14,
        left: 14,
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        padding: "5px 8px",
        background: FOREST,
        color: CREMA,
        borderRadius: 2
      }
    }, Math.round(zoom * 100), "%"), /*#__PURE__*/React.createElement("button", {
      className: "mc-zbtn",
      onClick: zoomOut,
      "aria-label": "Zoom out"
    }, "\u2212"), /*#__PURE__*/React.createElement("button", {
      className: "mc-zbtn",
      onClick: zoomIn,
      "aria-label": "Zoom in"
    }, "+"), /*#__PURE__*/React.createElement("button", {
      className: "mc-fit",
      onClick: fit
    }, "Fit")));
  }
  window.MapCanvas = MapCanvas;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/MapCanvas.jsx", error: String((e && e.message) || e) }); }

// app/Organizer.jsx
try { (() => {
/* Organizer.jsx — PIN gate + full editor (stats, sidebar, detail, export). */
(function () {
  const {
    useState,
    useEffect,
    useMemo,
    useRef
  } = React;
  const {
    categorizeVendor,
    CATEGORY_COLORS,
    VENDOR_CATEGORIES,
    fillFor,
    EVENT,
    ORG_PIN
  } = window.TCCF;
  const {
    Sheet,
    MiniMap,
    Legend,
    StatusBadge,
    STATUS_META,
    Avatar
  } = window.TCCFUI;
  const {
    DetailPanel,
    exportMapPNG
  } = window.OrgDetail;
  const FOREST = "#4A4B35",
    CREMA = "#EBE5DB",
    CORAL = "#AA7050",
    LATTE = "#746137",
    INK = "#181818";
  const isVendorTent = o => o.category === "tent" && (o.type === "vendor" || o.type === "sponsor" || o.type === "food");
  const PRESETS = {
    vendor: {
      category: "tent",
      type: "vendor",
      label: "New Vendor",
      w: 10,
      h: 10,
      status: "unassigned"
    },
    sponsor: {
      category: "tent",
      type: "sponsor",
      label: "Sponsor",
      w: 15,
      h: 15,
      status: "unassigned"
    },
    food: {
      category: "tent",
      type: "food",
      label: "Food & Drink",
      w: 10,
      h: 10,
      status: "unassigned"
    },
    stage: {
      category: "misc",
      type: "stage",
      label: "Stage",
      w: 30,
      h: 30,
      bg: "#3A2C18",
      border: "#6a4a28",
      text_color: "#EBE5DB"
    },
    restroom: {
      category: "misc",
      type: "restroom",
      label: "Restrooms",
      w: 10,
      h: 10,
      bg: "#75878B",
      border: "#4f6064",
      text_color: "#F7F6F2"
    },
    entrance: {
      category: "misc",
      type: "entrance",
      label: "Entrance",
      w: 20,
      h: 10,
      bg: "#6B6E45",
      border: "#4A4B35",
      text_color: "#F7F6F2"
    },
    building: {
      category: "building",
      type: "building",
      label: "Building",
      w: 30,
      h: 30,
      bg: "#CFC9BC",
      border: "#9a9483",
      text_color: "#4A4B35"
    },
    zone: {
      category: "zone",
      type: "zone",
      label: "Zone",
      w: 30,
      h: 30,
      bg: "rgba(170,112,80,0.16)",
      border: CORAL,
      text_color: "#4A4B35"
    }
  };

  /* ───────── PIN gate ───────── */
  function PinGate({
    onUnlock
  }) {
    const [pin, setPin] = useState("");
    const [err, setErr] = useState(false);
    const submit = e => {
      e.preventDefault();
      if (pin === window.TCCF.ORG_PIN) {
        sessionStorage.setItem("tccf_org_unlocked", "1");
        onUnlock();
      } else {
        setErr(true);
      }
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: INK,
        padding: 20
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "hidden",
        opacity: 0.05,
        pointerEvents: "none"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "assets/tccf-stamp-circle-crown-only.png",
      alt: "",
      style: {
        position: "absolute",
        right: "-12%",
        bottom: "-18%",
        width: "60vmin",
        filter: "invert(1)"
      }
    })), /*#__PURE__*/React.createElement("form", {
      onSubmit: submit,
      style: {
        width: "100%",
        maxWidth: 380,
        background: "var(--bg)",
        border: `1px solid ${INK}`,
        padding: 36,
        position: "relative",
        boxShadow: "var(--shadow-lift)"
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "assets/logo-primary-black.png",
      alt: "The Charlotte Coffee Festival",
      style: {
        height: 56,
        width: "auto",
        marginBottom: 22
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        color: LATTE
      }
    }, "Organizer Access"), /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        fontSize: 30,
        lineHeight: 1,
        margin: "8px 0 6px",
        color: INK
      }
    }, "Edit the map"), /*#__PURE__*/React.createElement("p", {
      style: {
        fontSize: 14,
        color: "var(--fg-muted)",
        margin: "0 0 22px",
        lineHeight: 1.5
      }
    }, "Enter your festival PIN to place booths, upload logos, and publish."), /*#__PURE__*/React.createElement("input", {
      type: "password",
      value: pin,
      autoFocus: true,
      placeholder: "PIN",
      onChange: e => {
        setPin(e.target.value);
        setErr(false);
      },
      className: "tccf-input",
      style: {
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.2em",
        textAlign: "center",
        fontSize: 16,
        padding: "12px"
      }
    }), err && /*#__PURE__*/React.createElement("div", {
      style: {
        color: "#a23a28",
        fontSize: 13,
        marginTop: 8,
        fontFamily: "var(--font-mono)"
      }
    }, "Incorrect PIN \u2014 try again"), /*#__PURE__*/React.createElement("button", {
      type: "submit",
      className: "tccf-btn-dark",
      style: {
        width: "100%",
        marginTop: 18,
        justifyContent: "center",
        padding: "13px"
      }
    }, "Unlock"), /*#__PURE__*/React.createElement("a", {
      href: "#/map",
      style: {
        display: "block",
        textAlign: "center",
        marginTop: 16,
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: LATTE
      }
    }, "\u2190 Back to public map")));
  }

  /* ───────── Stat tile ───────── */
  function Stat({
    label,
    value,
    accent
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: LATTE,
        whiteSpace: "nowrap"
      }
    }, label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: 22,
        lineHeight: 1.1,
        color: accent || FOREST
      }
    }, value));
  }

  /* ───────── Vendor card (sidebar) ───────── */
  function VendorCard({
    obj,
    active,
    onSelect,
    onEdit,
    compact
  }) {
    const cat = categorizeVendor(obj.label);
    const catColor = cat ? CATEGORY_COLORS[cat] : "var(--tccf-muted)";
    return /*#__PURE__*/React.createElement("div", {
      onClick: onSelect,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 12px",
        cursor: "pointer",
        borderLeft: `3px solid ${active ? CORAL : catColor}`,
        background: active ? "rgba(170,112,80,0.1)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      obj: obj,
      size: 36
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: FOREST,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, obj.label || "Unnamed"), !compact && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
        flexWrap: "wrap"
      }
    }, cat && /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        padding: "1px 6px",
        borderRadius: 999,
        background: `${catColor}22`,
        color: catColor
      }
    }, cat), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: LATTE
      }
    }, obj.booth_number || `#${obj.id}`, " \xB7 ", Math.round(obj.w), "\xD7", Math.round(obj.h), "ft"))), obj.status && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 999,
        background: STATUS_META[obj.status] ? STATUS_META[obj.status].dot : "#9a9483",
        flexShrink: 0
      },
      title: obj.status
    }), /*#__PURE__*/React.createElement("button", {
      onClick: e => {
        e.stopPropagation();
        onEdit();
      },
      className: "tccf-mini-edit"
    }, "Edit"));
  }

  /* ───────── Organizer map ───────── */
  function OrganizerMap({
    data,
    onLogout
  }) {
    const {
      objects,
      lot,
      updateObject,
      addObject,
      deleteObject,
      undo,
      canUndo,
      reset
    } = data;
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
      check();
      window.addEventListener("resize", check);
      return () => window.removeEventListener("resize", check);
    }, []);
    const selected = useMemo(() => objects.find(o => o.id === selectedId) || null, [objects, selectedId]);
    const detailObj = useMemo(() => objects.find(o => o.id === detailId) || null, [objects, detailId]);
    const vendors = useMemo(() => objects.filter(isVendorTent), [objects]);

    // Keyboard: undo, nudge, delete, esc
    useEffect(() => {
      const onKey = e => {
        const typing = /INPUT|TEXTAREA|SELECT/.test(e.target && e.target.tagName || "");
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (canUndo) {
            undo();
            window.toast && window.toast("Undone");
          }
          return;
        }
        if (typing) return;
        if (e.key === "Escape") {
          setSelectedId(null);
          return;
        }
        if (selectedId == null) return;
        const o = objects.find(x => x.id === selectedId);
        if (!o) return;
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          deleteObject(selectedId);
          setSelectedId(null);
          window.toast && window.toast("Deleted");
          return;
        }
        const step = e.shiftKey ? 5 : 1;
        const moves = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step]
        };
        if (moves[e.key]) {
          e.preventDefault();
          const [dx, dy] = moves[e.key];
          updateObject(selectedId, {
            x: Math.max(0, Math.min(lot.w - o.w, o.x + dx)),
            y: Math.max(0, Math.min(lot.h - o.h, o.y + dy))
          });
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [selectedId, objects, lot, undo, canUndo, updateObject, deleteObject]);
    const stats = useMemo(() => {
      const total = vendors.length;
      const confirmed = vendors.filter(o => o.status === "confirmed").length;
      const open = vendors.filter(o => o.status === "unassigned").length;
      const filled = total ? Math.round(confirmed / total * 100) : 0;
      const byCat = {};
      VENDOR_CATEGORIES.forEach(c => byCat[c] = 0);
      vendors.forEach(v => {
        const c = categorizeVendor(v.label);
        if (c) byCat[c] += 1;
      });
      return {
        total,
        confirmed,
        open,
        filled,
        byCat
      };
    }, [vendors]);
    const filteredVendors = useMemo(() => {
      const q = search.trim().toLowerCase();
      let list = vendors.filter(o => {
        if (q && !(o.label || "").toLowerCase().includes(q) && !(o.booth_number || "").toLowerCase().includes(q)) return false;
        if (filterCat !== "all" && categorizeVendor(o.label) !== filterCat) return false;
        if (filterStatus !== "all" && o.status !== filterStatus) return false;
        return true;
      });
      return list.slice().sort((a, b) => sortBy === "name" ? (a.label || "").localeCompare(b.label || "") : b.w * b.h - a.w * a.h);
    }, [vendors, search, filterCat, filterStatus, sortBy]);
    const handleAdd = key => {
      const p = PRESETS[key];
      if (!p) return;
      const id = addObject({
        x: 20,
        y: 20,
        ...p
      });
      setSelectedId(id);
      window.toast && window.toast(`Added ${p.label}`);
    };
    const sharePublic = () => {
      try {
        navigator.clipboard.writeText(location.origin + location.pathname + "#/map");
        window.toast && window.toast("Public map link copied");
      } catch (e) {
        window.toast && window.toast("Open #/map to share", "err");
      }
    };
    const onExport = async () => {
      window.toast && window.toast("Rendering PNG…");
      await exportMapPNG(objects, lot);
      window.toast && window.toast("Map exported");
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)",
        color: FOREST
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        background: INK,
        color: CREMA,
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "assets/logo-primary-crema.png",
      alt: "TCCF",
      style: {
        height: 30
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "hide-sm",
      style: {
        borderLeft: "1px solid rgba(235,229,219,0.25)",
        paddingLeft: 14
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: 14,
        textTransform: "uppercase",
        letterSpacing: "0.04em"
      }
    }, "Vendor Map \xB7 Editor"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        opacity: 0.7,
        letterSpacing: "0.1em",
        marginTop: 2
      }
    }, EVENT.date, " \xB7 ", EVENT.venue)), /*#__PURE__*/React.createElement("nav", {
      className: "hide-sm",
      style: {
        display: "flex",
        gap: 2,
        marginLeft: 8,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 999,
        padding: 3
      }
    }, [["map", "Map"], ["list", "Vendors"], ["settings", "Settings"]].map(([t, l]) => /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => setTab(t),
      style: {
        padding: "6px 14px",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        borderRadius: 999,
        border: "none",
        cursor: "pointer",
        background: tab === t ? CORAL : "transparent",
        color: tab === t ? CREMA : "rgba(235,229,219,0.75)"
      }
    }, l))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: sharePublic,
      className: "tccf-btn-coral hide-sm"
    }, "Share Public Map"), /*#__PURE__*/React.createElement("button", {
      onClick: onLogout,
      style: {
        background: "none",
        border: "none",
        color: "rgba(235,229,219,0.7)",
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.1em"
      }
    }, "Log out"))), isMobile && /*#__PURE__*/React.createElement("div", {
      style: {
        background: CORAL,
        color: CREMA,
        textAlign: "center",
        fontSize: 12,
        padding: "5px",
        fontFamily: "var(--font-mono)",
        letterSpacing: "0.06em"
      }
    }, "READ-ONLY ON MOBILE \u2014 USE DESKTOP TO EDIT"), /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--bg-alt)",
        borderBottom: "1px solid var(--rule-soft)",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 22,
        overflowX: "auto",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Stat, {
      label: "Booths",
      value: stats.total
    }), /*#__PURE__*/React.createElement(Stat, {
      label: "Confirmed",
      value: stats.confirmed,
      accent: "#5d6b3c"
    }), /*#__PURE__*/React.createElement(Stat, {
      label: "Open",
      value: stats.open,
      accent: "#9a9483"
    }), /*#__PURE__*/React.createElement("div", {
      className: "hide-md",
      style: {
        display: "flex",
        gap: 18,
        paddingLeft: 18,
        borderLeft: "1px solid var(--rule-soft)"
      }
    }, VENDOR_CATEGORIES.map(c => /*#__PURE__*/React.createElement(Stat, {
      key: c,
      label: c,
      value: stats.byCat[c] || 0
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "hide-sm",
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: LATTE
      }
    }, "Confirmed"), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 120,
        height: 6,
        background: "var(--bg)",
        border: "1px solid var(--rule-soft)",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${stats.filled}%`,
        background: CORAL
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        width: 36,
        textAlign: "right"
      }
    }, stats.filled, "%"))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        overflow: "hidden"
      }
    }, !isMobile && tab !== "settings" && /*#__PURE__*/React.createElement("aside", {
      style: {
        width: 320,
        background: "var(--bg-alt)",
        borderRight: "1px solid var(--rule-soft)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12,
        borderBottom: "1px solid var(--rule-soft)",
        display: "grid",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "14",
      height: "14",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: LATTE,
      strokeWidth: "2",
      style: {
        position: "absolute",
        left: 10,
        top: "50%",
        transform: "translateY(-50%)"
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "11",
      cy: "11",
      r: "7"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M21 21l-4.3-4.3"
    })), /*#__PURE__*/React.createElement("input", {
      value: search,
      onChange: e => setSearch(e.target.value),
      placeholder: "Search vendors\u2026",
      className: "tccf-input",
      style: {
        paddingLeft: 32,
        fontSize: 13
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("select", {
      value: filterCat,
      onChange: e => setFilterCat(e.target.value),
      className: "tccf-select",
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("option", {
      value: "all"
    }, "All Categories"), VENDOR_CATEGORIES.map(c => /*#__PURE__*/React.createElement("option", {
      key: c,
      value: c
    }, c, " (", stats.byCat[c] || 0, ")"))), /*#__PURE__*/React.createElement("select", {
      value: filterStatus,
      onChange: e => setFilterStatus(e.target.value),
      className: "tccf-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: "all"
    }, "Any Status"), /*#__PURE__*/React.createElement("option", {
      value: "confirmed"
    }, "Confirmed"), /*#__PURE__*/React.createElement("option", {
      value: "pending"
    }, "Pending"), /*#__PURE__*/React.createElement("option", {
      value: "unassigned"
    }, "Open")), /*#__PURE__*/React.createElement("select", {
      value: sortBy,
      onChange: e => setSortBy(e.target.value),
      className: "tccf-select"
    }, /*#__PURE__*/React.createElement("option", {
      value: "name"
    }, "A\u2013Z"), /*#__PURE__*/React.createElement("option", {
      value: "size"
    }, "Size")))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 8,
        borderBottom: "1px solid var(--rule-soft)",
        display: "flex",
        flexWrap: "wrap",
        gap: 5
      }
    }, Object.entries(PRESETS).map(([k, p]) => /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => handleAdd(k),
      className: "tccf-chip",
      title: `Add ${p.label}`
    }, "+ ", p.label))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "8px 12px",
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: LATTE,
        position: "sticky",
        top: 0,
        background: "var(--bg-alt)",
        borderBottom: "1px solid var(--rule-soft)",
        zIndex: 2
      }
    }, "Vendors \xB7 ", filteredVendors.length), /*#__PURE__*/React.createElement("div", null, filteredVendors.map(o => /*#__PURE__*/React.createElement(VendorCard, {
      key: o.id,
      obj: o,
      active: selectedId === o.id,
      onSelect: () => setSelectedId(o.id),
      onEdit: () => {
        setSelectedId(o.id);
        setDetailId(o.id);
      }
    })), filteredVendors.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 30,
        textAlign: "center",
        fontSize: 13,
        color: LATTE
      }
    }, "No matches"))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 8,
        borderTop: "1px solid var(--rule-soft)",
        display: "flex",
        gap: 6
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        undo();
        window.toast && window.toast("Undone");
      },
      disabled: !canUndo,
      className: "tccf-foot-btn"
    }, "\u21B6 Undo"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setRuler(r => !r),
      className: "tccf-foot-btn",
      style: ruler ? {
        background: CORAL,
        color: CREMA,
        borderColor: CORAL
      } : {}
    }, "\u27FA Ruler"), /*#__PURE__*/React.createElement("button", {
      onClick: onExport,
      className: "tccf-foot-btn",
      style: {
        background: FOREST,
        color: CREMA,
        borderColor: FOREST
      }
    }, "\u2193 PNG"))), tab === "settings" ? /*#__PURE__*/React.createElement(SettingsView, {
      snap: snap,
      setSnap: setSnap,
      reset: reset
    }) : tab === "list" ? /*#__PURE__*/React.createElement(ListView, {
      vendors: filteredVendors,
      onSelect: id => {
        setSelectedId(id);
        setDetailId(id);
        setTab("map");
      }
    }) : /*#__PURE__*/React.createElement("main", {
      style: {
        position: "relative",
        flex: 1
      }
    }, /*#__PURE__*/React.createElement(MapCanvas, {
      mode: isMobile ? "public" : "organizer",
      objects: objects,
      lot: lot,
      selectedId: selectedId,
      onSelect: setSelectedId,
      onUpdateObject: updateObject,
      snap: snap,
      rulerActive: ruler && !isMobile
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 14,
        left: 70
      }
    }, /*#__PURE__*/React.createElement(Legend, {
      defaultOpen: false
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 14,
        right: 14
      }
    }, /*#__PURE__*/React.createElement(MiniMap, {
      objects: objects,
      lot: lot,
      selectedId: selectedId,
      onJump: setSelectedId
    })), selected && /*#__PURE__*/React.createElement("button", {
      onClick: () => setDetailId(selected.id),
      className: "tccf-btn-coral",
      style: {
        position: "absolute",
        top: 14,
        right: 14,
        boxShadow: "var(--shadow-lift)"
      }
    }, "Edit \u201C", selected.label, "\u201D"))), /*#__PURE__*/React.createElement(Sheet, {
      open: !!detailObj,
      onClose: () => setDetailId(null),
      width: 400
    }, detailObj && /*#__PURE__*/React.createElement(DetailPanel, {
      obj: detailObj,
      onClose: () => setDetailId(null),
      onUpdate: patch => updateObject(detailObj.id, patch),
      onDelete: () => {
        deleteObject(detailObj.id);
        setDetailId(null);
        setSelectedId(null);
        window.toast && window.toast("Deleted");
      }
    })));
  }

  /* ───────── List view ───────── */
  function ListView({
    vendors,
    onSelect
  }) {
    return /*#__PURE__*/React.createElement("main", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: 28,
        background: "var(--bg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 1000,
        margin: "0 auto"
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        fontSize: 32,
        color: FOREST,
        margin: "0 0 18px"
      }
    }, "All Vendors"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12
      }
    }, vendors.map(o => /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => onSelect(o.id),
      className: "tccf-card",
      style: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: 12,
        background: "var(--bg-alt)",
        border: "1px solid var(--rule-soft)",
        cursor: "pointer",
        textAlign: "left"
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      obj: o,
      size: 46,
      round: 2
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: FOREST,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, o.label), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 5
      }
    }, /*#__PURE__*/React.createElement(StatusBadge, {
      status: o.status || "pending"
    }))))))));
  }

  /* ───────── Settings ───────── */
  function SettingsView({
    snap,
    setSnap,
    reset
  }) {
    const [confirming, setConfirming] = useState(false);
    return /*#__PURE__*/React.createElement("main", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: 28,
        background: "var(--bg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 560,
        margin: "0 auto",
        display: "grid",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("h2", {
      style: {
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        fontSize: 32,
        color: FOREST,
        margin: 0
      }
    }, "Map Settings"), /*#__PURE__*/React.createElement("div", {
      className: "tccf-card",
      style: {
        background: "var(--bg-alt)",
        border: "1px solid var(--rule-soft)",
        padding: 18
      }
    }, /*#__PURE__*/React.createElement("label", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        cursor: "pointer"
      }
    }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500,
        fontSize: 15,
        color: FOREST
      }
    }, "Snap to grid"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: LATTE,
        marginTop: 2
      }
    }, "Snap booth positions to 5 ft increments")), /*#__PURE__*/React.createElement("input", {
      type: "checkbox",
      checked: snap,
      onChange: e => setSnap(e.target.checked),
      style: {
        width: 20,
        height: 20,
        accentColor: CORAL
      }
    }))), /*#__PURE__*/React.createElement("div", {
      className: "tccf-card",
      style: {
        background: "var(--bg-alt)",
        border: "1px solid var(--rule-soft)",
        padding: 18
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontWeight: 500,
        fontSize: 15,
        color: FOREST
      }
    }, "Reset layout"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: LATTE,
        margin: "2px 0 12px"
      }
    }, "Restore the original seeded vendor layout. This clears all your edits."), confirming ? /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        reset();
        setConfirming(false);
        window.toast && window.toast("Layout reset");
      },
      className: "tccf-btn-danger",
      style: {
        width: "auto"
      }
    }, "Yes, reset everything"), /*#__PURE__*/React.createElement("button", {
      onClick: () => setConfirming(false),
      className: "tccf-btn-ghost"
    }, "Cancel")) : /*#__PURE__*/React.createElement("button", {
      onClick: () => setConfirming(true),
      className: "tccf-btn-ghost"
    }, "Reset to seeded layout")), /*#__PURE__*/React.createElement("a", {
      href: "#/map",
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        color: CORAL
      }
    }, "View public festival map \u2192")));
  }
  window.PinGate = PinGate;
  window.OrganizerMap = OrganizerMap;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/Organizer.jsx", error: String((e && e.message) || e) }); }

// app/OrganizerDetail.jsx
try { (() => {
/* OrganizerDetail.jsx — booth detail editor, logo upload (downscaled to a
   data-URL for offline storage), and a native canvas PNG export. */
(function () {
  const {
    useState,
    useRef
  } = React;
  const {
    categorizeVendor,
    CATEGORY_COLORS,
    fillFor,
    EVENT
  } = window.TCCF;
  const {
    StatusBadge,
    STATUS_META,
    Avatar
  } = window.TCCFUI;
  const FOREST = "#4A4B35",
    CREMA = "#EBE5DB",
    CORAL = "#AA7050",
    LATTE = "#746137";

  /* ---- Downscale an uploaded image to a small data URL ---- */
  function fileToDataURL(file, maxPx = 180) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, maxPx / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * s);
          c.height = Math.round(img.height * s);
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /* ---- Native PNG export of the whole lot ---- */
  async function exportMapPNG(objects, lot) {
    const PAD = 90,
      S = lot.scale * 2.2; // crisp 2.2px/ft
    const W = lot.w * S + PAD * 2,
      H = lot.h * S + PAD * 2;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    // Paper
    ctx.fillStyle = "#EBE5DB";
    ctx.fillRect(0, 0, W, H);
    // Lot
    ctx.fillStyle = "#BAB492";
    ctx.fillRect(PAD, PAD, lot.w * S, lot.h * S);
    // Grid (5ft)
    ctx.strokeStyle = "rgba(24,24,24,0.10)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= lot.w; x += 5) {
      ctx.beginPath();
      ctx.moveTo(PAD + x * S, PAD);
      ctx.lineTo(PAD + x * S, PAD + lot.h * S);
      ctx.stroke();
    }
    for (let y = 0; y <= lot.h; y += 5) {
      ctx.beginPath();
      ctx.moveTo(PAD, PAD + y * S);
      ctx.lineTo(PAD + lot.w * S, PAD + y * S);
      ctx.stroke();
    }
    // Cutout
    ctx.fillStyle = "#2c2d20";
    ctx.fillRect(PAD, PAD + 250 * S, 71 * S, 145 * S);
    const drawObj = o => {
      const f = fillFor(o);
      const x = PAD + o.x * S,
        y = PAD + o.y * S,
        w = o.w * S,
        h = o.h * S;
      ctx.fillStyle = f.bg && f.bg.indexOf("rgba") === 0 ? f.bg : f.bg || "#9C8B6E";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = f.border || "rgba(24,24,24,0.4)";
      ctx.lineWidth = 1.2;
      ctx.strokeRect(x, y, w, h);
      const isVendor = o.type === "vendor" || o.type === "sponsor" || o.type === "food";
      ctx.fillStyle = f.text_color || "#181818";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (isVendor) {
        const init = (o.label || "").split(/\s+/).slice(0, 2).map(s => s[0] || "").join("").toUpperCase().slice(0, 2);
        ctx.font = `700 ${Math.min(20, Math.max(9, w * 0.34))}px "Styrene B", Helvetica, sans-serif`;
        ctx.fillText(init || "?", x + w / 2, y + h / 2);
      } else {
        ctx.font = `${Math.min(13, Math.max(8, w * 0.085))}px "GT Flexa Mono", monospace`;
        const words = (o.label || "").split(" ");
        words.forEach((wd, i) => ctx.fillText(wd.toUpperCase(), x + w / 2, y + h / 2 + (i - (words.length - 1) / 2) * (h * 0.13)));
      }
    };
    objects.filter(o => o.category === "zone").forEach(drawObj);
    objects.filter(o => o.category !== "zone").forEach(drawObj);

    // Title block
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#181818";
    ctx.font = `700 40px "Styrene B", Helvetica, sans-serif`;
    ctx.fillText("THE CHARLOTTE COFFEE FESTIVAL", PAD, 56);
    ctx.font = `20px "GT Flexa Mono", monospace`;
    ctx.fillStyle = "#746137";
    ctx.fillText(`VENDOR MAP · ${EVENT.date} · ${EVENT.venue}`, PAD, H - 36);
    return new Promise(resolve => {
      c.toBlob(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `tccf-vendor-map-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    });
  }

  /* ---- Detail panel ---- */
  function DetailPanel({
    obj,
    onClose,
    onUpdate,
    onDelete
  }) {
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);
    const isVendor = obj.type === "vendor" || obj.type === "sponsor" || obj.type === "food";
    const onUpload = async file => {
      if (!file.type.startsWith("image/")) {
        window.toast && window.toast("PNG or JPG only", "err");
        return;
      }
      setUploading(true);
      try {
        const url = await fileToDataURL(file);
        onUpdate({
          logo_url: url
        });
        window.toast && window.toast("Logo added");
      } catch (e) {
        window.toast && window.toast("Upload failed", "err");
      } finally {
        setUploading(false);
      }
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: FOREST,
        color: CREMA,
        padding: "20px 22px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      obj: obj,
      size: 54,
      round: 3
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 0,
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        fontSize: 20,
        lineHeight: 1.05,
        color: CREMA,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, obj.label || "Unnamed booth"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        opacity: 0.8,
        marginTop: 5,
        letterSpacing: "0.06em"
      }
    }, obj.booth_number || `BOOTH #${obj.id}`, " \xB7 ", Math.round(obj.w), "\xD7", Math.round(obj.h), " FT")), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      "aria-label": "Close",
      style: {
        background: "none",
        border: "none",
        color: CREMA,
        cursor: "pointer",
        fontSize: 18,
        opacity: 0.8
      }
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: 22,
        display: "grid",
        gap: 18
      }
    }, isVendor && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Lbl, null, "Status"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6
      }
    }, Object.keys(STATUS_META).map(s => /*#__PURE__*/React.createElement("button", {
      key: s,
      onClick: () => onUpdate({
        status: s
      }),
      style: {
        flex: 1,
        padding: "8px 4px",
        borderRadius: 2,
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        border: obj.status === s ? `2px solid ${FOREST}` : "1px solid var(--rule-soft)",
        background: obj.status === s ? STATUS_META[s].bg : "transparent",
        color: obj.status === s ? STATUS_META[s].fg : LATTE
      }
    }, STATUS_META[s].label)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Lbl, null, "Logo"), /*#__PURE__*/React.createElement("input", {
      ref: fileRef,
      type: "file",
      accept: "image/png,image/jpeg",
      hidden: true,
      onChange: e => {
        const f = e.target.files && e.target.files[0];
        if (f) onUpload(f);
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => fileRef.current && fileRef.current.click(),
      disabled: uploading,
      className: "tccf-btn-coral",
      style: {
        flex: 1,
        justifyContent: "center"
      }
    }, uploading ? "Uploading…" : obj.logo_url ? "Replace Logo" : "Upload Logo"), obj.logo_url && /*#__PURE__*/React.createElement("button", {
      onClick: () => onUpdate({
        logo_url: null
      }),
      className: "tccf-btn-ghost"
    }, "Remove")))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Name",
      value: obj.label || "",
      onChange: v => onUpdate({
        label: v
      })
    }), /*#__PURE__*/React.createElement(Field, {
      label: "Booth #",
      value: obj.booth_number || "",
      onChange: v => onUpdate({
        booth_number: v || null
      })
    })), isVendor && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
      label: "Contact name",
      value: obj.contact_name || "",
      onChange: v => onUpdate({
        contact_name: v || null
      })
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Email",
      value: obj.vendor_email || "",
      onChange: v => onUpdate({
        vendor_email: v || null
      })
    }), /*#__PURE__*/React.createElement(Field, {
      label: "Phone",
      value: obj.phone || "",
      onChange: v => onUpdate({
        phone: v || null
      })
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Lbl, null, "Notes (internal)"), /*#__PURE__*/React.createElement("textarea", {
      value: obj.notes || "",
      onChange: e => onUpdate({
        notes: e.target.value || null
      }),
      rows: 3,
      placeholder: "Not shown publicly",
      className: "tccf-input",
      style: {
        resize: "vertical"
      }
    }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(Lbl, null, "Position & size (feet)"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(NumField, {
      label: "X",
      value: obj.x,
      onChange: v => onUpdate({
        x: v
      })
    }), /*#__PURE__*/React.createElement(NumField, {
      label: "Y",
      value: obj.y,
      onChange: v => onUpdate({
        y: v
      })
    }), /*#__PURE__*/React.createElement(NumField, {
      label: "W",
      value: obj.w,
      onChange: v => onUpdate({
        w: v
      })
    }), /*#__PURE__*/React.createElement(NumField, {
      label: "H",
      value: obj.h,
      onChange: v => onUpdate({
        h: v
      })
    }))), /*#__PURE__*/React.createElement("button", {
      onClick: onDelete,
      className: "tccf-btn-danger",
      style: {
        marginTop: 4
      }
    }, "Delete booth")));
  }
  function Lbl({
    children
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: LATTE,
        marginBottom: 7
      }
    }, children);
  }
  function Field({
    label,
    value,
    onChange
  }) {
    return /*#__PURE__*/React.createElement("label", {
      style: {
        display: "block"
      }
    }, /*#__PURE__*/React.createElement(Lbl, null, label), /*#__PURE__*/React.createElement("input", {
      value: value,
      onChange: e => onChange(e.target.value),
      className: "tccf-input"
    }));
  }
  function NumField({
    label,
    value,
    onChange
  }) {
    return /*#__PURE__*/React.createElement("label", {
      style: {
        display: "block"
      }
    }, /*#__PURE__*/React.createElement(Lbl, null, label), /*#__PURE__*/React.createElement("input", {
      type: "number",
      value: value,
      onChange: e => onChange(Number(e.target.value)),
      className: "tccf-input",
      style: {
        fontFamily: "var(--font-mono)"
      }
    }));
  }
  window.OrgDetail = {
    DetailPanel,
    exportMapPNG,
    fileToDataURL
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/OrganizerDetail.jsx", error: String((e && e.message) || e) }); }

// app/PublicMap.jsx
try { (() => {
/* PublicMap.jsx — public / vendor-facing view. Find My Booth, legend, minimap. */
(function () {
  const {
    useState,
    useMemo,
    useEffect
  } = React;
  const {
    categorizeVendor,
    CATEGORY_COLORS,
    VENDOR_CATEGORIES,
    EVENT
  } = window.TCCF;
  const {
    Sheet,
    MiniMap,
    Legend,
    Avatar
  } = window.TCCFUI;
  const FOREST = "#4A4B35",
    CREMA = "#EBE5DB",
    CORAL = "#AA7050",
    LATTE = "#746137";
  const isVendorTent = o => o.category === "tent" && (o.type === "vendor" || o.type === "sponsor" || o.type === "food");
  function PublicMap({
    objects,
    lot,
    loading
  }) {
    const [selectedId, setSelectedId] = useState(null);
    const [arrowId, setArrowId] = useState(null);
    const [search, setSearch] = useState("");
    const [showResults, setShowResults] = useState(false);
    const [catFilter, setCatFilter] = useState(null);
    const selected = useMemo(() => objects.find(o => o.id === selectedId) || null, [objects, selectedId]);
    const matches = useMemo(() => {
      const q = search.trim().toLowerCase();
      if (!q) return [];
      return objects.filter(isVendorTent).filter(o => (o.label || "").toLowerCase().includes(q)).slice(0, 8);
    }, [objects, search]);
    const findBooth = o => {
      setArrowId(o.id);
      setSearch(o.label || "");
      setShowResults(false);
    };
    const onSearchChange = v => {
      setSearch(v);
      setShowResults(true);
      if (arrowId !== null) setArrowId(null);
    };
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg)"
      }
    }, /*#__PURE__*/React.createElement("header", {
      style: {
        background: FOREST,
        color: CREMA,
        borderBottom: "1px solid rgba(24,24,24,0.25)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 14,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: "assets/logo-primary-crema.png",
      alt: "The Charlotte Coffee Festival",
      style: {
        height: 38,
        width: "auto"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        borderLeft: "1px solid rgba(235,229,219,0.28)",
        paddingLeft: 14
      },
      className: "hide-sm"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        opacity: 0.85
      }
    }, EVENT.date), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.2em",
        opacity: 0.65,
        marginTop: 3
      }
    }, EVENT.venue))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("a", {
      href: "#/organizer",
      className: "tccf-link-quiet hide-sm",
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.18em",
        color: "rgba(235,229,219,0.7)",
        textDecoration: "none"
      }
    }, "Organizer \u2192"), /*#__PURE__*/React.createElement("a", {
      href: EVENT.tickets,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "tccf-btn-coral"
    }, "Get Tickets"))), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "0 24px 18px",
        maxWidth: 640,
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("svg", {
      width: "16",
      height: "16",
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: FOREST,
      strokeWidth: "1.8",
      style: {
        position: "absolute",
        left: 16,
        top: "50%",
        transform: "translateY(-50%)",
        opacity: 0.55
      }
    }, /*#__PURE__*/React.createElement("circle", {
      cx: "11",
      cy: "11",
      r: "7"
    }), /*#__PURE__*/React.createElement("path", {
      d: "M21 21l-4.3-4.3"
    })), /*#__PURE__*/React.createElement("input", {
      value: search,
      onChange: e => onSearchChange(e.target.value),
      onFocus: () => setShowResults(true),
      placeholder: "Find my booth \u2014 search vendor name",
      style: {
        width: "100%",
        padding: "13px 42px 13px 44px",
        borderRadius: 999,
        border: "none",
        background: CREMA,
        color: FOREST,
        fontSize: 14,
        fontFamily: "var(--font-body)",
        outline: "none"
      }
    }), search && /*#__PURE__*/React.createElement("button", {
      onClick: () => {
        setSearch("");
        setShowResults(false);
        setArrowId(null);
      },
      "aria-label": "Clear",
      style: {
        position: "absolute",
        right: 16,
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        cursor: "pointer",
        color: FOREST,
        opacity: 0.6,
        fontSize: 16
      }
    }, "\u2715")), showResults && matches.length > 0 && /*#__PURE__*/React.createElement("div", {
      className: "tccf-card",
      style: {
        position: "absolute",
        left: 24,
        right: 24,
        marginTop: 8,
        background: "var(--tccf-off-white)",
        boxShadow: "var(--shadow-lift)",
        overflow: "hidden",
        zIndex: 60,
        maxHeight: 300,
        overflowY: "auto"
      }
    }, matches.map(o => /*#__PURE__*/React.createElement("button", {
      key: o.id,
      onClick: () => findBooth(o),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "9px 12px",
        background: "none",
        border: "none",
        borderBottom: "1px solid var(--rule-soft)",
        cursor: "pointer",
        textAlign: "left",
        color: FOREST
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      obj: o,
      size: 32
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, o.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        color: LATTE,
        marginTop: 1
      }
    }, o.booth_number || `BOOTH #${o.id}`))))))), /*#__PURE__*/React.createElement("main", {
      style: {
        position: "relative",
        flex: 1,
        overflow: "hidden"
      }
    }, loading ? /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        color: FOREST
      }
    }, "Loading map\u2026") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(MapCanvas, {
      mode: "public",
      objects: objects,
      lot: lot,
      selectedId: selectedId,
      arrowTargetId: arrowId,
      onSelect: setSelectedId,
      dimUnassigned: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 14,
        right: 14
      }
    }, /*#__PURE__*/React.createElement(MiniMap, {
      objects: objects,
      lot: lot,
      selectedId: selectedId,
      arrowId: arrowId,
      onJump: setArrowId
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        bottom: 14,
        right: 14
      }
    }, /*#__PURE__*/React.createElement(Legend, {
      defaultOpen: true
    })))), /*#__PURE__*/React.createElement(Sheet, {
      open: !!selected,
      onClose: () => setSelectedId(null),
      width: 360
    }, selected && /*#__PURE__*/React.createElement(PublicDetail, {
      obj: selected,
      onClose: () => setSelectedId(null)
    })));
  }
  function PublicDetail({
    obj,
    onClose
  }) {
    const cat = categorizeVendor(obj.label);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: FOREST,
        color: CREMA,
        padding: "22px 24px",
        display: "flex",
        alignItems: "flex-start",
        gap: 14
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      obj: obj,
      size: 56,
      round: 3
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("h3", {
      style: {
        margin: 0,
        fontFamily: "var(--font-display)",
        textTransform: "uppercase",
        fontSize: 22,
        lineHeight: 1.05,
        color: CREMA
      }
    }, obj.label), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        opacity: 0.8,
        marginTop: 6,
        letterSpacing: "0.08em"
      }
    }, obj.booth_number || `BOOTH #${obj.id}`, " \xB7 ", Math.round(obj.w), "\xD7", Math.round(obj.h), " FT")), /*#__PURE__*/React.createElement("button", {
      onClick: onClose,
      "aria-label": "Close",
      style: {
        background: "none",
        border: "none",
        color: CREMA,
        cursor: "pointer",
        fontSize: 18,
        opacity: 0.8
      }
    }, "\u2715")), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 24,
        flex: 1
      }
    }, cat && /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-block",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        padding: "4px 10px",
        borderRadius: 999,
        color: "#fff",
        background: CATEGORY_COLORS[cat]
      }
    }, cat), /*#__PURE__*/React.createElement("p", {
      style: {
        marginTop: 18,
        color: "var(--fg)",
        lineHeight: 1.55,
        fontSize: 15
      }
    }, "Look for this booth on the festival map \u2014 it's highlighted now. Booth footprint is ", Math.round(obj.w), " ft \xD7 ", Math.round(obj.h), " ft."), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 18,
        paddingTop: 18,
        borderTop: "1px solid var(--rule-soft)",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        color: LATTE,
        letterSpacing: "0.06em",
        lineHeight: 1.7
      }
    }, /*#__PURE__*/React.createElement("div", null, EVENT.date), /*#__PURE__*/React.createElement("div", null, EVENT.venue))));
  }
  window.PublicMap = PublicMap;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/PublicMap.jsx", error: String((e && e.message) || e) }); }

// app/data.js
try { (() => {
/* =====================================================================
   The Charlotte Coffee Festival — Vendor Map
   data.js — seed layout, vendor categorization, and the localStorage
   store (replaces the original Supabase backend with offline-first
   persistence + live cross-tab sync).
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Lot + seed objects (feet) ----------------------------- */
  // Lot is measured in feet; `scale` is px-per-foot at 100% zoom.
  const SEED = {
    lot: {
      w: 286,
      h: 396,
      scale: 4.5
    },
    objects: [{
      id: 1,
      category: "building",
      type: "building",
      label: "Lenny Boy",
      x: 165,
      y: 110,
      w: 119,
      h: 259,
      bg: "#CFC9BC",
      border: "#9a9483",
      text_color: "#4A4B35"
    }, {
      id: 3,
      category: "tent",
      type: "vendor",
      label: "Aara Coffee Co.",
      x: 40,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 4,
      category: "tent",
      type: "vendor",
      label: "Alexis' Cookie Co.",
      x: 130,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 5,
      category: "tent",
      type: "vendor",
      label: "Arboquin Coffee",
      x: 145,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 6,
      category: "tent",
      type: "vendor",
      label: "Atlas Brews",
      x: 55,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 7,
      category: "tent",
      type: "vendor",
      label: "Bean Lab",
      x: 70,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 8,
      category: "tent",
      type: "vendor",
      label: "Beyond Amazing Donuts",
      x: 85,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 9,
      category: "tent",
      type: "vendor",
      label: "Biscuits & Thangs",
      x: 100,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 10,
      category: "tent",
      type: "vendor",
      label: "Black Cat",
      x: 160,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 11,
      category: "tent",
      type: "vendor",
      label: "Breezeway Coffee",
      x: 115,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 12,
      category: "tent",
      type: "vendor",
      label: "Buen Dia Cafe",
      x: 175,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 13,
      category: "misc",
      type: "entrance",
      label: "Front Entrance",
      x: 80,
      y: 385,
      w: 50,
      h: 10,
      bg: "#6B6E45",
      border: "#4A4B35",
      text_color: "#F7F6F2"
    }, {
      id: 14,
      category: "misc",
      type: "entrance",
      label: "Back Entrance",
      x: 275,
      y: 30,
      w: 10,
      h: 50,
      bg: "#6B6E45",
      border: "#4A4B35",
      text_color: "#F7F6F2"
    }, {
      id: 15,
      category: "tent",
      type: "vendor",
      label: "Bush Hill Coffee",
      x: 185,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 16,
      category: "tent",
      type: "vendor",
      label: "Charleston Coffee",
      x: 110,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 17,
      category: "tent",
      type: "vendor",
      label: "Coco & the Director",
      x: 125,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 18,
      category: "tent",
      type: "vendor",
      label: "Companion Coffee",
      x: 190,
      y: 5,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 19,
      category: "tent",
      type: "vendor",
      label: "Cool Idiot Coffee",
      x: 170,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 20,
      category: "tent",
      type: "vendor",
      label: "Defined Coffee",
      x: 155,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 21,
      category: "tent",
      type: "vendor",
      label: "DONA",
      x: 140,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 22,
      category: "tent",
      type: "vendor",
      label: "Dulce Dreams",
      x: 170,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 23,
      category: "tent",
      type: "vendor",
      label: "Firm Foundation",
      x: 155,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 24,
      category: "tent",
      type: "vendor",
      label: "Hærfest Coffee",
      x: 140,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 25,
      category: "tent",
      type: "vendor",
      label: "Hickory Grove Coffee",
      x: 125,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 26,
      category: "tent",
      type: "vendor",
      label: "High Octane",
      x: 110,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 27,
      category: "tent",
      type: "vendor",
      label: "Immigrant Culture",
      x: 185,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 28,
      category: "tent",
      type: "vendor",
      label: "Indigo Tea + Coffee",
      x: 0,
      y: 110,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 29,
      category: "tent",
      type: "vendor",
      label: "It's Flowering",
      x: 0,
      y: 125,
      w: 10,
      h: 10,
      status: "pending"
    }, {
      id: 30,
      category: "tent",
      type: "vendor",
      label: "Javesca",
      x: 0,
      y: 80,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 31,
      category: "tent",
      type: "vendor",
      label: "Kaldi's Coffeehouse",
      x: 0,
      y: 95,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 32,
      category: "tent",
      type: "vendor",
      label: "Knowledge Perk Coffee",
      x: 0,
      y: 140,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 33,
      category: "tent",
      type: "vendor",
      label: "Kofi Kofi Co.",
      x: 0,
      y: 155,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 34,
      category: "misc",
      type: "stage",
      label: "Stage",
      x: 0,
      y: 185,
      w: 33,
      h: 66,
      bg: "#3A2C18",
      border: "#6a4a28",
      text_color: "#EBE5DB"
    }, {
      id: 35,
      category: "tent",
      type: "vendor",
      label: "La Loma Coffee",
      x: 0,
      y: 35,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 36,
      category: "tent",
      type: "vendor",
      label: "Magnolia Coffee",
      x: 0,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 37,
      category: "tent",
      type: "vendor",
      label: "Mama Moon Sourdough",
      x: 0,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 38,
      category: "tent",
      type: "vendor",
      label: "Mauve Lynn Bakehouse",
      x: 0,
      y: 20,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 39,
      category: "tent",
      type: "vendor",
      label: "Moonbeam Roastery",
      x: 95,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 40,
      category: "tent",
      type: "vendor",
      label: "Pancake Daddy's",
      x: 95,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 41,
      category: "tent",
      type: "vendor",
      label: "Robusta Coffee",
      x: 80,
      y: 65,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 43,
      category: "tent",
      type: "vendor",
      label: "Roost Roastery",
      x: 80,
      y: 50,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 44,
      category: "tent",
      type: "vendor",
      label: "San Café",
      x: 80,
      y: 145,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 45,
      category: "tent",
      type: "vendor",
      label: "Sweet Spoon Bakery",
      x: 80,
      y: 130,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 46,
      category: "tent",
      type: "vendor",
      label: "The Chai Box",
      x: 95,
      y: 80,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 47,
      category: "tent",
      type: "vendor",
      label: "Three Oaks",
      x: 95,
      y: 130,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 48,
      category: "tent",
      type: "vendor",
      label: "Tiny Tulip Coffee",
      x: 95,
      y: 115,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 49,
      category: "tent",
      type: "vendor",
      label: "Trailhead Oven",
      x: 80,
      y: 115,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 50,
      category: "tent",
      type: "vendor",
      label: "Two Cups Coffee",
      x: 80,
      y: 160,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 51,
      category: "tent",
      type: "vendor",
      label: "Varosh",
      x: 95,
      y: 145,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 52,
      category: "tent",
      type: "vendor",
      label: "Zikr Coffee",
      x: 95,
      y: 160,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 53,
      category: "tent",
      type: "vendor",
      label: "Open Booth",
      x: 80,
      y: 175,
      w: 10,
      h: 10,
      status: "unassigned"
    }, {
      id: 54,
      category: "tent",
      type: "vendor",
      label: "Open Booth",
      x: 95,
      y: 175,
      w: 10,
      h: 10,
      status: "unassigned"
    }, {
      id: 55,
      category: "tent",
      type: "vendor",
      label: "Open Booth",
      x: 80,
      y: 190,
      w: 10,
      h: 10,
      status: "unassigned"
    }, {
      id: 56,
      category: "tent",
      type: "vendor",
      label: "Open Booth",
      x: 95,
      y: 190,
      w: 10,
      h: 10,
      status: "unassigned"
    }, {
      id: 57,
      category: "tent",
      type: "vendor",
      label: "Open Booth",
      x: 95,
      y: 100,
      w: 10,
      h: 10,
      status: "unassigned"
    }, {
      id: 58,
      category: "tent",
      type: "vendor",
      label: "Open Booth",
      x: 80,
      y: 100,
      w: 10,
      h: 10,
      status: "unassigned"
    }, {
      id: 59,
      category: "misc",
      type: "restroom",
      label: "Restrooms",
      x: 225,
      y: 5,
      w: 10,
      h: 10,
      bg: "#75878B",
      border: "#4f6064",
      text_color: "#F7F6F2"
    }, {
      id: 60,
      category: "misc",
      type: "restroom",
      label: "Restrooms",
      x: 240,
      y: 5,
      w: 10,
      h: 10,
      bg: "#75878B",
      border: "#4f6064",
      text_color: "#F7F6F2"
    }, {
      id: 61,
      category: "misc",
      type: "restroom",
      label: "Restrooms",
      x: 255,
      y: 5,
      w: 10,
      h: 10,
      bg: "#75878B",
      border: "#4f6064",
      text_color: "#F7F6F2"
    }, {
      id: 62,
      category: "misc",
      type: "restroom",
      label: "Restrooms",
      x: 270,
      y: 5,
      w: 10,
      h: 10,
      bg: "#75878B",
      border: "#4f6064",
      text_color: "#F7F6F2"
    }, {
      id: 64,
      category: "tent",
      type: "vendor",
      label: "TCCF Tent",
      x: 150,
      y: 290,
      w: 10,
      h: 20,
      status: "confirmed"
    }, {
      id: 65,
      category: "zone",
      type: "zone",
      label: "Ticketing",
      x: 80,
      y: 330,
      w: 50,
      h: 30,
      bg: "rgba(170,112,80,0.16)",
      border: "#AA7050",
      text_color: "#4A4B35"
    }, {
      id: 66,
      category: "tent",
      type: "food",
      label: "Food & Drink",
      x: 150,
      y: 255,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 67,
      category: "tent",
      type: "food",
      label: "Food & Drink",
      x: 150,
      y: 235,
      w: 10,
      h: 10,
      status: "confirmed"
    }, {
      id: 68,
      category: "tent",
      type: "food",
      label: "Food & Drink",
      x: 150,
      y: 215,
      w: 10,
      h: 10,
      status: "confirmed"
    }]
  };

  /* ---------- Vendor sub-categories --------------------------------- */
  const VENDOR_CATEGORIES = ["Roaster", "Bakery", "Coffee Shop", "Tea & Chai", "Sponsor", "Other"];

  // Earthy palette pulled into the TCCF system: warm browns + one cool blue.
  const CATEGORY_COLORS = {
    "Roaster": "#6E4630",
    // roasted sienna
    "Bakery": "#C29A6B",
    // golden crust
    "Coffee Shop": "#9C8B6E",
    // latte tan
    "Tea & Chai": "#6B6E45",
    // sage / forest
    "Sponsor": "#AA7050",
    // coral
    "Other": "#75878B" // dusty blue
  };
  const CATEGORY_MAP = {
    Roaster: ["Aara", "Arboquin", "Breezeway", "Buen Dia", "Bush Hill", "Charleston", "Companion", "Defined", "Hærfest", "Haerfest", "Hickory Grove", "Immigrant Culture", "Javesca", "Kaldi", "Knowledge Perk", "Kofi Kofi", "La Loma", "Magnolia", "Moonbeam", "Roost", "San Café", "San Cafe", "Sharewell", "Three Oaks", "Varosh"],
    Bakery: ["Alexis", "Beyond Amazing", "Biscuits", "Dulce Dreams", "Mama Moon", "Mauve Lynn", "Pancake Daddy", "Sweet Spoon", "Trailhead Oven"],
    "Coffee Shop": ["Atlas", "Bean Lab", "Black Cat", "Coco", "Cool Idiot", "Firm Foundation", "High Octane", "Indigo", "Robusta", "Tiny Tulip", "Two Cups", "Zikr"],
    "Tea & Chai": ["DONA", "Chai Box"],
    Sponsor: ["Night Swim", "Maizly", "Sponsor"],
    Other: ["Flowering"]
  };
  const norm = s => (s || "").toLowerCase().replace(/[^a-z0-9æ ]+/gi, "").trim();
  function categorizeVendor(label) {
    if (!label) return null;
    const n = norm(label);
    for (const cat of VENDOR_CATEGORIES) {
      if ((CATEGORY_MAP[cat] || []).some(needle => n.includes(norm(needle)))) return cat;
    }
    return null;
  }

  /* ---------- Tent default fill (when no logo / category) ----------- */
  const TENT_DEFAULT = {
    bg: "#9C8B6E",
    border: "#7c6d52",
    text_color: "#3A2C18"
  };
  function fillFor(o) {
    if (o.bg) return {
      bg: o.bg,
      border: o.border,
      text_color: o.text_color
    };
    if (o.type === "sponsor") return {
      bg: CATEGORY_COLORS.Sponsor,
      border: "#80502f",
      text_color: "#F7F6F2"
    };
    if (o.type === "food") return {
      bg: "#4A4B35",
      border: "#33341f",
      text_color: "#EBE5DB"
    };
    const cat = categorizeVendor(o.label);
    if (cat) return {
      bg: CATEGORY_COLORS[cat],
      border: "rgba(24,24,24,0.35)",
      text_color: "#F7F6F2"
    };
    return TENT_DEFAULT;
  }

  /* ---------- Store (localStorage + cross-tab sync) ----------------- */
  const KEY_OBJ = "tccf_map_objects_v1";
  const KEY_LOT = "tccf_map_lot_v1";
  const listeners = new Set();
  function load() {
    let objects, lot;
    try {
      objects = JSON.parse(localStorage.getItem(KEY_OBJ));
    } catch (e) {
      objects = null;
    }
    try {
      lot = JSON.parse(localStorage.getItem(KEY_LOT));
    } catch (e) {
      lot = null;
    }
    if (!objects || !Array.isArray(objects) || objects.length === 0) {
      objects = SEED.objects.map(o => ({
        ...o
      }));
      lot = {
        ...SEED.lot
      };
      persist(objects, lot);
    }
    if (!lot) lot = {
      ...SEED.lot
    };
    return {
      objects,
      lot
    };
  }
  function persist(objects, lot) {
    try {
      localStorage.setItem(KEY_OBJ, JSON.stringify(objects));
      if (lot) localStorage.setItem(KEY_LOT, JSON.stringify(lot));
    } catch (e) {
      console.warn("Persist failed (quota?)", e);
    }
  }
  function save(objects, lot) {
    persist(objects, lot);
    listeners.forEach(fn => {
      try {
        fn({
          objects,
          lot
        });
      } catch (e) {}
    });
  }
  function resetToSeed() {
    const objects = SEED.objects.map(o => ({
      ...o
    }));
    const lot = {
      ...SEED.lot
    };
    save(objects, lot);
    return {
      objects,
      lot
    };
  }

  // Cross-tab: when another tab writes, notify listeners in this tab.
  window.addEventListener("storage", e => {
    if (e.key !== KEY_OBJ && e.key !== KEY_LOT) return;
    const data = load();
    listeners.forEach(fn => {
      try {
        fn(data);
      } catch (err) {}
    });
  });
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  window.TCCF = {
    SEED,
    VENDOR_CATEGORIES,
    CATEGORY_COLORS,
    categorizeVendor,
    fillFor,
    store: {
      load,
      save,
      subscribe,
      resetToSeed
    },
    ORG_PIN: "clt2026",
    EVENT: {
      name: "The Charlotte Coffee Festival",
      short: "Vendor Map · Vol. 02",
      date: "SAT · SEP 12, 2026",
      venue: "Lenny Boy Brewing Co · Charlotte NC",
      tickets: "https://www.cltcoffeefestival.com/tickets"
    }
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/data.js", error: String((e && e.message) || e) }); }

// app/hooks.jsx
try { (() => {
/* hooks.jsx — useMapData: localStorage-backed state with optimistic
   updates, 50-step undo, and live cross-tab sync. */
(function () {
  const {
    useState,
    useEffect,
    useRef,
    useCallback
  } = React;
  const store = window.TCCF.store;
  const HISTORY_LIMIT = 50;
  function useMapData() {
    const init = store.load();
    const [objects, setObjects] = useState(init.objects);
    const [lot, setLot] = useState(init.lot);
    const [loading] = useState(false);
    const history = useRef([]);
    const [historyLen, setHistoryLen] = useState(0);
    const localWrite = useRef(false);

    // Listen for changes from other tabs / the store
    useEffect(() => {
      return store.subscribe(({
        objects,
        lot
      }) => {
        if (localWrite.current) return; // ignore our own echoes
        setObjects(objects);
        if (lot) setLot(lot);
      });
    }, []);
    const commit = useCallback((nextObjects, nextLot) => {
      localWrite.current = true;
      setObjects(nextObjects);
      if (nextLot) setLot(nextLot);
      store.save(nextObjects, nextLot || lot);
      setTimeout(() => {
        localWrite.current = false;
      }, 0);
    }, [lot]);
    const pushHistory = useCallback(snap => {
      history.current.push(snap.map(o => ({
        ...o
      })));
      if (history.current.length > HISTORY_LIMIT) history.current.shift();
      setHistoryLen(history.current.length);
    }, []);
    const updateObject = useCallback((id, patch) => {
      setObjects(prev => {
        pushHistory(prev);
        const next = prev.map(o => o.id === id ? {
          ...o,
          ...patch
        } : o);
        store.save(next, lot);
        localWrite.current = true;
        setTimeout(() => {
          localWrite.current = false;
        }, 0);
        return next;
      });
    }, [lot, pushHistory]);
    const addObject = useCallback(obj => {
      let newId;
      setObjects(prev => {
        pushHistory(prev);
        newId = (prev.reduce((m, o) => Math.max(m, o.id), 0) || 0) + 1;
        const next = [...prev, {
          ...obj,
          id: newId
        }];
        store.save(next, lot);
        localWrite.current = true;
        setTimeout(() => {
          localWrite.current = false;
        }, 0);
        return next;
      });
      return newId;
    }, [lot, pushHistory]);
    const deleteObject = useCallback(id => {
      setObjects(prev => {
        pushHistory(prev);
        const next = prev.filter(o => o.id !== id);
        store.save(next, lot);
        localWrite.current = true;
        setTimeout(() => {
          localWrite.current = false;
        }, 0);
        return next;
      });
    }, [lot, pushHistory]);
    const undo = useCallback(() => {
      const prev = history.current.pop();
      setHistoryLen(history.current.length);
      if (!prev) return;
      commit(prev, lot);
    }, [commit, lot]);
    const reset = useCallback(() => {
      pushHistory(objects);
      const data = store.resetToSeed();
      setObjects(data.objects);
      setLot(data.lot);
    }, [objects, pushHistory]);
    return {
      objects,
      lot,
      loading,
      updateObject,
      addObject,
      deleteObject,
      undo,
      canUndo: historyLen > 0,
      reset
    };
  }
  window.useMapData = useMapData;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/hooks.jsx", error: String((e && e.message) || e) }); }

// app/main.jsx
try { (() => {
/* main.jsx — hash router, toast, mount. */
(function () {
  const {
    useState,
    useEffect
  } = React;

  /* ---- tiny toast ---- */
  function ToastHost() {
    const [items, setItems] = useState([]);
    useEffect(() => {
      window.toast = (msg, kind) => {
        const id = Math.random().toString(36).slice(2);
        setItems(it => [...it, {
          id,
          msg,
          kind
        }]);
        setTimeout(() => setItems(it => it.filter(x => x.id !== id)), 2400);
      };
    }, []);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        bottom: 18,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 200,
        alignItems: "center",
        pointerEvents: "none"
      }
    }, items.map(t => /*#__PURE__*/React.createElement("div", {
      key: t.id,
      style: {
        background: t.kind === "err" ? "#7a2d1e" : "#181818",
        color: "#EBE5DB",
        padding: "9px 16px",
        borderRadius: 2,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.04em",
        boxShadow: "var(--shadow-lift)",
        animation: "tccfToast 240ms cubic-bezier(0.2,0.7,0.2,1)"
      }
    }, t.msg)));
  }
  function useHashRoute() {
    const [route, setRoute] = useState(location.hash.replace(/^#/, "") || "/map");
    useEffect(() => {
      const onHash = () => setRoute(location.hash.replace(/^#/, "") || "/map");
      window.addEventListener("hashchange", onHash);
      return () => window.removeEventListener("hashchange", onHash);
    }, []);
    return route;
  }
  function App() {
    const route = useHashRoute();
    const data = window.useMapData();
    const [unlocked, setUnlocked] = useState(sessionStorage.getItem("tccf_org_unlocked") === "1");
    const isOrganizer = route === "/organizer" || route.indexOf("/organizer") === 0;
    let view;
    if (isOrganizer) {
      if (!unlocked) view = /*#__PURE__*/React.createElement(window.PinGate, {
        onUnlock: () => setUnlocked(true)
      });else view = /*#__PURE__*/React.createElement(window.OrganizerMap, {
        data: data,
        onLogout: () => {
          sessionStorage.removeItem("tccf_org_unlocked");
          setUnlocked(false);
          location.hash = "#/map";
        }
      });
    } else {
      view = /*#__PURE__*/React.createElement(window.PublicMap, {
        objects: data.objects,
        lot: data.lot,
        loading: data.loading
      });
    }
    return /*#__PURE__*/React.createElement(React.Fragment, null, view, /*#__PURE__*/React.createElement(ToastHost, null));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/main.jsx", error: String((e && e.message) || e) }); }

// app/shared.jsx
try { (() => {
/* shared.jsx — MiniMap, Legend, slide-out Sheet, badges. Shared by both views. */
(function () {
  const {
    useState,
    useEffect
  } = React;
  const {
    VENDOR_CATEGORIES,
    CATEGORY_COLORS
  } = window.TCCF;
  const FOREST = "#4A4B35",
    CREMA = "#EBE5DB",
    LATTE = "#746137",
    CORAL = "#AA7050";

  /* Slide-out right sheet with scrim */
  function Sheet({
    open,
    onClose,
    children,
    width = 380
  }) {
    useEffect(() => {
      const onKey = e => {
        if (e.key === "Escape") onClose();
      };
      if (open) window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);
    return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      onClick: onClose,
      style: {
        position: "fixed",
        inset: 0,
        background: "rgba(24,24,24,0.4)",
        opacity: open ? 1 : 0,
        pointerEvents: open ? "auto" : "none",
        transition: "opacity 240ms cubic-bezier(0.2,0.7,0.2,1)",
        zIndex: 80
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        top: 0,
        right: 0,
        bottom: 0,
        width: "100%",
        maxWidth: width,
        background: "var(--tccf-off-white)",
        boxShadow: "var(--shadow-lift)",
        transform: open ? "translateX(0)" : "translateX(105%)",
        transition: "transform 320ms cubic-bezier(0.2,0.7,0.2,1)",
        zIndex: 81,
        display: "flex",
        flexDirection: "column"
      }
    }, children));
  }

  /* MiniMap — schematic overview, click to jump */
  function MiniMap({
    objects,
    lot,
    selectedId,
    onJump,
    arrowId
  }) {
    const {
      fillFor
    } = window.TCCF;
    const W = 132,
      H = Math.round(W * (lot.h / lot.w));
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: W,
        height: H,
        background: "#BAB492",
        border: `1px solid ${FOREST}`,
        overflow: "hidden",
        boxShadow: "0 2px 10px rgba(24,24,24,0.2)"
      },
      title: "Overview"
    }, /*#__PURE__*/React.createElement("svg", {
      viewBox: `0 0 ${lot.w} ${lot.h}`,
      width: W,
      height: H,
      preserveAspectRatio: "none"
    }, objects.map(o => {
      const f = fillFor(o);
      const hot = selectedId === o.id || arrowId === o.id;
      return /*#__PURE__*/React.createElement("rect", {
        key: o.id,
        x: o.x,
        y: o.y,
        width: Math.max(o.w, 2),
        height: Math.max(o.h, 2),
        fill: f.bg,
        stroke: hot ? CORAL : "none",
        strokeWidth: hot ? 4 : 0,
        onClick: () => onJump && onJump(o.id),
        style: {
          cursor: onJump ? "pointer" : "default"
        }
      });
    })));
  }

  /* Legend — collapsible */
  function Legend({
    defaultOpen = true,
    place = "bottom-right"
  }) {
    const [open, setOpen] = useState(defaultOpen);
    const places = [{
      bg: "#3A2C18",
      border: "#6a4a28",
      l: "Stage"
    }, {
      bg: "#6B6E45",
      border: "#4A4B35",
      l: "Entrance"
    }, {
      bg: "rgba(170,112,80,0.16)",
      border: CORAL,
      l: "Ticketing"
    }, {
      bg: "#CFC9BC",
      border: "#9a9483",
      l: "Building"
    }, {
      bg: "#75878B",
      border: "#4f6064",
      l: "Restrooms"
    }, {
      bg: "#4A4B35",
      border: "#33341f",
      l: "Food & Drink"
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: "tccf-card",
      style: {
        width: 210,
        maxWidth: "78vw",
        background: "rgba(247,246,242,0.96)",
        backdropFilter: "blur(8px)",
        border: `1px solid ${FOREST}`,
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setOpen(o => !o),
      style: {
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: FOREST
      }
    }, /*#__PURE__*/React.createElement("span", null, "Map Legend"), /*#__PURE__*/React.createElement("span", {
      style: {
        transition: "transform 200ms",
        transform: open ? "rotate(0)" : "rotate(-90deg)"
      }
    }, "\u25BE")), open && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "2px 12px 12px",
        maxHeight: "48vh",
        overflowY: "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: LATTE,
        margin: "4px 0 6px"
      }
    }, "Vendors"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 5
      }
    }, VENDOR_CATEGORIES.map(c => /*#__PURE__*/React.createElement("div", {
      key: c,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: FOREST
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 2,
        background: CATEGORY_COLORS[c],
        border: "1px solid rgba(24,24,24,0.15)",
        flexShrink: 0
      }
    }), c))), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "1px solid var(--rule-soft)",
        marginTop: 10,
        paddingTop: 8
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        color: LATTE,
        marginBottom: 6
      }
    }, "Places"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 5
      }
    }, places.map(p => /*#__PURE__*/React.createElement("div", {
      key: p.l,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
        color: FOREST
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 2,
        background: p.bg,
        border: `1px solid ${p.border}`,
        flexShrink: 0
      }
    }), p.l))))));
  }
  const STATUS_META = {
    confirmed: {
      label: "Confirmed",
      fg: "#3f4426",
      bg: "#dfe2c8",
      dot: "#6B6E45"
    },
    pending: {
      label: "Pending",
      fg: "#7a4a1a",
      bg: "#f1e0cb",
      dot: "#C29A6B"
    },
    unassigned: {
      label: "Open",
      fg: "#6b6354",
      bg: "#e6e1d6",
      dot: "#9a9483"
    }
  };
  function StatusBadge({
    status
  }) {
    const m = STATUS_META[status] || STATUS_META.pending;
    return /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--font-mono)",
        fontSize: 9,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        padding: "2px 7px",
        borderRadius: 999,
        background: m.bg,
        color: m.fg
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 6,
        height: 6,
        borderRadius: 999,
        background: m.dot
      }
    }), m.label);
  }
  function Avatar({
    obj,
    size = 40,
    round = 2
  }) {
    const init = (obj.label || "").split(/\s+/).slice(0, 2).map(s => s[0] || "").join("").toUpperCase().slice(0, 2);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        width: size,
        height: size,
        borderRadius: round,
        background: obj.logo_url ? "#fff" : "var(--tccf-muted)",
        color: FOREST,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: size * 0.34,
        overflow: "hidden",
        flexShrink: 0,
        border: "1px solid rgba(24,24,24,0.12)"
      }
    }, obj.logo_url ? /*#__PURE__*/React.createElement("img", {
      src: obj.logo_url,
      alt: "",
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      }
    }) : init || "?");
  }
  window.TCCFUI = {
    Sheet,
    MiniMap,
    Legend,
    StatusBadge,
    STATUS_META,
    Avatar
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "app/shared.jsx", error: String((e && e.message) || e) }); }

// design-canvas.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// DesignCanvas.jsx — Figma-ish design canvas wrapper
// Warm gray grid bg + Sections + Artboards + PostIt notes.
// Exports (to window): DesignCanvas, DCSection, DCArtboard, DCPostIt.
// Artboards are reorderable (grip-drag), deletable, labels/titles are
// inline-editable, and any artboard can be opened in a fullscreen focus
// overlay (←/→/Esc). State persists to a .design-canvas.state.json sidecar
// via the host bridge. No assets, no deps.
//
// Usage:
//   <DesignCanvas>
//     <DCSection id="onboarding" title="Onboarding" subtitle="First-run variants">
//       <DCArtboard id="a" label="A · Dusk" width={260} height={480}>…</DCArtboard>
//       <DCArtboard id="b" label="B · Minimal" width={260} height={480}>…</DCArtboard>
//     </DCSection>
//   </DesignCanvas>
//
// Artboards are static design frames, not scroll regions — never use
// height: 100% + overflow: auto/scroll on inner elements; size each artboard
// to fit its content (explicit pixel height, or let it grow).
/* END USAGE */

const DC = {
  bg: '#f0eee9',
  grid: 'rgba(0,0,0,0.06)',
  label: 'rgba(60,50,40,0.7)',
  title: 'rgba(40,30,20,0.85)',
  subtitle: 'rgba(60,50,40,0.6)',
  postitBg: '#fef4a8',
  postitText: '#5a4a2a',
  font: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif'
};

// One-time CSS injection (classes are dc-prefixed so they don't collide with
// the hosted design's own styles).
if (typeof document !== 'undefined' && !document.getElementById('dc-styles')) {
  const s = document.createElement('style');
  s.id = 'dc-styles';
  s.textContent = ['.dc-editable{cursor:text;outline:none;white-space:nowrap;border-radius:3px;padding:0 2px;margin:0 -2px}', '.dc-editable:focus{background:#fff;box-shadow:0 0 0 1.5px #c96442}', '[data-dc-slot]{transition:transform .18s cubic-bezier(.2,.7,.3,1)}', '[data-dc-slot].dc-dragging{transition:none;z-index:10;pointer-events:none}', '[data-dc-slot].dc-dragging .dc-card{box-shadow:0 12px 40px rgba(0,0,0,.25),0 0 0 2px #c96442;transform:scale(1.02)}',
  // isolation:isolate contains artboard content's z-indexes so a
  // z-indexed child (sticky navbar etc.) can't paint over .dc-header or
  // the .dc-menu popover that drops into the top of the card.
  '.dc-card{isolation:isolate;transition:box-shadow .15s,transform .15s}', '.dc-card *{scrollbar-width:none}', '.dc-card *::-webkit-scrollbar{display:none}',
  // Per-artboard header: grip + label on the left, delete/expand on the
  // right. Single flex row; when the artboard's on-screen width is too
  // narrow for both the label yields (ellipsis, then hidden entirely below
  // ~4ch via the container query) and the buttons stay on the row.
  '.dc-header{position:absolute;bottom:100%;left:-4px;margin-bottom:calc(4px * var(--dc-inv-zoom,1));z-index:2;', '  display:flex;align-items:center;container-type:inline-size}', '.dc-labelrow{display:flex;align-items:center;gap:4px;height:24px;flex:1 1 auto;min-width:0}', '.dc-grip{flex:0 0 auto;cursor:grab;display:flex;align-items:center;padding:5px 4px;border-radius:4px;transition:background .12s,opacity .12s}', '.dc-grip:hover{background:rgba(0,0,0,.08)}', '.dc-grip:active{cursor:grabbing}', '.dc-labeltext{flex:1 1 auto;min-width:0;cursor:pointer;border-radius:4px;padding:3px 6px;', '  display:flex;align-items:center;transition:background .12s;overflow:hidden}',
  // Below ~4ch of label room: hide the label entirely, and drop the grip to
  // hover-only (same reveal rule as .dc-btns) so a narrow header is clean
  // until the card is moused.
  '@container (max-width: 110px){', '  .dc-labeltext{display:none}', '  .dc-grip{opacity:0}', '  [data-dc-slot]:hover .dc-grip{opacity:1}', '}', '.dc-labeltext:hover{background:rgba(0,0,0,.05)}', '.dc-labeltext .dc-editable{overflow:hidden;text-overflow:ellipsis;max-width:100%}', '.dc-labeltext .dc-editable:focus{overflow:visible;text-overflow:clip}', '.dc-btns{flex:0 0 auto;margin-left:auto;display:flex;gap:2px;opacity:0;transition:opacity .12s}', '[data-dc-slot]:hover .dc-btns,.dc-btns:has(.dc-menu){opacity:1}', '.dc-expand,.dc-kebab{width:22px;height:22px;border-radius:5px;border:none;cursor:pointer;padding:0;', '  background:transparent;color:rgba(60,50,40,.7);display:flex;align-items:center;justify-content:center;', '  font:inherit;transition:background .12s,color .12s}', '.dc-expand:hover,.dc-kebab:hover{background:rgba(0,0,0,.06);color:#2a251f}',
  // Slot hosting an open menu floats above later siblings (which otherwise
  // paint on top — same z-index:auto, later DOM order) so the popup isn't
  // clipped by the next card.
  '[data-dc-slot]:has(.dc-menu){z-index:10}', '.dc-menu{position:absolute;top:100%;right:0;margin-top:4px;background:#fff;border-radius:8px;', '  box-shadow:0 8px 28px rgba(0,0,0,.18),0 0 0 1px rgba(0,0,0,.05);padding:4px;min-width:160px;z-index:10}', '.dc-menu button{display:block;width:100%;padding:7px 10px;border:0;background:transparent;', '  border-radius:5px;font-family:inherit;font-size:13px;font-weight:500;line-height:1.2;', '  color:#29261b;cursor:pointer;text-align:left;transition:background .12s;white-space:nowrap}', '.dc-menu button:hover{background:rgba(0,0,0,.05)}', '.dc-menu hr{border:0;border-top:1px solid rgba(0,0,0,.08);margin:4px 2px}', '.dc-menu .dc-danger{color:#c96442}', '.dc-menu .dc-danger:hover{background:rgba(201,100,66,.1)}',
  // Chrome (titles / labels / buttons) counter-scales against the viewport
  // zoom so it stays a constant on-screen size. --dc-inv-zoom is set by
  // DCViewport on every transform update and inherits to all descendants —
  // any overlay inside the world (e.g. a TweaksPanel on an artboard) can use
  // it the same way.
  //
  // The header uses transform:scale (out-of-flow, so layout impact doesn't
  // matter) with its world-space width set to card-width / inv-zoom so that
  // after counter-scaling its on-screen width exactly matches the card's —
  // that's what lets the container query + text-overflow behave against the
  // card's visible edge at every zoom level.
  //
  // The section head uses CSS zoom instead of transform so its layout box
  // grows with the counter-scale, pushing the card row down — otherwise the
  // constant-screen-size title would overflow into the (shrinking) world-
  // space gap and overlap the artboard headers at low zoom.
  '.dc-header{width:calc((100% + 4px) / var(--dc-inv-zoom,1));', '  transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom left}', '.dc-sectionhead{zoom:var(--dc-inv-zoom,1)}'].join('\n');
  document.head.appendChild(s);
}
const DCCtx = React.createContext(null);

// Recursively unwrap React.Fragment so <>…</> grouping doesn't hide
// DCSection/DCArtboard children from the type-based walks below.
function dcFlatten(children) {
  const out = [];
  React.Children.forEach(children, c => {
    if (c && c.type === React.Fragment) out.push(...dcFlatten(c.props.children));else out.push(c);
  });
  return out;
}

// ─────────────────────────────────────────────────────────────
// DesignCanvas — stateful wrapper around the pan/zoom viewport.
// Owns runtime state (per-section order, renamed titles/labels, hidden
// artboards, focused artboard). Order/titles/labels/hidden persist to a
// .design-canvas.state.json
// sidecar next to the HTML. Reads go via plain fetch() so the saved
// arrangement is visible anywhere the HTML + sidecar are served together
// (omelette preview, direct link, downloaded zip). Writes go through the
// host's window.omelette bridge — editing requires the omelette runtime.
// Focus is ephemeral.
// ─────────────────────────────────────────────────────────────
const DC_STATE_FILE = '.design-canvas.state.json';
function DesignCanvas({
  children,
  minScale,
  maxScale,
  style
}) {
  const [state, setState] = React.useState({
    sections: {},
    focus: null
  });
  // Hold rendering until the sidecar read settles so the saved order/titles
  // appear on first paint (no source-order flash). didRead gates writes until
  // the read settles so the empty initial state can't clobber a slow read;
  // skipNextWrite suppresses the one echo-write that would otherwise follow
  // hydration.
  const [ready, setReady] = React.useState(false);
  const didRead = React.useRef(false);
  const skipNextWrite = React.useRef(false);
  React.useEffect(() => {
    let off = false;
    fetch('./' + DC_STATE_FILE).then(r => r.ok ? r.json() : null).then(saved => {
      if (off || !saved || !saved.sections) return;
      skipNextWrite.current = true;
      setState(s => ({
        ...s,
        sections: saved.sections
      }));
    }).catch(() => {}).finally(() => {
      didRead.current = true;
      if (!off) setReady(true);
    });
    const t = setTimeout(() => {
      if (!off) setReady(true);
    }, 150);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, []);
  React.useEffect(() => {
    if (!didRead.current) return;
    if (skipNextWrite.current) {
      skipNextWrite.current = false;
      return;
    }
    const t = setTimeout(() => {
      window.omelette?.writeFile(DC_STATE_FILE, JSON.stringify({
        sections: state.sections
      })).catch(() => {});
    }, 250);
    return () => clearTimeout(t);
  }, [state.sections]);

  // Build registries synchronously from children so FocusOverlay can read
  // them in the same render. Fragments are flattened; wrapping in other
  // elements still opts out of focus/reorder.
  const registry = {}; // slotId -> { sectionId, artboard }
  const sectionMeta = {}; // sectionId -> { title, subtitle, slotIds[] }
  const sectionOrder = [];
  dcFlatten(children).forEach(sec => {
    if (!sec || sec.type !== DCSection) return;
    const sid = sec.props.id ?? sec.props.title;
    if (!sid) return;
    sectionOrder.push(sid);
    const persisted = state.sections[sid] || {};
    const abs = [];
    dcFlatten(sec.props.children).forEach(ab => {
      if (!ab || ab.type !== DCArtboard) return;
      const aid = ab.props.id ?? ab.props.label;
      if (aid) abs.push([aid, ab]);
    });
    // hidden is scoped to one source revision — when the agent regenerates
    // (artboard-ID set changes), prior deletes don't apply to new content.
    const srcKey = abs.map(([k]) => k).join('\x1f');
    const hidden = persisted.srcKey === srcKey ? persisted.hidden || [] : [];
    const srcIds = [];
    abs.forEach(([aid, ab]) => {
      if (hidden.includes(aid)) return;
      registry[`${sid}/${aid}`] = {
        sectionId: sid,
        artboard: ab
      };
      srcIds.push(aid);
    });
    const kept = (persisted.order || []).filter(k => srcIds.includes(k));
    sectionMeta[sid] = {
      title: persisted.title ?? sec.props.title,
      subtitle: sec.props.subtitle,
      slotIds: [...kept, ...srcIds.filter(k => !kept.includes(k))]
    };
  });
  const api = React.useMemo(() => ({
    state,
    section: id => state.sections[id] || {},
    patchSection: (id, p) => setState(s => ({
      ...s,
      sections: {
        ...s.sections,
        [id]: {
          ...s.sections[id],
          ...(typeof p === 'function' ? p(s.sections[id] || {}) : p)
        }
      }
    })),
    setFocus: slotId => setState(s => ({
      ...s,
      focus: slotId
    }))
  }), [state]);

  // Esc exits focus; any outside pointerdown commits an in-progress rename.
  React.useEffect(() => {
    const onKey = e => {
      if (e.key === 'Escape') api.setFocus(null);
    };
    const onPd = e => {
      const ae = document.activeElement;
      if (ae && ae.isContentEditable && !ae.contains(e.target)) ae.blur();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPd, true);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPd, true);
    };
  }, [api]);
  return /*#__PURE__*/React.createElement(DCCtx.Provider, {
    value: api
  }, /*#__PURE__*/React.createElement(DCViewport, {
    minScale: minScale,
    maxScale: maxScale,
    style: style
  }, ready && children), state.focus && registry[state.focus] && /*#__PURE__*/React.createElement(DCFocusOverlay, {
    entry: registry[state.focus],
    sectionMeta: sectionMeta,
    sectionOrder: sectionOrder
  }));
}

// ─────────────────────────────────────────────────────────────
// DCViewport — transform-based pan/zoom (internal)
//
// Input mapping (Figma-style):
//   • trackpad pinch  → zoom   (ctrlKey wheel; Safari gesture* events)
//   • trackpad scroll → pan    (two-finger)
//   • mouse wheel     → zoom   (notched; distinguished from trackpad scroll)
//   • middle-drag / primary-drag-on-bg → pan
//
// Transform state lives in a ref and is written straight to the DOM
// (translate3d + will-change) so wheel ticks don't go through React —
// keeps pans at 60fps on dense canvases.
// ─────────────────────────────────────────────────────────────
function DCViewport({
  children,
  minScale = 0.1,
  maxScale = 8,
  style = {}
}) {
  const vpRef = React.useRef(null);
  const worldRef = React.useRef(null);
  const tf = React.useRef({
    x: 0,
    y: 0,
    scale: 1
  });
  // Persist viewport across reloads so the user lands back where they were
  // after an agent edit or browser refresh. The sandbox origin is already
  // per-project; pathname keeps multiple canvas files in one project apart.
  const tfKey = 'dc-viewport:' + location.pathname;
  const saveT = React.useRef(0);
  const lastPostedScale = React.useRef();
  const apply = React.useCallback(() => {
    const {
      x,
      y,
      scale
    } = tf.current;
    const el = worldRef.current;
    if (!el) return;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    // Exposed for zoom-invariant chrome (labels, buttons, TweaksPanel).
    el.style.setProperty('--dc-inv-zoom', String(1 / scale));
    // Keep the host toolbar's % readout in sync with the canvas scale. Pan
    // ticks leave scale unchanged — skip the cross-frame post for those.
    if (lastPostedScale.current !== scale) {
      lastPostedScale.current = scale;
      window.parent.postMessage({
        type: '__dc_zoom',
        scale
      }, '*');
    }
    clearTimeout(saveT.current);
    saveT.current = setTimeout(() => {
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    }, 200);
  }, [tfKey]);
  React.useLayoutEffect(() => {
    const flush = () => {
      clearTimeout(saveT.current);
      try {
        localStorage.setItem(tfKey, JSON.stringify(tf.current));
      } catch {}
    };
    try {
      const s = JSON.parse(localStorage.getItem(tfKey) || 'null');
      if (s && Number.isFinite(s.x) && Number.isFinite(s.y) && Number.isFinite(s.scale)) {
        tf.current = {
          x: s.x,
          y: s.y,
          scale: Math.min(maxScale, Math.max(minScale, s.scale))
        };
        apply();
      }
    } catch {}
    // Flush on pagehide and unmount so a reload within the 200ms debounce
    // window doesn't drop the last pan/zoom.
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);
  React.useEffect(() => {
    const vp = vpRef.current;
    if (!vp) return;
    const zoomAt = (cx, cy, factor) => {
      const r = vp.getBoundingClientRect();
      const px = cx - r.left,
        py = cy - r.top;
      const t = tf.current;
      const next = Math.min(maxScale, Math.max(minScale, t.scale * factor));
      const k = next / t.scale;
      // --dc-inv-zoom consumers (.dc-sectionhead's CSS zoom, each section's
      // marginBottom) reflow on every scale change, vertically shifting the
      // world layout — so a world point mathematically pinned under the cursor
      // drifts as you zoom (content creeps up on zoom-in, down on zoom-out).
      // Anchor the DOM element under the cursor instead: record its screen Y,
      // apply the transform + --dc-inv-zoom, then cancel whatever vertical
      // drift the reflow introduced so it stays put on screen.
      let marker = null,
        markerY0 = 0;
      if (k !== 1) {
        const hit = document.elementFromPoint(cx, cy);
        marker = hit && hit.closest ? hit.closest('[data-dc-slot],[data-dc-section]') : null;
        if (marker) markerY0 = marker.getBoundingClientRect().top;
      }
      // keep the world point under the cursor fixed
      t.x = px - (px - t.x) * k;
      t.y = py - (py - t.y) * k;
      t.scale = next;
      apply();
      if (marker) {
        // A pure zoom around (cx, cy) maps screen Y → cy + (Y - cy) * k. Any
        // departure after the --dc-inv-zoom reflow is the layout drift.
        const drift = marker.getBoundingClientRect().top - (cy + (markerY0 - cy) * k);
        if (Math.abs(drift) > 0.1) {
          t.y -= drift;
          apply();
        }
      }
    };

    // Mouse-wheel vs trackpad-scroll heuristic. A physical wheel sends
    // line-mode deltas (Firefox) or large integer pixel deltas with no X
    // component (Chrome/Safari, typically multiples of 100/120). Trackpad
    // two-finger scroll sends small/fractional pixel deltas, often with
    // non-zero deltaX. ctrlKey is set by the browser for trackpad pinch.
    const isMouseWheel = e => e.deltaMode !== 0 || e.deltaX === 0 && Number.isInteger(e.deltaY) && Math.abs(e.deltaY) >= 40;
    const onWheel = e => {
      e.preventDefault();
      if (isGesturing) return; // Safari: gesture* owns the pinch — discard concurrent wheels
      if ((e.ctrlKey || e.metaKey) && !isMouseWheel(e)) {
        // trackpad pinch, or ctrl/cmd + smooth-scroll mouse. Notched
        // wheels fall through to the fixed-step branch below.
        zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * 0.01));
      } else if (isMouseWheel(e)) {
        // notched mouse wheel — fixed-ratio step per click
        zoomAt(e.clientX, e.clientY, Math.exp(-Math.sign(e.deltaY) * 0.18));
      } else {
        // trackpad two-finger scroll — pan
        tf.current.x -= e.deltaX;
        tf.current.y -= e.deltaY;
        apply();
      }
    };

    // Safari sends native gesture* events for trackpad pinch with a smooth
    // e.scale; preferring these over the ctrl+wheel fallback gives a much
    // better feel there. No-ops on other browsers. Safari also fires
    // ctrlKey wheel events during the same pinch — isGesturing makes
    // onWheel drop those entirely so they neither zoom nor pan.
    let gsBase = 1;
    let isGesturing = false;
    const onGestureStart = e => {
      e.preventDefault();
      isGesturing = true;
      gsBase = tf.current.scale;
    };
    const onGestureChange = e => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, gsBase * e.scale / tf.current.scale);
    };
    const onGestureEnd = e => {
      e.preventDefault();
      isGesturing = false;
    };

    // Drag-pan: middle button anywhere, or primary button on canvas
    // background (anything that isn't an artboard or an inline editor).
    let drag = null;
    const onPointerDown = e => {
      const onBg = !e.target.closest('[data-dc-slot], .dc-editable');
      if (!(e.button === 1 || e.button === 0 && onBg)) return;
      e.preventDefault();
      vp.setPointerCapture(e.pointerId);
      drag = {
        id: e.pointerId,
        lx: e.clientX,
        ly: e.clientY
      };
      vp.style.cursor = 'grabbing';
    };
    const onPointerMove = e => {
      if (!drag || e.pointerId !== drag.id) return;
      tf.current.x += e.clientX - drag.lx;
      tf.current.y += e.clientY - drag.ly;
      drag.lx = e.clientX;
      drag.ly = e.clientY;
      apply();
    };
    const onPointerUp = e => {
      if (!drag || e.pointerId !== drag.id) return;
      vp.releasePointerCapture(e.pointerId);
      drag = null;
      vp.style.cursor = '';
    };

    // Host-driven zoom (toolbar % menu). Zooms around viewport centre so the
    // visible midpoint stays fixed — matching the host's iframe-zoom feel.
    const onHostMsg = e => {
      const d = e.data;
      if (d && d.type === '__dc_set_zoom' && typeof d.scale === 'number') {
        const r = vp.getBoundingClientRect();
        zoomAt(r.left + r.width / 2, r.top + r.height / 2, d.scale / tf.current.scale);
      } else if (d && d.type === '__dc_probe') {
        // Host's [readyGen] reset asks whether a canvas is present; it
        // fires on the iframe's native 'load', which for canvases with
        // images/fonts is after our mount-time announce, so re-announce.
        // Clear the pan-tick guard so apply() re-posts the current scale
        // even if it's unchanged — the host just reset dcScale to 1.
        window.parent.postMessage({
          type: '__dc_present'
        }, '*');
        lastPostedScale.current = undefined;
        apply();
      }
    };
    window.addEventListener('message', onHostMsg);
    // Announce canvas mode so the host toolbar proxies its % control here
    // instead of scaling the iframe element (which would just shrink the
    // viewport window of an infinite canvas). The apply() that follows emits
    // the initial __dc_zoom so the toolbar % is correct before first pinch.
    // lastPostedScale reset mirrors the __dc_probe handler: the layout
    // effect's restore-path apply() may already have posted the restored
    // scale (before __dc_present), so clear the guard to re-post it in order.
    window.parent.postMessage({
      type: '__dc_present'
    }, '*');
    lastPostedScale.current = undefined;
    apply();
    vp.addEventListener('wheel', onWheel, {
      passive: false
    });
    vp.addEventListener('gesturestart', onGestureStart, {
      passive: false
    });
    vp.addEventListener('gesturechange', onGestureChange, {
      passive: false
    });
    vp.addEventListener('gestureend', onGestureEnd, {
      passive: false
    });
    vp.addEventListener('pointerdown', onPointerDown);
    vp.addEventListener('pointermove', onPointerMove);
    vp.addEventListener('pointerup', onPointerUp);
    vp.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('message', onHostMsg);
      vp.removeEventListener('wheel', onWheel);
      vp.removeEventListener('gesturestart', onGestureStart);
      vp.removeEventListener('gesturechange', onGestureChange);
      vp.removeEventListener('gestureend', onGestureEnd);
      vp.removeEventListener('pointerdown', onPointerDown);
      vp.removeEventListener('pointermove', onPointerMove);
      vp.removeEventListener('pointerup', onPointerUp);
      vp.removeEventListener('pointercancel', onPointerUp);
    };
  }, [apply, minScale, maxScale]);
  const gridSvg = `url("data:image/svg+xml,%3Csvg width='120' height='120' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M120 0H0v120' fill='none' stroke='${encodeURIComponent(DC.grid)}' stroke-width='1'/%3E%3C/svg%3E")`;
  return /*#__PURE__*/React.createElement("div", {
    ref: vpRef,
    className: "design-canvas",
    style: {
      height: '100vh',
      width: '100vw',
      background: DC.bg,
      overflow: 'hidden',
      overscrollBehavior: 'none',
      touchAction: 'none',
      position: 'relative',
      fontFamily: DC.font,
      boxSizing: 'border-box',
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    ref: worldRef,
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      transformOrigin: '0 0',
      willChange: 'transform',
      width: 'max-content',
      minWidth: '100%',
      minHeight: '100%',
      padding: '60px 0 80px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: -6000,
      backgroundImage: gridSvg,
      backgroundSize: '120px 120px',
      pointerEvents: 'none',
      zIndex: -1
    }
  }), children));
}

// ─────────────────────────────────────────────────────────────
// DCSection — editable title + h-row of artboards in persisted order
// ─────────────────────────────────────────────────────────────
function DCSection({
  id,
  title,
  subtitle,
  children,
  gap = 48
}) {
  const ctx = React.useContext(DCCtx);
  const sid = id ?? title;
  const all = React.Children.toArray(dcFlatten(children));
  const artboards = all.filter(c => c && c.type === DCArtboard);
  const rest = all.filter(c => !(c && c.type === DCArtboard));
  const sec = ctx && sid && ctx.section(sid) || {};
  // Must match DesignCanvas's srcKey computation exactly (it filters falsy
  // IDs), or onDelete persists a srcKey that DesignCanvas never recognizes.
  const allIds = artboards.map(a => a.props.id ?? a.props.label).filter(Boolean);
  const srcKey = allIds.join('\x1f');
  const hidden = sec.srcKey === srcKey ? sec.hidden || [] : [];
  const srcOrder = allIds.filter(k => !hidden.includes(k));
  const order = React.useMemo(() => {
    const kept = (sec.order || []).filter(k => srcOrder.includes(k));
    return [...kept, ...srcOrder.filter(k => !kept.includes(k))];
  }, [sec.order, srcOrder.join('|')]);
  const byId = Object.fromEntries(artboards.map(a => [a.props.id ?? a.props.label, a]));

  // marginBottom counter-scales so the on-screen gap between sections stays
  // constant — otherwise at low zoom the (world-space) gap collapses while
  // the screen-constant sectionhead below it doesn't, and the title reads as
  // belonging to the section above. paddingBottom below is just enough for
  // the 24px artboard-header (abs-positioned above each card) plus ~8px, so
  // the title sits tight against its own row at every zoom.
  return /*#__PURE__*/React.createElement("div", {
    "data-dc-section": sid,
    style: {
      marginBottom: 'calc(80px * var(--dc-inv-zoom, 1))',
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: '0 60px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-sectionhead",
    style: {
      paddingBottom: 36
    }
  }, /*#__PURE__*/React.createElement(DCEditable, {
    tag: "div",
    value: sec.title ?? title,
    onChange: v => ctx && sid && ctx.patchSection(sid, {
      title: v
    }),
    style: {
      fontSize: 28,
      fontWeight: 600,
      color: DC.title,
      letterSpacing: -0.4,
      marginBottom: 6,
      display: 'inline-block'
    }
  }), subtitle && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      color: DC.subtitle
    }
  }, subtitle))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap,
      padding: '0 60px',
      alignItems: 'flex-start',
      width: 'max-content'
    }
  }, order.map(k => /*#__PURE__*/React.createElement(DCArtboardFrame, {
    key: k,
    sectionId: sid,
    artboard: byId[k],
    order: order,
    label: (sec.labels || {})[k] ?? byId[k].props.label,
    onRename: v => ctx && ctx.patchSection(sid, x => ({
      labels: {
        ...x.labels,
        [k]: v
      }
    })),
    onReorder: next => ctx && ctx.patchSection(sid, {
      order: next
    }),
    onDelete: () => ctx && ctx.patchSection(sid, x => ({
      hidden: [...(x.srcKey === srcKey ? x.hidden || [] : []), k],
      srcKey
    })),
    onFocus: () => ctx && ctx.setFocus(`${sid}/${k}`)
  }))), rest);
}

// DCArtboard — marker; rendered by DCArtboardFrame via DCSection.
function DCArtboard() {
  return null;
}

// Per-artboard export (kind: 'png' | 'html'). Both paths share the same
// self-contained clone: computed styles baked in, @font-face / <img> /
// inline-style background-image urls inlined as data URIs. PNG wraps the
// clone in foreignObject→canvas at 3× the artboard's natural width×height
// (same pipeline the host uses for page captures); HTML wraps it in a
// minimal standalone document. Both are independent of viewport zoom.
async function dcExport(node, w, h, name, kind) {
  try {
    await document.fonts.ready;
  } catch {}
  const toDataURL = url => fetch(url).then(r => r.blob()).then(b => new Promise(res => {
    const fr = new FileReader();
    fr.onload = () => res(fr.result);
    fr.onerror = () => res(url);
    fr.readAsDataURL(b);
  })).catch(() => url);

  // Collect @font-face rules. ss.cssRules throws SecurityError on
  // cross-origin sheets (e.g. fonts.googleapis.com) — in that case fetch
  // the CSS text directly (those endpoints send ACAO:*) and regex-extract
  // the blocks. @import and @media/@supports are walked so nested
  // @font-face rules aren't missed.
  const fontRules = [],
    pending = [],
    seen = new Set();
  const scrapeCss = href => {
    if (seen.has(href)) return;
    seen.add(href);
    pending.push(fetch(href).then(r => r.text()).then(css => {
      for (const m of css.match(/@font-face\s*{[^}]*}/g) || []) fontRules.push({
        css: m,
        base: href
      });
      for (const m of css.matchAll(/@import\s+(?:url\()?['"]?([^'")\s;]+)/g)) scrapeCss(new URL(m[1], href).href);
    }).catch(() => {}));
  };
  const walk = (rules, base) => {
    for (const r of rules) {
      if (r.type === CSSRule.FONT_FACE_RULE) fontRules.push({
        css: r.cssText,
        base
      });else if (r.type === CSSRule.IMPORT_RULE && r.styleSheet) {
        const ibase = r.styleSheet.href || base;
        try {
          walk(r.styleSheet.cssRules, ibase);
        } catch {
          scrapeCss(ibase);
        }
      } else if (r.cssRules) walk(r.cssRules, base);
    }
  };
  for (const ss of document.styleSheets) {
    const base = ss.href || location.href;
    try {
      walk(ss.cssRules, base);
    } catch {
      if (ss.href) scrapeCss(ss.href);
    }
  }
  while (pending.length) await pending.shift();
  const fontCss = (await Promise.all(fontRules.map(async rule => {
    let out = rule.css,
      m;
    const re = /url\((['"]?)([^'")]+)\1\)/g;
    while (m = re.exec(rule.css)) {
      if (m[2].indexOf('data:') === 0) continue;
      let abs;
      try {
        abs = new URL(m[2], rule.base).href;
      } catch {
        continue;
      }
      out = out.split(m[0]).join('url("' + (await toDataURL(abs)) + '")');
    }
    return out;
  }))).join('\n');
  const cloneStyled = src => {
    if (src.nodeType === 8 || src.nodeType === 1 && src.tagName === 'SCRIPT') return document.createTextNode('');
    const dst = src.cloneNode(false);
    if (src.nodeType === 1) {
      const cs = getComputedStyle(src);
      let txt = '';
      for (let i = 0; i < cs.length; i++) txt += cs[i] + ':' + cs.getPropertyValue(cs[i]) + ';';
      dst.setAttribute('style', txt + 'animation:none;transition:none;');
      if (src.tagName === 'CANVAS') try {
        const im = document.createElement('img');
        im.src = src.toDataURL();
        im.setAttribute('style', txt);
        return im;
      } catch {}
    }
    for (let c = src.firstChild; c; c = c.nextSibling) dst.appendChild(cloneStyled(c));
    return dst;
  };
  const clone = cloneStyled(node);
  clone.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  // Drop the card's own shadow/radius so the export is a flush w×h rect;
  // the artboard's own background (if any) is already in the computed style.
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  const jobs = [];
  clone.querySelectorAll('img').forEach(el => {
    const s = el.getAttribute('src');
    if (s && s.indexOf('data:') !== 0) jobs.push(toDataURL(el.src).then(d => el.setAttribute('src', d)));
  });
  [clone, ...clone.querySelectorAll('*')].forEach(el => {
    const bg = el.style.backgroundImage;
    if (!bg) return;
    let m;
    const re = /url\(["']?([^"')]+)["']?\)/g;
    while (m = re.exec(bg)) {
      const tok = m[0],
        url = m[1];
      if (url.indexOf('data:') === 0) continue;
      jobs.push(toDataURL(url).then(d => {
        el.style.backgroundImage = el.style.backgroundImage.split(tok).join('url("' + d + '")');
      }));
    }
  });
  await Promise.all(jobs);
  const xml = new XMLSerializer().serializeToString(clone);
  const save = (blob, ext) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name + '.' + ext;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  if (kind === 'html') {
    const html = '<!doctype html><html><head><meta charset="utf-8"><title>' + name + '</title>' + (fontCss ? '<style>' + fontCss + '</style>' : '') + '</head><body style="margin:0">' + xml + '</body></html>';
    return save(new Blob([html], {
      type: 'text/html'
    }), 'html');
  }

  // PNG: the SVG's own width/height must be the output resolution — an
  // <img>-loaded SVG rasterizes at its intrinsic size, so sizing it at 1×
  // and ctx.scale()-ing up would just upscale a 1× bitmap. viewBox maps the
  // w×h foreignObject onto the px·w × px·h SVG canvas so the browser renders
  // the HTML at full resolution.
  const px = 3;
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + w * px + '" height="' + h * px + '" viewBox="0 0 ' + w + ' ' + h + '"><foreignObject width="' + w + '" height="' + h + '">' + (fontCss ? '<style><![CDATA[' + fontCss + ']]></style>' : '') + xml + '</foreignObject></svg>';
  const img = new Image();
  await new Promise((res, rej) => {
    img.onload = res;
    img.onerror = () => rej(new Error('svg load failed'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  });
  const cv = document.createElement('canvas');
  cv.width = w * px;
  cv.height = h * px;
  cv.getContext('2d').drawImage(img, 0, 0);
  cv.toBlob(blob => save(blob, 'png'), 'image/png');
}
function DCArtboardFrame({
  sectionId,
  artboard,
  label,
  order,
  onRename,
  onReorder,
  onFocus,
  onDelete
}) {
  const {
    id: rawId,
    label: rawLabel,
    width = 260,
    height = 480,
    children,
    style = {}
  } = artboard.props;
  const id = rawId ?? rawLabel;
  const ref = React.useRef(null);
  const cardRef = React.useRef(null);
  const menuRef = React.useRef(null);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  // ⋯ menu: close on any outside pointerdown. Two-click delete lives inside
  // the menu — first click arms the row, second commits; closing disarms.
  React.useEffect(() => {
    if (!menuOpen) {
      setConfirming(false);
      return;
    }
    const off = e => {
      if (!menuRef.current || !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('pointerdown', off, true);
    return () => document.removeEventListener('pointerdown', off, true);
  }, [menuOpen]);
  const doExport = kind => {
    setMenuOpen(false);
    if (!cardRef.current) return;
    const name = String(label || id || 'artboard').replace(/[^\w\s.-]+/g, '_');
    dcExport(cardRef.current, width, height, name, kind).catch(e => console.error('[design-canvas] export failed:', e));
  };

  // Live drag-reorder: dragged card sticks to cursor; siblings slide into
  // their would-be slots in real time via transforms. DOM order only
  // changes on drop.
  const onGripDown = e => {
    e.preventDefault();
    e.stopPropagation();
    const me = ref.current;
    // translateX is applied in local (pre-scale) space but pointer deltas and
    // getBoundingClientRect().left are screen-space — divide by the viewport's
    // current scale so the dragged card tracks the cursor at any zoom level.
    const scale = me.getBoundingClientRect().width / me.offsetWidth || 1;
    const peers = Array.from(document.querySelectorAll(`[data-dc-section="${sectionId}"] [data-dc-slot]`));
    const homes = peers.map(el => ({
      el,
      id: el.dataset.dcSlot,
      x: el.getBoundingClientRect().left
    }));
    const slotXs = homes.map(h => h.x);
    const startIdx = order.indexOf(id);
    const startX = e.clientX;
    let liveOrder = order.slice();
    me.classList.add('dc-dragging');
    const layout = () => {
      for (const h of homes) {
        if (h.id === id) continue;
        const slot = liveOrder.indexOf(h.id);
        h.el.style.transform = `translateX(${(slotXs[slot] - h.x) / scale}px)`;
      }
    };
    const move = ev => {
      const dx = ev.clientX - startX;
      me.style.transform = `translateX(${dx / scale}px)`;
      const cur = homes[startIdx].x + dx;
      let nearest = 0,
        best = Infinity;
      for (let i = 0; i < slotXs.length; i++) {
        const d = Math.abs(slotXs[i] - cur);
        if (d < best) {
          best = d;
          nearest = i;
        }
      }
      if (liveOrder.indexOf(id) !== nearest) {
        liveOrder = order.filter(k => k !== id);
        liveOrder.splice(nearest, 0, id);
        layout();
      }
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      const finalSlot = liveOrder.indexOf(id);
      me.classList.remove('dc-dragging');
      me.style.transform = `translateX(${(slotXs[finalSlot] - homes[startIdx].x) / scale}px)`;
      // After the settle transition, kill transitions + clear transforms +
      // commit the reorder in the same frame so there's no visual snap-back.
      setTimeout(() => {
        for (const h of homes) {
          h.el.style.transition = 'none';
          h.el.style.transform = '';
        }
        if (liveOrder.join('|') !== order.join('|')) onReorder(liveOrder);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          for (const h of homes) h.el.style.transition = '';
        }));
      }, 180);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    ref: ref,
    "data-dc-slot": id,
    style: {
      position: 'relative',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-header",
    "data-omelette-chrome": "",
    style: {
      color: DC.label
    },
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-labelrow"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dc-grip",
    onPointerDown: onGripDown,
    title: "Drag to reorder"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "9",
    height: "13",
    viewBox: "0 0 9 13",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "2",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "6.5",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "2",
    cy: "11",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "7",
    cy: "11",
    r: "1.1"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-labeltext",
    onClick: onFocus,
    title: "Click to focus"
  }, /*#__PURE__*/React.createElement(DCEditable, {
    value: label,
    onChange: onRename,
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 15,
      fontWeight: 500,
      color: DC.label,
      lineHeight: 1
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "dc-btns"
  }, /*#__PURE__*/React.createElement("div", {
    ref: menuRef,
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "dc-kebab",
    title: "More",
    onClick: () => setMenuOpen(o => !o)
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "currentColor"
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "2.5",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "1.1"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "9.5",
    cy: "6",
    r: "1.1"
  }))), menuOpen && /*#__PURE__*/React.createElement("div", {
    className: "dc-menu",
    onPointerDown: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('png')
  }, "Download PNG"), /*#__PURE__*/React.createElement("button", {
    onClick: () => doExport('html')
  }, "Download HTML"), /*#__PURE__*/React.createElement("hr", null), /*#__PURE__*/React.createElement("button", {
    className: "dc-danger",
    onClick: () => {
      if (confirming) {
        setMenuOpen(false);
        onDelete();
      } else setConfirming(true);
    }
  }, confirming ? 'Click again to delete' : 'Delete'))), /*#__PURE__*/React.createElement("button", {
    className: "dc-expand",
    onClick: onFocus,
    title: "Focus"
  }, /*#__PURE__*/React.createElement("svg", {
    width: "12",
    height: "12",
    viewBox: "0 0 12 12",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 1h4v4M5 11H1V7M11 1L7.5 4.5M1 11l3.5-3.5"
  }))))), /*#__PURE__*/React.createElement("div", {
    ref: cardRef,
    className: "dc-card",
    style: {
      borderRadius: 2,
      boxShadow: '0 1px 3px rgba(0,0,0,.08),0 4px 16px rgba(0,0,0,.06)',
      overflow: 'hidden',
      width,
      height,
      background: '#fff',
      ...style
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb',
      fontSize: 13,
      fontFamily: DC.font
    }
  }, id)));
}

// Inline rename — commits on blur or Enter.
function DCEditable({
  value,
  onChange,
  style,
  tag = 'span',
  onClick
}) {
  const T = tag;
  return /*#__PURE__*/React.createElement(T, {
    className: "dc-editable",
    contentEditable: true,
    suppressContentEditableWarning: true,
    onClick: onClick,
    onPointerDown: e => e.stopPropagation(),
    onBlur: e => onChange && onChange(e.currentTarget.textContent),
    onKeyDown: e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        e.currentTarget.blur();
      }
    },
    style: style
  }, value);
}

// ─────────────────────────────────────────────────────────────
// Focus mode — overlay one artboard; ←/→ within section, ↑/↓ across
// sections, Esc or backdrop click to exit.
// ─────────────────────────────────────────────────────────────
function DCFocusOverlay({
  entry,
  sectionMeta,
  sectionOrder
}) {
  const ctx = React.useContext(DCCtx);
  const {
    sectionId,
    artboard
  } = entry;
  const sec = ctx.section(sectionId);
  const meta = sectionMeta[sectionId];
  const peers = meta.slotIds;
  const aid = artboard.props.id ?? artboard.props.label;
  const idx = peers.indexOf(aid);
  const secIdx = sectionOrder.indexOf(sectionId);
  const go = d => {
    const n = peers[(idx + d + peers.length) % peers.length];
    if (n) ctx.setFocus(`${sectionId}/${n}`);
  };
  const goSection = d => {
    // Sections whose artboards are all deleted have slotIds:[] — step past
    // them to the next non-empty section so ↑/↓ doesn't dead-end.
    const n = sectionOrder.length;
    for (let i = 1; i < n; i++) {
      const ns = sectionOrder[((secIdx + d * i) % n + n) % n];
      const first = sectionMeta[ns] && sectionMeta[ns].slotIds[0];
      if (first) {
        ctx.setFocus(`${ns}/${first}`);
        return;
      }
    }
  };
  React.useEffect(() => {
    const k = e => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        go(-1);
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        go(1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        goSection(-1);
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        goSection(1);
      }
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });
  const {
    width = 260,
    height = 480,
    children
  } = artboard.props;
  const [vp, setVp] = React.useState({
    w: window.innerWidth,
    h: window.innerHeight
  });
  React.useEffect(() => {
    const r = () => setVp({
      w: window.innerWidth,
      h: window.innerHeight
    });
    window.addEventListener('resize', r);
    return () => window.removeEventListener('resize', r);
  }, []);
  const scale = Math.max(0.1, Math.min((vp.w - 200) / width, (vp.h - 260) / height, 2));
  const [ddOpen, setDd] = React.useState(false);
  const Arrow = ({
    dir,
    onClick
  }) => /*#__PURE__*/React.createElement("button", {
    onClick: e => {
      e.stopPropagation();
      onClick();
    },
    style: {
      position: 'absolute',
      top: '50%',
      [dir]: 28,
      transform: 'translateY(-50%)',
      border: 'none',
      background: 'rgba(255,255,255,.08)',
      color: 'rgba(255,255,255,.9)',
      width: 44,
      height: 44,
      borderRadius: 22,
      fontSize: 18,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background .15s'
    },
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.18)',
    onMouseLeave: e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'
  }, /*#__PURE__*/React.createElement("svg", {
    width: "18",
    height: "18",
    viewBox: "0 0 18 18",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round"
  }, /*#__PURE__*/React.createElement("path", {
    d: dir === 'left' ? 'M11 3L5 9l6 6' : 'M7 3l6 6-6 6'
  })));

  // Portal to body so position:fixed is the real viewport regardless of any
  // transform on DesignCanvas's ancestors (including the canvas zoom itself).
  return ReactDOM.createPortal(/*#__PURE__*/React.createElement("div", {
    onClick: () => ctx.setFocus(null),
    onWheel: e => e.preventDefault(),
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      background: 'rgba(24,20,16,.6)',
      backdropFilter: 'blur(14px)',
      fontFamily: DC.font,
      color: '#fff'
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 72,
      display: 'flex',
      alignItems: 'flex-start',
      padding: '16px 20px 0',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDd(o => !o),
    style: {
      border: 'none',
      background: 'transparent',
      color: '#fff',
      cursor: 'pointer',
      padding: '6px 8px',
      borderRadius: 6,
      textAlign: 'left',
      fontFamily: 'inherit'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 18,
      fontWeight: 600,
      letterSpacing: -0.3
    }
  }, meta.title), /*#__PURE__*/React.createElement("svg", {
    width: "11",
    height: "11",
    viewBox: "0 0 11 11",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8",
    strokeLinecap: "round",
    style: {
      opacity: .7
    }
  }, /*#__PURE__*/React.createElement("path", {
    d: "M2 4l3.5 3.5L9 4"
  }))), meta.subtitle && /*#__PURE__*/React.createElement("span", {
    style: {
      display: 'block',
      fontSize: 13,
      opacity: .6,
      fontWeight: 400,
      marginTop: 2
    }
  }, meta.subtitle)), ddOpen && /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: '100%',
      left: 0,
      marginTop: 4,
      background: '#2a251f',
      borderRadius: 8,
      boxShadow: '0 8px 32px rgba(0,0,0,.4)',
      padding: 4,
      minWidth: 200,
      zIndex: 10
    }
  }, sectionOrder.filter(sid => sectionMeta[sid].slotIds.length).map(sid => /*#__PURE__*/React.createElement("button", {
    key: sid,
    onClick: () => {
      setDd(false);
      const f = sectionMeta[sid].slotIds[0];
      if (f) ctx.setFocus(`${sid}/${f}`);
    },
    style: {
      display: 'block',
      width: '100%',
      textAlign: 'left',
      border: 'none',
      cursor: 'pointer',
      background: sid === sectionId ? 'rgba(255,255,255,.1)' : 'transparent',
      color: '#fff',
      padding: '8px 12px',
      borderRadius: 5,
      fontSize: 14,
      fontWeight: sid === sectionId ? 600 : 400,
      fontFamily: 'inherit'
    }
  }, sectionMeta[sid].title)))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => ctx.setFocus(null),
    onMouseEnter: e => e.currentTarget.style.background = 'rgba(255,255,255,.12)',
    onMouseLeave: e => e.currentTarget.style.background = 'transparent',
    style: {
      border: 'none',
      background: 'transparent',
      color: 'rgba(255,255,255,.7)',
      width: 32,
      height: 32,
      borderRadius: 16,
      fontSize: 20,
      cursor: 'pointer',
      lineHeight: 1,
      transition: 'background .12s'
    }
  }, "\xD7")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top: 64,
      bottom: 56,
      left: 100,
      right: 100,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: width * scale,
      height: height * scale,
      position: 'relative'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width,
      height,
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      background: '#fff',
      borderRadius: 2,
      overflow: 'hidden',
      boxShadow: '0 20px 80px rgba(0,0,0,.4)'
    }
  }, children || /*#__PURE__*/React.createElement("div", {
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#bbb'
    }
  }, aid))), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      fontSize: 14,
      fontWeight: 500,
      opacity: .85,
      textAlign: 'center'
    }
  }, (sec.labels || {})[aid] ?? artboard.props.label, /*#__PURE__*/React.createElement("span", {
    style: {
      opacity: .5,
      marginLeft: 10,
      fontVariantNumeric: 'tabular-nums'
    }
  }, idx + 1, " / ", peers.length))), /*#__PURE__*/React.createElement(Arrow, {
    dir: "left",
    onClick: () => go(-1)
  }), /*#__PURE__*/React.createElement(Arrow, {
    dir: "right",
    onClick: () => go(1)
  }), /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      position: 'absolute',
      bottom: 20,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: 8
    }
  }, peers.map((p, i) => /*#__PURE__*/React.createElement("button", {
    key: p,
    onClick: () => ctx.setFocus(`${sectionId}/${p}`),
    style: {
      border: 'none',
      padding: 0,
      cursor: 'pointer',
      width: 6,
      height: 6,
      borderRadius: 3,
      background: i === idx ? '#fff' : 'rgba(255,255,255,.3)'
    }
  })))), document.body);
}

// ─────────────────────────────────────────────────────────────
// Post-it — absolute-positioned sticky note
// ─────────────────────────────────────────────────────────────
function DCPostIt({
  children,
  top,
  left,
  right,
  bottom,
  rotate = -2,
  width = 180
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      top,
      left,
      right,
      bottom,
      width,
      background: DC.postitBg,
      padding: '14px 16px',
      fontFamily: '"Comic Sans MS", "Marker Felt", "Segoe Print", cursive',
      fontSize: 14,
      lineHeight: 1.4,
      color: DC.postitText,
      boxShadow: '0 2px 8px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
      transform: `rotate(${rotate}deg)`,
      zIndex: 5
    }
  }, children);
}
Object.assign(window, {
  DesignCanvas,
  DCSection,
  DCArtboard,
  DCPostIt
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "design-canvas.jsx", error: String((e && e.message) || e) }); }

// image-slot.js
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)
/* BEGIN USAGE */
/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */
/* END USAGE */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;
  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE).then(r => r.ok ? r.json() : null).then(j => {
      // Merge: sidecar loses to any in-memory change that raced ahead of
      // the fetch (drop or clear) so neither is clobbered by hydration.
      if (j && typeof j === 'object') {
        const merged = Object.assign({}, j, slots);
        // A framing-only write that raced ahead of hydration must not
        // drop a user image that's only on disk — inherit u from the
        // sidecar for any in-memory entry that lacks one.
        for (const k in slots) {
          if (merged[k] && !merged[k].u && j[k]) {
            merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
          }
        }
        for (const id of tombstones) delete merged[id];
        slots = merged;
      }
      tombstones.clear();
    }).catch(() => {}).then(() => {
      loaded = true;
      subs.forEach(fn => fn());
    });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) {
      saveDirty = true;
      return;
    }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots))).catch(() => {}).then(() => {
      saving = false;
      if (saveDirty) {
        saveDirty = false;
        save();
      }
    });
  }
  const S_MAX = 5;
  const clampS = s => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? {
      u: v,
      s: 1,
      x: 0,
      y: 0
    } : v;
  }
  function setSlot(id, val) {
    if (!id) return;
    if (val) {
      slots[id] = val;
      tombstones.delete(id);
    } else {
      delete slots[id];
      if (!loaded) tombstones.add(id);
    }
    subs.forEach(fn => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save();else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet = ':host{display:inline-block;position:relative;vertical-align:top;' + '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' + '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
  // .frame img (clipped) and .spill (unclipped ghost + handles) share the
  // same left/top/width/height in frame-%, computed by _applyView(), so the
  // inside-mask crop and the outside-mask spill stay pixel-aligned.
  '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' + '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
  // Reframe mode (double-click): the full image spills past the mask. The
  // spill layer is sized to the IMAGE bounds so its corners are where the
  // resize handles belong. The ghost <img> inside is translucent; the real
  // clipped <img> underneath shows the opaque in-mask crop.
  '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' + '  cursor:grab;touch-action:none}' + ':host([data-panning]) .spill{cursor:grabbing}' + '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' + '  pointer-events:none;-webkit-user-drag:none;user-select:none;' + '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' + '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' + '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' + '  transform:translate(-50%,-50%)}' + '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' + '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' + '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' + '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' + ':host([data-reframe]){z-index:10}' + ':host([data-reframe]) .spill{display:block}' + ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' + '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' + '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' + '  cursor:pointer;user-select:none}' + '.empty svg{opacity:.45}' + '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' + '.empty .sub{font-size:11px}' + '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' + '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' + ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' + '  background:rgba(201,100,66,.10)}' + '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' + '  transition:border-color .12s}' + ':host([data-over]) .ring{border-color:#c96442}' + ':host([data-filled]) .ring{display:none}' +
  // Controls sit BELOW the mask (top:100%), absolutely positioned so the
  // author-declared slot height is unaffected. The gap is padding, not a
  // top offset, so the hover target stays contiguous with the frame.
  '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' + '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' + '  white-space:nowrap}' + ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' + '  {opacity:1;pointer-events:auto}' + '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' + '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' + '  backdrop-filter:blur(6px)}' + '.ctl button:hover{background:rgba(0,0,0,.8)}' + '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' + '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';
  const icon = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' + 'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' + '<path d="m21 15-5-5L5 21"/></svg>';
  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }
    constructor() {
      super();
      const root = this.attachShadow({
        mode: 'open'
      });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML = '<style>' + stylesheet + '</style>' + '<div class="frame" part="frame">' + '  <img part="image" alt="" draggable="false" style="display:none">' + '  <div class="empty" part="empty">' + icon + '    <div class="cap"></div>' + '    <div class="sub">or <u>browse files</u></div></div>' + '  <div class="ring" part="ring"></div>' + '</div>' + '<div class="spill">' + '  <img class="ghost" alt="" draggable="false">' + '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' + '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' + '</div>' + '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' + '  <button data-act="clear" title="Remove image">Remove</button></div>' + '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = {
        s: 1,
        x: 0,
        y: 0
      };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', e => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') {
          this._exitReframe(true);
          this._input.click();
        }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null);else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', e => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', e => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1,
          fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1,
            ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0,
            h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2,
            oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0,
            uy = sy * h0 / diag0;
          move = ev => {
            const proj = (ev.clientX - rect.left - ox) * ux + (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = {
            px: e.clientX,
            py: e.clientY,
            x: this._view.x,
            y: this._view.y
          };
          move = ev => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try {
            this._spill.releasePointerCapture(e.pointerId);
          } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', e => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, {
        passive: false
      });
    }
    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }
    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) {
        this._ro.disconnect();
        this._ro = null;
      }
      this._exitReframe(false);
    }
    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = e => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = e => {
        if (e.key === 'Escape') this._exitReframe(true);
      };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }
    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }
    attributeChangedCallback() {
      if (this.shadowRoot) this._render();
    }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) {
          this._depth = 0;
          this.removeAttribute('data-over');
        }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }
    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = {
          u: url,
          s: 1,
          x: 0,
          y: 0
        };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) {
          this._local = val;
          this._render();
        }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }
    _setError(msg) {
      if (this._err) {
        this._err.remove();
        this._err = null;
      }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err';
      d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => {
        if (this._err === d) {
          d.remove();
          this._err = null;
        }
      }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') && (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth,
        ih = this._img.naturalHeight;
      const fw = this.clientWidth,
        fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return {
        iw,
        ih,
        fw,
        fh,
        base: Math.max(fw / iw, fh / ih)
      };
    }
    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }
    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = g.iw * k / g.fw * 100 + '%';
      const h = g.ih * k / g.fh * 100 + '%';
      const l = 50 + this._view.x + '%';
      const t = 50 + this._view.y + '%';
      this._img.style.width = w;
      this._img.style.height = h;
      this._img.style.left = l;
      this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w;
      this._spill.style.height = h;
      this._spill.style.left = l;
      this._spill.style.top = t;
    }
    _commitView() {
      const v = {
        s: this._view.s,
        x: this._view.x,
        y: this._view.y
      };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);else {
        this._local = v;
      }
    }
    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';else if (shape === 'pill') radius = '9999px';else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = stored && stored.u || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }
  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "image-slot.js", error: String((e && e.message) || e) }); }

// lovable/MerchTeaser.tsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* =====================================================================
   MerchTeaser.tsx — The Charlotte Coffee Festival · Merch page
   Drop-in React page for a Lovable (Vite + React) app.

   SETUP (one time):
   1. Put the asset folder in your app's  public/  directory so the files
      live at:  public/merch-assets/img/...  and  public/merch-assets/fonts/...
      (download it from the chat — it's the "merch-assets" folder).
   2. Save this file as  src/pages/MerchTeaser.tsx
   3. Register the route, e.g. in your router:
        <Route path="/merch" element={<MerchTeaser />} />
      (In Lovable you can just paste this in and say
       "add this as a /merch page".)
   4. Set TICKETS_URL below to your real ticketing link.

   Notes:
   - All CSS is injected scoped under ".tccf-merch" so it can't clash with
     the rest of your app. Nothing here touches global <body>/<h1>/<footer>.
   - No external dependencies. Tailwind/shadcn are not required.
   ===================================================================== */

// 👉 Replace with your real ticketing URL (Eventbrite, etc.)
const TICKETS_URL = "#tickets";
const ASSETS = "/merch-assets";
const IMG = `${ASSETS}/img`;
const MERCH_CSS = `
@font-face {
  font-family: "GT Flexa Mono";
  src: url("${ASSETS}/fonts/GT-Flexa-Mono-Regular.woff2") format("woff2"),
       url("${ASSETS}/fonts/GT-Flexa-Mono-Regular.woff") format("woff");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Styrene B";
  src: url("${ASSETS}/fonts/StyreneB-Regular-Web.woff2") format("woff2"),
       url("${ASSETS}/fonts/StyreneB-Regular.otf") format("opentype");
  font-weight: 400; font-style: normal; font-display: swap;
}
@font-face {
  font-family: "Calligri";
  src: url("${ASSETS}/fonts/calligri-bold-italic.ttf") format("truetype");
  font-weight: 700; font-style: italic; font-display: swap;
}

.tccf-merch {
  --tccf-off-white:#F7F6F2; --tccf-crema:#EBE5DB; --tccf-muted:#BAB492; --tccf-forest:#4A4B35;
  --tccf-latte:#746137; --tccf-coral:#AA7050; --tccf-black:#181818; --tccf-blue:#75878B;
  --font-display:"Styrene B","Helvetica Neue",Helvetica,Arial,sans-serif;
  --font-body:"Styrene B","Helvetica Neue",Helvetica,Arial,sans-serif;
  --font-mono:"GT Flexa Mono","JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;
  --font-script:"Calligri","Snell Roundhand",cursive;
  --fs-xs:12px; --fs-sm:14px; --fs-base:16px; --fs-lg:22px; --fs-xl:28px;
  --fs-2xl:36px; --fs-3xl:52px; --fs-4xl:76px; --fs-5xl:112px;
  --lh-tight:0.92; --lh-snug:1.10; --lh-body:1.45;
  --tracking-tight:-0.01em; --tracking-normal:0; --tracking-wide:0.04em; --tracking-stamp:0.12em;
  --s-1:4px; --s-2:8px; --s-3:12px; --s-4:16px; --s-5:24px; --s-6:32px; --s-7:48px; --s-8:64px; --s-9:96px;
  --r-pill:999px; --bw-hair:1px; --bw-rule:2px;
  background:var(--tccf-crema); color:var(--tccf-black); overflow-x:hidden; position:relative;
  font-family:var(--font-body); font-size:var(--fs-base); line-height:var(--lh-body);
  -webkit-font-smoothing:antialiased; text-rendering:optimizeLegibility;
}
.tccf-merch *, .tccf-merch *::before, .tccf-merch *::after { box-sizing:border-box; }
.tccf-merch img { display:block; max-width:100%; }

.tccf-merch h1 { font-family:var(--font-display); font-size:var(--fs-4xl); line-height:var(--lh-tight); letter-spacing:var(--tracking-tight); text-transform:uppercase; font-weight:400; margin:0; }
.tccf-merch h2 { font-family:var(--font-display); font-size:var(--fs-3xl); line-height:var(--lh-snug); letter-spacing:var(--tracking-tight); text-transform:uppercase; font-weight:400; margin:0; }
.tccf-merch p { font-family:var(--font-body); font-size:var(--fs-base); line-height:var(--lh-body); margin:0; }
.tccf-merch a { color:inherit; text-decoration:underline; text-decoration-thickness:1.5px; text-underline-offset:3px; }
.tccf-merch a:hover { text-decoration-thickness:2.5px; }
.tccf-merch small { font-size:var(--fs-sm); line-height:var(--lh-body); }
.tccf-merch .eyebrow { font-family:var(--font-mono); font-size:var(--fs-xs); text-transform:uppercase; letter-spacing:var(--tracking-stamp); }
.tccf-merch .script { font-family:var(--font-script); font-style:italic; font-weight:700; text-transform:none; letter-spacing:0; }
.tccf-merch .lede { font-family:var(--font-body); font-size:var(--fs-lg); line-height:var(--lh-body); letter-spacing:var(--tracking-normal); }
.tccf-merch .mono { font-family:var(--font-mono); font-size:0.92em; letter-spacing:0; }

.tccf-merch .wrap { max-width:1240px; margin:0 auto; padding:0 clamp(24px, 5vw, 72px); }

.tccf-merch .grain::after {
  content:""; position:absolute; inset:0; z-index:4; pointer-events:none; opacity:0.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E");
}

.tccf-merch .topbar { position:relative; z-index:3; display:flex; align-items:center; justify-content:space-between; padding:var(--s-4) clamp(24px, 5vw, 72px); border-bottom:var(--bw-hair) solid var(--tccf-black); }
.tccf-merch .topbar img { height:30px; }
.tccf-merch .topbar .nav { display:flex; gap:var(--s-5); align-items:center; }
.tccf-merch .topbar .nav span { font-family:var(--font-mono); font-size:11px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-latte); }
.tccf-merch .topbar .pill { font-family:var(--font-mono); font-size:11px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; border:var(--bw-hair) solid var(--tccf-black); border-radius:var(--r-pill); padding:7px 16px; color:var(--tccf-black); text-decoration:none; }

.tccf-merch .hero { position:relative; border-bottom:var(--bw-rule) solid var(--tccf-black); overflow:hidden; }
.tccf-merch .hero .wrap { display:grid; grid-template-columns:1.05fr 1fr; gap:var(--s-7); align-items:center; min-height:80vh; padding-top:var(--s-8); padding-bottom:var(--s-8); }
.tccf-merch .hero-copy .eyebrow { color:var(--tccf-coral); }
.tccf-merch .hero-copy .script { display:block; font-size:var(--fs-2xl); line-height:1; color:var(--tccf-latte); margin:var(--s-5) 0 var(--s-1); }
.tccf-merch .hero-copy h1 { margin:0; font-size:clamp(56px, 9vw, 116px); line-height:0.9; letter-spacing:var(--tracking-tight); }
.tccf-merch .hero-copy .lede { max-width:40ch; margin:var(--s-5) 0 var(--s-6); color:var(--tccf-latte); }
.tccf-merch .hero-actions { display:flex; gap:var(--s-4); align-items:center; flex-wrap:wrap; }
.tccf-merch .btn { font-family:var(--font-display); text-transform:uppercase; letter-spacing:var(--tracking-wide); font-size:var(--fs-sm); background:var(--tccf-black); color:var(--tccf-crema); border:var(--bw-rule) solid var(--tccf-black); padding:14px 28px; cursor:pointer; transition:all 160ms cubic-bezier(0.2,0.7,0.2,1); text-decoration:none; display:inline-block; }
.tccf-merch .btn:hover { background:transparent; color:var(--tccf-black); }
.tccf-merch .btn--ghost { background:transparent; color:var(--tccf-black); }
.tccf-merch .btn--ghost:hover { background:var(--tccf-black); color:var(--tccf-crema); }

.tccf-merch .hero-visual { position:relative; display:grid; place-items:center; min-height:460px; }
.tccf-merch .hero-visual .disc { position:absolute; width:104%; aspect-ratio:1; border-radius:50%; background:var(--tccf-muted); opacity:0.26; z-index:0; -webkit-mask:radial-gradient(circle, #000 60%, transparent 71%); mask:radial-gradient(circle, #000 60%, transparent 71%); }
.tccf-merch .hero-visual .photo-frame { position:relative; z-index:1; width:100%; max-width:520px; background:var(--tccf-off-white); border:var(--bw-rule) solid var(--tccf-black); padding:12px 12px 0; transform:rotate(-1.6deg); box-shadow:0 34px 46px rgba(20,18,14,0.30); }
.tccf-merch .hero-visual .photo-frame img { width:100%; display:block; }
.tccf-merch .hero-visual .photo-frame .cap { display:flex; align-items:baseline; justify-content:space-between; gap:var(--s-4); padding:12px 4px 14px; font-family:var(--font-mono); font-size:10px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-latte); }
.tccf-merch .hero-visual .photo-frame .cap b { color:var(--tccf-black); font-weight:400; }

.tccf-merch .marquee { background:var(--tccf-black); color:var(--tccf-crema); overflow:hidden; border-bottom:var(--bw-rule) solid var(--tccf-black); }
.tccf-merch .marquee .track { display:flex; gap:var(--s-6); white-space:nowrap; padding:var(--s-4) 0; animation:tccfMarquee 26s linear infinite; width:max-content; }
.tccf-merch .marquee span { font-family:var(--font-display); text-transform:uppercase; font-size:var(--fs-lg); letter-spacing:var(--tracking-wide); display:inline-flex; align-items:center; gap:var(--s-6); }
.tccf-merch .marquee b { color:var(--tccf-muted); font-weight:400; }
@keyframes tccfMarquee { to { transform:translateX(-50%); } }

.tccf-merch .details { border-bottom:var(--bw-rule) solid var(--tccf-black); background:var(--tccf-off-white); }
.tccf-merch .details .wrap { display:grid; grid-template-columns:repeat(3, 1fr); gap:0; padding-left:0; padding-right:0; }
.tccf-merch .details .cell { padding:var(--s-6) clamp(24px, 4vw, 48px); border-right:var(--bw-hair) solid var(--tccf-black); display:flex; flex-direction:column; gap:var(--s-2); }
.tccf-merch .details .cell:last-child { border-right:none; }
.tccf-merch .details .k { font-family:var(--font-mono); font-size:10px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-coral); }
.tccf-merch .details .v { font-family:var(--font-display); text-transform:uppercase; font-size:clamp(22px, 2.4vw, 32px); line-height:1; letter-spacing:0.01em; }
.tccf-merch .details .s { font-family:var(--font-mono); font-size:11px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-latte); }

.tccf-merch .drop { padding:clamp(56px, 9vh, 120px) 0; }
.tccf-merch .drop-head { display:flex; align-items:flex-end; justify-content:space-between; gap:var(--s-5); margin-bottom:var(--s-7); flex-wrap:wrap; }
.tccf-merch .drop-head .eyebrow { color:var(--tccf-coral); display:block; margin-bottom:var(--s-2); }
.tccf-merch .drop-head h2 { margin:0; font-size:clamp(36px, 5vw, 64px); }
.tccf-merch .drop-head p { font-family:var(--font-mono); font-size:12px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-latte); margin:0; }

.tccf-merch .lookbook { display:grid; grid-template-columns:repeat(12, 1fr); gap:var(--s-5); }
.tccf-merch .item { position:relative; border:var(--bw-hair) solid var(--tccf-black); background:var(--tccf-off-white); overflow:hidden; display:flex; flex-direction:column; }
.tccf-merch .item .frame { position:relative; overflow:hidden; aspect-ratio:4 / 5; }
.tccf-merch .item .frame img { width:100%; height:100%; object-fit:cover; filter:saturate(0.96) contrast(1.03); transition:transform 600ms cubic-bezier(0.2,0.7,0.2,1); }
.tccf-merch .item:hover .frame img { transform:scale(1.04); }
.tccf-merch .item .meta { padding:var(--s-4) var(--s-5) var(--s-5); border-top:var(--bw-hair) solid var(--tccf-black); display:flex; flex-direction:column; gap:4px; }
.tccf-merch .item .meta .n { font-family:var(--font-display); text-transform:uppercase; font-size:var(--fs-lg); line-height:1; letter-spacing:0.01em; }
.tccf-merch .item .meta .d { font-family:var(--font-mono); font-size:11px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-latte); }
.tccf-merch .item .meta .access { font-family:var(--font-mono); font-size:11px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-coral); margin-top:var(--s-2); }

.tccf-merch .col-6 { grid-column:span 6; }
.tccf-merch .item--wide .frame { aspect-ratio:16 / 12; }

.tccf-merch .signup { background:var(--tccf-forest); color:var(--tccf-crema); border-top:var(--bw-rule) solid var(--tccf-black); border-bottom:var(--bw-rule) solid var(--tccf-black); }
.tccf-merch .signup .wrap { padding:clamp(56px, 9vh, 110px) clamp(24px,5vw,72px); display:grid; grid-template-columns:1.1fr 1fr; gap:var(--s-7); align-items:center; }
.tccf-merch .signup .eyebrow { color:var(--tccf-muted); }
.tccf-merch .signup h2 { margin:var(--s-3) 0 var(--s-3); font-size:clamp(40px, 6vw, 80px); line-height:0.92; color:var(--tccf-off-white); }
.tccf-merch .signup .script { font-family:var(--font-script); font-style:italic; font-weight:700; text-transform:none; color:var(--tccf-muted); }
.tccf-merch .signup p { color:rgba(235,229,219,0.78); max-width:38ch; margin:0; }
.tccf-merch .signup .fest-facts { display:flex; gap:var(--s-7); margin-top:var(--s-6); flex-wrap:wrap; }
.tccf-merch .signup .fest-facts .k { display:block; font-family:var(--font-mono); font-size:10px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-muted); margin-bottom:6px; }
.tccf-merch .signup .fest-facts .v { display:block; font-family:var(--font-display); text-transform:uppercase; font-size:var(--fs-lg); line-height:1.05; color:var(--tccf-off-white); }
.tccf-merch .signup small { display:block; margin-top:var(--s-5); font-family:var(--font-mono); font-size:10px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:rgba(235,229,219,0.55); }
.tccf-merch .signup-mark { display:grid; place-items:center; }
.tccf-merch .signup-mark img { width:min(280px, 70%); opacity:0.96; }

.tccf-merch .site-foot { padding:var(--s-7) 0; }
.tccf-merch .site-foot .wrap { display:flex; align-items:center; justify-content:space-between; gap:var(--s-5); flex-wrap:wrap; }
.tccf-merch .site-foot img { height:34px; }
.tccf-merch .site-foot .mono { font-family:var(--font-mono); font-size:11px; letter-spacing:var(--tracking-stamp); text-transform:uppercase; color:var(--tccf-latte); }

@media (max-width: 860px) {
  .tccf-merch .hero .wrap { grid-template-columns:1fr; gap:var(--s-6); min-height:0; }
  .tccf-merch .hero-visual { order:-1; }
  .tccf-merch .signup .wrap { grid-template-columns:1fr; }
  .tccf-merch .signup-mark { display:none; }
  .tccf-merch .col-6 { grid-column:span 6; }
  .tccf-merch .topbar .nav span { display:none; }
  .tccf-merch .details .wrap { grid-template-columns:1fr; }
  .tccf-merch .details .cell { border-right:none; border-bottom:var(--bw-hair) solid var(--tccf-black); }
  .tccf-merch .details .cell:last-child { border-bottom:none; }
}
@media (max-width: 560px) {
  .tccf-merch .col-6 { grid-column:span 12; }
}
`;
function MerchTeaser() {
  const isExternal = /^https?:/.test(TICKETS_URL);
  const ticketLinkProps = isExternal ? {
    href: TICKETS_URL,
    target: "_blank",
    rel: "noopener noreferrer"
  } : {
    href: TICKETS_URL
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "tccf-merch"
  }, /*#__PURE__*/React.createElement("style", null, MERCH_CSS), /*#__PURE__*/React.createElement("div", {
    className: "topbar"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/logo-primary-black.png`,
    alt: "The Charlotte Coffee Festival"
  }), /*#__PURE__*/React.createElement("div", {
    className: "nav"
  }, /*#__PURE__*/React.createElement("span", null, "Sept 12 \xB7 Lenny Boy Brewing"), /*#__PURE__*/React.createElement("a", _extends({
    className: "pill"
  }, ticketLinkProps), "Tickets live now \u2192"))), /*#__PURE__*/React.createElement("section", {
    className: "hero grain"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "hero-copy"
  }, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "The Charlotte Coffee Festival \xB7 Merch"), /*#__PURE__*/React.createElement("span", {
    className: "script"
  }, "A first look at"), /*#__PURE__*/React.createElement("h1", null, "THE", /*#__PURE__*/React.createElement("br", null), "MERCH", /*#__PURE__*/React.createElement("br", null), "DROP"), /*#__PURE__*/React.createElement("p", {
    className: "lede"
  }, "Cups, totes & tees \u2014 all of it lives at the festival. A celebration of coffee & the people that shape it."), /*#__PURE__*/React.createElement("div", {
    className: "hero-actions"
  }, /*#__PURE__*/React.createElement("a", _extends({
    className: "btn"
  }, ticketLinkProps), "Get tickets"), /*#__PURE__*/React.createElement("a", {
    className: "btn btn--ghost",
    href: "#lookbook"
  }, "See the merch \u2193"))), /*#__PURE__*/React.createElement("div", {
    className: "hero-visual"
  }, /*#__PURE__*/React.createElement("div", {
    className: "disc"
  }), /*#__PURE__*/React.createElement("figure", {
    className: "photo-frame"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/hero-tees-kitchen.png`,
    alt: "Two baristas wearing the navy and white Charlotte Coffee Festival tees, back print, in a kitchen"
  }), /*#__PURE__*/React.createElement("figcaption", {
    className: "cap"
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("b", null, "Festival Tees"), " \xB7 Navy & White"), /*#__PURE__*/React.createElement("span", null, "Back print")))))), /*#__PURE__*/React.createElement("section", {
    className: "details"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Where"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, "Lenny Boy Brewing Co."), /*#__PURE__*/React.createElement("span", {
    className: "s"
  }, "Charlotte, NC")), /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "When"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, "Sat, Sept 12"), /*#__PURE__*/React.createElement("span", {
    className: "s"
  }, "9 AM \u2013 2 PM")), /*#__PURE__*/React.createElement("div", {
    className: "cell"
  }, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Admission"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, "Tickets Live Now"), /*#__PURE__*/React.createElement("span", {
    className: "s"
  }, "VIP \xB7 Early GA \xB7 GA")))), /*#__PURE__*/React.createElement("div", {
    className: "marquee",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("div", {
    className: "track"
  }, /*#__PURE__*/React.createElement("span", null, "Coffee ", /*#__PURE__*/React.createElement("b", null, "&"), " Community"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Lenny Boy Brewing"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Sat Sept 12 ", /*#__PURE__*/React.createElement("b", null, "\xB7"), " 9\u20132"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Tickets Live Now"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Coffee ", /*#__PURE__*/React.createElement("b", null, "&"), " Community"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Lenny Boy Brewing"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Sat Sept 12 ", /*#__PURE__*/React.createElement("b", null, "\xB7"), " 9\u20132"), /*#__PURE__*/React.createElement("span", null, "\xB7"), /*#__PURE__*/React.createElement("span", null, "Tickets Live Now"), /*#__PURE__*/React.createElement("span", null, "\xB7"))), /*#__PURE__*/React.createElement("section", {
    className: "drop",
    id: "lookbook"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "drop-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "At the festival"), /*#__PURE__*/React.createElement("h2", null, "What's at the fest.")), /*#__PURE__*/React.createElement("p", null, "04 pieces \xB7 All at the festival")), /*#__PURE__*/React.createElement("div", {
    className: "lookbook"
  }, /*#__PURE__*/React.createElement("article", {
    className: "item col-6 item--wide"
  }, /*#__PURE__*/React.createElement("div", {
    className: "frame"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/photo-tote.jpg`,
    alt: "TCCF natural canvas tote bag"
  })), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "Canvas Tote"), /*#__PURE__*/React.createElement("span", {
    className: "d"
  }, "Natural cotton \xB7 tagline badge \xB7 presented by Night Swim"), /*#__PURE__*/React.createElement("span", {
    className: "access"
  }, "Included with VIP & Early GA admission"))), /*#__PURE__*/React.createElement("article", {
    className: "item col-6 item--wide"
  }, /*#__PURE__*/React.createElement("div", {
    className: "frame"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/photo-cup.jpg`,
    alt: "TCCF 4 oz kraft cup",
    style: {
      objectPosition: "center 42%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "4 oz Cup"), /*#__PURE__*/React.createElement("span", {
    className: "d"
  }, "Single-wall kraft \xB7 crown crest \xB7 black lid"), /*#__PURE__*/React.createElement("span", {
    className: "access"
  }, "Free coffee samples for every attendee"))), /*#__PURE__*/React.createElement("article", {
    className: "item col-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "frame"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/photo-tee-navy-front.jpg`,
    alt: "Navy festival tee, front",
    style: {
      objectPosition: "center 38%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "Festival Tee \u2014 Navy"), /*#__PURE__*/React.createElement("span", {
    className: "d"
  }, "Oversized cotton \xB7 left-chest stamp \xB7 back wordmark"), /*#__PURE__*/React.createElement("span", {
    className: "access"
  }, "$20 at the festival"))), /*#__PURE__*/React.createElement("article", {
    className: "item col-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "frame"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/photo-tee-white-back.jpg`,
    alt: "White festival tee, back",
    style: {
      objectPosition: "center 40%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "meta"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "Festival Tee \u2014 White"), /*#__PURE__*/React.createElement("span", {
    className: "d"
  }, "Oversized cotton \xB7 left-chest stamp \xB7 back wordmark"), /*#__PURE__*/React.createElement("span", {
    className: "access"
  }, "$20 at the festival")))))), /*#__PURE__*/React.createElement("section", {
    className: "signup",
    id: "tickets"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "eyebrow"
  }, "Come hang with us"), /*#__PURE__*/React.createElement("h2", null, "See you at ", /*#__PURE__*/React.createElement("span", {
    className: "script"
  }, "the"), " fest."), /*#__PURE__*/React.createElement("p", null, "No online shop \u2014 the cups, the tote & the tees all live at the festival. One morning only at Lenny Boy Brewing."), /*#__PURE__*/React.createElement("div", {
    className: "fest-facts"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Canvas Tote"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, "VIP & Early GA")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Festival Tees"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, "$20 each")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "k"
  }, "Coffee Samples"), /*#__PURE__*/React.createElement("span", {
    className: "v"
  }, "Free for all"))), /*#__PURE__*/React.createElement("div", {
    className: "hero-actions",
    style: {
      marginTop: "var(--s-6)"
    }
  }, /*#__PURE__*/React.createElement("a", _extends({
    className: "btn"
  }, ticketLinkProps, {
    style: {
      background: "var(--tccf-crema)",
      color: "var(--tccf-black)",
      borderColor: "var(--tccf-crema)"
    }
  }), "Tickets live now \u2192")), /*#__PURE__*/React.createElement("small", null, "Sat, Sept 12 \xB7 9 AM \u2013 2 PM \xB7 Lenny Boy Brewing Co., Charlotte NC")), /*#__PURE__*/React.createElement("div", {
    className: "signup-mark"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/lockup-crema.png`,
    alt: "TCCF stamp"
  })))), /*#__PURE__*/React.createElement("footer", {
    className: "site-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wrap"
  }, /*#__PURE__*/React.createElement("img", {
    src: `${IMG}/logo-primary-black.png`,
    alt: "The Charlotte Coffee Festival"
  }), /*#__PURE__*/React.createElement("span", {
    className: "mono"
  }, "\xA9 2026 TCCF \xB7 A celebration of coffee & the people that shape it"))));
}
Object.assign(__ds_scope, { MerchTeaser });
})(); } catch (e) { __ds_ns.__errors.push({ path: "lovable/MerchTeaser.tsx", error: String((e && e.message) || e) }); }

// poster-100days.jsx
try { (() => {
/* global React */
const {
  useRef,
  useEffect
} = React;

/* Inject shared poster CSS once */
const POSTER_CSS = `
.pst-mount { position:relative; overflow:hidden; background:#11120c; }
.pst-stage { position:absolute; top:0; left:0; width:1080px; height:1920px; transform-origin:top left; }

.pst { position:absolute; inset:0; overflow:hidden; font-family:var(--font-display);
  background:var(--pst-bg); color:var(--pst-ink); }
.pst::after { content:""; position:absolute; inset:0; pointer-events:none; opacity:.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.pst::before { content:""; position:absolute; inset:0; pointer-events:none; box-shadow:var(--pst-vig); }

.pst-frame { position:absolute; inset:54px; border:2px solid var(--pst-line);
  display:flex; flex-direction:column; padding:60px 72px 56px; z-index:2; }

.pst-reg { position:absolute; width:26px; height:26px; color:var(--pst-line2); }
.pst-reg::before,.pst-reg::after{content:"";position:absolute;background:currentColor;}
.pst-reg::before{left:50%;top:0;bottom:0;width:1.5px;transform:translateX(-50%);}
.pst-reg::after{top:50%;left:0;right:0;height:1.5px;transform:translateY(-50%);}
.pst-reg.tl{top:-13px;left:-13px}.pst-reg.tr{top:-13px;right:-13px}
.pst-reg.bl{bottom:-13px;left:-13px}.pst-reg.br{bottom:-13px;right:-13px}

.pst-meta { display:flex; justify-content:space-between; align-items:baseline;
  font-family:var(--font-mono); font-size:21px; letter-spacing:.12em;
  text-transform:uppercase; color:var(--pst-ink-soft); }
.pst-meta .dot { color:var(--tccf-coral); }

/* centered core fills the space between meta and credit */
.pst-core { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; }

.pst-crown { width:136px; height:auto; display:block; filter:drop-shadow(0 6px 14px rgba(0,0,0,.3)); }
.pst-only { margin-top:22px; font-family:var(--font-script); font-style:italic; font-weight:700;
  font-size:60px; color:var(--pst-muted); line-height:1; }

.pst-100 { font-family:var(--font-display); font-weight:400; font-size:500px; line-height:.82;
  letter-spacing:-.04em; color:var(--pst-ink); text-shadow:0 10px 40px rgba(0,0,0,.22); margin-top:-6px; }
.pst-days { display:flex; align-items:center; justify-content:center; gap:28px; margin-top:18px; }
.pst-days .rule { height:2px; flex:0 0 80px; background:var(--pst-line2); }
.pst-days .word { font-family:var(--font-display); text-transform:uppercase; font-size:64px;
  letter-spacing:.14em; color:var(--pst-ink); white-space:nowrap; }
.pst-until { margin-top:34px; font-family:var(--font-mono); font-size:24px; letter-spacing:.3em;
  text-transform:uppercase; color:var(--pst-ink-faint); }

.pst-the { margin-top:30px; font-family:var(--font-script); font-style:italic; font-weight:700;
  font-size:78px; line-height:.7; color:var(--tccf-coral); }
.pst-wm { margin-top:8px; font-family:var(--font-display); text-transform:uppercase; font-weight:400;
  font-size:112px; line-height:.92; letter-spacing:.005em; color:var(--pst-ink); text-align:center; }
.pst-wm .row { display:flex; align-items:center; justify-content:center; gap:22px; }
.pst-wm .rings { display:inline-flex; gap:10px; }
.pst-wm .rings b { display:inline-grid; place-items:center; width:62px; height:62px;
  border:3px solid var(--pst-ink); border-radius:50%; font-size:29px; font-weight:400; }

.pst-seal { width:560px; height:auto; margin-top:30px; }

.pst-credit { display:flex; align-items:center; justify-content:center; gap:54px;
  padding-top:30px; border-top:2px solid var(--pst-line2); }
.pst-credit .col { display:flex; flex-direction:column; align-items:center; gap:14px; }
.pst-credit .lab { font-family:var(--font-mono); font-size:18px; letter-spacing:.12em;
  text-transform:uppercase; color:var(--pst-ink-faint); }
.pst-credit .ns { height:42px; width:auto; }
.pst-credit .mz { height:48px; width:auto; }
.pst-credit .divider { width:2px; align-self:stretch; background:var(--pst-line2); }
`;
const COLORWAYS = {
  forest: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #5a5b41 0%, #4A4B35 42%, #3b3c2b 100%)',
    ink: '#EBE5DB',
    inkSoft: 'rgba(235,229,219,.82)',
    inkFaint: 'rgba(235,229,219,.62)',
    muted: '#BAB492',
    line: 'rgba(235,229,219,.5)',
    line2: 'rgba(235,229,219,.5)',
    vig: 'inset 0 0 320px 60px rgba(10,11,6,.45)',
    crown: 'export-assets/crown-crema.png',
    ns: 'export-assets/ns-crema.png',
    seal: 'export-assets/seal-crema.png',
    mz: 'export-assets/maizly-crema.png'
  },
  crema: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #F7F6F2 0%, #EBE5DB 55%, #ded7c9 100%)',
    ink: '#181818',
    inkSoft: 'rgba(24,24,24,.72)',
    inkFaint: 'rgba(24,24,24,.5)',
    muted: '#746137',
    line: 'rgba(24,24,24,.22)',
    line2: 'rgba(24,24,24,.22)',
    vig: 'inset 0 0 280px 50px rgba(120,110,80,.14)',
    crown: 'export-assets/crown-black.png',
    ns: 'export-assets/ns-black.png',
    seal: 'export-assets/seal-black.png',
    mz: 'export-assets/maizly-black.png'
  },
  black: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #2a2a26 0%, #181818 48%, #050505 100%)',
    ink: '#EBE5DB',
    inkSoft: 'rgba(235,229,219,.8)',
    inkFaint: 'rgba(235,229,219,.6)',
    muted: '#BAB492',
    line: 'rgba(235,229,219,.42)',
    line2: 'rgba(235,229,219,.42)',
    vig: 'inset 0 0 320px 70px rgba(0,0,0,.6)',
    crown: 'export-assets/crown-crema.png',
    ns: 'export-assets/ns-crema.png',
    seal: 'export-assets/seal-black.png',
    mz: 'export-assets/maizly-crema.png'
  }
};
function Poster({
  w = 460,
  colorway = 'forest',
  layout = 'stack',
  date = '09.12.2026'
}) {
  const c = COLORWAYS[colorway];
  const scale = w / 1080;
  const h = Math.round(1920 * scale);
  const vars = {
    '--pst-bg': c.bg,
    '--pst-ink': c.ink,
    '--pst-ink-soft': c.inkSoft,
    '--pst-ink-faint': c.inkFaint,
    '--pst-muted': c.muted,
    '--pst-line': c.line,
    '--pst-line2': c.line2,
    '--pst-vig': c.vig
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "pst-mount",
    style: {
      width: w + 'px',
      height: h + 'px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pst-stage",
    style: {
      transform: `scale(${scale})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pst",
    style: vars
  }, /*#__PURE__*/React.createElement("div", {
    className: "pst-frame"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pst-reg tl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pst-reg tr"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pst-reg bl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pst-reg br"
  }), /*#__PURE__*/React.createElement("div", {
    className: "pst-meta"
  }, /*#__PURE__*/React.createElement("span", null, "Lenny Boy Brewery"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\u25CF"), "\xA0 ", date)), /*#__PURE__*/React.createElement("div", {
    className: "pst-core"
  }, /*#__PURE__*/React.createElement("img", {
    className: "pst-crown",
    src: c.crown,
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "pst-only"
  }, "only"), /*#__PURE__*/React.createElement("div", {
    className: "pst-100"
  }, "100"), /*#__PURE__*/React.createElement("div", {
    className: "pst-days"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "word"
  }, "Days to go"), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  })), /*#__PURE__*/React.createElement("div", {
    className: "pst-until"
  }, "until"), layout === 'seal' ? /*#__PURE__*/React.createElement("img", {
    className: "pst-seal",
    src: c.seal,
    alt: "The Charlotte Coffee Festival"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pst-the"
  }, "The"), /*#__PURE__*/React.createElement("div", {
    className: "pst-wm"
  }, /*#__PURE__*/React.createElement("span", null, "Charlotte"), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rings"
  }, /*#__PURE__*/React.createElement("b", null, "T"), /*#__PURE__*/React.createElement("b", null, "C")), /*#__PURE__*/React.createElement("span", null, "Coffee"), /*#__PURE__*/React.createElement("span", {
    className: "rings"
  }, /*#__PURE__*/React.createElement("b", null, "C"), /*#__PURE__*/React.createElement("b", null, "F"))), /*#__PURE__*/React.createElement("span", null, "Festival")))), /*#__PURE__*/React.createElement("div", {
    className: "pst-credit"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lab"
  }, "Presented by"), /*#__PURE__*/React.createElement("img", {
    className: "ns",
    src: c.ns,
    alt: "Night Swim Coffee"
  })), /*#__PURE__*/React.createElement("span", {
    className: "divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lab"
  }, "Sponsored by"), /*#__PURE__*/React.createElement("img", {
    className: "mz",
    src: c.mz,
    alt: "ma\xEFzly \u2014 for all"
  })))))));
}
(function injectPosterCSS() {
  if (document.getElementById('poster-css')) return;
  const s = document.createElement('style');
  s.id = 'poster-css';
  s.textContent = POSTER_CSS;
  document.head.appendChild(s);
})();
window.Poster = Poster;
})(); } catch (e) { __ds_ns.__errors.push({ path: "poster-100days.jsx", error: String((e && e.message) || e) }); }

// poster.jsx
try { (() => {
/* global React */
const {
  useRef,
  useEffect
} = React;

/* Inject shared poster CSS once */
const POSTER_CSS = `
.pst-mount { position:relative; overflow:hidden; background:#11120c; }
.pst-stage { position:absolute; top:0; left:0; width:1080px; height:1920px; transform-origin:top left; }

.pst { position:absolute; inset:0; overflow:hidden; font-family:var(--font-display);
  background:var(--pst-bg); color:var(--pst-ink); }
.pst::after { content:""; position:absolute; inset:0; pointer-events:none; opacity:.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
.pst::before { content:""; position:absolute; inset:0; pointer-events:none; box-shadow:var(--pst-vig); }

.pst-frame { position:absolute; inset:54px; border:2px solid var(--pst-line);
  display:flex; flex-direction:column; padding:58px 72px 54px; z-index:2; }

.pst-reg { position:absolute; width:26px; height:26px; color:var(--pst-line2); }
.pst-reg::before,.pst-reg::after{content:"";position:absolute;background:currentColor;}
.pst-reg::before{left:50%;top:0;bottom:0;width:1.5px;transform:translateX(-50%);}
.pst-reg::after{top:50%;left:0;right:0;height:1.5px;transform:translateY(-50%);}
.pst-reg.tl{top:-13px;left:-13px}.pst-reg.tr{top:-13px;right:-13px}
.pst-reg.bl{bottom:-13px;left:-13px}.pst-reg.br{bottom:-13px;right:-13px}

.pst-meta { display:flex; justify-content:space-between; align-items:baseline;
  font-family:var(--font-mono); font-size:21px; letter-spacing:.12em;
  text-transform:uppercase; color:var(--pst-ink-soft); }
.pst-meta .dot { color:var(--pst-accent); }

/* centered core fills the space between meta and credit */
.pst-core { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; }

.pst-crown { width:120px; height:auto; display:block; filter:drop-shadow(0 6px 14px rgba(0,0,0,.3)); }

.pst-badge { margin-top:26px; display:inline-flex; align-items:center; gap:18px;
  padding:11px 30px 12px; border:1.5px solid var(--pst-accent); border-radius:999px;
  font-family:var(--font-mono); font-size:19px; letter-spacing:.40em; text-transform:uppercase;
  color:var(--pst-accent); }
.pst-badge .gem { width:7px; height:7px; transform:rotate(45deg); background:var(--pst-accent); }

.pst-headline { margin-top:30px; font-family:var(--font-display); text-transform:uppercase;
  font-weight:400; font-size:52px; letter-spacing:.04em; line-height:1; color:var(--pst-ink);
  text-align:center; }

.pst-hero-text { font-family:var(--font-display); font-weight:400; font-size:152px; line-height:.88;
  letter-spacing:.03em; margin-top:14px; text-align:center; text-transform:uppercase;
  background:var(--pst-accent-grad); -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent;
  filter:drop-shadow(0 10px 30px rgba(0,0,0,.28)); }

.pst-only { margin-top:30px; font-family:var(--font-script); font-style:italic; font-weight:700;
  font-size:62px; color:var(--pst-accent); line-height:.8; }

.pst-25 { font-family:var(--font-display); font-weight:400; font-size:500px; line-height:.82;
  letter-spacing:-.04em; margin-top:-4px;
  background:var(--pst-accent-grad); -webkit-background-clip:text; background-clip:text;
  -webkit-text-fill-color:transparent; color:transparent;
  filter:drop-shadow(0 10px 30px rgba(0,0,0,.28)); }

.pst-remain { display:flex; align-items:center; justify-content:center; gap:26px; margin-top:14px; }
.pst-remain .rule { height:1.5px; flex:0 0 56px; background:var(--pst-line2); }
.pst-remain .word { font-family:var(--font-display); text-transform:uppercase; font-size:42px;
  letter-spacing:.16em; color:var(--pst-ink); white-space:nowrap; }

.pst-the { margin-top:46px; font-family:var(--font-script); font-style:italic; font-weight:700;
  font-size:70px; line-height:.7; color:var(--pst-accent); }
.pst-wm { margin-top:8px; font-family:var(--font-display); text-transform:uppercase; font-weight:400;
  font-size:104px; line-height:.92; letter-spacing:.005em; color:var(--pst-ink); text-align:center; }
.pst-wm .row { display:flex; align-items:center; justify-content:center; gap:22px; }
.pst-wm .rings { display:inline-flex; gap:10px; }
.pst-wm .rings b { display:inline-grid; place-items:center; width:58px; height:58px;
  border:3px solid var(--pst-ink); border-radius:50%; font-size:27px; font-weight:400; }

.pst-seal { width:520px; height:auto; margin-top:44px; }

.pst-credit { display:flex; align-items:center; justify-content:center; gap:54px;
  padding-top:28px; border-top:2px solid var(--pst-line2); }
.pst-credit .col { display:flex; flex-direction:column; align-items:center; gap:14px; }
.pst-credit .lab { font-family:var(--font-mono); font-size:18px; letter-spacing:.12em;
  text-transform:uppercase; color:var(--pst-ink-faint); }
.pst-credit .ns { height:42px; width:auto; }
.pst-credit .mz { height:48px; width:auto; }
.pst-credit .divider { width:2px; align-self:stretch; background:var(--pst-line2); }
`;
const COLORWAYS = {
  forest: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #5a5b41 0%, #4A4B35 42%, #3b3c2b 100%)',
    ink: '#EBE5DB',
    inkSoft: 'rgba(235,229,219,.82)',
    inkFaint: 'rgba(235,229,219,.62)',
    muted: '#BAB492',
    line: 'rgba(235,229,219,.5)',
    line2: 'rgba(235,229,219,.5)',
    vig: 'inset 0 0 320px 60px rgba(10,11,6,.45)',
    crown: 'export-assets/crown-crema.png',
    ns: 'export-assets/ns-crema.png',
    seal: 'export-assets/seal-crema.png',
    mz: 'export-assets/maizly-crema.png'
  },
  crema: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #F7F6F2 0%, #EBE5DB 55%, #ded7c9 100%)',
    ink: '#181818',
    inkSoft: 'rgba(24,24,24,.72)',
    inkFaint: 'rgba(24,24,24,.5)',
    muted: '#746137',
    line: 'rgba(24,24,24,.22)',
    line2: 'rgba(24,24,24,.22)',
    vig: 'inset 0 0 280px 50px rgba(120,110,80,.14)',
    crown: 'export-assets/crown-black.png',
    ns: 'export-assets/ns-black.png',
    seal: 'export-assets/seal-black.png',
    mz: 'export-assets/maizly-black.png'
  },
  black: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #2a2a26 0%, #181818 48%, #050505 100%)',
    ink: '#EBE5DB',
    inkSoft: 'rgba(235,229,219,.8)',
    inkFaint: 'rgba(235,229,219,.6)',
    muted: '#BAB492',
    line: 'rgba(235,229,219,.42)',
    line2: 'rgba(235,229,219,.42)',
    vig: 'inset 0 0 320px 70px rgba(0,0,0,.6)',
    crown: 'export-assets/crown-crema.png',
    ns: 'export-assets/ns-crema.png',
    seal: 'export-assets/seal-black.png',
    mz: 'export-assets/maizly-crema.png'
  }
};

/* Bronze / copper accent presets — solid + metallic gradient for the hero numeral */
const ACCENTS = {
  copper: {
    solid: '#B07A48',
    grad: 'linear-gradient(176deg,#E4BA84 0%,#B97F4B 44%,#8A5325 100%)'
  },
  gold: {
    solid: '#B49658',
    grad: 'linear-gradient(176deg,#E8D49A 0%,#BBA063 46%,#876A2F 100%)'
  },
  terracotta: {
    solid: '#AA7050',
    grad: 'linear-gradient(176deg,#CC9375 0%,#AA7050 50%,#7E4C31 100%)'
  }
};
function Poster({
  w = 480,
  colorway = 'forest',
  layout = 'stack',
  date = '09.12.2026',
  accent = 'copper',
  heroNum = '25',
  headline = 'Last Chance for VIP',
  scarcity = 'VIP tickets remain',
  scriptWord = 'only',
  badgeText = 'VIP Access',
  showBadge = true,
  showRegMarks = true
}) {
  const c = COLORWAYS[colorway];
  const a = ACCENTS[accent] || ACCENTS.copper;
  const scale = w / 1080;
  const h = Math.round(1920 * scale);
  const vars = {
    '--pst-bg': c.bg,
    '--pst-ink': c.ink,
    '--pst-ink-soft': c.inkSoft,
    '--pst-ink-faint': c.inkFaint,
    '--pst-muted': c.muted,
    '--pst-line': c.line,
    '--pst-line2': c.line2,
    '--pst-vig': c.vig,
    '--pst-accent': a.solid,
    '--pst-accent-grad': a.grad
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "pst-mount",
    style: {
      width: w + 'px',
      height: h + 'px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pst-stage",
    style: {
      transform: `scale(${scale})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "pst",
    style: vars
  }, /*#__PURE__*/React.createElement("div", {
    className: "pst-frame"
  }, showRegMarks && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "pst-reg tl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pst-reg tr"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pst-reg bl"
  }), /*#__PURE__*/React.createElement("span", {
    className: "pst-reg br"
  })), /*#__PURE__*/React.createElement("div", {
    className: "pst-meta"
  }, /*#__PURE__*/React.createElement("span", null, "Lenny Boy Brewery"), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\u25CF"), "\xA0 ", date)), /*#__PURE__*/React.createElement("div", {
    className: "pst-core"
  }, /*#__PURE__*/React.createElement("img", {
    className: "pst-crown",
    src: c.crown,
    alt: ""
  }), showBadge && /*#__PURE__*/React.createElement("div", {
    className: "pst-badge"
  }, /*#__PURE__*/React.createElement("span", {
    className: "gem"
  }), badgeText, /*#__PURE__*/React.createElement("span", {
    className: "gem"
  })), heroNum ? /*#__PURE__*/React.createElement(React.Fragment, null, headline && /*#__PURE__*/React.createElement("div", {
    className: "pst-headline"
  }, headline), scriptWord && /*#__PURE__*/React.createElement("div", {
    className: "pst-only"
  }, scriptWord), /*#__PURE__*/React.createElement("div", {
    className: "pst-25"
  }, heroNum)) : headline && /*#__PURE__*/React.createElement("div", {
    className: "pst-hero-text"
  }, headline), /*#__PURE__*/React.createElement("div", {
    className: "pst-remain"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rule"
  }), /*#__PURE__*/React.createElement("span", {
    className: "word"
  }, scarcity), /*#__PURE__*/React.createElement("span", {
    className: "rule"
  })), layout === 'seal' ? /*#__PURE__*/React.createElement("img", {
    className: "pst-seal",
    src: c.seal,
    alt: "The Charlotte Coffee Festival"
  }) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pst-the"
  }, "The"), /*#__PURE__*/React.createElement("div", {
    className: "pst-wm"
  }, /*#__PURE__*/React.createElement("span", null, "Charlotte"), /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rings"
  }, /*#__PURE__*/React.createElement("b", null, "T"), /*#__PURE__*/React.createElement("b", null, "C")), /*#__PURE__*/React.createElement("span", null, "Coffee"), /*#__PURE__*/React.createElement("span", {
    className: "rings"
  }, /*#__PURE__*/React.createElement("b", null, "C"), /*#__PURE__*/React.createElement("b", null, "F"))), /*#__PURE__*/React.createElement("span", null, "Festival")))), /*#__PURE__*/React.createElement("div", {
    className: "pst-credit"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lab"
  }, "Presented by"), /*#__PURE__*/React.createElement("img", {
    className: "ns",
    src: c.ns,
    alt: "Night Swim Coffee"
  })), /*#__PURE__*/React.createElement("span", {
    className: "divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lab"
  }, "Sponsored by"), /*#__PURE__*/React.createElement("img", {
    className: "mz",
    src: c.mz,
    alt: "ma\xEFzly \u2014 for all"
  })))))));
}
(function injectPosterCSS() {
  const prev = document.getElementById('poster-css');
  if (prev) prev.remove();
  const s = document.createElement('style');
  s.id = 'poster-css';
  s.textContent = POSTER_CSS;
  document.head.appendChild(s);
})();
window.Poster = Poster;
})(); } catch (e) { __ds_ns.__errors.push({ path: "poster.jsx", error: String((e && e.message) || e) }); }

// posts.jsx
try { (() => {
/* global React */
/* Instagram teaser posts — 1080×1350 (4:5). Three layouts.
   Brand tokens/fonts come from colors_and_type.css (linked in the page). */

const POST_CSS = `
.igp-mount { position:relative; overflow:hidden; background:#11120c; }
.igp-stage { position:absolute; top:0; left:0; width:1080px; height:1350px; transform-origin:top left; }

.igp { position:absolute; inset:0; overflow:hidden; font-family:var(--font-display); color:var(--igp-ink); background:var(--igp-bg); }
.igp::after { content:""; position:absolute; inset:0; pointer-events:none; opacity:.05; mix-blend-mode:overlay;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }

.igp-mono { font-family:var(--font-mono); text-transform:uppercase; letter-spacing:.12em; }
.igp-script { font-family:var(--font-script); font-style:italic; font-weight:700; }

/* ---- ring wordmark helper ---- */
.igp-rings { display:inline-flex; gap:.12em; vertical-align:middle; }
.igp-rings b { display:inline-grid; place-items:center; width:1.5em; height:1.5em; border:.1em solid currentColor; border-radius:50%; font-size:.42em; font-weight:400; line-height:1; }

/* ===================== A · LINEUP GRID ===================== */
.igp.A { padding:72px 64px 60px; display:flex; flex-direction:column; }
.igp.A .top { display:flex; align-items:center; gap:18px; }
.igp.A .top img { height:58px; width:auto; }
.igp.A .top .ey { font-family:var(--font-mono); font-size:18px; letter-spacing:.18em; text-transform:uppercase; color:var(--tccf-coral); line-height:1.4; }
.igp.A .top .ey b { display:block; color:var(--igp-ink-soft); font-weight:400; }
.igp.A h1 { margin:30px 0 0; font-family:var(--font-display); text-transform:uppercase; font-weight:400;
  font-size:104px; line-height:.9; letter-spacing:-.01em; }
.igp.A .sub { margin:18px 0 26px; font-family:var(--font-mono); font-size:20px; letter-spacing:.14em; text-transform:uppercase; color:var(--igp-ink-soft); }
.igp.A .pgrid { flex:1; display:grid; grid-template-columns:1fr 1fr; grid-template-rows:1fr 1fr; gap:20px; min-height:0; }
.igp.A .pcard { position:relative; border:2px solid var(--igp-line); background:var(--tccf-off-white); overflow:hidden; display:flex; flex-direction:column; }
.igp.A .pcard .ph { flex:1; overflow:hidden; min-height:0; }
.igp.A .pcard .ph img { width:100%; height:100%; object-fit:cover; }
.igp.A .pcard .lab { display:flex; align-items:baseline; justify-content:space-between; gap:10px; padding:14px 18px; border-top:2px solid var(--igp-line); color:var(--tccf-black); }
.igp.A .pcard .lab .n { font-family:var(--font-display); text-transform:uppercase; font-size:26px; line-height:1; }
.igp.A .pcard .lab .a { font-family:var(--font-mono); font-size:14px; letter-spacing:.1em; text-transform:uppercase; color:var(--tccf-coral); text-align:right; white-space:nowrap; }
.igp.A .foot { margin-top:26px; display:flex; align-items:center; justify-content:space-between; gap:18px;
  font-family:var(--font-mono); font-size:19px; letter-spacing:.14em; text-transform:uppercase; color:var(--igp-ink-soft); }
.igp.A .foot .live { color:var(--tccf-off-white); background:var(--tccf-coral); padding:9px 16px; }

/* ===================== B · LIFESTYLE (matches IG house template) ===================== */
.igp.B .bg { position:absolute; inset:0; }
.igp.B .bg img { width:100%; height:100%; object-fit:cover; object-position:center 32%; }
.igp.B .scrim { position:absolute; inset:0; background:linear-gradient(180deg, rgba(16,15,10,.62) 0%, rgba(16,15,10,.12) 24%, rgba(16,15,10,.1) 50%, rgba(16,15,10,.84) 100%); }
.igp.B .inner { position:absolute; inset:0; padding:52px 52px 48px; display:flex; flex-direction:column; color:var(--tccf-crema); }
.igp.B .mrow { display:flex; justify-content:space-between; align-items:flex-start; font-family:var(--font-mono); font-size:18px; line-height:1.5; letter-spacing:.16em; text-transform:uppercase; text-shadow:0 1px 12px rgba(0,0,0,.55); }
.igp.B .mrow .r { text-align:right; }
.igp.B .banner { align-self:center; margin-top:34px; background:rgba(170,112,80,.9); color:var(--tccf-off-white); font-family:var(--font-mono); font-size:38px; letter-spacing:.2em; text-transform:uppercase; padding:15px 34px; box-shadow:0 8px 26px rgba(0,0,0,.3); }
.igp.B .grow { flex:1; }
.igp.B .bottom { display:flex; justify-content:space-between; align-items:flex-end; gap:28px; }
.igp.B .lock { display:flex; flex-direction:column; gap:20px; }
.igp.B .lock > img { width:332px; height:auto; filter:drop-shadow(0 2px 14px rgba(0,0,0,.45)); }
.igp.B .lock .cred { font-family:var(--font-mono); font-size:15px; line-height:1.7; letter-spacing:.14em; text-transform:uppercase; color:rgba(235,229,219,.88); }
.igp.B .head { text-align:right; max-width:540px; }
.igp.B .head h1 { margin:0; font-family:var(--font-display); font-weight:400; font-size:64px; line-height:.96; text-transform:none; letter-spacing:-.01em; text-shadow:0 2px 18px rgba(0,0,0,.45); }
.igp.B .head .sub { margin-top:16px; font-family:var(--font-display); font-size:27px; line-height:1.18; color:rgba(235,229,219,.92); text-shadow:0 2px 14px rgba(0,0,0,.45); }

/* ===================== C · BOLD TYPE ===================== */
.igp.C { padding:70px 64px 60px; display:flex; flex-direction:column; align-items:center; text-align:center; }
.igp.C .crown { height:120px; width:auto; }
.igp.C .script { margin-top:24px; font-family:var(--font-script); font-style:italic; font-weight:700; font-size:64px; line-height:.9; color:var(--tccf-muted); }
.igp.C h1 { margin:6px 0 0; font-family:var(--font-display); text-transform:uppercase; font-weight:400; font-size:200px; line-height:.82; letter-spacing:-.02em; color:var(--tccf-crema); }
.igp.C .thumbs { margin-top:46px; display:grid; grid-template-columns:repeat(3,1fr); gap:18px; width:100%; }
.igp.C .thumbs .t { aspect-ratio:1; border:2px solid var(--tccf-crema); overflow:hidden; background:var(--tccf-off-white); }
.igp.C .thumbs .t img { width:100%; height:100%; object-fit:cover; }
.igp.C .foot { margin-top:auto; padding-top:34px; }
.igp.C .foot .d { font-family:var(--font-mono); font-size:20px; letter-spacing:.18em; text-transform:uppercase; color:var(--tccf-crema); }
.igp.C .foot .live { margin-top:16px; display:inline-block; font-family:var(--font-mono); font-size:18px; letter-spacing:.18em; text-transform:uppercase; background:var(--tccf-coral); color:var(--tccf-off-white); padding:11px 20px; }
`;
const IMG = {
  logoCrema: "assets/logo-primary-crema.png",
  logoBlack: "assets/logo-primary-black.png",
  crownCrema: "t shirt assets/crown-crema.png",
  tote: "assets/photo-tote.jpg",
  cup: "assets/photo-cup.jpg",
  navy: "assets/photo-tee-navy-front.jpg",
  white: "assets/photo-tee-white-back.jpg",
  life: "assets/merch-tees-kitchen.jpg",
  nsCrema: "assets/nightswim-crema.png"
};
const GROUNDS = {
  crema: {
    bg: "radial-gradient(130% 90% at 50% -10%, #F7F6F2 0%, #EBE5DB 60%, #ded7c9 100%)",
    ink: "#181818",
    inkSoft: "#746137",
    line: "#181818"
  },
  forest: {
    bg: "radial-gradient(135% 95% at 50% -8%, #5a5b41 0%, #4A4B35 45%, #3b3c2b 100%)",
    ink: "#EBE5DB",
    inkSoft: "rgba(235,229,219,.8)",
    line: "#EBE5DB"
  }
};
function Rings({
  a,
  b
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "igp-rings"
  }, /*#__PURE__*/React.createElement("b", null, a), /*#__PURE__*/React.createElement("b", null, b));
}
function Post({
  w = 432,
  layout = "A"
}) {
  const scale = w / 1080;
  const h = Math.round(1350 * scale);
  const ground = layout === "A" ? GROUNDS.crema : layout === "C" ? GROUNDS.forest : GROUNDS.crema;
  const vars = {
    "--igp-bg": ground.bg,
    "--igp-ink": ground.ink,
    "--igp-ink-soft": ground.inkSoft,
    "--igp-line": ground.line
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "igp-mount",
    style: {
      width: w + "px",
      height: h + "px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "igp-stage",
    style: {
      transform: `scale(${scale})`
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: `igp ${layout}`,
    style: vars
  }, layout === "A" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "top"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.logoBlack,
    alt: ""
  }), /*#__PURE__*/React.createElement("span", {
    className: "ey"
  }, "First look \xB7 Festival merch", /*#__PURE__*/React.createElement("b", null, "The Charlotte Coffee Festival"))), /*#__PURE__*/React.createElement("h1", null, "What's at", /*#__PURE__*/React.createElement("br", null), "the fest."), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Cups \xB7 Totes \xB7 Tees \u2014 all at the festival"), /*#__PURE__*/React.createElement("div", {
    className: "pgrid"
  }, /*#__PURE__*/React.createElement("div", {
    className: "pcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ph"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.tote,
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "Canvas Tote"), /*#__PURE__*/React.createElement("span", {
    className: "a"
  }, "VIP &", /*#__PURE__*/React.createElement("br", null), "Early GA"))), /*#__PURE__*/React.createElement("div", {
    className: "pcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ph"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.cup,
    alt: "",
    style: {
      objectPosition: "center 42%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "4 oz Cup"), /*#__PURE__*/React.createElement("span", {
    className: "a"
  }, "Free", /*#__PURE__*/React.createElement("br", null), "samples"))), /*#__PURE__*/React.createElement("div", {
    className: "pcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ph"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.navy,
    alt: "",
    style: {
      objectPosition: "center 40%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "Tee \xB7 Navy"), /*#__PURE__*/React.createElement("span", {
    className: "a"
  }, "$20"))), /*#__PURE__*/React.createElement("div", {
    className: "pcard"
  }, /*#__PURE__*/React.createElement("div", {
    className: "ph"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.white,
    alt: "",
    style: {
      objectPosition: "center 40%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "lab"
  }, /*#__PURE__*/React.createElement("span", {
    className: "n"
  }, "Tee \xB7 White"), /*#__PURE__*/React.createElement("span", {
    className: "a"
  }, "$20")))), /*#__PURE__*/React.createElement("div", {
    className: "foot"
  }, /*#__PURE__*/React.createElement("span", null, "Sat Sept 12 \xB7 Lenny Boy Brewing"), /*#__PURE__*/React.createElement("span", {
    className: "live"
  }, "Tickets live now"))), layout === "B" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "bg"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.life,
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "scrim"
  }), /*#__PURE__*/React.createElement("div", {
    className: "inner"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mrow"
  }, /*#__PURE__*/React.createElement("span", null, "September 12th,", /*#__PURE__*/React.createElement("br", null), "9am to 2pm"), /*#__PURE__*/React.createElement("span", {
    className: "r"
  }, "Lenny Boy Brewery", /*#__PURE__*/React.createElement("br", null), "Charlotte, NC")), /*#__PURE__*/React.createElement("div", {
    className: "banner"
  }, "This Year's Merch"), /*#__PURE__*/React.createElement("div", {
    className: "grow"
  }), /*#__PURE__*/React.createElement("div", {
    className: "bottom"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lock"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.logoCrema,
    alt: "The Charlotte Coffee Festival"
  }), /*#__PURE__*/React.createElement("span", {
    className: "cred"
  }, "Presented by Night Swim Coffee", /*#__PURE__*/React.createElement("br", null), "Sponsored by Ma\xEFzly")), /*#__PURE__*/React.createElement("div", {
    className: "head"
  }, /*#__PURE__*/React.createElement("h1", null, "Wear the festival."), /*#__PURE__*/React.createElement("div", {
    className: "sub"
  }, "Tees, totes & cups \u2014 first look"))))), layout === "C" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("img", {
    className: "crown",
    src: IMG.crownCrema,
    alt: ""
  }), /*#__PURE__*/React.createElement("div", {
    className: "script"
  }, "a first look at the"), /*#__PURE__*/React.createElement("h1", null, "Merch"), /*#__PURE__*/React.createElement("div", {
    className: "thumbs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.navy,
    alt: "",
    style: {
      objectPosition: "center 42%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.tote,
    alt: ""
  })), /*#__PURE__*/React.createElement("div", {
    className: "t"
  }, /*#__PURE__*/React.createElement("img", {
    src: IMG.white,
    alt: "",
    style: {
      objectPosition: "center 42%"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    className: "foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d"
  }, "Tees $20 \xB7 Tote for VIP & Early GA \xB7 Free cups"), /*#__PURE__*/React.createElement("div", {
    className: "live"
  }, "Sat Sept 12 \xB7 Lenny Boy \xB7 Tickets live now"))))));
}
(function injectPostCSS() {
  if (document.getElementById("igp-css")) return;
  const s = document.createElement("style");
  s.id = "igp-css";
  s.textContent = POST_CSS;
  document.head.appendChild(s);
})();
window.Post = Post;
})(); } catch (e) { __ds_ns.__errors.push({ path: "posts.jsx", error: String((e && e.message) || e) }); }

// studio/Canvas.jsx
try { (() => {
/* Canvas.jsx — the spatial workspace.
   Zoom / pan / fit, grid, layers, object rendering for every mode,
   multi-select + marquee, drag, resize, rotate, smart alignment guides,
   measurement tool, comment pins, attendee routing overlay.
   Exposes window.StudioCanvas. */
(function () {
  const {
    useRef,
    useState,
    useEffect,
    useCallback,
    useMemo,
    forwardRef,
    useImperativeHandle
  } = React;
  const {
    STUDIO
  } = window;
  const {
    CATEGORIES,
    STATUS,
    colorFor
  } = STUDIO;
  const SCALE = 4.2; // px per foot at zoom=1
  const MIN_Z = 0.25,
    MAX_Z = 6;
  const PLACE_STYLE = {
    stage: {
      fill: "#3A2C18",
      stroke: "#6a4a28",
      text: "#EBE5DB",
      icon: "mic",
      radius: 8
    },
    food: {
      fill: "#4A4B35",
      stroke: "#33341f",
      text: "#EBE5DB",
      icon: "utensils",
      radius: 8
    },
    ticketing: {
      fill: "rgba(170,112,80,0.18)",
      stroke: "#AA7050",
      text: "#7a4a2c",
      icon: "ticket",
      radius: 8,
      dashed: true
    },
    restroom: {
      fill: "#75878B",
      stroke: "#4f6064",
      text: "#F7F6F2",
      icon: "droplet",
      radius: 8
    },
    building: {
      fill: "#CFC9BC",
      stroke: "#9a9483",
      text: "#4A4B35",
      icon: "building",
      radius: 6
    },
    patch: {
      fill: "rgba(107,110,69,0.28)",
      stroke: "#6B6E45",
      text: "#3a3c24",
      icon: "target",
      radius: "50%"
    },
    entrance: {
      fill: "#6B6E45",
      stroke: "#4A4B35",
      text: "#F7F6F2",
      icon: "door",
      radius: 6
    },
    generator: {
      fill: "#C9A227",
      stroke: "#9a7c1d",
      text: "#3a2c10",
      icon: "bolt",
      radius: 6
    }
  };
  function initials(s) {
    return (s || "").split(/\s+/).slice(0, 2).map(w => w[0] || "").join("").toUpperCase().slice(0, 2);
  }
  const snap5 = v => Math.round(v / 5) * 5;
  const StudioCanvas = forwardRef(function StudioCanvas(props, ref) {
    const {
      doc,
      mode,
      theme,
      tool,
      layers,
      zoomGrid,
      selection,
      onSelectionChange,
      onUpdateObjects,
      onAddComment,
      arrowTargetId,
      routeTargetId,
      onMeasure,
      measurements,
      onZoomReport,
      vendorFocusId
    } = props;
    const wrapRef = useRef(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({
      x: 0,
      y: 0
    });
    const fitOnce = useRef(false);
    const lot = doc.lot;
    const lotPxW = lot.w * SCALE,
      lotPxH = lot.h * SCALE;
    const isEditing = mode === "organizer";
    const objects = doc.objects;
    const byId = useMemo(() => Object.fromEntries(objects.map(o => [o.id, o])), [objects]);

    /* ---- camera ---- */
    const fit = useCallback(pad => {
      const el = wrapRef.current;
      if (!el) return;
      pad = pad == null ? 92 : pad;
      const z = Math.min((el.clientWidth - pad * 2) / lotPxW, (el.clientHeight - pad * 2) / lotPxH);
      const cz = Math.max(MIN_Z, Math.min(MAX_Z, z));
      setZoom(cz);
      setPan({
        x: (el.clientWidth - lotPxW * cz) / 2,
        y: (el.clientHeight - lotPxH * cz) / 2
      });
    }, [lotPxW, lotPxH]);
    const centerOn = useCallback((o, z) => {
      const el = wrapRef.current;
      if (!el || !o) return;
      const cx = (o.x + (o.w || 6) / 2) * SCALE,
        cy = (o.y + (o.h || 6) / 2) * SCALE;
      const cz = z || 2.6;
      setZoom(cz);
      setPan({
        x: el.clientWidth / 2 - cx * cz,
        y: el.clientHeight / 2 - cy * cz
      });
    }, []);
    useImperativeHandle(ref, () => ({
      fit,
      centerOn,
      zoomTo: z => setZoom(Math.max(MIN_Z, Math.min(MAX_Z, z))),
      getCamera: () => ({
        zoom,
        pan
      }),
      getViewCenterFt: () => {
        const el = wrapRef.current;
        if (!el) return {
          x: lot.w / 2,
          y: lot.h / 2
        };
        return {
          x: (el.clientWidth / 2 - pan.x) / (SCALE * zoom),
          y: (el.clientHeight / 2 - pan.y) / (SCALE * zoom)
        };
      }
    }), [fit, centerOn, zoom, pan, lot.w, lot.h]);
    useEffect(() => {
      if (!fitOnce.current) {
        fit();
        fitOnce.current = true;
      }
      const r = () => fit();
      window.addEventListener("resize", r);
      return () => window.removeEventListener("resize", r);
    }, [fit]);
    useEffect(() => {
      onZoomReport && onZoomReport(zoom);
    }, [zoom, onZoomReport]);

    // focus from search / vendor mode
    useEffect(() => {
      if (vendorFocusId != null && byId[vendorFocusId]) centerOn(byId[vendorFocusId], 2.4);
    }, [vendorFocusId]);
    useEffect(() => {
      if (arrowTargetId != null && byId[arrowTargetId]) centerOn(byId[arrowTargetId], 2.2);
    }, [arrowTargetId]);

    /* ---- wheel zoom (cursor-anchored) ---- */
    const onWheel = useCallback(e => {
      const el = wrapRef.current;
      if (!el) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left,
        my = e.clientY - r.top;
      if (e.ctrlKey || e.metaKey || !e.shiftKey) {
        const d = -e.deltaY * 0.0016;
        setZoom(z => {
          const nz = Math.max(MIN_Z, Math.min(MAX_Z, z * (1 + d)));
          const k = nz / z;
          setPan(p => ({
            x: mx - (mx - p.x) * k,
            y: my - (my - p.y) * k
          }));
          return nz;
        });
      } else {
        setPan(p => ({
          x: p.x - e.deltaX,
          y: p.y - e.deltaY
        }));
      }
    }, []);
    useEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      el.addEventListener("wheel", onWheel, {
        passive: false
      });
      return () => el.removeEventListener("wheel", onWheel);
    }, [onWheel]);

    /* ---- coordinate helpers ---- */
    const toFt = useCallback((cx, cy) => {
      const r = wrapRef.current.getBoundingClientRect();
      return {
        x: (cx - r.left - pan.x) / (SCALE * zoom),
        y: (cy - r.top - pan.y) / (SCALE * zoom)
      };
    }, [pan, zoom]);

    /* ---- interaction state ---- */
    const drag = useRef(null);
    const [marquee, setMarquee] = useState(null);
    const [guides, setGuides] = useState([]);
    const [measureDraft, setMeasureDraft] = useState(null);
    const [spaceDown, setSpaceDown] = useState(false);

    // Hold SPACE to pan from anywhere (Figma-style), regardless of active tool.
    useEffect(() => {
      const dn = e => {
        if (e.code === "Space" && !/INPUT|TEXTAREA|SELECT/.test(e.target && e.target.tagName || "")) {
          e.preventDefault();
          setSpaceDown(true);
        }
      };
      const up = e => {
        if (e.code === "Space") setSpaceDown(false);
      };
      window.addEventListener("keydown", dn);
      window.addEventListener("keyup", up);
      return () => {
        window.removeEventListener("keydown", dn);
        window.removeEventListener("keyup", up);
      };
    }, []);
    const selectable = o => {
      if (!isEditing) return false;
      if (o.kind === "booth") return layers.booths;
      if (["stage", "food", "ticketing", "restroom", "building", "entrance", "patch"].includes(o.kind)) return layers.places;
      if (o.kind === "generator" || o.kind === "power") return layers.power;
      if (o.kind === "water") return layers.water;
      return false;
    };

    /* ---- smart guides: compare moving rect to others ---- */
    function computeGuides(moving, others) {
      const gs = [];
      const TOL = 1.2; // feet
      const me = {
        l: moving.x,
        r: moving.x + moving.w,
        cx: moving.x + moving.w / 2,
        t: moving.y,
        b: moving.y + moving.h,
        cy: moving.y + moving.h / 2
      };
      let snapX = null,
        snapY = null;
      others.forEach(o => {
        if (!o.w) return;
        const ot = {
          l: o.x,
          r: o.x + o.w,
          cx: o.x + o.w / 2,
          t: o.y,
          b: o.y + o.h,
          cy: o.y + o.h / 2
        };
        [["l", "l"], ["r", "r"], ["cx", "cx"], ["l", "r"], ["r", "l"]].forEach(([a, b]) => {
          if (Math.abs(me[a] - ot[b]) < TOL) {
            gs.push({
              vert: true,
              at: ot[b]
            });
            if (snapX == null) snapX = ot[b] - (me[a] - moving.x);
          }
        });
        [["t", "t"], ["b", "b"], ["cy", "cy"], ["t", "b"], ["b", "t"]].forEach(([a, b]) => {
          if (Math.abs(me[a] - ot[b]) < TOL) {
            gs.push({
              vert: false,
              at: ot[b]
            });
            if (snapY == null) snapY = ot[b] - (me[a] - moving.y);
          }
        });
      });
      return {
        gs,
        snapX,
        snapY
      };
    }

    /* ---- pointer on background ---- */
    const onBgDown = e => {
      const panMode = spaceDown || isEditing && tool === "pan";
      if (e.target !== e.currentTarget && !e.target.dataset.bg && !panMode) return;
      const ftp = toFt(e.clientX, e.clientY);
      // SPACE-hold or Hand tool → pan from anywhere
      if (spaceDown || isEditing && tool === "pan") {
        drag.current = {
          type: "pan",
          sx: e.clientX,
          sy: e.clientY,
          px: pan.x,
          py: pan.y
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      if (isEditing && tool === "measure") {
        setMeasureDraft({
          a: ftp,
          b: ftp
        });
        drag.current = {
          type: "measure"
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      if (isEditing && tool === "comment") {
        onAddComment && onAddComment(ftp);
        return;
      }
      if (isEditing && tool === "select") {
        // marquee
        onSelectionChange([]);
        setMarquee({
          x0: ftp.x,
          y0: ftp.y,
          x1: ftp.x,
          y1: ftp.y
        });
        drag.current = {
          type: "marquee"
        };
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      // pan (non-edit modes)
      onSelectionChange && onSelectionChange([]);
      drag.current = {
        type: "pan",
        sx: e.clientX,
        sy: e.clientY,
        px: pan.x,
        py: pan.y
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const onMove = e => {
      const d = drag.current;
      if (!d) return;
      const commitOnce = () => {
        if (!d.committed) {
          d.committed = true;
          props.onBeginChange && props.onBeginChange();
        }
      };
      if (d.type === "pan") {
        setPan({
          x: d.px + (e.clientX - d.sx),
          y: d.py + (e.clientY - d.sy)
        });
        return;
      }
      if (d.type === "measure") {
        setMeasureDraft(m => ({
          ...m,
          b: toFt(e.clientX, e.clientY)
        }));
        return;
      }
      if (d.type === "marquee") {
        const p = toFt(e.clientX, e.clientY);
        setMarquee(m => ({
          ...m,
          x1: p.x,
          y1: p.y
        }));
        return;
      }
      if (d.type === "move") {
        const ft = toFt(e.clientX, e.clientY);
        const dx = ft.x - d.startFt.x,
          dy = ft.y - d.startFt.y;
        // compute guides from the primary object's prospective position
        if (!e.altKey) {
          const prim = {
            ...byId[d.primary],
            x: d.base[d.primary].x + dx,
            y: d.base[d.primary].y + dy
          };
          const others = objects.filter(o => o.w && !d.ids.includes(o.id) && selectable(o));
          const {
            gs
          } = computeGuides(prim, others);
          setGuides(gs);
        } else {
          setGuides([]);
        }
        const patches = d.ids.map(id => {
          let x = d.base[id].x + dx,
            y = d.base[id].y + dy;
          if (props.snapGrid && !e.altKey) {
            x = snap5(x);
            y = snap5(y);
          }
          const ow = byId[id].w || 0,
            oh = byId[id].h || 0;
          x = Math.max(0, Math.min(lot.w - ow, Math.round(x * 10) / 10));
          y = Math.max(0, Math.min(lot.h - oh, Math.round(y * 10) / 10));
          return {
            id,
            x,
            y
          };
        });
        commitOnce();
        onUpdateObjects(patches, {
          transient: true
        });
        return;
      }
      if (d.type === "resize") {
        const ft = toFt(e.clientX, e.clientY);
        let w = Math.max(5, ft.x - byId[d.id].x),
          h = Math.max(5, ft.y - byId[d.id].y);
        if (props.snapGrid && !e.altKey) {
          w = snap5(w);
          h = snap5(h);
        }
        commitOnce();
        onUpdateObjects([{
          id: d.id,
          w: Math.round(w * 10) / 10,
          h: Math.round(h * 10) / 10
        }], {
          transient: true
        });
        return;
      }
      if (d.type === "rotate") {
        const o = byId[d.id];
        const r = wrapRef.current.getBoundingClientRect();
        const cx = r.left + pan.x + (o.x + o.w / 2) * SCALE * zoom;
        const cy = r.top + pan.y + (o.y + o.h / 2) * SCALE * zoom;
        let ang = Math.atan2(e.clientY - cy, e.clientX - cx) * 180 / Math.PI + 90;
        if (!e.altKey) ang = Math.round(ang / 15) * 15;
        commitOnce();
        onUpdateObjects([{
          id: d.id,
          rot: Math.round(ang)
        }], {
          transient: true
        });
        return;
      }
      if (d.type === "ptsize") {
        const o = byId[d.id];
        if (!o) {
          return;
        }
        const ft = toFt(e.clientX, e.clientY);
        let s = Math.max(2, Math.hypot(ft.x - o.x, ft.y - o.y) * 2);
        if (props.snapGrid && !e.altKey) s = Math.round(s);
        commitOnce();
        onUpdateObjects([{
          id: d.id,
          size: Math.round(s * 10) / 10
        }], {
          transient: true
        });
        return;
      }
      if (d.type === "emvtx" && emPath) {
        const ft = toFt(e.clientX, e.clientY);
        let x = ft.x,
          y = ft.y;
        if (props.snapGrid && !e.altKey) {
          x = snap5(x);
          y = snap5(y);
        }
        x = Math.max(0, Math.min(lot.w, Math.round(x * 10) / 10));
        y = Math.max(0, Math.min(lot.h, Math.round(y * 10) / 10));
        const path = emPath.path.map((p, i) => i === d.idx ? {
          x,
          y
        } : p);
        commitOnce();
        props.onUpdateEmergency && props.onUpdateEmergency({
          ...emPath,
          path
        }, {
          transient: true
        });
        return;
      }
    };
    const onUp = e => {
      const d = drag.current;
      if (d && d.type === "measure" && measureDraft) {
        const len = Math.hypot(measureDraft.b.x - measureDraft.a.x, measureDraft.b.y - measureDraft.a.y);
        if (len > 1) onMeasure && onMeasure(measureDraft);
        setMeasureDraft(null);
      }
      if (d && d.type === "marquee" && marquee) {
        const x0 = Math.min(marquee.x0, marquee.x1),
          x1 = Math.max(marquee.x0, marquee.x1);
        const y0 = Math.min(marquee.y0, marquee.y1),
          y1 = Math.max(marquee.y0, marquee.y1);
        const hit = objects.filter(o => o.w && selectable(o) && o.x < x1 && o.x + o.w > x0 && o.y < y1 && o.y + o.h > y0).map(o => o.id);
        if (hit.length) onSelectionChange(hit);
        setMarquee(null);
      }
      setGuides([]);
      drag.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    };
    const onObjDown = (e, o, kind) => {
      // SPACE-hold pans even over objects — let the background handler take it
      if (spaceDown) return;
      if (!isEditing || tool !== "select") {
        // allow click-to-select-detail in non-edit modes
        if (!isEditing) {
          e.stopPropagation();
          props.onObjectClick && props.onObjectClick(o.id);
        }
        return;
      }
      if (!selectable(o)) return;
      e.stopPropagation();
      let ids = selection.includes(o.id) ? selection : e.shiftKey ? [...selection, o.id] : [o.id];
      if (e.shiftKey && selection.includes(o.id)) ids = selection.filter(x => x !== o.id);
      onSelectionChange(ids);
      if (kind === "resize" || kind === "rotate") {
        drag.current = {
          type: kind,
          id: o.id
        };
      } else {
        const base = {};
        ids.forEach(id => {
          base[id] = {
            x: byId[id].x,
            y: byId[id].y
          };
        });
        drag.current = {
          type: "move",
          ids,
          base,
          primary: o.id,
          startFt: toFt(e.clientX, e.clientY)
        };
      }
      e.currentTarget.setPointerCapture(e.pointerId);
    };
    const zoomBtn = dir => setZoom(z => Math.max(MIN_Z, Math.min(MAX_Z, dir > 0 ? z * 1.25 : z / 1.25)));

    /* ---- emergency lane geometry ---- */
    const emPath = doc.emergency;

    /* ---- visibility per mode ---- */
    const showLayer = key => {
      if (mode === "utility") {
        if (["power", "water", "emergency"].includes(key)) return true;
        if (key === "booths" || key === "places" || key === "grid") return layers[key];
        return layers[key];
      }
      return layers[key];
    };
    const dimNonRoute = mode === "attendee" && routeTargetId != null;
    return /*#__PURE__*/React.createElement("div", {
      ref: wrapRef,
      className: spaceDown ? "cv-grab" : isEditing && tool === "pan" ? "cv-grab" : isEditing && (tool === "measure" || tool === "comment") ? "cv-cross" : isEditing && tool === "select" ? "cv-default" : "cv-grab",
      style: {
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "var(--canvas)",
        touchAction: "none",
        userSelect: "none"
      },
      onPointerDown: onBgDown,
      onPointerMove: onMove,
      onPointerUp: onUp,
      onPointerCancel: onUp
    }, /*#__PURE__*/React.createElement("div", {
      "data-bg": "1",
      style: {
        position: "absolute",
        inset: 0
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        transformOrigin: "top left",
        transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
        width: lotPxW,
        height: lotPxH,
        pointerEvents: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      "data-bg": "1",
      style: {
        position: "absolute",
        inset: 0,
        background: "var(--lot)",
        borderRadius: 10,
        boxShadow: "var(--shadow-md)",
        pointerEvents: "auto",
        backgroundImage: showLayer("grid") && zoomGrid ? "radial-gradient(circle at 1px 1px, var(--grid-dot) 1.4px, transparent 1.4px)" : "none",
        backgroundSize: `${5 * SCALE}px ${5 * SCALE}px`
      },
      onPointerDown: e => {
        e.currentTarget.dataset.bg = '1';
      }
    }), showLayer("grid") && (() => {
      const xt = [],
        yt = [];
      for (let ft = 0; ft <= lot.w; ft += 20) xt.push(ft);
      for (let ft = 0; ft <= lot.h; ft += 20) yt.push(ft);
      const fs = 9 / zoom,
        off = 6 / zoom,
        lab = 20 / zoom,
        tick = 5 / zoom;
      const lblStyle = {
        position: "absolute",
        fontFamily: "var(--font-mono)",
        fontSize: fs,
        color: "var(--ink-faint)",
        pointerEvents: "none",
        whiteSpace: "nowrap"
      };
      return /*#__PURE__*/React.createElement(React.Fragment, null, xt.map(ft => /*#__PURE__*/React.createElement(React.Fragment, {
        key: "x" + ft
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...lblStyle,
          left: ft * SCALE,
          top: -lab,
          transform: "translateX(-50%)"
        }
      }, ft, "\u2032"), /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          left: ft * SCALE,
          top: -tick,
          width: 1,
          height: tick,
          background: "var(--line-strong)",
          pointerEvents: "none"
        }
      }))), yt.map(ft => /*#__PURE__*/React.createElement(React.Fragment, {
        key: "y" + ft
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          ...lblStyle,
          left: -off,
          top: ft * SCALE,
          transform: "translate(-100%,-50%)"
        }
      }, ft, "\u2032"), /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          left: -tick,
          top: ft * SCALE,
          width: tick,
          height: 1,
          background: "var(--line-strong)",
          pointerEvents: "none"
        }
      }))), /*#__PURE__*/React.createElement("div", {
        style: {
          ...lblStyle,
          left: lot.w * SCALE / 2,
          top: -lab * 2,
          transform: "translateX(-50%)",
          fontSize: 10 / zoom,
          color: "var(--ink-soft)",
          letterSpacing: "0.1em"
        }
      }, lot.w, "\u2032 WIDE"), /*#__PURE__*/React.createElement("div", {
        style: {
          ...lblStyle,
          left: -lab * 2,
          top: lot.h * SCALE / 2,
          transform: "translate(-50%,-50%) rotate(-90deg)",
          fontSize: 10 / zoom,
          color: "var(--ink-soft)",
          letterSpacing: "0.1em"
        }
      }, lot.h, "\u2032 DEEP"));
    })(), showLayer("emergency") && emPath && /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        inset: 0,
        overflow: "visible"
      },
      width: lotPxW,
      height: lotPxH
    }, /*#__PURE__*/React.createElement("polyline", {
      points: emPath.path.map(p => `${p.x * SCALE},${p.y * SCALE}`).join(" "),
      fill: "none",
      stroke: "rgba(194,74,58,0.18)",
      strokeWidth: emPath.width * SCALE,
      strokeLinejoin: "round",
      strokeLinecap: "round"
    }), /*#__PURE__*/React.createElement("polyline", {
      points: emPath.path.map(p => `${p.x * SCALE},${p.y * SCALE}`).join(" "),
      fill: "none",
      stroke: "var(--c-emergency)",
      strokeWidth: 2,
      strokeDasharray: "10 8",
      strokeLinejoin: "round",
      style: {
        animation: "dash 1s linear infinite"
      }
    }), /*#__PURE__*/React.createElement("text", {
      x: emPath.path[0].x * SCALE + 8,
      y: emPath.path[0].y * SCALE - 8,
      fill: "var(--c-emergency)",
      fontFamily: "var(--font-mono)",
      fontSize: 11,
      fontWeight: "700"
    }, "EMERGENCY LANE \xB7 ", emPath.width, "\u2032 CLEAR")), isEditing && showLayer("emergency") && emPath && /*#__PURE__*/React.createElement(React.Fragment, null, emPath.path.slice(0, -1).map((p, i) => {
      const n = emPath.path[i + 1];
      const mx = (p.x + n.x) / 2,
        my = (p.y + n.y) / 2;
      return /*#__PURE__*/React.createElement("div", {
        key: "emid" + i,
        title: "Insert point",
        onPointerDown: e => {
          if (spaceDown) return;
          e.stopPropagation();
        },
        onClick: e => {
          e.stopPropagation();
          const path = [...emPath.path];
          path.splice(i + 1, 0, {
            x: Math.round(mx),
            y: Math.round(my)
          });
          props.onUpdateEmergency({
            ...emPath,
            path
          });
        },
        style: {
          position: "absolute",
          left: mx * SCALE,
          top: my * SCALE,
          width: 14,
          height: 14,
          transform: `translate(-50%,-50%) scale(${1 / zoom})`,
          borderRadius: 999,
          background: "var(--panel)",
          border: "1.5px dashed var(--c-emergency)",
          color: "var(--c-emergency)",
          cursor: "copy",
          zIndex: 46,
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }
      }, /*#__PURE__*/React.createElement(window.Icon, {
        name: "plus",
        size: 9,
        stroke: 2.5
      }));
    }), emPath.path.map((p, i) => /*#__PURE__*/React.createElement("div", {
      key: "emvtx" + i,
      title: "Drag to move \xB7 double-click to remove",
      onPointerDown: e => {
        if (spaceDown) return;
        e.stopPropagation();
        drag.current = {
          type: "emvtx",
          idx: i
        };
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      onDoubleClick: e => {
        e.stopPropagation();
        if (emPath.path.length <= 2) {
          window.toast && window.toast("A lane needs at least 2 points", "err");
          return;
        }
        props.onUpdateEmergency({
          ...emPath,
          path: emPath.path.filter((_, k) => k !== i)
        });
      },
      style: {
        position: "absolute",
        left: p.x * SCALE,
        top: p.y * SCALE,
        width: 16,
        height: 16,
        transform: `translate(-50%,-50%) scale(${1 / zoom})`,
        borderRadius: 999,
        background: "var(--c-emergency)",
        border: "2.5px solid var(--panel)",
        cursor: "move",
        zIndex: 47,
        pointerEvents: "auto",
        boxShadow: "var(--shadow-md)"
      }
    }))), objects.map(o => {
      const isPlace = ["stage", "food", "ticketing", "restroom", "building", "entrance", "patch"].includes(o.kind);
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
      if (isPower) return /*#__PURE__*/React.createElement(PowerDrop, {
        key: o.id,
        o: o,
        sel: selection.includes(o.id),
        zoom: zoom,
        editing: isEditing,
        onDown: e => onObjDown(e, o, "move"),
        onEdit: () => props.onObjectEdit && props.onObjectEdit(o.id),
        onResize: e => {
          if (spaceDown) return;
          e.stopPropagation();
          onSelectionChange([o.id]);
          drag.current = {
            type: "ptsize",
            id: o.id
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      });
      if (isWater) return /*#__PURE__*/React.createElement(WaterTap, {
        key: o.id,
        o: o,
        sel: selection.includes(o.id),
        zoom: zoom,
        editing: isEditing,
        onDown: e => onObjDown(e, o, "move"),
        onEdit: () => props.onObjectEdit && props.onObjectEdit(o.id),
        onResize: e => {
          if (spaceDown) return;
          e.stopPropagation();
          onSelectionChange([o.id]);
          drag.current = {
            type: "ptsize",
            id: o.id
          };
          e.currentTarget.setPointerCapture(e.pointerId);
        }
      });
      const sel = selection.includes(o.id);
      const dim = mode === "vendor" && vendorFocusId != null && o.id !== vendorFocusId || dimNonRoute && o.id !== routeTargetId && isBooth;
      const x = o.x * SCALE,
        y = o.y * SCALE,
        w = o.w * SCALE,
        h = o.h * SCALE;
      let bg,
        border,
        txt,
        radius = 8,
        dashed = false,
        icon = null;
      if (isBooth) {
        const cc = colorFor(o);
        bg = cc;
        border = "rgba(0,0,0,0.18)";
        txt = "#FBFAF6";
        radius = 7;
      } else {
        const ps = PLACE_STYLE[o.kind] || PLACE_STYLE.building;
        bg = ps.fill;
        border = ps.stroke;
        txt = ps.text;
        radius = ps.radius;
        dashed = ps.dashed;
        icon = ps.icon;
      }
      const clickable = isEditing ? selectable(o) : true;
      const labelOn = showLayer("labels");
      return /*#__PURE__*/React.createElement("div", {
        key: o.id,
        onPointerDown: e => onObjDown(e, o, "move"),
        onDoubleClick: e => {
          if (isEditing && selectable(o)) {
            e.stopPropagation();
            props.onObjectEdit && props.onObjectEdit(o.id);
          }
        },
        style: {
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          transform: o.rot ? `rotate(${o.rot}deg)` : undefined,
          transformOrigin: "center",
          background: bg,
          border: `${dashed ? "1.5px dashed" : "1px solid"} ${border}`,
          borderRadius: radius,
          color: txt,
          pointerEvents: clickable ? "auto" : "none",
          cursor: isEditing ? selectable(o) ? "move" : "default" : clickable ? "pointer" : "default",
          opacity: dim ? 0.28 : 1,
          transition: "opacity 220ms, box-shadow 160ms",
          boxShadow: sel ? "0 0 0 2px var(--accent), var(--shadow-md)" : isBooth ? "var(--shadow-sm)" : "var(--shadow-sm)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "visible",
          zIndex: sel ? 40 : isBooth ? 10 : 6
        }
      }, mode === "utility" && isBooth && o.powerKW != null && /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          top: -7,
          right: -7,
          background: "var(--c-power)",
          color: "#3a2c10",
          fontFamily: "var(--font-mono)",
          fontSize: 8.5,
          fontWeight: 700,
          padding: "1px 4px",
          borderRadius: 5,
          boxShadow: "var(--shadow-sm)"
        }
      }, o.powerKW, "kW"), isEditing && isBooth && o.status && w > 16 && /*#__PURE__*/React.createElement("div", {
        title: o.status,
        style: {
          position: "absolute",
          top: 3,
          right: 3,
          width: 6,
          height: 6,
          borderRadius: 999,
          background: (STATUS[o.status] || STATUS.pending).color,
          boxShadow: "0 0 0 1.5px rgba(255,255,255,0.7)"
        }
      }), /*#__PURE__*/React.createElement("div", {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          padding: 2,
          textAlign: "center",
          pointerEvents: "none",
          lineHeight: 1.05
        }
      }, icon && w > 28 && /*#__PURE__*/React.createElement(window.Icon, {
        name: icon,
        size: Math.min(18, w * 0.3),
        stroke: 1.6
      }), isBooth ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: Math.min(13, Math.max(7, w * 0.3))
        }
      }, initials(o.label)), labelOn && w > 30 && /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "var(--font-display)",
          fontWeight: 500,
          fontSize: Math.min(8, Math.max(5, w * 0.08)),
          maxWidth: w - 4,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis"
        }
      }, o.label)) : labelOn && w > 30 && /*#__PURE__*/React.createElement("div", {
        style: {
          fontFamily: "var(--font-mono)",
          fontSize: Math.min(10, Math.max(7, w * 0.07)),
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          maxWidth: w - 6
        }
      }, o.label)), isEditing && sel && selection.length === 1 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
        onPointerDown: e => onObjDown(e, o, "resize"),
        style: {
          position: "absolute",
          right: -6,
          bottom: -6,
          width: 13,
          height: 13,
          background: "var(--accent)",
          border: "2px solid var(--panel)",
          borderRadius: 4,
          cursor: "nwse-resize",
          pointerEvents: "auto"
        }
      }), o.kind === "booth" || isPlace ? /*#__PURE__*/React.createElement("div", {
        onPointerDown: e => onObjDown(e, o, "rotate"),
        style: {
          position: "absolute",
          left: "50%",
          top: -22,
          width: 13,
          height: 13,
          marginLeft: -6.5,
          background: "var(--panel)",
          border: "2px solid var(--accent)",
          borderRadius: 999,
          cursor: "grab",
          pointerEvents: "auto"
        }
      }) : null));
    }), guides.map((g, i) => g.vert ? /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: "absolute",
        left: g.at * SCALE - 0.5,
        top: -40,
        bottom: -40,
        width: 1,
        background: "var(--accent)",
        pointerEvents: "none",
        opacity: 0.9
      }
    }) : /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        position: "absolute",
        top: g.at * SCALE - 0.5,
        left: -40,
        right: -40,
        height: 1,
        background: "var(--accent)",
        pointerEvents: "none",
        opacity: 0.9
      }
    })), /*#__PURE__*/React.createElement(MeasureLayer, {
      measurements: measurements,
      draft: measureDraft,
      scale: SCALE,
      zoom: zoom,
      editing: isEditing,
      onDelete: props.onDeleteMeasurement
    }), (doc.comments || []).map(c => mode === "organizer" && /*#__PURE__*/React.createElement(CommentPin, {
      key: c.id,
      c: c,
      scale: SCALE,
      zoom: zoom,
      onOpen: () => props.onOpenComment && props.onOpenComment(c.id)
    })), mode === "attendee" && routeTargetId != null && byId[routeTargetId] && /*#__PURE__*/React.createElement(RouteOverlay, {
      from: props.attendeePos,
      to: byId[routeTargetId],
      scale: SCALE,
      zoom: zoom
    }), mode === "attendee" && props.attendeePos && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: props.attendeePos.x * SCALE - 7,
        top: props.attendeePos.y * SCALE - 7,
        width: 14,
        height: 14,
        borderRadius: 999,
        background: "var(--c-water)",
        border: "2.5px solid #fff",
        boxShadow: "0 1px 5px rgba(0,0,0,0.4)",
        animation: "blueDot 2s ease-out infinite",
        zIndex: 60,
        pointerEvents: "none"
      }
    }), arrowTargetId != null && byId[arrowTargetId] && /*#__PURE__*/React.createElement(Highlight, {
      o: byId[arrowTargetId],
      scale: SCALE,
      zoom: zoom
    })), marquee && (() => {
      const x0 = Math.min(marquee.x0, marquee.x1) * SCALE * zoom + pan.x,
        y0 = Math.min(marquee.y0, marquee.y1) * SCALE * zoom + pan.y,
        ww = Math.abs(marquee.x1 - marquee.x0) * SCALE * zoom,
        hh = Math.abs(marquee.y1 - marquee.y0) * SCALE * zoom;
      return /*#__PURE__*/React.createElement("div", {
        style: {
          position: "absolute",
          left: x0,
          top: y0,
          width: ww,
          height: hh,
          background: "var(--sel)",
          border: "1px solid var(--accent)",
          pointerEvents: "none",
          borderRadius: 3
        }
      });
    })(), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: 16,
        bottom: 16,
        display: "flex",
        alignItems: "center",
        gap: 8,
        zIndex: 50
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "panel",
      style: {
        display: "flex",
        alignItems: "center",
        padding: 4,
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 32,
        height: 32
      },
      onClick: () => zoomBtn(-1)
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "zoomOut",
      size: 17
    })), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        width: 46,
        textAlign: "center",
        fontSize: 11,
        color: "var(--ink-soft)"
      }
    }, Math.round(zoom * 100), "%"), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 32,
        height: 32
      },
      onClick: () => zoomBtn(1)
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "zoomIn",
      size: 17
    }))), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn panel",
      style: {
        width: 38,
        height: 38
      },
      onClick: () => fit(),
      title: "Fit to screen"
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "fit",
      size: 17
    }))), /*#__PURE__*/React.createElement("div", {
      className: "panel",
      style: {
        position: "absolute",
        left: 16,
        top: 16,
        width: 42,
        height: 42,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        color: "var(--ink-soft)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 3,
        fontFamily: "var(--font-mono)",
        fontSize: 8,
        fontWeight: 700,
        color: "var(--accent)"
      }
    }, "N"), /*#__PURE__*/React.createElement(window.Icon, {
      name: "compass",
      size: 20
    })));
  });

  /* ---- sub-components ---- */
  function PowerDrop({
    o,
    sel,
    onDown,
    onEdit,
    editing,
    zoom,
    onResize
  }) {
    const s = (o.size || 4.5) * SCALE;
    const x = o.x * SCALE,
      y = o.y * SCALE;
    return /*#__PURE__*/React.createElement("div", {
      onPointerDown: editing ? onDown : undefined,
      onDoubleClick: editing ? onEdit : undefined,
      style: {
        position: "absolute",
        left: x - s / 2,
        top: y - s / 2,
        width: s,
        height: s,
        borderRadius: Math.max(3, s * 0.28),
        background: "var(--c-power)",
        border: "1.5px solid #9a7c1d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#3a2c10",
        boxShadow: sel ? "0 0 0 2px var(--accent), var(--shadow-md)" : "var(--shadow-sm)",
        zIndex: sel ? 40 : 12,
        cursor: editing ? "move" : "default",
        pointerEvents: editing ? "auto" : "none"
      },
      title: `Power drop · ${o.amps}A`
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "bolt",
      size: Math.max(8, s * 0.58),
      stroke: 2,
      fill: "#3a2c10"
    }), editing && sel && /*#__PURE__*/React.createElement("div", {
      onPointerDown: onResize,
      style: {
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 12,
        height: 12,
        transform: `translate(50%,50%) scale(${1 / zoom})`,
        background: "var(--accent)",
        border: "2px solid var(--panel)",
        borderRadius: 3,
        cursor: "nwse-resize",
        pointerEvents: "auto"
      }
    }));
  }
  function WaterTap({
    o,
    sel,
    onDown,
    onEdit,
    editing,
    zoom,
    onResize
  }) {
    const s = (o.size || 4.5) * SCALE;
    const x = o.x * SCALE,
      y = o.y * SCALE;
    return /*#__PURE__*/React.createElement("div", {
      onPointerDown: editing ? onDown : undefined,
      onDoubleClick: editing ? onEdit : undefined,
      style: {
        position: "absolute",
        left: x - s / 2,
        top: y - s / 2,
        width: s,
        height: s,
        borderRadius: 999,
        background: "var(--c-water)",
        border: "1.5px solid #3f6678",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        boxShadow: sel ? "0 0 0 2px var(--accent), var(--shadow-md)" : "var(--shadow-sm)",
        zIndex: sel ? 40 : 12,
        cursor: editing ? "move" : "default",
        pointerEvents: editing ? "auto" : "none"
      },
      title: `Water · ${o.gpm} GPM`
    }, /*#__PURE__*/React.createElement(window.Icon, {
      name: "droplet",
      size: Math.max(8, s * 0.58),
      stroke: 2,
      fill: "#fff"
    }), editing && sel && /*#__PURE__*/React.createElement("div", {
      onPointerDown: onResize,
      style: {
        position: "absolute",
        right: 0,
        bottom: 0,
        width: 12,
        height: 12,
        transform: `translate(50%,50%) scale(${1 / zoom})`,
        background: "var(--accent)",
        border: "2px solid var(--panel)",
        borderRadius: 3,
        cursor: "nwse-resize",
        pointerEvents: "auto"
      }
    }));
  }
  function MeasureLayer({
    measurements,
    draft,
    scale,
    zoom,
    editing,
    onDelete
  }) {
    const saved = measurements || [];
    const all = [...saved];
    if (draft) all.push(draft);
    if (!all.length) return null;
    return /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 55
      }
    }, all.map((m, i) => {
      const ax = m.a.x * scale,
        ay = m.a.y * scale,
        bx = m.b.x * scale,
        by = m.b.y * scale;
      const len = Math.hypot(m.b.x - m.a.x, m.b.y - m.a.y);
      const mx = (ax + bx) / 2,
        my = (ay + by) / 2;
      const isSaved = i < saved.length;
      const canDel = editing && isSaved && onDelete;
      return /*#__PURE__*/React.createElement("g", {
        key: i,
        style: {
          cursor: canDel ? "pointer" : "default",
          pointerEvents: canDel ? "auto" : "none"
        },
        onPointerDown: canDel ? e => e.stopPropagation() : undefined,
        onClick: canDel ? e => {
          e.stopPropagation();
          onDelete(i);
        } : undefined
      }, canDel && /*#__PURE__*/React.createElement("line", {
        x1: ax,
        y1: ay,
        x2: bx,
        y2: by,
        stroke: "transparent",
        strokeWidth: 16 / zoom
      }), /*#__PURE__*/React.createElement("line", {
        x1: ax,
        y1: ay,
        x2: bx,
        y2: by,
        stroke: "var(--accent)",
        strokeWidth: 2 / zoom,
        strokeDasharray: `${6 / zoom} ${4 / zoom}`,
        pointerEvents: "none"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: ax,
        cy: ay,
        r: 3.5 / zoom,
        fill: "var(--accent)",
        pointerEvents: "none"
      }), /*#__PURE__*/React.createElement("circle", {
        cx: bx,
        cy: by,
        r: 3.5 / zoom,
        fill: "var(--accent)",
        pointerEvents: "none"
      }), /*#__PURE__*/React.createElement("g", {
        transform: `translate(${mx},${my})`,
        pointerEvents: "none"
      }, /*#__PURE__*/React.createElement("rect", {
        x: -22 / zoom,
        y: -9 / zoom,
        width: 44 / zoom,
        height: 18 / zoom,
        rx: 4 / zoom,
        fill: "var(--accent)"
      }), /*#__PURE__*/React.createElement("text", {
        x: 0,
        y: 0,
        textAnchor: "middle",
        dominantBaseline: "central",
        fill: "#fff",
        fontFamily: "var(--font-mono)",
        fontSize: 11 / zoom,
        fontWeight: "700"
      }, len.toFixed(1), "\u2032")));
    }));
  }
  function CommentPin({
    c,
    scale,
    zoom,
    onOpen
  }) {
    return /*#__PURE__*/React.createElement("div", {
      onPointerDown: e => {
        e.stopPropagation();
        onOpen();
      },
      style: {
        position: "absolute",
        left: c.x * scale - 13,
        top: c.y * scale - 26,
        width: 26,
        height: 26,
        cursor: "pointer",
        zIndex: 58,
        pointerEvents: "auto",
        transform: `scale(${1 / zoom})`,
        transformOrigin: "bottom center"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        width: 26,
        height: 26,
        borderRadius: "50% 50% 50% 2px",
        background: c.color || "#AA7050",
        border: "2px solid #fff",
        boxShadow: "var(--shadow-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700,
        transform: "rotate(45deg)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        transform: "rotate(-45deg)"
      }
    }, c.initials || "?")));
  }
  function RouteOverlay({
    from,
    to,
    scale,
    zoom
  }) {
    if (!from) return null;
    const ax = from.x * scale,
      ay = from.y * scale,
      bx = (to.x + to.w / 2) * scale,
      by = (to.y + to.h / 2) * scale;
    // simple L-route
    const pts = `${ax},${ay} ${ax},${by} ${bx},${by}`;
    return /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 50
      }
    }, /*#__PURE__*/React.createElement("polyline", {
      points: pts,
      fill: "none",
      stroke: "var(--c-water)",
      strokeWidth: 4 / zoom,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      opacity: "0.35"
    }), /*#__PURE__*/React.createElement("polyline", {
      points: pts,
      fill: "none",
      stroke: "var(--c-water)",
      strokeWidth: 2.5 / zoom,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeDasharray: `${2 / zoom} ${7 / zoom}`,
      style: {
        animation: "dash 0.8s linear infinite"
      }
    }));
  }
  function Highlight({
    o,
    scale,
    zoom
  }) {
    const x = o.x * scale,
      y = o.y * scale,
      w = o.w * scale,
      h = o.h * scale;
    return /*#__PURE__*/React.createElement("svg", {
      style: {
        position: "absolute",
        inset: 0,
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 90
      }
    }, /*#__PURE__*/React.createElement("rect", {
      x: x - 7,
      y: y - 7,
      width: w + 14,
      height: h + 14,
      rx: 8,
      fill: "none",
      stroke: "var(--accent)",
      strokeWidth: 3 / zoom,
      style: {
        transformOrigin: `${x + w / 2}px ${y + h / 2}px`,
        animation: "pulseRing 1.3s ease-in-out infinite"
      }
    }));
  }
  window.StudioCanvas = StudioCanvas;
  window.STUDIO_SCALE = SCALE;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/Canvas.jsx", error: String((e && e.message) || e) }); }

// studio/Chrome.jsx
try { (() => {
/* Chrome.jsx — TopBar, ToolDock, ModeSwitcher, VersionMenu, ShareMenu,
   AttendeeBar (mobile-style search + route). window.StudioChrome */
(function () {
  const {
    useState,
    useRef,
    useEffect
  } = React;
  const {
    STUDIO
  } = window;
  const {
    EVENT,
    TEAM,
    CATEGORIES,
    CAT_KEYS,
    colorFor
  } = STUDIO;
  const Icon = window.Icon;
  const MODES = [{
    key: "organizer",
    label: "Organizer",
    icon: "settings"
  }, {
    key: "utility",
    label: "Utility",
    icon: "bolt"
  }, {
    key: "vendor",
    label: "Vendor",
    icon: "flag"
  }, {
    key: "attendee",
    label: "Attendee",
    icon: "nav"
  }];

  /* ───────── TopBar ───────── */
  function TopBar({
    mode,
    setMode,
    theme,
    setTheme,
    layouts,
    activeIndex,
    setActiveIndex,
    onDuplicateLayout,
    onRename,
    published,
    onTogglePublished,
    onDeleteLayout,
    onShare,
    onExport,
    onDownloadBackup,
    onRestoreBackup
  }) {
    const [verOpen, setVerOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [editingName, setEditingName] = useState(false);
    const restoreRef = useRef(null);
    const active = layouts[activeIndex];
    return /*#__PURE__*/React.createElement("header", {
      style: {
        height: 56,
        flexShrink: 0,
        background: "var(--topbar)",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 14px",
        position: "relative",
        zIndex: 70
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: theme === "dark" ? "assets/logo-primary-crema.png" : "assets/logo-primary-black.png",
      alt: "TCCF",
      style: {
        height: 28
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "hide-md",
      style: {
        borderLeft: "1px solid var(--line)",
        paddingLeft: 11
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: 12.5,
        fontWeight: 600,
        lineHeight: 1,
        color: "var(--ink)"
      }
    }, "Festival Studio"), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9,
        color: "var(--ink-faint)",
        marginTop: 3,
        letterSpacing: "0.1em"
      }
    }, EVENT.date))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "pill",
      onClick: () => setVerOpen(v => !v),
      style: {
        maxWidth: 230
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: published ? "#5d6b3c" : "#b07d2e",
        flexShrink: 0
      }
    }), editingName ? /*#__PURE__*/React.createElement("input", {
      autoFocus: true,
      defaultValue: active.name,
      onClick: e => e.stopPropagation(),
      onBlur: e => {
        onRename(e.target.value || active.name);
        setEditingName(false);
      },
      onKeyDown: e => {
        if (e.key === "Enter") {
          onRename(e.target.value || active.name);
          setEditingName(false);
        }
      },
      style: {
        background: "transparent",
        border: "none",
        outline: "none",
        color: "var(--ink)",
        font: "inherit",
        width: 150
      }
    }) : /*#__PURE__*/React.createElement("span", {
      onDoubleClick: e => {
        e.stopPropagation();
        setEditingName(true);
      },
      style: {
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        textTransform: "none",
        letterSpacing: 0,
        fontFamily: "var(--font-body)",
        fontSize: 12.5
      }
    }, active.name), /*#__PURE__*/React.createElement(Icon, {
      name: "chevronDown",
      size: 14
    })), verOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1
      },
      onClick: () => setVerOpen(false)
    }), /*#__PURE__*/React.createElement("div", {
      className: "panel anim-pop",
      style: {
        position: "absolute",
        top: 44,
        left: 0,
        width: 280,
        padding: 8,
        zIndex: 2,
        boxShadow: "var(--shadow-lg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kicker",
      style: {
        padding: "4px 8px 8px"
      }
    }, "Layout Versions"), layouts.map((l, i) => /*#__PURE__*/React.createElement("div", {
      key: i,
      onClick: () => {
        setActiveIndex(i);
        setVerOpen(false);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        padding: "9px 8px",
        borderRadius: 9,
        cursor: "pointer",
        background: i === activeIndex ? "var(--sel)" : "transparent"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: l.published ? "#5d6b3c" : "#b07d2e"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--ink)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, l.name), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9,
        color: "var(--ink-faint)",
        marginTop: 1
      }
    }, l.objects.filter(o => o.kind === "booth").length, " booths \xB7 ", l.published ? "Published" : "Draft")), i === activeIndex && /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 15,
      style: {
        color: "var(--accent)"
      }
    }), layouts.length > 1 && /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 26,
        height: 26
      },
      onClick: e => {
        e.stopPropagation();
        onDeleteLayout(i);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 13
    })))), /*#__PURE__*/React.createElement("div", {
      style: {
        borderTop: "1px solid var(--line)",
        marginTop: 6,
        paddingTop: 6,
        display: "grid",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        width: "100%",
        justifyContent: "flex-start",
        border: "none"
      },
      onClick: () => {
        onDuplicateLayout();
        setVerOpen(false);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "copy",
      size: 14
    }), " Duplicate this layout"), /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        width: "100%",
        justifyContent: "flex-start",
        border: "none"
      },
      onClick: onTogglePublished
    }, /*#__PURE__*/React.createElement(Icon, {
      name: published ? "eyeOff" : "check",
      size: 14
    }), " ", published ? "Unpublish (set draft)" : "Publish layout"))))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)"
      },
      className: "hide-sm"
    }, /*#__PURE__*/React.createElement("div", {
      className: "seg"
    }, MODES.map(m => /*#__PURE__*/React.createElement("button", {
      key: m.key,
      className: mode === m.key ? "on" : "",
      onClick: () => setMode(m.key)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: m.icon,
      size: 13
    }), m.label)))), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "hide-md",
      style: {
        display: "flex",
        alignItems: "center"
      }
    }, TEAM.map((t, i) => /*#__PURE__*/React.createElement("div", {
      key: t.name,
      title: t.name + " · editing",
      style: {
        width: 28,
        height: 28,
        borderRadius: 999,
        background: t.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 9.5,
        fontWeight: 700,
        border: "2px solid var(--topbar)",
        marginLeft: i ? -8 : 0
      }
    }, t.initials)), /*#__PURE__*/React.createElement("div", {
      style: {
        marginLeft: 8,
        display: "flex",
        alignItems: "center",
        gap: 5
      },
      className: "mono"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: "#5d6b3c",
        boxShadow: "0 0 0 3px rgba(93,107,60,0.2)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 9.5,
        color: "var(--ink-faint)"
      }
    }, "LIVE"))), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      onClick: () => setTheme(theme === "dark" ? "light" : "dark"),
      title: "Toggle theme"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: theme === "dark" ? "sun" : "moon",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      },
      className: "hide-sm"
    }, /*#__PURE__*/React.createElement("button", {
      className: "pill",
      onClick: () => setExportOpen(s => !s)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "download",
      size: 15
    }), " Export ", /*#__PURE__*/React.createElement(Icon, {
      name: "chevronDown",
      size: 13
    })), exportOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1
      },
      onClick: () => setExportOpen(false)
    }), /*#__PURE__*/React.createElement("input", {
      ref: restoreRef,
      type: "file",
      accept: "application/json,.json",
      hidden: true,
      onChange: e => {
        const f = e.target.files && e.target.files[0];
        if (f) onRestoreBackup(f);
        e.target.value = "";
        setExportOpen(false);
      }
    }), /*#__PURE__*/React.createElement("div", {
      className: "panel anim-pop",
      style: {
        position: "absolute",
        top: 44,
        right: 0,
        width: 280,
        padding: 8,
        zIndex: 2,
        boxShadow: "var(--shadow-lg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kicker",
      style: {
        padding: "4px 8px 8px"
      }
    }, "Export & Backup"), [["download", "Export map as PNG", "Current view · high-res image", () => {
      onExport();
      setExportOpen(false);
    }], ["copy", "Download backup", "Saves all layouts to a .json file", () => {
      onDownloadBackup();
      setExportOpen(false);
    }], ["undo", "Restore from backup…", "Load a .json backup file", () => {
      restoreRef.current && restoreRef.current.click();
    }]].map(([ic, t, d, fn]) => /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: fn,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        padding: "10px 8px",
        borderRadius: 9,
        border: "none",
        background: "transparent",
        textAlign: "left",
        cursor: "pointer"
      },
      onMouseEnter: e => e.currentTarget.style.background = "var(--panel-2)",
      onMouseLeave: e => e.currentTarget.style.background = "transparent"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        background: "var(--panel-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent)",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 16
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: "var(--ink)"
      }
    }, t), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9.5,
        color: "var(--ink-faint)",
        marginTop: 2
      }
    }, d))))))), /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "pill accent",
      onClick: () => setShareOpen(s => !s)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "share",
      size: 14
    }), " Share"), shareOpen && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        inset: 0,
        zIndex: 1
      },
      onClick: () => setShareOpen(false)
    }), /*#__PURE__*/React.createElement("div", {
      className: "panel anim-pop",
      style: {
        position: "absolute",
        top: 44,
        right: 0,
        width: 300,
        padding: 14,
        zIndex: 2,
        boxShadow: "var(--shadow-lg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kicker",
      style: {
        marginBottom: 10
      }
    }, "Share this layout"), [["nav", "Attendee map", "Public link · search & navigate"], ["flag", "Vendor packet", "Booth + load-in details"], ["bolt", "Utility map", "For power & ops teams"]].map(([ic, t, d]) => /*#__PURE__*/React.createElement("button", {
      key: t,
      onClick: () => {
        onShare(t);
        setShareOpen(false);
      },
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        padding: "10px 8px",
        borderRadius: 9,
        border: "none",
        background: "transparent",
        textAlign: "left",
        cursor: "pointer"
      },
      onMouseEnter: e => e.currentTarget.style.background = "var(--panel-2)",
      onMouseLeave: e => e.currentTarget.style.background = "transparent"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 34,
        height: 34,
        borderRadius: 9,
        background: "var(--panel-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent)",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: ic,
      size: 17
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: "var(--ink)"
      }
    }, t), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9.5,
        color: "var(--ink-faint)",
        marginTop: 2
      }
    }, d)))))))));
  }

  /* ───────── Floating tool dock (organizer) ───────── */
  function ToolDock({
    tool,
    setTool,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    snapGrid,
    setSnapGrid
  }) {
    const tools = [{
      key: "select",
      icon: "cursor",
      label: "Select / move (V)"
    }, {
      key: "pan",
      icon: "hand",
      label: "Pan — or hold Space (H)"
    }, {
      key: "measure",
      icon: "ruler",
      label: "Measure (M)"
    }, {
      key: "comment",
      icon: "comment",
      label: "Comment (C)"
    }];
    return /*#__PURE__*/React.createElement("div", {
      className: "panel anim-slide-up",
      style: {
        position: "absolute",
        left: "50%",
        bottom: 18,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: 5,
        zIndex: 50,
        boxShadow: "var(--shadow-lg)"
      }
    }, tools.map(t => /*#__PURE__*/React.createElement("button", {
      key: t.key,
      className: "iconbtn" + (tool === t.key ? " active" : ""),
      onClick: () => setTool(t.key),
      title: t.label
    }, /*#__PURE__*/React.createElement(Icon, {
      name: t.icon,
      size: 18
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1,
        height: 24,
        background: "var(--line)",
        margin: "0 3px"
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn" + (snapGrid ? " active" : ""),
      onClick: () => setSnapGrid(!snapGrid),
      title: "Snap to grid"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "grid",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        width: 1,
        height: 24,
        background: "var(--line)",
        margin: "0 3px"
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      onClick: onUndo,
      disabled: !canUndo,
      title: "Undo (\u2318Z)"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "undo",
      size: 18
    })), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      onClick: onRedo,
      disabled: !canRedo,
      title: "Redo (\u2318\u21E7Z)"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "redo",
      size: 18
    })));
  }

  /* ───────── Attendee bar (mobile-style overlay) ───────── */
  function AttendeeBar({
    doc,
    onFocus,
    routeTarget,
    setRouteTarget
  }) {
    const [q, setQ] = useState("");
    const [open, setOpen] = useState(false);
    const [favs, setFavs] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("tccf_favs") || "[]");
      } catch (e) {
        return [];
      }
    });
    const [catF, setCatF] = useState(null);
    const booths = doc.objects.filter(o => o.kind === "booth");
    const matches = booths.filter(b => (!catF || b.category === catF) && (!q.trim() || (b.label || "").toLowerCase().includes(q.toLowerCase()))).slice(0, 40);
    const target = routeTarget != null ? booths.find(b => b.id === routeTarget) : null;
    const toggleFav = id => {
      setFavs(f => {
        const n = f.includes(id) ? f.filter(x => x !== id) : [...f, id];
        try {
          localStorage.setItem("tccf_favs", JSON.stringify(n));
        } catch (e) {}
        return n;
      });
    };

    // estimate walking time: rough, 1 ft ~ 0.32s walking; assume from main entrance
    const walkMin = target ? Math.max(1, Math.round((Math.abs(132 - (target.x + target.w / 2)) + Math.abs(382 - (target.y + target.h / 2))) * 0.32 / 60)) : 0;
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 45,
        pointerEvents: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        maxWidth: 440,
        margin: "14px auto 0",
        padding: "0 14px",
        pointerEvents: "auto"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "panel",
      style: {
        padding: 8,
        boxShadow: "var(--shadow-lg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 13,
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--ink-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 17
    })), /*#__PURE__*/React.createElement("input", {
      className: "tin",
      style: {
        height: 44,
        paddingLeft: 38,
        fontSize: 15,
        background: "var(--panel)"
      },
      placeholder: "Find a vendor or booth\u2026",
      value: q,
      onChange: e => {
        setQ(e.target.value);
        setOpen(true);
      },
      onFocus: () => setOpen(true)
    }), q && /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        position: "absolute",
        right: 4,
        top: 4,
        width: 36,
        height: 36
      },
      onClick: () => {
        setQ("");
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 16
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 6,
        marginTop: 8,
        overflowX: "auto",
        paddingBottom: 2
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setCatF(null),
      style: attChip(catF === null)
    }, "All"), CAT_KEYS.map(k => /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => setCatF(catF === k ? null : k),
      style: attChip(catF === k, CATEGORIES[k].color)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: CATEGORIES[k].color
      }
    }), k)))), open && (q.trim() || catF) && /*#__PURE__*/React.createElement("div", {
      className: "panel anim-slide-up",
      style: {
        marginTop: 8,
        maxHeight: "52vh",
        overflowY: "auto",
        boxShadow: "var(--shadow-lg)",
        pointerEvents: "auto"
      }
    }, matches.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 26,
        textAlign: "center",
        color: "var(--ink-faint)",
        fontSize: 14
      }
    }, "No vendors found"), matches.map(b => /*#__PURE__*/React.createElement("div", {
      key: b.id,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 11,
        padding: "10px 12px",
        borderBottom: "1px solid var(--line)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 32,
        height: 32,
        borderRadius: 8,
        background: colorFor(b),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 11,
        flexShrink: 0
      }
    }, (b.label || "").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0,
        cursor: "pointer"
      },
      onClick: () => {
        onFocus(b.id);
        setOpen(false);
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 14,
        fontWeight: 500,
        color: "var(--ink)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, b.label), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9.5,
        color: "var(--ink-faint)",
        marginTop: 1
      }
    }, b.category)), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 32,
        height: 32
      },
      onClick: () => toggleFav(b.id)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "star",
      size: 16,
      fill: favs.includes(b.id) ? "var(--accent)" : "none",
      style: {
        color: favs.includes(b.id) ? "var(--accent)" : "var(--ink-faint)"
      }
    })), /*#__PURE__*/React.createElement("button", {
      className: "pill accent",
      style: {
        height: 32,
        padding: "0 11px"
      },
      onClick: () => {
        setRouteTarget(b.id);
        onFocus(b.id);
        setOpen(false);
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "nav",
      size: 13
    })))))), target && /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 16,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "panel anim-slide-up",
      style: {
        width: "min(440px, calc(100% - 28px))",
        padding: 14,
        display: "flex",
        alignItems: "center",
        gap: 13,
        boxShadow: "var(--shadow-lg)",
        pointerEvents: "auto"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 44,
        height: 44,
        borderRadius: 11,
        background: colorFor(target),
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 14,
        flexShrink: 0
      }
    }, (target.label || "").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kicker",
      style: {
        color: "var(--c-water)"
      }
    }, "Navigating to"), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: 16,
        fontWeight: 600,
        color: "var(--ink)",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, target.label), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 10,
        color: "var(--ink-soft)",
        marginTop: 2,
        display: "flex",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
      name: "clock",
      size: 11,
      style: {
        verticalAlign: "-1px"
      }
    }), " ~", walkMin, " min walk"), /*#__PURE__*/React.createElement("span", null, target.category))), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 40,
        height: 40
      },
      onClick: () => setRouteTarget(null)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 18
    })))));
  }
  function attChip(on, color) {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 30,
      padding: "0 12px",
      borderRadius: 999,
      border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`,
      background: on ? "var(--sel)" : "var(--panel)",
      color: on ? "var(--ink)" : "var(--ink-soft)",
      fontFamily: "var(--font-mono)",
      fontSize: 10.5,
      whiteSpace: "nowrap",
      cursor: "pointer",
      flexShrink: 0
    };
  }

  /* ───────── mode banner for non-organizer ───────── */
  function ModeBanner({
    mode
  }) {
    const meta = {
      utility: {
        icon: "bolt",
        t: "Utility & Power View",
        d: "Generators, power drops, water, and emergency lanes. Booth power needs shown as badges."
      },
      vendor: {
        icon: "flag",
        t: "Vendor View",
        d: "What vendors see — their booth, neighbors, utilities, and load-in instructions."
      },
      attendee: {
        icon: "nav",
        t: "Attendee Map",
        d: "The public, mobile-friendly experience. Search, favorite, and navigate to any booth."
      }
    }[mode];
    if (!meta) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "panel anim-slide-up hide-sm",
      style: {
        position: "absolute",
        left: 16,
        top: 70,
        maxWidth: 280,
        padding: "12px 14px",
        zIndex: 40,
        display: "flex",
        gap: 11
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 32,
        height: 32,
        borderRadius: 9,
        background: "var(--panel-2)",
        color: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: meta.icon,
      size: 17
    })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        fontWeight: 600,
        color: "var(--ink)"
      }
    }, meta.t), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 12,
        color: "var(--ink-soft)",
        marginTop: 3,
        lineHeight: 1.45
      }
    }, meta.d)));
  }
  window.StudioChrome = {
    TopBar,
    ToolDock,
    AttendeeBar,
    ModeBanner
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/Chrome.jsx", error: String((e && e.message) || e) }); }

// studio/Panels.jsx
try { (() => {
/* Panels.jsx — LeftSidebar (vendors + layers), Inspector (right detail),
   CommentThread. window.StudioPanels */
(function () {
  const {
    useState,
    useMemo,
    useRef
  } = React;
  const {
    STUDIO
  } = window;
  const {
    CATEGORIES,
    CAT_KEYS,
    LAYERS,
    STATUS,
    colorFor,
    PRESETS
  } = STUDIO;
  const Icon = window.Icon;
  const isBooth = o => o.kind === "booth";

  /* ───────────────── Left sidebar ───────────────── */
  function LeftSidebar({
    doc,
    mode,
    selection,
    onSelect,
    onFocus,
    onEdit,
    layers,
    onToggleLayer,
    search,
    setSearch,
    catFilter,
    setCatFilter,
    statusFilter,
    setStatusFilter,
    onAddBooth,
    onAddElement
  }) {
    const [tab, setTab] = useState("vendors");
    const vendors = useMemo(() => doc.objects.filter(isBooth), [doc.objects]);
    const counts = useMemo(() => {
      const c = {};
      CAT_KEYS.forEach(k => c[k] = 0);
      vendors.forEach(v => {
        if (c[v.category] != null) c[v.category]++;
      });
      return c;
    }, [vendors]);
    const filtered = useMemo(() => {
      const q = search.trim().toLowerCase();
      return vendors.filter(v => {
        if (q && !(v.label || "").toLowerCase().includes(q)) return false;
        if (catFilter && v.category !== catFilter) return false;
        if (statusFilter && v.status !== statusFilter) return false;
        return true;
      }).sort((a, b) => (a.label || "").localeCompare(b.label || ""));
    }, [vendors, search, catFilter, statusFilter]);
    return /*#__PURE__*/React.createElement("aside", {
      style: {
        width: 296,
        flexShrink: 0,
        background: "var(--panel)",
        borderRight: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "12px 12px 0"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "seg",
      style: {
        width: "100%"
      }
    }, [["vendors", "Vendors"], ["layers", "Layers"]].map(([k, l]) => /*#__PURE__*/React.createElement("button", {
      key: k,
      className: tab === k ? "on" : "",
      style: {
        flex: 1,
        justifyContent: "center"
      },
      onClick: () => setTab(k)
    }, l)))), tab === "vendors" ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12,
        display: "grid",
        gap: 9
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "absolute",
        left: 11,
        top: "50%",
        transform: "translateY(-50%)",
        color: "var(--ink-faint)"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "search",
      size: 15
    })), /*#__PURE__*/React.createElement("input", {
      className: "tin",
      style: {
        paddingLeft: 33
      },
      placeholder: "Search vendors\u2026",
      value: search,
      onChange: e => setSearch(e.target.value)
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 5
      }
    }, /*#__PURE__*/React.createElement("button", {
      onClick: () => setCatFilter(null),
      style: chip(catFilter === null)
    }, "All \xB7 ", vendors.length), CAT_KEYS.map(k => /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => setCatFilter(catFilter === k ? null : k),
      style: chip(catFilter === k, CATEGORIES[k].color)
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 7,
        height: 7,
        borderRadius: 999,
        background: CATEGORIES[k].color,
        display: "inline-block"
      }
    }), counts[k]))), mode === "organizer" && /*#__PURE__*/React.createElement("button", {
      className: "pill accent",
      style: {
        width: "100%",
        justifyContent: "center",
        height: 38
      },
      onClick: onAddBooth
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 15
    }), " Add booth")), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: "0 8px 8px"
      }
    }, filtered.map(v => {
      const sel = selection.includes(v.id);
      return /*#__PURE__*/React.createElement("div", {
        key: v.id,
        onClick: () => {
          onSelect([v.id]);
          onFocus(v.id);
        },
        className: "tccf-vrow",
        style: {
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 9px",
          borderRadius: 10,
          cursor: "pointer",
          marginBottom: 2,
          background: sel ? "var(--sel)" : "transparent",
          border: `1px solid ${sel ? "var(--accent)" : "transparent"}`,
          transition: "background 140ms"
        }
      }, /*#__PURE__*/React.createElement("span", {
        style: {
          width: 26,
          height: 26,
          borderRadius: 7,
          background: colorFor(v),
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--font-display)",
          fontWeight: 700,
          fontSize: 10,
          flexShrink: 0
        }
      }, (v.label || "").slice(0, 2).toUpperCase()), /*#__PURE__*/React.createElement("div", {
        style: {
          minWidth: 0,
          flex: 1
        }
      }, /*#__PURE__*/React.createElement("div", {
        style: {
          fontSize: 13.5,
          fontWeight: 500,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          color: "var(--ink)"
        }
      }, v.label), /*#__PURE__*/React.createElement("div", {
        className: "mono",
        style: {
          fontSize: 9.5,
          color: "var(--ink-faint)",
          marginTop: 2
        }
      }, v.category, " \xB7 ", Math.round(v.w), "\xD7", Math.round(v.h), "\u2032")), v.status && /*#__PURE__*/React.createElement("span", {
        style: {
          width: 8,
          height: 8,
          borderRadius: 999,
          background: (STATUS[v.status] || STATUS.pending).color,
          flexShrink: 0
        },
        title: v.status
      }), mode === "organizer" && onEdit && /*#__PURE__*/React.createElement("button", {
        className: "tccf-vedit",
        onClick: e => {
          e.stopPropagation();
          onEdit(v.id);
        },
        title: "Edit details"
      }, "Edit"));
    }), filtered.length === 0 && /*#__PURE__*/React.createElement("div", {
      style: {
        textAlign: "center",
        padding: 30,
        color: "var(--ink-faint)",
        fontSize: 13
      }
    }, "No vendors match"))) : /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kicker",
      style: {
        marginBottom: 10
      }
    }, "Map Layers"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 4
      }
    }, LAYERS.map(ly => /*#__PURE__*/React.createElement("div", {
      key: ly.key,
      style: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 10px",
        borderRadius: 10,
        background: "var(--panel-2)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 10,
        height: 10,
        borderRadius: 3,
        background: ly.color,
        flexShrink: 0
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        flex: 1,
        fontSize: 13.5,
        color: "var(--ink)"
      }
    }, ly.label), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 30,
        height: 30
      },
      onClick: () => onToggleLayer(ly.key),
      title: layers[ly.key] ? "Hide" : "Show"
    }, /*#__PURE__*/React.createElement(Icon, {
      name: layers[ly.key] ? "eye" : "eyeOff",
      size: 16,
      style: {
        opacity: layers[ly.key] ? 1 : 0.45
      }
    }))))), mode === "organizer" && onAddElement && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
      className: "kicker",
      style: {
        margin: "18px 0 8px"
      }
    }, "Add to Map"), [["structure", "Structures"], ["infra", "Power & Water"], ["booth", "Booths"]].map(([grp, lbl]) => /*#__PURE__*/React.createElement("div", {
      key: grp,
      style: {
        marginBottom: 12
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9,
        color: "var(--ink-faint)",
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        marginBottom: 6
      }
    }, lbl), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6
      }
    }, Object.entries(PRESETS).filter(([, p]) => p.group === grp).map(([key, p]) => /*#__PURE__*/React.createElement("button", {
      key: key,
      onClick: () => onAddElement(key),
      className: "tccf-addbtn"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 22,
        height: 22,
        borderRadius: 6,
        background: "var(--panel)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--accent)",
        flexShrink: 0
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: p.icon,
      size: 13
    })), p.name))))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 11.5,
        color: "var(--ink-faint)",
        lineHeight: 1.5,
        marginTop: 4,
        paddingTop: 10,
        borderTop: "1px solid var(--line)"
      }
    }, "New items drop into view \u2014 drag to place, then edit in the panel. Double-click anything on the map to edit it."))));
  }
  function chip(on, color) {
    return {
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      height: 26,
      padding: "0 9px",
      borderRadius: 999,
      border: `1px solid ${on ? "var(--accent)" : "var(--line)"}`,
      background: on ? "var(--sel)" : "var(--panel-2)",
      color: on ? "var(--ink)" : "var(--ink-soft)",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      cursor: "pointer"
    };
  }

  /* ───────────────── Inspector (right) ───────────────── */
  function Inspector({
    objs,
    mode,
    onUpdate,
    onDelete,
    onDuplicate,
    onClose,
    onUploadLogo
  }) {
    if (!objs.length) return null;
    const multi = objs.length > 1;
    const o = objs[0];
    const booth = isBooth(o);
    const fileRef = useRef(null);
    const patch = p => onUpdate(objs.map(x => ({
      id: x.id,
      ...p
    })));
    return /*#__PURE__*/React.createElement("aside", {
      className: "anim-slide-in",
      style: {
        width: 332,
        flexShrink: 0,
        background: "var(--panel)",
        borderLeft: "1px solid var(--line)",
        display: "flex",
        flexDirection: "column",
        height: "100%"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        padding: "16px 18px",
        borderBottom: "1px solid var(--line)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12
      }
    }, !multi && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 42,
        height: 42,
        borderRadius: 10,
        background: booth ? colorFor(o) : "var(--panel-2)",
        color: booth ? "#fff" : "var(--ink-soft)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 15,
        flexShrink: 0,
        overflow: "hidden"
      }
    }, o.logo ? /*#__PURE__*/React.createElement("img", {
      src: o.logo,
      alt: "",
      style: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
      }
    }) : booth ? (o.label || "").slice(0, 2).toUpperCase() : /*#__PURE__*/React.createElement(Icon, {
      name: "flag",
      size: 18
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        minWidth: 0
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "kicker"
    }, multi ? `${objs.length} selected` : booth ? o.category : o.kind), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: "var(--font-display)",
        fontSize: 19,
        fontWeight: 600,
        lineHeight: 1.1,
        color: "var(--ink)",
        marginTop: 2,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      }
    }, multi ? "Multiple objects" : o.label || "Untitled")), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 30,
        height: 30
      },
      onClick: onClose
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 16
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        overflowY: "auto",
        padding: 18,
        display: "grid",
        gap: 16
      }
    }, !multi && /*#__PURE__*/React.createElement(Field, {
      label: "Name"
    }, /*#__PURE__*/React.createElement("input", {
      className: "tin",
      value: o.label || "",
      onChange: e => patch({
        label: e.target.value
      })
    })), booth && !multi && mode === "organizer" && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement(Field, {
      label: "Category"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        flexWrap: "wrap",
        gap: 6
      }
    }, CAT_KEYS.map(k => /*#__PURE__*/React.createElement("button", {
      key: k,
      onClick: () => patch({
        category: k
      }),
      style: {
        ...chip(o.category === k, CATEGORIES[k].color),
        height: 30
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 3,
        background: CATEGORIES[k].color
      }
    }), CATEGORIES[k].label)))), /*#__PURE__*/React.createElement(Field, {
      label: "Status"
    }, /*#__PURE__*/React.createElement("div", {
      className: "seg",
      style: {
        width: "100%"
      }
    }, Object.keys(STATUS).map(s => /*#__PURE__*/React.createElement("button", {
      key: s,
      className: o.status === s ? "on" : "",
      style: {
        flex: 1,
        justifyContent: "center"
      },
      onClick: () => patch({
        status: s
      })
    }, STATUS[s].label)))), /*#__PURE__*/React.createElement(Field, {
      label: "Vendor logo"
    }, /*#__PURE__*/React.createElement("input", {
      ref: fileRef,
      type: "file",
      accept: "image/*",
      hidden: true,
      onChange: e => {
        const f = e.target.files && e.target.files[0];
        if (f) onUploadLogo(o.id, f);
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        flex: 1,
        justifyContent: "center"
      },
      onClick: () => fileRef.current && fileRef.current.click()
    }, o.logo ? "Replace" : "Upload"), o.logo && /*#__PURE__*/React.createElement("button", {
      className: "pill",
      onClick: () => patch({
        logo: null
      })
    }, "Remove"))), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Field, {
      label: "Power (kW)"
    }, /*#__PURE__*/React.createElement("input", {
      className: "tin mono",
      type: "number",
      value: o.powerKW || 0,
      onChange: e => patch({
        powerKW: Number(e.target.value)
      })
    })), /*#__PURE__*/React.createElement(Field, {
      label: "Water"
    }, /*#__PURE__*/React.createElement("button", {
      className: "pill" + (o.water ? " accent" : ""),
      style: {
        width: "100%",
        justifyContent: "center",
        height: 38
      },
      onClick: () => patch({
        water: !o.water
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "droplet",
      size: 14
    }), o.water ? "Needed" : "None"))), /*#__PURE__*/React.createElement(Field, {
      label: "Internal notes"
    }, /*#__PURE__*/React.createElement("textarea", {
      className: "tin",
      rows: 3,
      placeholder: "Load-in time, contacts, special requests\u2026",
      value: o.notes || "",
      onChange: e => patch({
        notes: e.target.value
      })
    }))), !booth && !multi && mode === "organizer" && /*#__PURE__*/React.createElement(React.Fragment, null, o.kind === "generator" && /*#__PURE__*/React.createElement(Field, {
      label: "Capacity (kW)"
    }, /*#__PURE__*/React.createElement("input", {
      className: "tin mono",
      type: "number",
      value: o.kW || 0,
      onChange: e => patch({
        kW: Number(e.target.value)
      })
    })), o.kind === "power" && /*#__PURE__*/React.createElement(Field, {
      label: "Amperage (A)"
    }, /*#__PURE__*/React.createElement("input", {
      className: "tin mono",
      type: "number",
      value: o.amps || 0,
      onChange: e => patch({
        amps: Number(e.target.value)
      })
    })), o.kind === "water" && /*#__PURE__*/React.createElement(Field, {
      label: "Flow rate (GPM)"
    }, /*#__PURE__*/React.createElement("input", {
      className: "tin mono",
      type: "number",
      value: o.gpm || 0,
      onChange: e => patch({
        gpm: Number(e.target.value)
      })
    })), (o.kind === "power" || o.kind === "water") && /*#__PURE__*/React.createElement(Field, {
      label: "Marker size (ft)"
    }, /*#__PURE__*/React.createElement("input", {
      className: "tin mono",
      type: "number",
      value: o.size || 4.5,
      onChange: e => patch({
        size: Math.max(2, Number(e.target.value))
      })
    }))), mode === "organizer" && /*#__PURE__*/React.createElement(Field, {
      label: o.w == null ? "Position (ft)" : "Position & size (ft)"
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gridTemplateColumns: o.w == null ? "1fr 1fr" : "1fr 1fr 1fr 1fr",
        gap: 8
      }
    }, (o.w == null ? ["x", "y"] : ["x", "y", "w", "h"]).map(k => /*#__PURE__*/React.createElement("label", {
      key: k,
      style: {
        display: "grid",
        gap: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 9,
        color: "var(--ink-faint)",
        textTransform: "uppercase"
      }
    }, k), /*#__PURE__*/React.createElement("input", {
      className: "tin mono",
      style: {
        height: 34,
        padding: "0 8px",
        fontSize: 12
      },
      type: "number",
      value: multi ? "" : Math.round(o[k]),
      placeholder: multi ? "—" : "",
      onChange: e => patch({
        [k]: Number(e.target.value)
      }),
      disabled: multi
    })))), !multi && o.w != null && /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        marginTop: 8,
        width: "100%",
        justifyContent: "center"
      },
      onClick: () => patch({
        rot: ((o.rot || 0) + 90) % 360
      })
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "rotate",
      size: 14
    }), " Rotate 90\xB0")), booth && mode !== "organizer" && /*#__PURE__*/React.createElement("div", {
      style: {
        display: "grid",
        gap: 12
      }
    }, /*#__PURE__*/React.createElement(Row, {
      label: "Category",
      value: o.category,
      dot: colorFor(o)
    }), /*#__PURE__*/React.createElement(Row, {
      label: "Booth size",
      value: `${Math.round(o.w)} × ${Math.round(o.h)} ft`
    }), mode === "vendor" && /*#__PURE__*/React.createElement(Row, {
      label: "Power supplied",
      value: `${o.powerKW || 0} kW`
    }), mode === "vendor" && /*#__PURE__*/React.createElement(Row, {
      label: "Water access",
      value: o.water ? "Yes — nearby spigot" : "Not at booth"
    }), mode === "vendor" && /*#__PURE__*/React.createElement("div", {
      style: {
        background: "var(--panel-2)",
        borderRadius: 10,
        padding: 12,
        fontSize: 13,
        color: "var(--ink-soft)",
        lineHeight: 1.5
      }
    }, /*#__PURE__*/React.createElement("strong", {
      style: {
        color: "var(--ink)"
      }
    }, "Load-in:"), " Fri 4\u20137 PM via Vendor Load-In gate (west). Vehicles off-grounds by 7:30 PM."))), mode === "organizer" && /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 12,
        borderTop: "1px solid var(--line)",
        display: "flex",
        gap: 8
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        flex: 1,
        justifyContent: "center"
      },
      onClick: onDuplicate
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "copy",
      size: 14
    }), " Duplicate"), /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        justifyContent: "center",
        color: "#c24a3a",
        borderColor: "rgba(194,74,58,0.4)"
      },
      onClick: onDelete
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 14
    }))));
  }
  function Field({
    label,
    children
  }) {
    return /*#__PURE__*/React.createElement("label", {
      style: {
        display: "grid",
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "kicker"
    }, label), children);
  }
  function Row({
    label,
    value,
    dot
  }) {
    return /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 10,
        borderBottom: "1px solid var(--line)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.08em",
        color: "var(--ink-faint)"
      }
    }, label), /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        fontSize: 13.5,
        color: "var(--ink)"
      }
    }, dot && /*#__PURE__*/React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: 3,
        background: dot
      }
    }), value));
  }
  window.StudioPanels = {
    LeftSidebar,
    Inspector
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/Panels.jsx", error: String((e && e.message) || e) }); }

// studio/app.jsx
try { (() => {
/* app.jsx — composition root: state, modes, keyboard, toasts, comments. */
(function () {
  const {
    useState,
    useEffect,
    useRef,
    useCallback
  } = React;
  const {
    STUDIO
  } = window;
  const {
    DEFAULT_LAYERS,
    CATEGORIES,
    CAT_KEYS
  } = STUDIO;
  const {
    LeftSidebar,
    Inspector
  } = window.StudioPanels;
  const {
    TopBar,
    ToolDock,
    AttendeeBar,
    ModeBanner
  } = window.StudioChrome;
  const Icon = window.Icon;
  function Toasts() {
    const [items, setItems] = useState([]);
    useEffect(() => {
      window.toast = (msg, kind) => {
        const id = Math.random().toString(36).slice(2);
        setItems(x => [...x, {
          id,
          msg,
          kind
        }]);
        setTimeout(() => setItems(x => x.filter(i => i.id !== id)), 2600);
      };
    }, []);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        position: "fixed",
        bottom: 76,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        zIndex: 300,
        alignItems: "center",
        pointerEvents: "none"
      }
    }, items.map(t => /*#__PURE__*/React.createElement("div", {
      key: t.id,
      className: "anim-slide-up",
      style: {
        background: t.kind === "err" ? "#7a2d1e" : "var(--ink)",
        color: "var(--bg)",
        padding: "10px 16px",
        borderRadius: 10,
        fontFamily: "var(--font-mono)",
        fontSize: 12,
        letterSpacing: "0.03em",
        boxShadow: "var(--shadow-lg)"
      }
    }, t.msg)));
  }
  function CommentPopover({
    comment,
    onResolve,
    onClose
  }) {
    if (!comment) return null;
    return /*#__PURE__*/React.createElement("div", {
      className: "panel anim-pop",
      style: {
        position: "absolute",
        right: 18,
        bottom: 90,
        width: 280,
        padding: 14,
        zIndex: 60,
        boxShadow: "var(--shadow-lg)"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 9,
        marginBottom: 9
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 28,
        height: 28,
        borderRadius: 999,
        background: comment.color,
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        fontWeight: 700
      }
    }, comment.initials), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13,
        color: "var(--ink)",
        fontWeight: 500
      }
    }, comment.author), /*#__PURE__*/React.createElement("div", {
      className: "mono",
      style: {
        fontSize: 9,
        color: "var(--ink-faint)"
      }
    }, "just now")), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 26,
        height: 26
      },
      onClick: onClose
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "x",
      size: 14
    }))), /*#__PURE__*/React.createElement("div", {
      style: {
        fontSize: 13.5,
        color: "var(--ink)",
        lineHeight: 1.5
      }
    }, comment.text), /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        width: "100%",
        justifyContent: "center",
        marginTop: 11
      },
      onClick: () => onResolve(comment.id)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "check",
      size: 14
    }), " Resolve"));
  }
  function App() {
    const studio = window.useStudio();
    const {
      active
    } = studio;
    const canvasRef = useRef(null);
    const [theme, setTheme] = useState(() => localStorage.getItem("tccf_theme") || "light");
    const [mode, setMode] = useState("organizer");
    const [tool, setTool] = useState("select");
    const [snapGrid, setSnapGrid] = useState(true);
    const [layers, setLayers] = useState({
      ...DEFAULT_LAYERS
    });
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
    useEffect(() => {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("tccf_theme", theme);
    }, [theme]);

    // mode-driven layer presets
    useEffect(() => {
      if (mode === "utility") setLayers(l => ({
        ...l,
        power: true,
        water: true,
        emergency: true,
        labels: true,
        booths: true,
        places: true
      }));else if (mode === "attendee") setLayers(l => ({
        ...l,
        power: false,
        water: false,
        emergency: false,
        labels: true,
        booths: true,
        places: true
      }));else if (mode === "vendor") setLayers(l => ({
        ...l,
        power: true,
        water: true,
        emergency: false,
        labels: true
      }));else setLayers({
        ...DEFAULT_LAYERS
      });
      setSelection([]);
      setTool("select");
      setRouteTarget(null);
      setArrowTargetId(null);
      setInspectorOpen(false);
      if (mode !== "vendor") setVendorFocusId(null);
    }, [mode]);
    const attendeePos = {
      x: 132,
      y: 382
    }; // at the main entrance

    const selObjs = selection.map(id => active.objects.find(o => o.id === id)).filter(Boolean);

    // keyboard
    useEffect(() => {
      const onKey = e => {
        const typing = /INPUT|TEXTAREA|SELECT/.test(e.target && e.target.tagName || "");
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            studio.redo();
          } else {
            studio.undo();
          }
          return;
        }
        if (typing) return;
        if (mode !== "organizer") return;
        if (e.key === "v" || e.key === "V") setTool("select");
        if (e.key === "h" || e.key === "H") setTool("pan");
        if (e.key === "m" || e.key === "M") setTool("measure");
        if (e.key === "c" || e.key === "C") setTool("comment");
        if (e.key === "Escape") {
          setSelection([]);
          setTool("select");
          setInspectorOpen(false);
        }
        if (!selection.length) return;
        if (e.key === "Enter") {
          e.preventDefault();
          setInspectorOpen(true);
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          e.preventDefault();
          studio.deleteObjects(selection);
          setSelection([]);
          window.toast("Deleted");
          return;
        }
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
          e.preventDefault();
          const n = studio.duplicateObjects(selection);
          setSelection(n);
          window.toast("Duplicated");
          return;
        }
        const step = e.shiftKey ? 5 : 1;
        const mv = {
          ArrowLeft: [-step, 0],
          ArrowRight: [step, 0],
          ArrowUp: [0, -step],
          ArrowDown: [0, step]
        }[e.key];
        if (mv) {
          e.preventDefault();
          const patches = selObjs.map(o => ({
            id: o.id,
            x: Math.max(0, Math.min(active.lot.w - o.w, o.x + mv[0])),
            y: Math.max(0, Math.min(active.lot.h - o.h, o.y + mv[1]))
          }));
          studio.updateObjects(patches);
        }
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [mode, selection, selObjs, studio, active.lot]);
    const toggleLayer = key => setLayers(l => ({
      ...l,
      [key]: !l[key]
    }));
    const addBooth = () => {
      const cam = canvasRef.current && canvasRef.current.getCamera ? canvasRef.current.getCamera() : null;
      const id = studio.addObject({
        kind: "booth",
        label: "New Vendor",
        category: "Coffee Shop",
        status: "unassigned",
        powerKW: 2,
        water: false,
        x: 40,
        y: 150,
        w: 10,
        h: 10,
        rot: 0
      });
      setSelection([id]);
      setTool("select");
      setTimeout(() => {
        const o = studio.active.objects.find(x => x.id === id);
        if (o && canvasRef.current) canvasRef.current.centerOn(o, 2.4);
      }, 30);
      window.toast("Booth added — drag into place");
    };
    const addElement = key => {
      const preset = STUDIO.PRESETS[key];
      if (!preset) return;
      // place near the center of the current view, snapped to 5ft
      let c = canvasRef.current && canvasRef.current.getViewCenterFt ? canvasRef.current.getViewCenterFt() : {
        x: active.lot.w / 2,
        y: active.lot.h / 2
      };
      const w = preset.make.w || 0,
        h = preset.make.h || 0;
      const snap = v => Math.round(v / 5) * 5;
      const x = Math.max(0, Math.min(active.lot.w - w, snap(c.x - w / 2)));
      const y = Math.max(0, Math.min(active.lot.h - h, snap(c.y - h / 2)));
      const id = studio.addObject({
        ...preset.make,
        x,
        y
      });
      // make sure the layer it belongs to is visible
      if (preset.layer && !layers[preset.layer]) setLayers(l => ({
        ...l,
        [preset.layer]: true
      }));
      setSelection([id]);
      setTool("select");
      setInspectorOpen(true);
      window.toast(`${preset.name} added — drag to place`);
    };
    const onUploadLogo = async (id, file) => {
      try {
        const url = await window.studioExport.logoToDataURL(file);
        studio.updateObjects([{
          id,
          logo: url
        }]);
        window.toast("Logo added");
      } catch (e) {
        window.toast("Upload failed", "err");
      }
    };
    const addComment = ftp => {
      const me = STUDIO.TEAM[0];
      const text = prompt("Add a comment at this spot:");
      if (!text) return;
      studio.addComment({
        x: ftp.x,
        y: ftp.y,
        text,
        author: me.name,
        initials: me.initials,
        color: me.color
      });
      setTool("select");
      window.toast("Comment added");
    };
    const onShare = kind => {
      if (kind === "Attendee map") setMode("attendee");else if (kind === "Vendor packet") setMode("vendor");else if (kind === "Utility map") setMode("utility");
      window.toast(`Shareable ${kind.toLowerCase()} link copied`);
    };
    const onExport = async () => {
      window.toast("Rendering PNG…");
      await window.studioExport.exportPNG(active, {
        mode
      });
      window.toast("Map exported");
    };
    const downloadBackup = () => {
      try {
        const blob = new Blob([JSON.stringify(studio.state, null, 2)], {
          type: "application/json"
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const d = new Date().toISOString().slice(0, 10);
        a.href = url;
        a.download = `tccf-festival-layout-${d}.json`;
        a.click();
        URL.revokeObjectURL(url);
        window.toast("Backup downloaded");
      } catch (e) {
        window.toast("Backup failed", "err");
      }
    };
    const restoreBackup = file => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(reader.result);
          studio.importState(parsed);
          setSelection([]);
          setInspectorOpen(false);
          window.toast("Backup restored");
        } catch (e) {
          window.toast("Couldn't read that backup file", "err");
        }
      };
      reader.onerror = () => window.toast("Couldn't read file", "err");
      reader.readAsText(file);
    };
    const onObjectClick = id => {
      setSelection([id]);
      setInspectorOpen(true);
      if (mode === "vendor") setVendorFocusId(id);
    };
    const onObjectEdit = id => {
      setSelection([id]);
      setInspectorOpen(true);
    };
    const showLeft = mode === "organizer";
    const showInspector = inspectorOpen && !!selObjs.length && mode !== "attendee";
    return /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        display: "flex",
        flexDirection: "column"
      }
    }, /*#__PURE__*/React.createElement(TopBar, {
      mode: mode,
      setMode: setMode,
      theme: theme,
      setTheme: setTheme,
      layouts: studio.layouts,
      activeIndex: studio.activeIndex,
      setActiveIndex: studio.setActiveIndex,
      onDuplicateLayout: studio.duplicateLayout,
      onRename: studio.renameLayout,
      published: active.published,
      onTogglePublished: studio.togglePublished,
      onDeleteLayout: studio.deleteLayout,
      onShare: onShare,
      onExport: onExport,
      onDownloadBackup: downloadBackup,
      onRestoreBackup: restoreBackup
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        display: "flex",
        overflow: "hidden",
        position: "relative"
      }
    }, showLeft && /*#__PURE__*/React.createElement("div", {
      className: "hide-sm",
      style: {
        display: "flex"
      }
    }, /*#__PURE__*/React.createElement(LeftSidebar, {
      doc: active,
      mode: mode,
      selection: selection,
      onSelect: setSelection,
      onFocus: id => {
        const o = active.objects.find(x => x.id === id);
        if (o && canvasRef.current) canvasRef.current.centerOn(o, 2.4);
      },
      onEdit: id => {
        setSelection([id]);
        setInspectorOpen(true);
        const o = active.objects.find(x => x.id === id);
        if (o && canvasRef.current) canvasRef.current.centerOn(o, 2.4);
      },
      layers: layers,
      onToggleLayer: toggleLayer,
      search: search,
      setSearch: setSearch,
      catFilter: catFilter,
      setCatFilter: setCatFilter,
      statusFilter: statusFilter,
      setStatusFilter: setStatusFilter,
      onAddBooth: addBooth,
      onAddElement: addElement
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1,
        position: "relative"
      }
    }, /*#__PURE__*/React.createElement(window.StudioCanvas, {
      ref: canvasRef,
      doc: active,
      mode: mode,
      theme: theme,
      tool: tool,
      layers: layers,
      zoomGrid: layers.grid,
      snapGrid: snapGrid,
      selection: selection,
      onSelectionChange: setSelection,
      onUpdateObjects: (p, opts) => studio.updateObjects(p, opts),
      onAddComment: addComment,
      onBeginChange: () => studio.beginChange(),
      arrowTargetId: arrowTargetId,
      routeTargetId: routeTarget,
      attendeePos: attendeePos,
      onMeasure: m => studio.addMeasurement(m),
      measurements: active.measurements,
      onDeleteMeasurement: i => {
        studio.deleteMeasurement(i);
        window.toast("Measurement removed");
      },
      onUpdateEmergency: (em, opts) => studio.setEmergency(em, opts),
      vendorFocusId: mode === "vendor" ? vendorFocusId : null,
      onObjectClick: onObjectClick,
      onObjectEdit: onObjectEdit,
      onZoomReport: setZoomPct,
      onOpenComment: id => setOpenComment(active.comments.find(c => c.id === id))
    }), mode === "organizer" && /*#__PURE__*/React.createElement(ToolDock, {
      tool: tool,
      setTool: setTool,
      onUndo: studio.undo,
      onRedo: studio.redo,
      canUndo: studio.canUndo,
      canRedo: studio.canRedo,
      snapGrid: snapGrid,
      setSnapGrid: setSnapGrid
    }), mode === "organizer" && tool === "measure" && /*#__PURE__*/React.createElement("div", {
      className: "panel anim-slide-up",
      style: {
        position: "absolute",
        left: "50%",
        bottom: 76,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 8px 8px 14px",
        zIndex: 50
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "var(--ink-soft)",
        whiteSpace: "nowrap"
      }
    }, "Drag to measure \xB7 click a line to delete"), (active.measurements || []).length > 0 && /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        height: 30
      },
      onClick: () => {
        studio.clearMeasurements();
        window.toast("Measurements cleared");
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 13
    }), " Clear all (", (active.measurements || []).length, ")")), mode === "organizer" && layers.emergency && /*#__PURE__*/React.createElement("div", {
      className: "panel anim-slide-up",
      style: {
        position: "absolute",
        left: "50%",
        bottom: tool === "measure" ? 124 : 76,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 8px 8px 14px",
        zIndex: 50
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "alert",
      size: 15,
      style: {
        color: "var(--c-emergency)"
      }
    }), active.emergency ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "var(--ink-soft)",
        whiteSpace: "nowrap"
      },
      className: "hide-sm"
    }, "Emergency lane \xB7 drag points \xB7 double-click to remove a point"), /*#__PURE__*/React.createElement("div", {
      style: {
        display: "flex",
        alignItems: "center",
        gap: 2
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 28,
        height: 28
      },
      title: "Narrower",
      onClick: () => studio.setEmergency({
        ...active.emergency,
        width: Math.max(4, active.emergency.width - 2)
      })
    }, "\u2212"), /*#__PURE__*/React.createElement("span", {
      className: "mono",
      style: {
        fontSize: 12,
        width: 44,
        textAlign: "center",
        color: "var(--ink)"
      }
    }, active.emergency.width, "\u2032"), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn",
      style: {
        width: 28,
        height: 28
      },
      title: "Wider",
      onClick: () => studio.setEmergency({
        ...active.emergency,
        width: Math.min(40, active.emergency.width + 2)
      })
    }, "+")), /*#__PURE__*/React.createElement("button", {
      className: "pill",
      style: {
        height: 30
      },
      onClick: () => {
        studio.setEmergency(null);
        window.toast("Emergency lane removed");
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "trash",
      size: 13
    }), " Remove")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12.5,
        color: "var(--ink-soft)"
      }
    }, "No emergency lane on this layout"), /*#__PURE__*/React.createElement("button", {
      className: "pill accent",
      style: {
        height: 30
      },
      onClick: () => {
        const w = active.lot.w,
          h = active.lot.h;
        studio.setEmergency({
          width: 16,
          path: [{
            x: Math.round(w * 0.2),
            y: Math.round(h * 0.5)
          }, {
            x: Math.round(w * 0.8),
            y: Math.round(h * 0.5)
          }]
        });
        window.toast("Lane added — drag the points to shape it");
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "plus",
      size: 14
    }), " Add lane"))), mode === "organizer" && selObjs.length > 0 && !inspectorOpen && /*#__PURE__*/React.createElement("button", {
      className: "pill accent anim-pop",
      style: {
        position: "absolute",
        top: 16,
        right: 16,
        zIndex: 50,
        boxShadow: "var(--shadow-lg)"
      },
      onClick: () => setInspectorOpen(true)
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "settings",
      size: 14
    }), " ", selObjs.length > 1 ? `Edit ${selObjs.length} selected` : "Edit details"), mode === "attendee" && /*#__PURE__*/React.createElement(AttendeeBar, {
      doc: active,
      onFocus: id => {
        const o = active.objects.find(x => x.id === id);
        if (o && canvasRef.current) canvasRef.current.centerOn(o, 2.6);
        setArrowTargetId(id);
      },
      routeTarget: routeTarget,
      setRouteTarget: setRouteTarget
    }), mode !== "organizer" && mode !== "attendee" && /*#__PURE__*/React.createElement(ModeBanner, {
      mode: mode
    }), mode === "vendor" && !vendorFocusId && /*#__PURE__*/React.createElement("div", {
      className: "panel anim-slide-up",
      style: {
        position: "absolute",
        left: "50%",
        bottom: 18,
        transform: "translateX(-50%)",
        padding: "11px 16px",
        display: "flex",
        alignItems: "center",
        gap: 9,
        zIndex: 40
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: "flag",
      size: 15,
      style: {
        color: "var(--accent)"
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 13,
        color: "var(--ink)"
      }
    }, "Tap any booth to preview the vendor's view")), /*#__PURE__*/React.createElement(CommentPopover, {
      comment: openComment,
      onResolve: id => {
        studio.resolveComment(id);
        setOpenComment(null);
        window.toast("Comment resolved");
      },
      onClose: () => setOpenComment(null)
    })), showInspector && /*#__PURE__*/React.createElement("div", {
      className: "hide-sm",
      style: {
        display: "flex"
      }
    }, /*#__PURE__*/React.createElement(Inspector, {
      objs: selObjs,
      mode: mode,
      onUpdate: p => studio.updateObjects(p),
      onDelete: () => {
        studio.deleteObjects(selection);
        setSelection([]);
        window.toast("Deleted");
      },
      onDuplicate: () => {
        const n = studio.duplicateObjects(selection);
        setSelection(n);
        window.toast("Duplicated");
      },
      onClose: () => setInspectorOpen(false),
      onUploadLogo: onUploadLogo
    }))), /*#__PURE__*/React.createElement(Toasts, null));
  }
  ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(App, null));
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/app.jsx", error: String((e && e.message) || e) }); }

// studio/data.js
try { (() => {
/* =====================================================================
   The Charlotte Coffee Festival — FESTIVAL STUDIO
   data.js — venue model (feet), layers, power/water/emergency
   infrastructure, vendor categories, and a multi-layout localStorage
   store. All coordinates are in feet; the canvas converts to px.
   ===================================================================== */
(function () {
  "use strict";

  /* ---------- Vendor categories ----------------------------------- */
  const CATEGORIES = {
    Roaster: {
      color: "#6E4630",
      label: "Roaster"
    },
    Bakery: {
      color: "#C29A6B",
      label: "Bakery"
    },
    "Coffee Shop": {
      color: "#9C8B6E",
      label: "Coffee Shop"
    },
    "Tea & Chai": {
      color: "#6B6E45",
      label: "Tea & Chai"
    },
    Other: {
      color: "#8F7B86",
      label: "Other"
    },
    Sponsor: {
      color: "#AA7050",
      label: "Sponsor"
    }
  };
  const CAT_KEYS = Object.keys(CATEGORIES);
  const POWER_BY_CAT = {
    Roaster: 3,
    Bakery: 4,
    "Coffee Shop": 2,
    "Tea & Chai": 2,
    Other: 2,
    Sponsor: 6
  };

  /* ---------- Layers ---------------------------------------------- */
  const LAYERS = [{
    key: "booths",
    label: "Vendor booths",
    color: "#6E4630",
    locked: false
  }, {
    key: "places",
    label: "Stages & structures",
    color: "#3A2C18",
    locked: false
  }, {
    key: "power",
    label: "Power & generators",
    color: "#C9A227",
    locked: false
  }, {
    key: "water",
    label: "Water access",
    color: "#5C8AA6",
    locked: false
  }, {
    key: "emergency",
    label: "Emergency lanes",
    color: "#C24A3A",
    locked: false
  }, {
    key: "labels",
    label: "Booth labels",
    color: "#746137",
    locked: false
  }, {
    key: "grid",
    label: "Grid & rulers",
    color: "#746137",
    locked: false
  }];
  const DEFAULT_LAYERS = {
    booths: true,
    places: true,
    power: false,
    water: false,
    emergency: false,
    labels: true,
    grid: true
  };

  /* ---------- Venue layout (feet) — portrait, mirrors the real lot - */
  const LOT = {
    w: 286,
    h: 396
  };

  // Official 2026 lineup → [name, category]
  const ROSTER = [["Aara Coffee Company", "Roaster"], ["Alexis' Cookie Co.", "Bakery"], ["Arboquin Coffee", "Roaster"], ["Atlas Brews", "Coffee Shop"], ["Bean & Bun", "Coffee Shop"], ["Bean Lab", "Coffee Shop"], ["Beyond Amazing Donuts", "Bakery"], ["Biscuits N Thangs", "Bakery"], ["Black Cat Coffee Co.", "Coffee Shop"], ["Breezeway Coffee Roasters", "Roaster"], ["Buen Dia Cafe", "Roaster"], ["Bush Hill Coffee Co.", "Roaster"], ["Charleston Coffee Roasters", "Roaster"], ["Coco and the Director", "Coffee Shop"], ["Companion Coffee Roasters", "Roaster"], ["COOL IDIOT COFFEE", "Coffee Shop"], ["Defined Coffee", "Roaster"], ["DONA", "Tea & Chai"], ["Dulce Dreams", "Bakery"], ["Firm Foundation Coffee", "Coffee Shop"], ["HAERFEST COFFEE roasting co.", "Roaster"], ["Hickory Grove Coffee", "Roaster"], ["High Octane", "Coffee Shop"], ["Immigrant Culture", "Roaster"], ["Indigo Tea + Coffee", "Coffee Shop"], ["It's Flowering", "Other"], ["Javesca", "Roaster"], ["Kaldi's Coffeehouse & Roastery", "Roaster"], ["Knowledge Perk Coffee Co.", "Roaster"], ["Kofi Kofi Co.", "Roaster"], ["La Loma Coffee", "Roaster"], ["Magnolia Coffee", "Roaster"], ["Mama Moon Sourdough", "Bakery"], ["Mauve Lynn Bakehouse", "Bakery"], ["Moonbean Roastery", "Roaster"], ["Mug & Maple", "Coffee Shop"], ["Pancake Daddy's", "Bakery"], ["Robusta Coffee", "Coffee Shop"], ["Roost Roastery", "Roaster"], ["San Café", "Roaster"], ["Sharewell Coffee Company", "Roaster"], ["Shore Coffee Roasters", "Roaster"], ["Sweet Spoon Bakery", "Bakery"], ["Sweetwaters Coffee & Tea", "Coffee Shop"], ["The Chai Box", "Tea & Chai"], ["Three Oaks", "Roaster"], ["Tiny Tulip Coffee", "Coffee Shop"], ["Trailhead Oven", "Bakery"], ["Two Cups Coffee + Matcha", "Coffee Shop"], ["VAROSH Coffee Roasters", "Roaster"], ["Zikr Coffee", "Coffee Shop"]];

  // Lay out a block of booths in rows. Returns booth objects.
  function block(x0, y0, cols, rows, names, pitchX, pitchY, size, startId) {
    const out = [];
    let i = 0,
      id = startId;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (i >= names.length) break;
        const [label, category] = names[i++];
        out.push({
          id: id++,
          kind: "booth",
          label,
          category,
          status: "confirmed",
          powerKW: POWER_BY_CAT[category] || 2,
          water: category === "Bakery",
          x: x0 + c * pitchX,
          y: y0 + r * pitchY,
          w: size,
          h: size,
          rot: 0
        });
      }
    }
    return out;
  }
  function buildDoc(name, scatter) {
    let id = 1;
    // Vendors mirror the real venue: a row along the TOP edge, a column
    // down the LEFT edge, and central rows beside the taproom building.
    const topRow = block(40, 8, 11, 1, ROSTER.slice(0, 11), 15, 14, 10, id);
    id += topRow.length; // 11
    const leftCol = block(4, 34, 1, 12, ROSTER.slice(11, 23), 14, 14, 10, id);
    id += leftCol.length; // 12
    const central = block(80, 62, 3, 10, ROSTER.slice(23, 51), 15, 14, 10, id);
    id += central.length; // 28
    let booths = topRow.concat(leftCol, central);

    // Optional draft variant: mark a few unconfirmed
    if (scatter) booths = booths.map((b, k) => k % 6 === 0 ? {
      ...b,
      status: "pending"
    } : k % 11 === 0 ? {
      ...b,
      status: "unassigned"
    } : b);
    const sponsors = [{
      id: id++,
      kind: "booth",
      label: "Night Swim",
      category: "Sponsor",
      status: "confirmed",
      powerKW: 8,
      sponsorTier: "Title",
      water: true,
      x: 78,
      y: 212,
      w: 30,
      h: 24,
      rot: 0
    }, {
      id: id++,
      kind: "booth",
      label: "Maizly",
      category: "Sponsor",
      status: "confirmed",
      powerKW: 6,
      sponsorTier: "Gold",
      water: false,
      x: 116,
      y: 214,
      w: 26,
      h: 20,
      rot: 0
    }];
    const places = [{
      id: id++,
      kind: "building",
      label: "Lenny Boy Taproom",
      x: 160,
      y: 70,
      w: 104,
      h: 212,
      rot: 0
    }, {
      id: id++,
      kind: "restroom",
      label: "Restrooms",
      x: 210,
      y: 8,
      w: 46,
      h: 24,
      rot: 0
    }, {
      id: id++,
      kind: "stage",
      label: "Main Stage",
      x: 4,
      y: 214,
      w: 46,
      h: 72,
      rot: 0
    }, {
      id: id++,
      kind: "food",
      label: "Food Court",
      x: 160,
      y: 300,
      w: 96,
      h: 50,
      rot: 0
    }, {
      id: id++,
      kind: "ticketing",
      label: "Ticketing",
      x: 78,
      y: 318,
      w: 58,
      h: 30,
      rot: 0
    }, {
      id: id++,
      kind: "entrance",
      label: "Main Entrance",
      x: 100,
      y: 384,
      w: 64,
      h: 10,
      rot: 0
    }, {
      id: id++,
      kind: "entrance",
      label: "Vendor Load-In",
      x: 274,
      y: 40,
      w: 12,
      h: 46,
      rot: 0
    }];

    // Power infrastructure
    const power = [{
      id: id++,
      kind: "generator",
      label: "Gen A · 60kW",
      x: 258,
      y: 4,
      w: 22,
      h: 12,
      kW: 60
    }, {
      id: id++,
      kind: "generator",
      label: "Gen B · 60kW",
      x: 4,
      y: 300,
      w: 22,
      h: 12,
      kW: 60
    }, {
      id: id++,
      kind: "generator",
      label: "Gen C · 45kW",
      x: 256,
      y: 366,
      w: 22,
      h: 12,
      kW: 45
    }];
    // Power drops near the vendor rows
    const drops = [];
    [86, 116, 146].forEach(x => {
      [60, 110, 160].forEach(y => drops.push({
        id: id++,
        kind: "power",
        x,
        y,
        amps: 50
      }));
    });
    [62, 122, 182].forEach(y => drops.push({
      id: id++,
      kind: "power",
      x: 26,
      y,
      amps: 50
    }));
    drops.push({
      id: id++,
      kind: "power",
      x: 120,
      y: 24,
      amps: 50
    });
    drops.push({
      id: id++,
      kind: "power",
      x: 168,
      y: 24,
      amps: 100
    });

    // Water spigots
    const water = [{
      id: id++,
      kind: "water",
      x: 60,
      y: 210,
      gpm: 8
    }, {
      id: id++,
      kind: "water",
      x: 150,
      y: 300,
      gpm: 8
    }, {
      id: id++,
      kind: "water",
      x: 24,
      y: 200,
      gpm: 5
    }];

    // Emergency lane — a 16ft clear lane down the central aisle to the exit
    const emergency = {
      width: 16,
      path: [{
        x: 150,
        y: 24
      }, {
        x: 150,
        y: 360
      }, {
        x: 132,
        y: 360
      }, {
        x: 132,
        y: 384
      }]
    };
    return {
      name,
      lot: {
        ...LOT
      },
      objects: booths.concat(sponsors, places, power, drops, water),
      emergency,
      comments: [],
      measurements: [],
      published: !scatter
    };
  }

  /* ---------- Multi-layout store (localStorage) ------------------- */
  const KEY = "tccf_studio_v5";
  const listeners = new Set();
  function freshState() {
    return {
      layouts: [buildDoc("Main Layout — Published", false), buildDoc("Saturday Draft", true)],
      activeIndex: 0
    };
  }
  function load() {
    let s = null;
    try {
      s = JSON.parse(localStorage.getItem(KEY));
    } catch (e) {}
    if (!s || !s.layouts || !s.layouts.length) {
      s = freshState();
      persist(s);
    }
    return s;
  }
  function persist(s) {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch (e) {
      console.warn("persist", e);
    }
  }
  function save(s) {
    persist(s);
    listeners.forEach(fn => {
      try {
        fn(s);
      } catch (e) {}
    });
  }
  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }
  function reset() {
    const s = freshState();
    save(s);
    return s;
  }
  window.addEventListener("storage", e => {
    if (e.key === KEY) {
      const s = load();
      listeners.forEach(fn => fn(s));
    }
  });

  /* ---------- Helpers --------------------------------------------- */
  const STATUS = {
    confirmed: {
      label: "Confirmed",
      color: "#5d6b3c",
      soft: "#dfe2c8"
    },
    pending: {
      label: "Pending",
      color: "#b07d2e",
      soft: "#f1e0cb"
    },
    unassigned: {
      label: "Open",
      color: "#9a9483",
      soft: "#e6e1d6"
    }
  };
  function colorFor(o) {
    if (o.kind === "booth") return (CATEGORIES[o.category] || CATEGORIES["Coffee Shop"]).color;
    return null;
  }

  /* ---------- Add-to-map presets (organizer) ---------------------- */
  // group: "booth" | "structure" | "infra" ; pt = point marker (no w/h)
  const PRESETS = {
    vendor: {
      group: "booth",
      icon: "flag",
      name: "Vendor booth",
      layer: "booths",
      make: {
        kind: "booth",
        label: "New Vendor",
        category: "Coffee Shop",
        status: "unassigned",
        powerKW: 2,
        water: false,
        w: 10,
        h: 10,
        rot: 0
      }
    },
    sponsor: {
      group: "booth",
      icon: "star",
      name: "Sponsor",
      layer: "booths",
      make: {
        kind: "booth",
        label: "New Sponsor",
        category: "Sponsor",
        status: "unassigned",
        powerKW: 6,
        water: false,
        w: 20,
        h: 18,
        rot: 0
      }
    },
    stage: {
      group: "structure",
      icon: "mic",
      name: "Stage",
      layer: "places",
      make: {
        kind: "stage",
        label: "Stage",
        w: 40,
        h: 30,
        rot: 0
      }
    },
    food: {
      group: "structure",
      icon: "utensils",
      name: "Food court",
      layer: "places",
      make: {
        kind: "food",
        label: "Food Court",
        w: 60,
        h: 40,
        rot: 0
      }
    },
    ticketing: {
      group: "structure",
      icon: "ticket",
      name: "Ticketing",
      layer: "places",
      make: {
        kind: "ticketing",
        label: "Ticketing",
        w: 50,
        h: 26,
        rot: 0
      }
    },
    restroom: {
      group: "structure",
      icon: "droplet",
      name: "Restrooms",
      layer: "places",
      make: {
        kind: "restroom",
        label: "Restrooms",
        w: 38,
        h: 22,
        rot: 0
      }
    },
    building: {
      group: "structure",
      icon: "building",
      name: "Building",
      layer: "places",
      make: {
        kind: "building",
        label: "Building",
        w: 40,
        h: 40,
        rot: 0
      }
    },
    entrance: {
      group: "structure",
      icon: "door",
      name: "Entrance",
      layer: "places",
      make: {
        kind: "entrance",
        label: "Entrance",
        w: 40,
        h: 12,
        rot: 0
      }
    },
    patch: {
      group: "structure",
      icon: "target",
      name: "Patch",
      layer: "places",
      make: {
        kind: "patch",
        label: "Patch",
        w: 30,
        h: 30,
        rot: 0
      }
    },
    generator: {
      group: "infra",
      icon: "bolt",
      name: "Generator",
      layer: "power",
      make: {
        kind: "generator",
        label: "Generator · 45kW",
        kW: 45,
        w: 18,
        h: 12,
        rot: 0
      }
    },
    power: {
      group: "infra",
      icon: "bolt",
      name: "Power drop",
      layer: "power",
      pt: true,
      make: {
        kind: "power",
        amps: 50,
        size: 4.5
      }
    },
    water: {
      group: "infra",
      icon: "droplet",
      name: "Water tap",
      layer: "water",
      pt: true,
      make: {
        kind: "water",
        gpm: 8,
        size: 4.5
      }
    }
  };
  window.STUDIO = {
    CATEGORIES,
    CAT_KEYS,
    LAYERS,
    DEFAULT_LAYERS,
    STATUS,
    LOT,
    colorFor,
    buildDoc,
    PRESETS,
    store: {
      load,
      save,
      subscribe,
      reset
    },
    EVENT: {
      name: "The Charlotte Coffee Festival",
      date: "SAT · SEP 12, 2026",
      venue: "Lenny Boy Brewing Co · Charlotte NC"
    },
    TEAM: [{
      name: "Maya R.",
      initials: "MR",
      color: "#AA7050"
    }, {
      name: "Devon K.",
      initials: "DK",
      color: "#6B6E45"
    }, {
      name: "Priya S.",
      initials: "PS",
      color: "#5C8AA6"
    }]
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/data.js", error: String((e && e.message) || e) }); }

// studio/export.jsx
try { (() => {
/* export.jsx — high-res canvas PNG of the active layout. window.studioExport */
(function () {
  const {
    STUDIO
  } = window;
  const {
    CATEGORIES,
    colorFor,
    EVENT
  } = STUDIO;
  const PLACE_FILL = {
    stage: "#3A2C18",
    food: "#4A4B35",
    ticketing: "#d8c4b2",
    restroom: "#75878B",
    building: "#CFC9BC",
    entrance: "#6B6E45",
    generator: "#C9A227",
    patch: "rgba(107,110,69,0.28)"
  };
  const PLACE_TXT = {
    stage: "#EBE5DB",
    food: "#EBE5DB",
    ticketing: "#5a3a22",
    restroom: "#fff",
    building: "#4A4B35",
    entrance: "#fff",
    generator: "#3a2c10",
    patch: "#3a3c24"
  };
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  async function exportPNG(doc, opts) {
    opts = opts || {};
    const mode = opts.mode || "organizer";
    const S = 5.2,
      PAD = 110;
    const lot = doc.lot;
    const W = lot.w * S + PAD * 2,
      H = lot.h * S + PAD * 2 + 60;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#F4F1EA";
    ctx.fillRect(0, 0, W, H);
    // lot
    rr(ctx, PAD, PAD, lot.w * S, lot.h * S, 12);
    ctx.fillStyle = "#DDD6C5";
    ctx.fill();
    // grid
    ctx.strokeStyle = "rgba(33,28,20,0.08)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= lot.w; x += 5) {
      ctx.beginPath();
      ctx.moveTo(PAD + x * S, PAD);
      ctx.lineTo(PAD + x * S, PAD + lot.h * S);
      ctx.stroke();
    }
    for (let y = 0; y <= lot.h; y += 5) {
      ctx.beginPath();
      ctx.moveTo(PAD, PAD + y * S);
      ctx.lineTo(PAD + lot.w * S, PAD + y * S);
      ctx.stroke();
    }

    // emergency
    if (mode === "utility" && doc.emergency) {
      ctx.strokeStyle = "rgba(194,74,58,0.18)";
      ctx.lineWidth = doc.emergency.width * S;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.beginPath();
      doc.emergency.path.forEach((p, i) => i ? ctx.lineTo(PAD + p.x * S, PAD + p.y * S) : ctx.moveTo(PAD + p.x * S, PAD + p.y * S));
      ctx.stroke();
      ctx.strokeStyle = "#C24A3A";
      ctx.lineWidth = 2.5;
      ctx.setLineDash([12, 9]);
      ctx.beginPath();
      doc.emergency.path.forEach((p, i) => i ? ctx.lineTo(PAD + p.x * S, PAD + p.y * S) : ctx.moveTo(PAD + p.x * S, PAD + p.y * S));
      ctx.stroke();
      ctx.setLineDash([]);
    }
    const drawRect = o => {
      const x = PAD + o.x * S,
        y = PAD + o.y * S,
        w = o.w * S,
        h = o.h * S;
      const booth = o.kind === "booth";
      ctx.save();
      if (o.rot) {
        ctx.translate(x + w / 2, y + h / 2);
        ctx.rotate(o.rot * Math.PI / 180);
        ctx.translate(-(x + w / 2), -(y + h / 2));
      }
      if (o.kind === "patch") {
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.closePath();
      } else {
        rr(ctx, x, y, w, h, booth ? 7 : 8);
      }
      ctx.fillStyle = booth ? colorFor(o) : PLACE_FILL[o.kind] || "#CFC9BC";
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(0,0,0,0.18)";
      ctx.stroke();
      ctx.fillStyle = booth ? "#fff" : PLACE_TXT[o.kind] || "#333";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (booth) {
        ctx.font = `700 ${Math.min(20, Math.max(9, w * 0.34))}px "Styrene B", sans-serif`;
        ctx.fillText((o.label || "").slice(0, 2).toUpperCase(), x + w / 2, y + h / 2 - (w > 34 ? 5 : 0));
        if (w > 34) {
          ctx.font = `${Math.min(10, Math.max(6, w * 0.1))}px "Styrene B", sans-serif`;
          ctx.fillText((o.label || "").slice(0, 16), x + w / 2, y + h / 2 + 8);
        }
        if (mode === "utility" && o.powerKW) {
          ctx.fillStyle = "#C9A227";
          rr(ctx, x + w - 26, y - 7, 26, 14, 4);
          ctx.fill();
          ctx.fillStyle = "#3a2c10";
          ctx.font = '700 9px "GT Flexa Mono", monospace';
          ctx.fillText(o.powerKW + "kW", x + w - 13, y);
        }
      } else {
        ctx.font = `${Math.min(13, Math.max(8, w * 0.08))}px "GT Flexa Mono", monospace`;
        const ws = (o.label || "").toUpperCase().split(" ");
        ws.forEach((wd, i) => ctx.fillText(wd, x + w / 2, y + h / 2 + (i - (ws.length - 1) / 2) * (h * 0.16)));
      }
      ctx.restore();
    };
    const drawPoint = o => {
      const x = PAD + o.x * S,
        y = PAD + o.y * S;
      if (o.kind === "power") {
        ctx.fillStyle = "#C9A227";
        rr(ctx, x - 10, y - 10, 20, 20, 5);
        ctx.fill();
        ctx.fillStyle = "#3a2c10";
        ctx.font = '700 11px sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u26a1", x, y);
      }
      if (o.kind === "water") {
        ctx.fillStyle = "#5C8AA6";
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 7);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = '700 11px sans-serif';
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("\u2602", x, y);
      }
    };
    doc.objects.filter(o => ["stage", "food", "ticketing", "restroom", "building", "entrance", "patch"].includes(o.kind)).forEach(drawRect);
    doc.objects.filter(o => o.kind === "booth").forEach(drawRect);
    doc.objects.filter(o => o.kind === "generator").forEach(drawRect);
    if (mode === "utility") {
      doc.objects.filter(o => o.kind === "power").forEach(drawPoint);
      doc.objects.filter(o => o.kind === "water").forEach(drawPoint);
    }

    // title block
    ctx.fillStyle = "#211C14";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = '700 42px "Styrene B", sans-serif';
    ctx.fillText("THE CHARLOTTE COFFEE FESTIVAL", PAD, 64);
    ctx.fillStyle = "#746137";
    ctx.font = '20px "GT Flexa Mono", monospace';
    ctx.fillText(`${doc.name.toUpperCase()} · ${mode.toUpperCase()} MAP`, PAD, 92);
    ctx.fillText(`${EVENT.date} · ${EVENT.venue}`, PAD, H - 34);
    return new Promise(res => {
      c.toBlob(b => {
        const u = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = u;
        a.download = `tccf-${mode}-map.png`;
        a.click();
        URL.revokeObjectURL(u);
        res();
      }, "image/png");
    });
  }
  function logoToDataURL(file, max) {
    max = max || 200;
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, max / Math.max(img.width, img.height));
          const cv = document.createElement("canvas");
          cv.width = Math.round(img.width * s);
          cv.height = Math.round(img.height * s);
          const cx = cv.getContext("2d");
          cx.fillStyle = "#fff";
          cx.fillRect(0, 0, cv.width, cv.height);
          cx.drawImage(img, 0, 0, cv.width, cv.height);
          resolve(cv.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = reject;
        img.src = r.result;
      };
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  }
  window.studioExport = {
    exportPNG,
    logoToDataURL
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/export.jsx", error: String((e && e.message) || e) }); }

// studio/icons.jsx
try { (() => {
/* icons.jsx — compact Lucide-style icon set (1.6px stroke). <Icon name=.. size=.. /> */
(function () {
  const P = {
    cursor: "M4 3l7 17 2.5-6.5L20 11 4 3z",
    hand: "M8 13V5.5a1.5 1.5 0 013 0V11m0-1V4.5a1.5 1.5 0 013 0V11m0-2V6a1.5 1.5 0 013 0v7a6 6 0 01-6 6h-1.5a5 5 0 01-3.6-1.5L6 14a1.6 1.6 0 012.3-2.2L10 13.5",
    ruler: "M3 9l6-6 12 12-6 6L3 9zm3 0l1.5 1.5M9 6l1.5 1.5M12 9l1.5 1.5M9 12l1.5 1.5",
    comment: "M21 11.5a8.4 8.4 0 01-9 8.4L3 21l1.1-3.3A8.4 8.4 0 1121 11.5z",
    plus: "M12 5v14M5 12h14",
    layers: "M12 3l9 5-9 5-9-5 9-5zm9 9l-9 5-9-5m18 4l-9 5-9-5",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    zoomIn: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3M11 8v6M8 11h6",
    zoomOut: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3M8 11h6",
    undo: "M9 14L4 9l5-5M4 9h11a5 5 0 010 10h-3",
    redo: "M15 14l5-5-5-5M20 9H9a5 5 0 000 10h3",
    search: "M11 4a7 7 0 100 14 7 7 0 000-14zM21 21l-4.3-4.3",
    nav: "M3 11l19-8-8 19-2.5-8.5L3 11z",
    bolt: "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
    droplet: "M12 3s6 6.5 6 11a6 6 0 11-12 0c0-4.5 6-11 6-11z",
    alert: "M12 3l10 17H2L12 3zm0 6v5m0 3v.5",
    x: "M5 5l14 14M19 5L5 19",
    sun: "M12 7a5 5 0 100 10 5 5 0 000-10zM12 1v3M12 20v3M4 12H1M23 12h-3M5 5L3 3M21 21l-2-2M5 19l-2 2M21 3l-2 2",
    moon: "M21 12.8A8.5 8.5 0 1111.2 3 6.6 6.6 0 0021 12.8z",
    share: "M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13",
    download: "M4 16v3a1 1 0 001 1h14a1 1 0 001-1v-3M8 11l4 4 4-4M12 3v12",
    copy: "M9 9h11v11H9zM5 15H4V4h11v1",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 9a3 3 0 100 6 3 3 0 000-6z",
    eyeOff: "M3 3l18 18M10.6 10.6A3 3 0 0014 14M9.5 5.4A9.6 9.6 0 0112 5c6 0 10 7 10 7a17 17 0 01-3 3.7M6.1 6.1A17 17 0 002 12s4 7 10 7a9.5 9.5 0 004-0.9",
    trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
    rotate: "M21 12a9 9 0 11-3-6.7L21 8M21 3v5h-5",
    check: "M5 13l4 4L19 7",
    pin: "M12 2a7 7 0 00-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 00-7-7zm0 4a3 3 0 110 6 3 3 0 010-6z",
    users: "M16 19v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 9a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM22 19v-2a4 4 0 00-3-3.8M16 2.2a4 4 0 010 7.6",
    clock: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8v4l3 2",
    mic: "M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM5 11a7 7 0 0014 0M12 18v3",
    utensils: "M4 3v7a2 2 0 002 2 2 2 0 002-2V3M6 3v18M16 3c-1.5 0-3 2-3 5s1 4 3 4v9",
    door: "M5 21V4a1 1 0 011-1h9a1 1 0 011 1v17M3 21h18M13 12h.5",
    building: "M4 21V5a1 1 0 011-1h9a1 1 0 011 1v16M8 8h2M8 12h2M8 16h2M15 21V9h3a1 1 0 011 1v11M3 21h18",
    ticket: "M4 8a2 2 0 002-2h12a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H6a2 2 0 00-2-2v-2a2 2 0 000-4V8z",
    settings: "M12 9a3 3 0 100 6 3 3 0 000-6zM19.4 13a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-2.7 1.1V21a2 2 0 11-4 0v-.2a1.6 1.6 0 00-2.7-1.1l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00-1.1-2.7H1a2 2 0 110-4h.2A1.6 1.6 0 003.3 8.4l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 002.7-1.1V4a2 2 0 114 0v.2a1.6 1.6 0 002.7 1.1l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 001.1 2.7H21a2 2 0 110 4h-.2a1.6 1.6 0 00-1.4 1z",
    chevronDown: "M6 9l6 6 6-6",
    chevronRight: "M9 6l6 6-6 6",
    target: "M12 4a8 8 0 100 16 8 8 0 000-16zM12 8a4 4 0 100 8 4 4 0 000-8zM12 11.5a.5.5 0 100 1 .5.5 0 000-1z",
    menu: "M3 6h18M3 12h18M3 18h18",
    star: "M12 3l2.6 6.3 6.8.5-5.2 4.4 1.6 6.6L12 17.7 6.2 21.3l1.6-6.6L2.6 9.8l6.8-.5L12 3z",
    fit: "M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3",
    flag: "M5 21V4M5 4h11l-2 4 2 4H5",
    compass: "M12 4a8 8 0 100 16 8 8 0 000-16zM15.5 8.5l-2 5-5 2 2-5 5-2z"
  };
  function Icon({
    name,
    size = 18,
    stroke = 1.6,
    fill = "none",
    style,
    className
  }) {
    const d = P[name] || P.cursor;
    return /*#__PURE__*/React.createElement("svg", {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: fill,
      stroke: "currentColor",
      strokeWidth: stroke,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      style: style,
      className: className,
      "aria-hidden": "true"
    }, d.split("M").filter(Boolean).map((seg, i) => /*#__PURE__*/React.createElement("path", {
      key: i,
      d: "M" + seg
    })));
  }
  window.Icon = Icon;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/icons.jsx", error: String((e && e.message) || e) }); }

// studio/useStudio.jsx
try { (() => {
/* useStudio.jsx — multi-layout state, undo/redo, object CRUD,
   comments, measurements, layout versioning. window.useStudio */
(function () {
  const {
    useState,
    useEffect,
    useRef,
    useCallback
  } = React;
  const store = window.STUDIO.store;
  const HIST = 60;
  function useStudio() {
    const [state, setState] = useState(() => store.load());
    const stateRef = useRef(state);
    stateRef.current = state; // always points at the latest state (fixes stale-closure during drags)
    const past = useRef([]);
    const future = useRef([]);
    const [, force] = useState(0);
    const localWrite = useRef(false);
    useEffect(() => store.subscribe(s => {
      if (localWrite.current) return;
      stateRef.current = s;
      setState(s);
    }), []);
    const active = state.layouts[state.activeIndex];

    // Core: apply a producer to current state. recordHistory pushes one undo snapshot.
    const apply = useCallback((producer, recordHistory) => {
      const prev = stateRef.current;
      if (recordHistory) {
        past.current.push(JSON.stringify(prev));
        if (past.current.length > HIST) past.current.shift();
        future.current = [];
      }
      const next = producer(prev);
      stateRef.current = next;
      localWrite.current = true;
      setState(next);
      store.save(next);
      setTimeout(() => {
        localWrite.current = false;
      }, 0);
      force(n => n + 1);
    }, []);
    const write = useCallback((nextState, pushHistory) => {
      apply(() => nextState, pushHistory !== false);
    }, [apply]);

    // Push a single undo snapshot WITHOUT changing state — call once at the start
    // of a continuous interaction (e.g. a drag) so the whole drag is one undo step.
    const beginChange = useCallback(() => {
      past.current.push(JSON.stringify(stateRef.current));
      if (past.current.length > HIST) past.current.shift();
      future.current = [];
      force(n => n + 1);
    }, []);

    // mutate the active layout. recordHistory defaults true; pass {transient:true} to skip.
    const mutateActive = useCallback((fn, recordHistory) => {
      apply(prev => ({
        ...prev,
        layouts: prev.layouts.map((l, i) => i === prev.activeIndex ? fn({
          ...l
        }) : l)
      }), recordHistory !== false);
    }, [apply]);
    const updateObjects = useCallback((patches, opts) => {
      const transient = opts === false || opts && opts.transient;
      mutateActive(l => {
        const map = Object.fromEntries(patches.map(p => [p.id, p]));
        l.objects = l.objects.map(o => map[o.id] ? {
          ...o,
          ...map[o.id]
        } : o);
        return l;
      }, !transient);
    }, [mutateActive]);
    const addObject = useCallback(obj => {
      let id;
      mutateActive(l => {
        id = (l.objects.reduce((m, o) => Math.max(m, o.id), 0) || 0) + 1;
        l.objects = [...l.objects, {
          ...obj,
          id
        }];
        return l;
      });
      return id;
    }, [mutateActive]);
    const deleteObjects = useCallback(ids => {
      const set = new Set(ids);
      mutateActive(l => {
        l.objects = l.objects.filter(o => !set.has(o.id));
        return l;
      });
    }, [mutateActive]);
    const duplicateObjects = useCallback(ids => {
      const newIds = [];
      mutateActive(l => {
        let maxId = l.objects.reduce((m, o) => Math.max(m, o.id), 0);
        const set = new Set(ids);
        const dupes = l.objects.filter(o => set.has(o.id)).map(o => {
          maxId += 1;
          newIds.push(maxId);
          return {
            ...o,
            id: maxId,
            x: o.x + 6,
            y: o.y + 6,
            label: o.label
          };
        });
        l.objects = [...l.objects, ...dupes];
        return l;
      });
      return newIds;
    }, [mutateActive]);
    const addComment = useCallback(c => {
      mutateActive(l => {
        const id = Date.now();
        l.comments = [...(l.comments || []), {
          id,
          ...c
        }];
        return l;
      });
    }, [mutateActive]);
    const resolveComment = useCallback(id => {
      mutateActive(l => {
        l.comments = (l.comments || []).filter(c => c.id !== id);
        return l;
      });
    }, [mutateActive]);
    const addMeasurement = useCallback(m => {
      mutateActive(l => {
        l.measurements = [...(l.measurements || []), m];
        return l;
      });
    }, [mutateActive]);
    const setEmergency = useCallback((em, opts) => {
      const transient = opts && opts.transient;
      mutateActive(l => {
        l.emergency = em;
        return l;
      }, !transient);
    }, [mutateActive]);
    const deleteMeasurement = useCallback(idx => {
      mutateActive(l => {
        l.measurements = (l.measurements || []).filter((_, i) => i !== idx);
        return l;
      });
    }, [mutateActive]);
    const clearMeasurements = useCallback(() => {
      mutateActive(l => {
        l.measurements = [];
        return l;
      });
    }, [mutateActive]);

    // whole-project backup
    const importState = useCallback(s => {
      if (!s || !Array.isArray(s.layouts) || !s.layouts.length) throw new Error("Invalid backup file");
      const clean = {
        layouts: s.layouts,
        activeIndex: Math.max(0, Math.min(s.layouts.length - 1, s.activeIndex || 0))
      };
      write(clean);
    }, [write]);
    const undo = useCallback(() => {
      const prev = past.current.pop();
      if (!prev) return;
      future.current.push(JSON.stringify(stateRef.current));
      const s = JSON.parse(prev);
      stateRef.current = s;
      localWrite.current = true;
      setState(s);
      store.save(s);
      setTimeout(() => {
        localWrite.current = false;
      }, 0);
      force(n => n + 1);
    }, []);
    const redo = useCallback(() => {
      const nxt = future.current.pop();
      if (!nxt) return;
      past.current.push(JSON.stringify(stateRef.current));
      const s = JSON.parse(nxt);
      stateRef.current = s;
      localWrite.current = true;
      setState(s);
      store.save(s);
      setTimeout(() => {
        localWrite.current = false;
      }, 0);
      force(n => n + 1);
    }, []);

    // layout management
    const setActiveIndex = useCallback(i => {
      write({
        ...state,
        activeIndex: i
      }, false);
    }, [state, write]);
    const duplicateLayout = useCallback(() => {
      const copy = JSON.parse(JSON.stringify(active));
      copy.name = active.name.replace(/ \(copy\)$/, "") + " (copy)";
      copy.published = false;
      const layouts = [...state.layouts, copy];
      write({
        ...state,
        layouts,
        activeIndex: layouts.length - 1
      });
    }, [state, active, write]);
    const renameLayout = useCallback(name => {
      mutateActive(l => {
        l.name = name;
        return l;
      }, false);
    }, [mutateActive]);
    const togglePublished = useCallback(() => {
      mutateActive(l => {
        l.published = !l.published;
        return l;
      });
    }, [mutateActive]);
    const deleteLayout = useCallback(i => {
      if (state.layouts.length <= 1) return;
      const layouts = state.layouts.filter((_, k) => k !== i);
      write({
        ...state,
        layouts,
        activeIndex: Math.max(0, Math.min(layouts.length - 1, state.activeIndex >= i ? state.activeIndex - 1 : state.activeIndex))
      });
    }, [state, write]);
    const resetAll = useCallback(() => {
      const s = store.reset();
      past.current = [];
      future.current = [];
      setState(s);
      force(n => n + 1);
    }, []);
    return {
      state,
      active,
      activeIndex: state.activeIndex,
      layouts: state.layouts,
      updateObjects,
      addObject,
      deleteObjects,
      duplicateObjects,
      addComment,
      resolveComment,
      addMeasurement,
      deleteMeasurement,
      clearMeasurements,
      importState,
      setEmergency,
      undo,
      redo,
      beginChange,
      canUndo: past.current.length > 0,
      canRedo: future.current.length > 0,
      setActiveIndex,
      duplicateLayout,
      renameLayout,
      togglePublished,
      deleteLayout,
      resetAll
    };
  }
  window.useStudio = useStudio;
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "studio/useStudio.jsx", error: String((e && e.message) || e) }); }

// tweaks-panel.jsx
try { (() => {
// @ds-adherence-ignore -- omelette starter scaffold (raw elements/hex/px by design)

/* BEGIN USAGE */
// tweaks-panel.jsx
// Reusable Tweaks shell + form-control helpers.
// Exports (to window): useTweaks, TweaksPanel, TweakSection, TweakRow, TweakSlider,
//   TweakToggle, TweakRadio, TweakSelect, TweakText, TweakNumber, TweakColor, TweakButton.
//
// Owns the host protocol (listens for __activate_edit_mode / __deactivate_edit_mode,
// posts __edit_mode_available / __edit_mode_set_keys / __edit_mode_dismissed) so
// individual prototypes don't re-roll it. Ships a consistent set of controls so you
// don't hand-draw <input type="range">, segmented radios, steppers, etc.
//
// Usage (in an HTML file that loads React + Babel):
//
//   const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
//     "primaryColor": "#D97757",
//     "palette": ["#D97757", "#29261b", "#f6f4ef"],
//     "fontSize": 16,
//     "density": "regular",
//     "dark": false
//   }/*EDITMODE-END*/;
//
//   function App() {
//     const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
//     return (
//       <div style={{ fontSize: t.fontSize, color: t.primaryColor }}>
//         Hello
//         <TweaksPanel>
//           <TweakSection label="Typography" />
//           <TweakSlider label="Font size" value={t.fontSize} min={10} max={32} unit="px"
//                        onChange={(v) => setTweak('fontSize', v)} />
//           <TweakRadio  label="Density" value={t.density}
//                        options={['compact', 'regular', 'comfy']}
//                        onChange={(v) => setTweak('density', v)} />
//           <TweakSection label="Theme" />
//           <TweakColor  label="Primary" value={t.primaryColor}
//                        options={['#D97757', '#2A6FDB', '#1F8A5B', '#7A5AE0']}
//                        onChange={(v) => setTweak('primaryColor', v)} />
//           <TweakColor  label="Palette" value={t.palette}
//                        options={[['#D97757', '#29261b', '#f6f4ef'],
//                                  ['#475569', '#0f172a', '#f1f5f9']]}
//                        onChange={(v) => setTweak('palette', v)} />
//           <TweakToggle label="Dark mode" value={t.dark}
//                        onChange={(v) => setTweak('dark', v)} />
//         </TweaksPanel>
//       </div>
//     );
//   }
//
// TweakRadio is the segmented control for 2–3 short options (auto-falls-back to
// TweakSelect past ~16/~10 chars per label); reach for TweakSelect directly when
// options are many or long. For color tweaks always curate 3-4 options rather than
// a free picker; an option can also be a whole 2–5 color palette (the stored value
// is the array). The Tweak* controls are a floor, not a ceiling — build custom
// controls inside the panel if a tweak calls for UI they don't cover.
/* END USAGE */
// ─────────────────────────────────────────────────────────────────────────────

const __TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    transform:scale(var(--dc-inv-zoom,1));transform-origin:bottom right;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:rgba(0,0,0,.15) transparent}
  .twk-body::-webkit-scrollbar{width:8px}
  .twk-body::-webkit-scrollbar-track{background:transparent;margin:2px}
  .twk-body::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15);border-radius:4px;
    border:2px solid transparent;background-clip:content-box}
  .twk-body::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25);
    border:2px solid transparent;background-clip:content-box}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;
    color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:rgba(41,38,27,.5);font-variant-numeric:tabular-nums}

  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}

  .twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;
    background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
  .twk-field:focus{border-color:rgba(0,0,0,.25);background:rgba(255,255,255,.85)}
  select.twk-field{padding-right:22px;
    background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path fill='rgba(0,0,0,.5)' d='M0 0h10L5 6z'/></svg>");
    background-repeat:no-repeat;background-position:right 8px center}

  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:rgba(0,0,0,.12);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:#fff;
    border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:#fff;border:.5px solid rgba(0,0,0,.12);box-shadow:0 1px 3px rgba(0,0,0,.2);cursor:default}

  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;
    background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;
    background:rgba(255,255,255,.9);box-shadow:0 1px 2px rgba(0,0,0,.12);
    transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg.dragging .twk-seg-thumb{transition:none}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;
    background:transparent;color:inherit;font:inherit;font-weight:500;min-height:22px;
    border-radius:6px;cursor:default;padding:4px 6px;line-height:1.2;
    overflow-wrap:anywhere}

  .twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;
    background:rgba(0,0,0,.15);transition:background .15s;cursor:default;padding:0}
  .twk-toggle[data-on="1"]{background:#34c759}
  .twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;
    background:#fff;box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
  .twk-toggle[data-on="1"] i{transform:translateX(14px)}

  .twk-num{display:flex;align-items:center;box-sizing:border-box;min-width:0;height:26px;padding:0 0 0 8px;
    border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6)}
  .twk-num-lbl{font-weight:500;color:rgba(41,38,27,.6);cursor:ew-resize;
    user-select:none;padding-right:8px}
  .twk-num input{flex:1;min-width:0;height:100%;border:0;background:transparent;
    font:inherit;font-variant-numeric:tabular-nums;text-align:right;padding:0 8px 0 0;
    outline:none;color:inherit;-moz-appearance:textfield}
  .twk-num input::-webkit-inner-spin-button,.twk-num input::-webkit-outer-spin-button{
    -webkit-appearance:none;margin:0}
  .twk-num-unit{padding-right:8px;color:rgba(41,38,27,.45)}

  .twk-btn{appearance:none;height:26px;padding:0 12px;border:0;border-radius:7px;
    background:rgba(0,0,0,.78);color:#fff;font:inherit;font-weight:500;cursor:default}
  .twk-btn:hover{background:rgba(0,0,0,.88)}
  .twk-btn.secondary{background:rgba(0,0,0,.06);color:inherit}
  .twk-btn.secondary:hover{background:rgba(0,0,0,.1)}

  .twk-swatch{appearance:none;-webkit-appearance:none;width:56px;height:22px;
    border:.5px solid rgba(0,0,0,.1);border-radius:6px;padding:0;cursor:default;
    background:transparent;flex-shrink:0}
  .twk-swatch::-webkit-color-swatch-wrapper{padding:0}
  .twk-swatch::-webkit-color-swatch{border:0;border-radius:5.5px}
  .twk-swatch::-moz-color-swatch{border:0;border-radius:5.5px}

  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;
    padding:0;border:0;border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);
    box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),
    0 2px 6px rgba(0,0,0,.15)}
  .twk-chip>span{position:absolute;top:0;bottom:0;right:0;width:34%;
    display:flex;flex-direction:column;box-shadow:-1px 0 0 rgba(0,0,0,.1)}
  .twk-chip>span>i{flex:1;box-shadow:0 -1px 0 rgba(0,0,0,.1)}
  .twk-chip>span>i:first-child{box-shadow:none}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
`;

// ── useTweaks ───────────────────────────────────────────────────────────────
// Single source of truth for tweak values. setTweak persists via the host
// (__edit_mode_set_keys → host rewrites the EDITMODE block on disk).
function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts either setTweak('key', value) or setTweak({ key: value, ... }) so a
  // useState-style call doesn't write a "[object Object]" key into the persisted
  // JSON block.
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null ? keyOrEdits : {
      [keyOrEdits]: val
    };
    setValues(prev => ({
      ...prev,
      ...edits
    }));
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits
    }, '*');
    // Same-window signal so in-page listeners (deck-stage rail thumbnails)
    // can react — the parent message only reaches the host, not peers.
    window.dispatchEvent(new CustomEvent('tweakchange', {
      detail: edits
    }));
  }, []);
  return [values, setTweak];
}

// ── TweaksPanel ─────────────────────────────────────────────────────────────
// Floating shell. Registers the protocol listener BEFORE announcing
// availability — if the announce ran first, the host's activate could land
// before our handler exists and the toolbar toggle would silently no-op.
// The close button posts __edit_mode_dismissed so the host's toolbar toggle
// flips off in lockstep; the host echoes __deactivate_edit_mode back which
// is what actually hides the panel.
function TweaksPanel({
  title = 'Tweaks',
  children
}) {
  const [open, setOpen] = React.useState(false);
  const dragRef = React.useRef(null);
  const offsetRef = React.useRef({
    x: 16,
    y: 16
  });
  const PAD = 16;
  const clampToViewport = React.useCallback(() => {
    const panel = dragRef.current;
    if (!panel) return;
    const w = panel.offsetWidth,
      h = panel.offsetHeight;
    const maxRight = Math.max(PAD, window.innerWidth - w - PAD);
    const maxBottom = Math.max(PAD, window.innerHeight - h - PAD);
    offsetRef.current = {
      x: Math.min(maxRight, Math.max(PAD, offsetRef.current.x)),
      y: Math.min(maxBottom, Math.max(PAD, offsetRef.current.y))
    };
    panel.style.right = offsetRef.current.x + 'px';
    panel.style.bottom = offsetRef.current.y + 'px';
  }, []);
  React.useEffect(() => {
    if (!open) return;
    clampToViewport();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', clampToViewport);
      return () => window.removeEventListener('resize', clampToViewport);
    }
    const ro = new ResizeObserver(clampToViewport);
    ro.observe(document.documentElement);
    return () => ro.disconnect();
  }, [open, clampToViewport]);
  React.useEffect(() => {
    const onMsg = e => {
      const t = e?.data?.type;
      if (t === '__activate_edit_mode') setOpen(true);else if (t === '__deactivate_edit_mode') setOpen(false);
    };
    window.addEventListener('message', onMsg);
    window.parent.postMessage({
      type: '__edit_mode_available'
    }, '*');
    return () => window.removeEventListener('message', onMsg);
  }, []);
  const dismiss = () => {
    setOpen(false);
    window.parent.postMessage({
      type: '__edit_mode_dismissed'
    }, '*');
  };
  const onDragStart = e => {
    const panel = dragRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX,
      sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = ev => {
      offsetRef.current = {
        x: startRight - (ev.clientX - sx),
        y: startBottom - (ev.clientY - sy)
      };
      clampToViewport();
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  };
  if (!open) return null;
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("style", null, __TWEAKS_STYLE), /*#__PURE__*/React.createElement("div", {
    ref: dragRef,
    className: "twk-panel",
    "data-omelette-chrome": "",
    style: {
      right: offsetRef.current.x,
      bottom: offsetRef.current.y
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-hd",
    onMouseDown: onDragStart
  }, /*#__PURE__*/React.createElement("b", null, title), /*#__PURE__*/React.createElement("button", {
    className: "twk-x",
    "aria-label": "Close tweaks",
    onMouseDown: e => e.stopPropagation(),
    onClick: dismiss
  }, "\u2715")), /*#__PURE__*/React.createElement("div", {
    className: "twk-body"
  }, children)));
}

// ── Layout helpers ──────────────────────────────────────────────────────────

function TweakSection({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "twk-sect"
  }, label), children);
}
function TweakRow({
  label,
  value,
  children,
  inline = false
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: inline ? 'twk-row twk-row-h' : 'twk-row'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label), value != null && /*#__PURE__*/React.createElement("span", {
    className: "twk-val"
  }, value)), children);
}

// ── Controls ────────────────────────────────────────────────────────────────

function TweakSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label,
    value: `${value}${unit}`
  }, /*#__PURE__*/React.createElement("input", {
    type: "range",
    className: "twk-slider",
    min: min,
    max: max,
    step: step,
    value: value,
    onChange: e => onChange(Number(e.target.value))
  }));
}
function TweakToggle({
  label,
  value,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-row twk-row-h"
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-lbl"
  }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "twk-toggle",
    "data-on": value ? '1' : '0',
    role: "switch",
    "aria-checked": !!value,
    onClick: () => onChange(!value)
  }, /*#__PURE__*/React.createElement("i", null)));
}
function TweakRadio({
  label,
  value,
  options,
  onChange
}) {
  const trackRef = React.useRef(null);
  const [dragging, setDragging] = React.useState(false);
  // The active value is read by pointer-move handlers attached for the lifetime
  // of a drag — ref it so a stale closure doesn't fire onChange for every move.
  const valueRef = React.useRef(value);
  valueRef.current = value;

  // Segments wrap mid-word once per-segment width runs out. The track is
  // ~248px (280 panel − 28 body pad − 4 seg pad), each button loses 12px
  // to its own padding, and 11.5px system-ui averages ~6.3px/char — so 2
  // options fit ~16 chars each, 3 fit ~10. Past that (or >3 options), fall
  // back to a dropdown rather than wrap.
  const labelLen = o => String(typeof o === 'object' ? o.label : o).length;
  const maxLen = options.reduce((m, o) => Math.max(m, labelLen(o)), 0);
  const fitsAsSegments = maxLen <= ({
    2: 16,
    3: 10
  }[options.length] ?? 0);
  if (!fitsAsSegments) {
    // <select> emits strings — map back to the original option value so the
    // fallback stays type-preserving (numbers, booleans) like the segment path.
    const resolve = s => {
      const m = options.find(o => String(typeof o === 'object' ? o.value : o) === s);
      return m === undefined ? s : typeof m === 'object' ? m.value : m;
    };
    return /*#__PURE__*/React.createElement(TweakSelect, {
      label: label,
      value: value,
      options: options,
      onChange: s => onChange(resolve(s))
    });
  }
  const opts = options.map(o => typeof o === 'object' ? o : {
    value: o,
    label: o
  });
  const idx = Math.max(0, opts.findIndex(o => o.value === value));
  const n = opts.length;
  const segAt = clientX => {
    const r = trackRef.current.getBoundingClientRect();
    const inner = r.width - 4;
    const i = Math.floor((clientX - r.left - 2) / inner * n);
    return opts[Math.max(0, Math.min(n - 1, i))].value;
  };
  const onPointerDown = e => {
    setDragging(true);
    const v0 = segAt(e.clientX);
    if (v0 !== valueRef.current) onChange(v0);
    const move = ev => {
      if (!trackRef.current) return;
      const v = segAt(ev.clientX);
      if (v !== valueRef.current) onChange(v);
    };
    const up = () => {
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    ref: trackRef,
    role: "radiogroup",
    onPointerDown: onPointerDown,
    className: dragging ? 'twk-seg dragging' : 'twk-seg'
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-seg-thumb",
    style: {
      left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
      width: `calc((100% - 4px) / ${n})`
    }
  }), opts.map(o => /*#__PURE__*/React.createElement("button", {
    key: o.value,
    type: "button",
    role: "radio",
    "aria-checked": o.value === value
  }, o.label))));
}
function TweakSelect({
  label,
  value,
  options,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("select", {
    className: "twk-field",
    value: value,
    onChange: e => onChange(e.target.value)
  }, options.map(o => {
    const v = typeof o === 'object' ? o.value : o;
    const l = typeof o === 'object' ? o.label : o;
    return /*#__PURE__*/React.createElement("option", {
      key: v,
      value: v
    }, l);
  })));
}
function TweakText({
  label,
  value,
  placeholder,
  onChange
}) {
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("input", {
    className: "twk-field",
    type: "text",
    value: value,
    placeholder: placeholder,
    onChange: e => onChange(e.target.value)
  }));
}
function TweakNumber({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange
}) {
  const clamp = n => {
    if (min != null && n < min) return min;
    if (max != null && n > max) return max;
    return n;
  };
  const startRef = React.useRef({
    x: 0,
    val: 0
  });
  const onScrubStart = e => {
    e.preventDefault();
    startRef.current = {
      x: e.clientX,
      val: value
    };
    const decimals = (String(step).split('.')[1] || '').length;
    const move = ev => {
      const dx = ev.clientX - startRef.current.x;
      const raw = startRef.current.val + dx * step;
      const snapped = Math.round(raw / step) * step;
      onChange(clamp(Number(snapped.toFixed(decimals))));
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "twk-num"
  }, /*#__PURE__*/React.createElement("span", {
    className: "twk-num-lbl",
    onPointerDown: onScrubStart
  }, label), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: value,
    min: min,
    max: max,
    step: step,
    onChange: e => onChange(clamp(Number(e.target.value)))
  }), unit && /*#__PURE__*/React.createElement("span", {
    className: "twk-num-unit"
  }, unit));
}

// Relative-luminance contrast pick — checkmarks drawn over a swatch need to
// read on both #111 and #fafafa without per-option configuration. Hex input
// only (#rgb / #rrggbb); named or rgb()/hsl() colors fall through to "light".
function __twkIsLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, c => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = n >> 16 & 255,
    g = n >> 8 & 255,
    b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}
const __TwkCheck = ({
  light
}) => /*#__PURE__*/React.createElement("svg", {
  viewBox: "0 0 14 14",
  "aria-hidden": "true"
}, /*#__PURE__*/React.createElement("path", {
  d: "M3 7.2 5.8 10 11 4.2",
  fill: "none",
  strokeWidth: "2.2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
  stroke: light ? 'rgba(0,0,0,.78)' : '#fff'
}));

// TweakColor — curated color/palette picker. Each option is either a single
// hex string or an array of 1-5 hex strings; the card adapts — a lone color
// renders solid, a palette renders colors[0] as the hero (left ~2/3) with the
// rest stacked in a sharp column on the right. onChange emits the
// option in the shape it was passed (string stays string, array stays array).
// Without options it falls back to the native color input for back-compat.
function TweakColor({
  label,
  value,
  options,
  onChange
}) {
  if (!options || !options.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "twk-row twk-row-h"
    }, /*#__PURE__*/React.createElement("div", {
      className: "twk-lbl"
    }, /*#__PURE__*/React.createElement("span", null, label)), /*#__PURE__*/React.createElement("input", {
      type: "color",
      className: "twk-swatch",
      value: value,
      onChange: e => onChange(e.target.value)
    }));
  }
  // Native <input type=color> emits lowercase hex per the HTML spec, so
  // compare case-insensitively. String() guards JSON.stringify(undefined),
  // which returns the primitive undefined (no .toLowerCase).
  const key = o => String(JSON.stringify(o)).toLowerCase();
  const cur = key(value);
  return /*#__PURE__*/React.createElement(TweakRow, {
    label: label
  }, /*#__PURE__*/React.createElement("div", {
    className: "twk-chips",
    role: "radiogroup"
  }, options.map((o, i) => {
    const colors = Array.isArray(o) ? o : [o];
    const [hero, ...rest] = colors;
    const sup = rest.slice(0, 4);
    const on = key(o) === cur;
    return /*#__PURE__*/React.createElement("button", {
      key: i,
      type: "button",
      className: "twk-chip",
      role: "radio",
      "aria-checked": on,
      "data-on": on ? '1' : '0',
      "aria-label": colors.join(', '),
      title: colors.join(' · '),
      style: {
        background: hero
      },
      onClick: () => onChange(o)
    }, sup.length > 0 && /*#__PURE__*/React.createElement("span", null, sup.map((c, j) => /*#__PURE__*/React.createElement("i", {
      key: j,
      style: {
        background: c
      }
    }))), on && /*#__PURE__*/React.createElement(__TwkCheck, {
      light: __twkIsLight(hero)
    }));
  })));
}
function TweakButton({
  label,
  onClick,
  secondary = false
}) {
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: secondary ? 'twk-btn secondary' : 'twk-btn',
    onClick: onClick
  }, label);
}
Object.assign(window, {
  useTweaks,
  TweaksPanel,
  TweakSection,
  TweakRow,
  TweakSlider,
  TweakToggle,
  TweakRadio,
  TweakSelect,
  TweakText,
  TweakNumber,
  TweakColor,
  TweakButton
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "tweaks-panel.jsx", error: String((e && e.message) || e) }); }

__ds_ns.MerchTeaser = __ds_scope.MerchTeaser;

})();
