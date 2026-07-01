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
  nsCrema: "assets/nightswim-crema.png",
};

const GROUNDS = {
  crema:  { bg:"radial-gradient(130% 90% at 50% -10%, #F7F6F2 0%, #EBE5DB 60%, #ded7c9 100%)", ink:"#181818", inkSoft:"#746137", line:"#181818" },
  forest: { bg:"radial-gradient(135% 95% at 50% -8%, #5a5b41 0%, #4A4B35 45%, #3b3c2b 100%)", ink:"#EBE5DB", inkSoft:"rgba(235,229,219,.8)", line:"#EBE5DB" },
};

function Rings({ a, b }) {
  return <span className="igp-rings"><b>{a}</b><b>{b}</b></span>;
}

function Post({ w = 432, layout = "A" }) {
  const scale = w / 1080;
  const h = Math.round(1350 * scale);
  const ground = layout === "A" ? GROUNDS.crema : layout === "C" ? GROUNDS.forest : GROUNDS.crema;
  const vars = { "--igp-bg": ground.bg, "--igp-ink": ground.ink, "--igp-ink-soft": ground.inkSoft, "--igp-line": ground.line };

  return (
    <div className="igp-mount" style={{ width: w + "px", height: h + "px" }}>
      <div className="igp-stage" style={{ transform: `scale(${scale})` }}>
        <div className={`igp ${layout}`} style={vars}>

          {layout === "A" && (
            <React.Fragment>
              <div className="top">
                <img src={IMG.logoBlack} alt="" />
                <span className="ey">First look · Festival merch<b>The Charlotte Coffee Festival</b></span>
              </div>
              <h1>What's at<br />the fest.</h1>
              <div className="sub">Cups · Totes · Tees — all at the festival</div>
              <div className="pgrid">
                <div className="pcard"><div className="ph"><img src={IMG.tote} alt="" /></div><div className="lab"><span className="n">Canvas Tote</span><span className="a">VIP &amp;<br />Early GA</span></div></div>
                <div className="pcard"><div className="ph"><img src={IMG.cup} alt="" style={{ objectPosition: "center 42%" }} /></div><div className="lab"><span className="n">4 oz Cup</span><span className="a">Free<br />samples</span></div></div>
                <div className="pcard"><div className="ph"><img src={IMG.navy} alt="" style={{ objectPosition: "center 40%" }} /></div><div className="lab"><span className="n">Tee · Navy</span><span className="a">$20</span></div></div>
                <div className="pcard"><div className="ph"><img src={IMG.white} alt="" style={{ objectPosition: "center 40%" }} /></div><div className="lab"><span className="n">Tee · White</span><span className="a">$20</span></div></div>
              </div>
              <div className="foot">
                <span>Sat Sept 12 · Lenny Boy Brewing</span>
                <span className="live">Tickets live now</span>
              </div>
            </React.Fragment>
          )}

          {layout === "B" && (
            <React.Fragment>
              <div className="bg"><img src={IMG.life} alt="" /></div>
              <div className="scrim"></div>
              <div className="inner">
                <div className="mrow">
                  <span>September 12th,<br />9am to 2pm</span>
                  <span className="r">Lenny Boy Brewery<br />Charlotte, NC</span>
                </div>
                <div className="banner">This Year's Merch</div>
                <div className="grow"></div>
                <div className="bottom">
                  <div className="lock">
                    <img src={IMG.logoCrema} alt="The Charlotte Coffee Festival" />
                    <span className="cred">Presented by Night Swim Coffee<br />Sponsored by Maïzly</span>
                  </div>
                  <div className="head">
                    <h1>Wear the festival.</h1>
                    <div className="sub">Tees, totes &amp; cups — first look</div>
                  </div>
                </div>
              </div>
            </React.Fragment>
          )}

          {layout === "C" && (
            <React.Fragment>
              <img className="crown" src={IMG.crownCrema} alt="" />
              <div className="script">a first look at the</div>
              <h1>Merch</h1>
              <div className="thumbs">
                <div className="t"><img src={IMG.navy} alt="" style={{ objectPosition: "center 42%" }} /></div>
                <div className="t"><img src={IMG.tote} alt="" /></div>
                <div className="t"><img src={IMG.white} alt="" style={{ objectPosition: "center 42%" }} /></div>
              </div>
              <div className="foot">
                <div className="d">Tees $20 · Tote for VIP &amp; Early GA · Free cups</div>
                <div className="live">Sat Sept 12 · Lenny Boy · Tickets live now</div>
              </div>
            </React.Fragment>
          )}

        </div>
      </div>
    </div>
  );
}

(function injectPostCSS() {
  if (document.getElementById("igp-css")) return;
  const s = document.createElement("style");
  s.id = "igp-css";
  s.textContent = POST_CSS;
  document.head.appendChild(s);
})();

window.Post = Post;
