/* global React */
const { useRef, useEffect } = React;

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
    ink: '#EBE5DB', inkSoft: 'rgba(235,229,219,.82)', inkFaint: 'rgba(235,229,219,.62)',
    muted: '#BAB492', line: 'rgba(235,229,219,.5)', line2: 'rgba(235,229,219,.5)',
    vig: 'inset 0 0 320px 60px rgba(10,11,6,.45)',
    crown: 'export-assets/crown-crema.png', ns: 'export-assets/ns-crema.png',
    seal: 'export-assets/seal-crema.png', mz: 'export-assets/maizly-crema.png',
  },
  crema: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #F7F6F2 0%, #EBE5DB 55%, #ded7c9 100%)',
    ink: '#181818', inkSoft: 'rgba(24,24,24,.72)', inkFaint: 'rgba(24,24,24,.5)',
    muted: '#746137', line: 'rgba(24,24,24,.22)', line2: 'rgba(24,24,24,.22)',
    vig: 'inset 0 0 280px 50px rgba(120,110,80,.14)',
    crown: 'export-assets/crown-black.png', ns: 'export-assets/ns-black.png',
    seal: 'export-assets/seal-black.png', mz: 'export-assets/maizly-black.png',
  },
  black: {
    bg: 'radial-gradient(140% 90% at 50% -8%, #2a2a26 0%, #181818 48%, #050505 100%)',
    ink: '#EBE5DB', inkSoft: 'rgba(235,229,219,.8)', inkFaint: 'rgba(235,229,219,.6)',
    muted: '#BAB492', line: 'rgba(235,229,219,.42)', line2: 'rgba(235,229,219,.42)',
    vig: 'inset 0 0 320px 70px rgba(0,0,0,.6)',
    crown: 'export-assets/crown-crema.png', ns: 'export-assets/ns-crema.png',
    seal: 'export-assets/seal-black.png', mz: 'export-assets/maizly-crema.png',
  },
};

/* Bronze / copper accent presets — solid + metallic gradient for the hero numeral */
const ACCENTS = {
  copper: { solid: '#B07A48', grad: 'linear-gradient(176deg,#E4BA84 0%,#B97F4B 44%,#8A5325 100%)' },
  gold:   { solid: '#B49658', grad: 'linear-gradient(176deg,#E8D49A 0%,#BBA063 46%,#876A2F 100%)' },
  terracotta: { solid: '#AA7050', grad: 'linear-gradient(176deg,#CC9375 0%,#AA7050 50%,#7E4C31 100%)' },
};

function Poster({
  w = 480, colorway = 'forest', layout = 'stack', date = '09.12.2026',
  accent = 'copper', heroNum = '25', headline = 'Last Chance for VIP',
  scarcity = 'VIP tickets remain', scriptWord = 'only', badgeText = 'VIP Access',
  showBadge = true, showRegMarks = true,
}) {
  const c = COLORWAYS[colorway];
  const a = ACCENTS[accent] || ACCENTS.copper;
  const scale = w / 1080;
  const h = Math.round(1920 * scale);
  const vars = {
    '--pst-bg': c.bg, '--pst-ink': c.ink, '--pst-ink-soft': c.inkSoft,
    '--pst-ink-faint': c.inkFaint, '--pst-muted': c.muted,
    '--pst-line': c.line, '--pst-line2': c.line2, '--pst-vig': c.vig,
    '--pst-accent': a.solid, '--pst-accent-grad': a.grad,
  };
  return (
    <div className="pst-mount" style={{ width: w + 'px', height: h + 'px' }}>
      <div className="pst-stage" style={{ transform: `scale(${scale})` }}>
        <div className="pst" style={vars}>
          <div className="pst-frame">
            {showRegMarks && (
              <React.Fragment>
                <span className="pst-reg tl"></span><span className="pst-reg tr"></span>
                <span className="pst-reg bl"></span><span className="pst-reg br"></span>
              </React.Fragment>
            )}

            <div className="pst-meta">
              <span>Lenny Boy Brewery</span>
              <span><span className="dot">●</span>&nbsp; {date}</span>
            </div>

            <div className="pst-core">
              <img className="pst-crown" src={c.crown} alt="" />

              {showBadge && (
                <div className="pst-badge"><span className="gem"></span>{badgeText}<span className="gem"></span></div>
              )}

              {heroNum ? (
                <React.Fragment>
                  {headline && <div className="pst-headline">{headline}</div>}
                  {scriptWord && <div className="pst-only">{scriptWord}</div>}
                  <div className="pst-25">{heroNum}</div>
                </React.Fragment>
              ) : (
                headline && <div className="pst-hero-text">{headline}</div>
              )}
              <div className="pst-remain">
                <span className="rule"></span>
                <span className="word">{scarcity}</span>
                <span className="rule"></span>
              </div>

              {layout === 'seal' ? (
                <img className="pst-seal" src={c.seal} alt="The Charlotte Coffee Festival" />
              ) : (
                <React.Fragment>
                  <div className="pst-the">The</div>
                  <div className="pst-wm">
                    <span>Charlotte</span>
                    <div className="row"><span className="rings"><b>T</b><b>C</b></span><span>Coffee</span><span className="rings"><b>C</b><b>F</b></span></div>
                    <span>Festival</span>
                  </div>
                </React.Fragment>
              )}
            </div>

            <div className="pst-credit">
              <div className="col">
                <span className="lab">Presented by</span>
                <img className="ns" src={c.ns} alt="Night Swim Coffee" />
              </div>
              <span className="divider"></span>
              <div className="col">
                <span className="lab">Sponsored by</span>
                <img className="mz" src={c.mz} alt="maïzly — for all" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
