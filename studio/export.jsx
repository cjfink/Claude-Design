/* export.jsx — high-res canvas PNG of the active layout. window.studioExport */
(function () {
  const { STUDIO } = window;
  const { CATEGORIES, colorFor, EVENT } = STUDIO;
  const PLACE_FILL = { stage:"#3A2C18", food:"#4A4B35", ticketing:"#d8c4b2", restroom:"#75878B", building:"#CFC9BC", entrance:"#6B6E45", generator:"#C9A227", patch:"rgba(107,110,69,0.28)" };
  const PLACE_TXT = { stage:"#EBE5DB", food:"#EBE5DB", ticketing:"#5a3a22", restroom:"#fff", building:"#4A4B35", entrance:"#fff", generator:"#3a2c10", patch:"#3a3c24" };

  function rr(ctx, x, y, w, h, r) { r = Math.min(r, w/2, h/2); ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  async function exportPNG(doc, opts) {
    opts = opts || {};
    const mode = opts.mode || "organizer";
    const S = 5.2, PAD = 110;
    const lot = doc.lot;
    const W = lot.w*S + PAD*2, H = lot.h*S + PAD*2 + 60;
    const c = document.createElement("canvas"); c.width = W; c.height = H;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#F4F1EA"; ctx.fillRect(0,0,W,H);
    // lot
    rr(ctx, PAD, PAD, lot.w*S, lot.h*S, 12); ctx.fillStyle = "#DDD6C5"; ctx.fill();
    // grid
    ctx.strokeStyle = "rgba(33,28,20,0.08)"; ctx.lineWidth = 1;
    for (let x=0;x<=lot.w;x+=5){ ctx.beginPath(); ctx.moveTo(PAD+x*S,PAD); ctx.lineTo(PAD+x*S,PAD+lot.h*S); ctx.stroke(); }
    for (let y=0;y<=lot.h;y+=5){ ctx.beginPath(); ctx.moveTo(PAD,PAD+y*S); ctx.lineTo(PAD+lot.w*S,PAD+y*S); ctx.stroke(); }

    // emergency
    if ((mode==="utility") && doc.emergency) {
      ctx.strokeStyle = "rgba(194,74,58,0.18)"; ctx.lineWidth = doc.emergency.width*S; ctx.lineJoin="round"; ctx.lineCap="round";
      ctx.beginPath(); doc.emergency.path.forEach((p,i)=> i?ctx.lineTo(PAD+p.x*S,PAD+p.y*S):ctx.moveTo(PAD+p.x*S,PAD+p.y*S)); ctx.stroke();
      ctx.strokeStyle = "#C24A3A"; ctx.lineWidth = 2.5; ctx.setLineDash([12,9]);
      ctx.beginPath(); doc.emergency.path.forEach((p,i)=> i?ctx.lineTo(PAD+p.x*S,PAD+p.y*S):ctx.moveTo(PAD+p.x*S,PAD+p.y*S)); ctx.stroke(); ctx.setLineDash([]);
    }

    const drawRect = (o) => {
      const x=PAD+o.x*S, y=PAD+o.y*S, w=o.w*S, h=o.h*S;
      const booth = o.kind==="booth";
      ctx.save();
      if (o.rot){ ctx.translate(x+w/2,y+h/2); ctx.rotate(o.rot*Math.PI/180); ctx.translate(-(x+w/2),-(y+h/2)); }
      if (o.kind==="patch"){ ctx.beginPath(); ctx.ellipse(x+w/2, y+h/2, w/2, h/2, 0, 0, Math.PI*2); ctx.closePath(); }
      else { rr(ctx,x,y,w,h, booth?7:8); }
      ctx.fillStyle = booth ? colorFor(o) : (PLACE_FILL[o.kind]||"#CFC9BC"); ctx.fill();
      ctx.lineWidth = 1.2; ctx.strokeStyle = "rgba(0,0,0,0.18)"; ctx.stroke();
      ctx.fillStyle = booth ? "#fff" : (PLACE_TXT[o.kind]||"#333");
      ctx.textAlign="center"; ctx.textBaseline="middle";
      if (booth){ ctx.font = `700 ${Math.min(20,Math.max(9,w*0.34))}px "Styrene B", sans-serif`; ctx.fillText((o.label||"").slice(0,2).toUpperCase(), x+w/2, y+h/2-(w>34?5:0));
        if (w>34){ ctx.font = `${Math.min(10,Math.max(6,w*0.1))}px "Styrene B", sans-serif`; ctx.fillText((o.label||"").slice(0,16), x+w/2, y+h/2+8); }
        if (mode==="utility" && o.powerKW){ ctx.fillStyle="#C9A227"; rr(ctx,x+w-26,y-7,26,14,4); ctx.fill(); ctx.fillStyle="#3a2c10"; ctx.font='700 9px "GT Flexa Mono", monospace'; ctx.fillText(o.powerKW+"kW", x+w-13, y); }
      } else { ctx.font = `${Math.min(13,Math.max(8,w*0.08))}px "GT Flexa Mono", monospace`; const ws=(o.label||"").toUpperCase().split(" "); ws.forEach((wd,i)=>ctx.fillText(wd, x+w/2, y+h/2+(i-(ws.length-1)/2)*(h*0.16))); }
      ctx.restore();
    };
    const drawPoint = (o) => {
      const x=PAD+o.x*S, y=PAD+o.y*S;
      if (o.kind==="power"){ ctx.fillStyle="#C9A227"; rr(ctx,x-10,y-10,20,20,5); ctx.fill(); ctx.fillStyle="#3a2c10"; ctx.font='700 11px sans-serif'; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("\u26a1", x, y); }
      if (o.kind==="water"){ ctx.fillStyle="#5C8AA6"; ctx.beginPath(); ctx.arc(x,y,10,0,7); ctx.fill(); ctx.fillStyle="#fff"; ctx.font='700 11px sans-serif'; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillText("\u2602", x, y); }
    };

    doc.objects.filter(o=>["stage","food","ticketing","restroom","building","entrance","patch"].includes(o.kind)).forEach(drawRect);
    doc.objects.filter(o=>o.kind==="booth").forEach(drawRect);
    doc.objects.filter(o=>o.kind==="generator").forEach(drawRect);
    if (mode==="utility"){ doc.objects.filter(o=>o.kind==="power").forEach(drawPoint); doc.objects.filter(o=>o.kind==="water").forEach(drawPoint); }

    // title block
    ctx.fillStyle="#211C14"; ctx.textAlign="left"; ctx.textBaseline="alphabetic";
    ctx.font='700 42px "Styrene B", sans-serif'; ctx.fillText("THE CHARLOTTE COFFEE FESTIVAL", PAD, 64);
    ctx.fillStyle="#746137"; ctx.font='20px "GT Flexa Mono", monospace';
    ctx.fillText(`${doc.name.toUpperCase()} · ${mode.toUpperCase()} MAP`, PAD, 92);
    ctx.fillText(`${EVENT.date} · ${EVENT.venue}`, PAD, H-34);

    return new Promise((res)=>{ c.toBlob((b)=>{ const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download=`tccf-${mode}-map.png`; a.click(); URL.revokeObjectURL(u); res(); }, "image/png"); });
  }

  function logoToDataURL(file, max){ max=max||200; return new Promise((resolve,reject)=>{ const r=new FileReader(); r.onload=()=>{ const img=new Image(); img.onload=()=>{ const s=Math.min(1,max/Math.max(img.width,img.height)); const cv=document.createElement("canvas"); cv.width=Math.round(img.width*s); cv.height=Math.round(img.height*s); const cx=cv.getContext("2d"); cx.fillStyle="#fff"; cx.fillRect(0,0,cv.width,cv.height); cx.drawImage(img,0,0,cv.width,cv.height); resolve(cv.toDataURL("image/jpeg",0.82)); }; img.onerror=reject; img.src=r.result; }; r.onerror=reject; r.readAsDataURL(file); }); }

  window.studioExport = { exportPNG, logoToDataURL };
})();
