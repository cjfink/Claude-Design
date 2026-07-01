/* OrganizerDetail.jsx — booth detail editor, logo upload (downscaled to a
   data-URL for offline storage), and a native canvas PNG export. */
(function () {
  const { useState, useRef } = React;
  const { categorizeVendor, CATEGORY_COLORS, fillFor, EVENT } = window.TCCF;
  const { StatusBadge, STATUS_META, Avatar } = window.TCCFUI;
  const FOREST = "#4A4B35", CREMA = "#EBE5DB", CORAL = "#AA7050", LATTE = "#746137";

  /* ---- Downscale an uploaded image to a small data URL ---- */
  function fileToDataURL(file, maxPx = 180) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const s = Math.min(1, maxPx / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          const ctx = c.getContext("2d");
          ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
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
    const PAD = 90, S = lot.scale * 2.2; // crisp 2.2px/ft
    const W = lot.w * S + PAD * 2, H = lot.h * S + PAD * 2;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    // Paper
    ctx.fillStyle = "#EBE5DB"; ctx.fillRect(0, 0, W, H);
    // Lot
    ctx.fillStyle = "#BAB492"; ctx.fillRect(PAD, PAD, lot.w * S, lot.h * S);
    // Grid (5ft)
    ctx.strokeStyle = "rgba(24,24,24,0.10)"; ctx.lineWidth = 1;
    for (let x = 0; x <= lot.w; x += 5) { ctx.beginPath(); ctx.moveTo(PAD + x * S, PAD); ctx.lineTo(PAD + x * S, PAD + lot.h * S); ctx.stroke(); }
    for (let y = 0; y <= lot.h; y += 5) { ctx.beginPath(); ctx.moveTo(PAD, PAD + y * S); ctx.lineTo(PAD + lot.w * S, PAD + y * S); ctx.stroke(); }
    // Cutout
    ctx.fillStyle = "#2c2d20"; ctx.fillRect(PAD, PAD + 250 * S, 71 * S, 145 * S);

    const drawObj = (o) => {
      const f = fillFor(o);
      const x = PAD + o.x * S, y = PAD + o.y * S, w = o.w * S, h = o.h * S;
      ctx.fillStyle = f.bg && f.bg.indexOf("rgba") === 0 ? f.bg : (f.bg || "#9C8B6E");
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = f.border || "rgba(24,24,24,0.4)"; ctx.lineWidth = 1.2; ctx.strokeRect(x, y, w, h);
      const isVendor = o.type === "vendor" || o.type === "sponsor" || o.type === "food";
      ctx.fillStyle = f.text_color || "#181818";
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      if (isVendor) {
        const init = (o.label || "").split(/\s+/).slice(0, 2).map((s) => s[0] || "").join("").toUpperCase().slice(0, 2);
        ctx.font = `700 ${Math.min(20, Math.max(9, w * 0.34))}px "Styrene B", Helvetica, sans-serif`;
        ctx.fillText(init || "?", x + w / 2, y + h / 2);
      } else {
        ctx.font = `${Math.min(13, Math.max(8, w * 0.085))}px "GT Flexa Mono", monospace`;
        const words = (o.label || "").split(" ");
        words.forEach((wd, i) => ctx.fillText(wd.toUpperCase(), x + w / 2, y + h / 2 + (i - (words.length - 1) / 2) * (h * 0.13)));
      }
    };
    objects.filter((o) => o.category === "zone").forEach(drawObj);
    objects.filter((o) => o.category !== "zone").forEach(drawObj);

    // Title block
    ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#181818";
    ctx.font = `700 40px "Styrene B", Helvetica, sans-serif`;
    ctx.fillText("THE CHARLOTTE COFFEE FESTIVAL", PAD, 56);
    ctx.font = `20px "GT Flexa Mono", monospace`;
    ctx.fillStyle = "#746137";
    ctx.fillText(`VENDOR MAP · ${EVENT.date} · ${EVENT.venue}`, PAD, H - 36);

    return new Promise((resolve) => {
      c.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `tccf-vendor-map-${Date.now()}.png`; a.click();
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    });
  }

  /* ---- Detail panel ---- */
  function DetailPanel({ obj, onClose, onUpdate, onDelete }) {
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef(null);
    const isVendor = obj.type === "vendor" || obj.type === "sponsor" || obj.type === "food";

    const onUpload = async (file) => {
      if (!file.type.startsWith("image/")) { window.toast && window.toast("PNG or JPG only", "err"); return; }
      setUploading(true);
      try { const url = await fileToDataURL(file); onUpdate({ logo_url: url }); window.toast && window.toast("Logo added"); }
      catch (e) { window.toast && window.toast("Upload failed", "err"); }
      finally { setUploading(false); }
    };

    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ background: FOREST, color: CREMA, padding: "20px 22px", display: "flex", alignItems: "flex-start", gap: 14 }}>
          <Avatar obj={obj} size={54} round={3} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", textTransform: "uppercase", fontSize: 20, lineHeight: 1.05, color: CREMA, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{obj.label || "Unnamed booth"}</h3>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, opacity: 0.8, marginTop: 5, letterSpacing: "0.06em" }}>{obj.booth_number || `BOOTH #${obj.id}`} · {Math.round(obj.w)}×{Math.round(obj.h)} FT</div>
          </div>
          <button onClick={onClose} aria-label="Close" style={{ background: "none", border: "none", color: CREMA, cursor: "pointer", fontSize: 18, opacity: 0.8 }}>✕</button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: 22, display: "grid", gap: 18 }}>
          {isVendor && (
            <React.Fragment>
              {/* Status */}
              <div>
                <Lbl>Status</Lbl>
                <div style={{ display: "flex", gap: 6 }}>
                  {Object.keys(STATUS_META).map((s) => (
                    <button key={s} onClick={() => onUpdate({ status: s })}
                      style={{ flex: 1, padding: "8px 4px", borderRadius: 2, cursor: "pointer", fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.08em",
                        border: obj.status === s ? `2px solid ${FOREST}` : "1px solid var(--rule-soft)",
                        background: obj.status === s ? STATUS_META[s].bg : "transparent", color: obj.status === s ? STATUS_META[s].fg : LATTE }}>
                      {STATUS_META[s].label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Logo */}
              <div>
                <Lbl>Logo</Lbl>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) onUpload(f); }} />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => fileRef.current && fileRef.current.click()} disabled={uploading} className="tccf-btn-coral" style={{ flex: 1, justifyContent: "center" }}>
                    {uploading ? "Uploading…" : obj.logo_url ? "Replace Logo" : "Upload Logo"}
                  </button>
                  {obj.logo_url && <button onClick={() => onUpdate({ logo_url: null })} className="tccf-btn-ghost">Remove</button>}
                </div>
              </div>
            </React.Fragment>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Name" value={obj.label || ""} onChange={(v) => onUpdate({ label: v })} />
            <Field label="Booth #" value={obj.booth_number || ""} onChange={(v) => onUpdate({ booth_number: v || null })} />
          </div>
          {isVendor && (
            <React.Fragment>
              <Field label="Contact name" value={obj.contact_name || ""} onChange={(v) => onUpdate({ contact_name: v || null })} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Email" value={obj.vendor_email || ""} onChange={(v) => onUpdate({ vendor_email: v || null })} />
                <Field label="Phone" value={obj.phone || ""} onChange={(v) => onUpdate({ phone: v || null })} />
              </div>
              <div>
                <Lbl>Notes (internal)</Lbl>
                <textarea value={obj.notes || ""} onChange={(e) => onUpdate({ notes: e.target.value || null })} rows={3} placeholder="Not shown publicly" className="tccf-input" style={{ resize: "vertical" }} />
              </div>
            </React.Fragment>
          )}

          <div>
            <Lbl>Position & size (feet)</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              <NumField label="X" value={obj.x} onChange={(v) => onUpdate({ x: v })} />
              <NumField label="Y" value={obj.y} onChange={(v) => onUpdate({ y: v })} />
              <NumField label="W" value={obj.w} onChange={(v) => onUpdate({ w: v })} />
              <NumField label="H" value={obj.h} onChange={(v) => onUpdate({ h: v })} />
            </div>
          </div>

          <button onClick={onDelete} className="tccf-btn-danger" style={{ marginTop: 4 }}>Delete booth</button>
        </div>
      </div>
    );
  }

  function Lbl({ children }) {
    return <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.12em", color: LATTE, marginBottom: 7 }}>{children}</div>;
  }
  function Field({ label, value, onChange }) {
    return <label style={{ display: "block" }}><Lbl>{label}</Lbl><input value={value} onChange={(e) => onChange(e.target.value)} className="tccf-input" /></label>;
  }
  function NumField({ label, value, onChange }) {
    return <label style={{ display: "block" }}><Lbl>{label}</Lbl><input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="tccf-input" style={{ fontFamily: "var(--font-mono)" }} /></label>;
  }

  window.OrgDetail = { DetailPanel, exportMapPNG, fileToDataURL };
})();
