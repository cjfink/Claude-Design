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

export default function MerchTeaser() {
  const isExternal = /^https?:/.test(TICKETS_URL);
  const ticketLinkProps = isExternal
    ? { href: TICKETS_URL, target: "_blank", rel: "noopener noreferrer" }
    : { href: TICKETS_URL };

  return (
    <div className="tccf-merch">
      <style>{MERCH_CSS}</style>

      {/* TOP BAR */}
      <div className="topbar">
        <img src={`${IMG}/logo-primary-black.png`} alt="The Charlotte Coffee Festival" />
        <div className="nav">
          <span>Sept 12 · Lenny Boy Brewing</span>
          <a className="pill" {...ticketLinkProps}>Tickets live now →</a>
        </div>
      </div>

      {/* HERO */}
      <section className="hero grain">
        <div className="wrap">
          <div className="hero-copy">
            <span className="eyebrow">The Charlotte Coffee Festival · Merch</span>
            <span className="script">A first look at</span>
            <h1>THE<br />MERCH<br />DROP</h1>
            <p className="lede">Cups, totes &amp; tees — all of it lives at the festival. A celebration of coffee &amp; the people that shape it.</p>
            <div className="hero-actions">
              <a className="btn" {...ticketLinkProps}>Get tickets</a>
              <a className="btn btn--ghost" href="#lookbook">See the merch ↓</a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="disc"></div>
            <figure className="photo-frame">
              <img src={`${IMG}/hero-tees-kitchen.png`} alt="Two baristas wearing the navy and white Charlotte Coffee Festival tees, back print, in a kitchen" />
              <figcaption className="cap"><span><b>Festival Tees</b> · Navy &amp; White</span><span>Back print</span></figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* FESTIVAL DETAILS BAND */}
      <section className="details">
        <div className="wrap">
          <div className="cell">
            <span className="k">Where</span>
            <span className="v">Lenny Boy Brewing Co.</span>
            <span className="s">Charlotte, NC</span>
          </div>
          <div className="cell">
            <span className="k">When</span>
            <span className="v">Sat, Sept 12</span>
            <span className="s">9 AM – 2 PM</span>
          </div>
          <div className="cell">
            <span className="k">Admission</span>
            <span className="v">Tickets Live Now</span>
            <span className="s">VIP · Early GA · GA</span>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="marquee" aria-hidden="true">
        <div className="track">
          <span>Coffee <b>&amp;</b> Community</span><span>·</span>
          <span>Lenny Boy Brewing</span><span>·</span>
          <span>Sat Sept 12 <b>·</b> 9–2</span><span>·</span>
          <span>Tickets Live Now</span><span>·</span>
          <span>Coffee <b>&amp;</b> Community</span><span>·</span>
          <span>Lenny Boy Brewing</span><span>·</span>
          <span>Sat Sept 12 <b>·</b> 9–2</span><span>·</span>
          <span>Tickets Live Now</span><span>·</span>
        </div>
      </div>

      {/* LOOKBOOK */}
      <section className="drop" id="lookbook">
        <div className="wrap">
          <div className="drop-head">
            <div>
              <span className="eyebrow">At the festival</span>
              <h2>What's at the fest.</h2>
            </div>
            <p>04 pieces · All at the festival</p>
          </div>

          <div className="lookbook">
            <article className="item col-6 item--wide">
              <div className="frame">
                <img src={`${IMG}/photo-tote.jpg`} alt="TCCF natural canvas tote bag" />
              </div>
              <div className="meta">
                <span className="n">Canvas Tote</span>
                <span className="d">Natural cotton · tagline badge · presented by Night Swim</span>
                <span className="access">Included with VIP &amp; Early GA admission</span>
              </div>
            </article>

            <article className="item col-6 item--wide">
              <div className="frame">
                <img src={`${IMG}/photo-cup.jpg`} alt="TCCF 4 oz kraft cup" style={{ objectPosition: "center 42%" }} />
              </div>
              <div className="meta">
                <span className="n">4 oz Cup</span>
                <span className="d">Single-wall kraft · crown crest · black lid</span>
                <span className="access">Free coffee samples for every attendee</span>
              </div>
            </article>

            <article className="item col-6">
              <div className="frame">
                <img src={`${IMG}/photo-tee-navy-front.jpg`} alt="Navy festival tee, front" style={{ objectPosition: "center 38%" }} />
              </div>
              <div className="meta">
                <span className="n">Festival Tee — Navy</span>
                <span className="d">Oversized cotton · left-chest stamp · back wordmark</span>
                <span className="access">$20 at the festival</span>
              </div>
            </article>

            <article className="item col-6">
              <div className="frame">
                <img src={`${IMG}/photo-tee-white-back.jpg`} alt="White festival tee, back" style={{ objectPosition: "center 40%" }} />
              </div>
              <div className="meta">
                <span className="n">Festival Tee — White</span>
                <span className="d">Oversized cotton · left-chest stamp · back wordmark</span>
                <span className="access">$20 at the festival</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* FESTIVAL CLOSER */}
      <section className="signup" id="tickets">
        <div className="wrap">
          <div>
            <span className="eyebrow">Come hang with us</span>
            <h2>See you at <span className="script">the</span> fest.</h2>
            <p>No online shop — the cups, the tote &amp; the tees all live at the festival. One morning only at Lenny Boy Brewing.</p>
            <div className="fest-facts">
              <div><span className="k">Canvas Tote</span><span className="v">VIP &amp; Early GA</span></div>
              <div><span className="k">Festival Tees</span><span className="v">$20 each</span></div>
              <div><span className="k">Coffee Samples</span><span className="v">Free for all</span></div>
            </div>
            <div className="hero-actions" style={{ marginTop: "var(--s-6)" }}>
              <a className="btn" {...ticketLinkProps} style={{ background: "var(--tccf-crema)", color: "var(--tccf-black)", borderColor: "var(--tccf-crema)" }}>Tickets live now →</a>
            </div>
            <small>Sat, Sept 12 · 9 AM – 2 PM · Lenny Boy Brewing Co., Charlotte NC</small>
          </div>
          <div className="signup-mark">
            <img src={`${IMG}/lockup-crema.png`} alt="TCCF stamp" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="site-foot">
        <div className="wrap">
          <img src={`${IMG}/logo-primary-black.png`} alt="The Charlotte Coffee Festival" />
          <span className="mono">© 2026 TCCF · A celebration of coffee &amp; the people that shape it</span>
        </div>
      </footer>
    </div>
  );
}
