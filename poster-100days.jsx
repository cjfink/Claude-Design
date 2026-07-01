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

function Poster({ w = 460, colorway = 'forest', layout = 'stack', date = '09.12.2026' }) {
  const c = COLORWAYS[colorway];
  const scale = w / 1080;
  const h = Math.round(1920 * scale);
  const vars = {
    '--pst-bg': c.bg, '--pst-ink': c.ink, '--pst-ink-soft': c.inkSoft,
    '--pst-ink-faint': c.inkFaint, '--pst-muted': c.muted,
    '--pst-line': c.line, '--pst-line2': c.line2, '--pst-vig': c.vig,
  };
  return (
    <div className="pst-mount" style={{ width: w + 'px', height: h + 'px' }}>
      <div className="pst-stage" style={{ transform: `scale(${scale})` }}>
        <div className="pst" style={vars}>
          <div className="pst-frame">
            <span className="pst-reg tl"></span><span className="pst-reg tr"></span>
            <span className="pst-reg bl"></span><span className="pst-reg br"></span>

            <div className="pst-meta">
              <span>Lenny Boy Brewery</span>
              <span><span className="dot">●</span>&nbsp; {date}</span>
            </div>

            <div className="pst-core">
              <img className="pst-crown" src={c.crown} alt="" />
              <div className="pst-only">only</div>
              <div className="pst-100">100</div>
              <div className="pst-days">
                <span className="rule"></span>
                <span className="word">Days to go</span>
                <span className="rule"></span>
              </div>
              <div className="pst-until">until</div>

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
  if (document.getElementById('poster-css')) return;
  const s = document.createElement('style');
  s.id = 'poster-css';
  s.textContent = POSTER_CSS;
  document.head.appendChild(s);
})();

window.Poster = Poster;
