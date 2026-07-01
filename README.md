# The Charlotte Coffee Festival — Design System

*A celebration of coffee & the people that shape it.*

The Charlotte Coffee Festival (TCCF) is an annual coffee-culture event held in Charlotte, NC. The brand is **premium yet approachable** — craft sophistication paired with community warmth. Visually, it lives at the intersection of **vintage stamp-craft, modern typography, and minimalist print design** — think coffee bag, gallery placard, and ASCAP-style certification mark, all at once.

This repository is the home of TCCF's design language: foundations, brand assets, content rules, and HTML/JSX UI kits that can be lifted directly into mockups, decks, and production work.

---

## Index — what's in this folder

| Path | What it is |
| --- | --- |
| `README.md` | This file — brand context + foundations |
| `SKILL.md` | Agent-Skills compatible manifest for downstream use |
| `colors_and_type.css` | CSS variables for the full color + type system |
| `fonts/` | Webfont files (woff2/otf/ttf) |
| `assets/` | Logos, lockups, sub-marks (SVG + PNG, on black and crema) |
| `preview/` | Design-system preview cards (registered in the DS tab) |
| `ui_kits/` | High-fidelity UI kit recreations *(none yet — see "Open questions")* |
| `slides/` | Slide templates *(none yet — see "Open questions")* |

---

## Source files reviewed

All sources were uploaded by the user (saved in `uploads/`). No Figma, codebase, or deck was provided.

| Source | Used for |
| --- | --- |
| `Primary Logo TCCF.svg / .ai`, transparent + crema PNGs | Crown crest + "The Charlotte Coffee Festival" lockup |
| `Primary Lockup.svg / .ai`, black/crema variants | Circular badge with tagline |
| `Untitled document.docx` | (Reviewed — note retired) |
| `GT-Flexa-Mono-Regular.*` | Monospace voice (eyebrows, technical labels) |
| `StyreneB-Regular.otf` | Display sans (headlines, all-caps stamps) |
| `calligri-bold-italic.ttf` | Italic script (connector words: "The", "A Celebration of…") |
| `commercial-type-2508-TYHFQC.pdf`, `Commercial_Type_EULA.pdf` | Foundry license docs (not for layout) |

---

## Brand at a glance

- **Personality** — craft-shop, slightly old-world, monochrome, confident, tactile.
- **Audience** — Charlotte coffee community: roasters, baristas, café owners, enthusiasts, and the curious public.
- **Voice** — second-person, warm, plainspoken; reverent about coffee, never precious about it.
- **Visual signature** — black ink on crema (#ede7dd), the **TCCF crown crest**, and the **circular tagline stamp** that wraps "THE CHARLOTTE COFFEE FESTIVAL · COFFEE FESTIVAL ·" around a center crest.
- **Tagline** — *A CELEBRATION OF COFFEE & THE PEOPLE THAT SHAPE IT.*

---

## Content Fundamentals

How TCCF writes — copy is short, confident, and unfussy. The brand sounds like a thoughtful barista, not a marketing department.

### Voice
- **Second person, present tense.** "Pull up a chair." "Meet the roasters." Not "Attendees will be able to meet roasters."
- **Warm authority.** TCCF knows coffee but never lectures. Industry terms (extraction, single-origin, washed process) appear in context, never as gatekeeping.
- **Plainspoken.** Short sentences. Active verbs. Cut adjectives by half.
- **Lightly reverent.** The tagline ends with "*…and the people that shape it.*" — people first, always.

### Casing & punctuation
- **All-caps for display.** Headlines, navigation, eyebrows, and most buttons set in caps. (`THE CHARLOTTE COFFEE FESTIVAL`, `BUY TICKETS`, `MEET THE ROASTERS`)
- **Title case never** — it's either all-caps or sentence case.
- **Sentence case for paragraphs and longer copy.**
- **Italic script (Calligri) for connector words** — "*The*", "*A Celebration of*", "*presents*", "*est.*" — the script is doing the work of an em dash or a wink. Used sparingly.
- **Mono caps for eyebrows / metadata** — "VOL. 02 · 2026", "SAT 10:00–15:00", "STAGE A".
- **Ampersand `&` preferred over "and"** in display copy (`COFFEE & COMMUNITY`).
- **Em dash with spaces** — like this — for asides.
- **Numbers** — numerals everywhere (`1 day, 50+ roasters, 1 city`), never spelled out.

### Vocabulary
**Use:** craft, roaster, brew, drip, pull, origin, ritual, festival, community, Charlotte, hometown.
**Avoid:** "experience" (as a noun), "elevate," "curated journey," "passionate," "synergy," and any phrase that could appear on a SaaS landing page.

### Emoji
**No emoji.** The brand is a black-and-crema print system; unicode chars (·, &, ★, ©, ®) earn their place because they look at home on a stamp. Emoji do not.

### Examples
- **Hero:** *A CELEBRATION OF COFFEE & THE PEOPLE THAT SHAPE IT.*
- **2026 theme:** *SIP N' STYLE — Coffee. Vintage. Music. Good energy.*
- **Section eyebrow:** `VOL. 02 — SEP 12, 2026`
- **Card copy:** *One day. Fifty roasters. Unlimited tastings.*
- **Button:** `GET YOUR PASS`
- **Wayfinding:** *Find your roast →*
- **Footer microcopy:** *Made in Charlotte. Brewed with intent.*

---

## Visual Foundations

### Color
The brand has **eight palette colors**, but the design language is still defined by restraint — the brand reads as black-on-crema first, and the rest of the palette enters as accents.

| Token | Hex | Role |
| --- | --- | --- |
| `--tccf-off-white` | `#F7F6F2` | Lightest paper. Alternate background for nested surfaces, modals. |
| `--tccf-crema` | `#EBE5DB` | Signature warm off-white. Default background. |
| `--tccf-muted` | `#BAB492` | Sage / khaki. Quiet secondary surfaces, vendor tags. |
| `--tccf-forest` | `#4A4B35` | Deep olive. Depth, dark sections, alternate header treatment. |
| `--tccf-latte` | `#746137` | Olive-brown. Earthy mid-tone, secondary copy on light. |
| `--tccf-coral` | `#AA7050` | Terracotta. Warm accent — CTAs, featured cards, "hot drip". |
| `--tccf-black` | `#181818` | Primary ink. **Soft black** — never pure `#000`. |
| `--tccf-blue` | `#75878B` | Dusty blue. Cool counterpoint — info states, links on dark, water/cold-brew. |

**Rules**
- Default a layout to **black on crema**. Reach for color when the section *means* something different (a roaster spotlight, a workshop, a sponsor strip).
- Each color is its own voice — they are not a scale or ramp. Mixing >3 in a single composition starts to feel arbitrary. Two accents + the neutrals is the house rhythm.
- **Pure `#000` and `#FFF` are off-limits.** Use `--tccf-black` and `--tccf-off-white`/`--tccf-crema` instead.
- Gradients are not part of the brand. Do not use them.
- Color-on-color pairings to lean on: forest + crema, coral + off-white, latte + crema, blue + black, muted + black.

### Typography
A **three-voice** system. Display sans does the heavy lifting; italic script provides warmth; mono adds the stamp/document feel.

| Role | Family | Notes |
| --- | --- | --- |
| Display | **Styrene B** (regular, all-caps) | Headlines, lockups, buttons. Geometric, slightly condensed feel. Use loose to tight tracking; never small. |
| Body / UI | **Styrene B** (regular, sentence case) | Body copy, UI labels, lede paragraphs. Same family as display — relies on case + size for hierarchy. |
| Script | **Calligri Bold Italic** | One job: connector words. "The", "A Celebration of", "est.", "presents". Never a full sentence. |
| Mono | **GT Flexa Mono** | Eyebrows, dates, ticket codes, stage IDs, micro-labels. Sets a "printed program / Bandcamp" tone. |

Display caps stack tight (line-height ≈ 0.92) like the lockup. Body sets at 1.45–1.65. Tracking on stamp/eyebrow text is loose (0.12em).

### Spacing & layout
- **4px base scale** (`--s-1` = 4px → `--s-10` = 128px).
- Layouts are gridded and orthogonal. Hairline rules separate sections rather than boxes-within-boxes.
- Generous left/right margins; copy is allowed to breathe on a wide crema field.
- Fixed elements are rare — navigation is a thin top bar with rules above and below, not a floating chip.
- The festival's circular stamp is the single composition device that breaks the grid.

### Borders & corners
- Default corner radius is **0** (orthogonal print feel).
- Pills (`--r-pill: 999px`) are reserved for the **circular sub-marks** (the "TC" / "CF" ringed monograms) and a single capsule button style.
- Borders are typically 1px or 2px solid black; never grey, never dashed unless on construction/blueprint slides.

### Shadows & elevation
The brand is **predominantly flat**, like print.
- `--shadow-none` — default for cards and surfaces.
- `--shadow-card` — a hard 2px black offset (no blur) for "ticket-stub" cards.
- `--shadow-press` — 1px black offset on resting buttons; removes on press.
- `--shadow-lift` — soft 28px shadow reserved for modals and focused-state elements only.

### Backgrounds
- Most surfaces are flat crema or flat black.
- **Full-bleed photography** is welcome — warm, slightly desaturated, **with a film-grain overlay**. Black-and-white treatments preferred for portraits of roasters/baristas.
- **No repeating patterns.** The closest thing to a pattern is the circular badge, used as an oversized graphic ornament (40–80% off-canvas, low opacity).
- A subtle paper-grain texture (≈3% opacity) on crema backgrounds is acceptable; do not introduce noise on black.

### Imagery vibe
- Warm, golden-hour, slightly grainy.
- Black-and-white portraits with high contrast.
- Coffee close-ups (crema swirl, latte art, beans) are framed tight and never tilted.
- No stock photography.

### Animation
The brand is print-first; motion is restrained.
- **Easing** — `cubic-bezier(0.2, 0.7, 0.2, 1)` (a slightly snappy ease-out) is the house curve.
- **Duration** — UI: 160–200ms. Hero / page transitions: 400–600ms.
- **Style** — fades and short translates (≤8px). The circular stamp may **slowly rotate** (40s linear) as a hero ornament. No bounces, no spring overshoots.
- **Avoid** — parallax, scroll-jacking, type-on-walk-in cascades.

### Hover states
- **Buttons (filled black)** — invert to crema-on-black-outline, no shadow.
- **Buttons (outlined)** — fill black, text becomes crema.
- **Links** — underline thickens from 1.5px → 2.5px.
- **Cards** — gain `--shadow-card` (2px hard offset); do not scale.

### Press states
- Buttons translate **+1px** on Y, shadow collapses to 0. No color shift, no shrink.

### Transparency & blur
- Used sparingly. Sticky nav over imagery uses a 90% crema fill with `backdrop-filter: blur(8px)` — never a semi-transparent black.
- The circular stamp as ornament uses 8–14% black opacity over crema.

### Cards
- Square corners. 1px or 2px solid black border. Optional `--shadow-card` (2px hard offset, black, no blur) — "ticket-stub" look.
- Internal padding: `--s-5` (24px) minimum, `--s-6` (32px) for prose-heavy cards.
- Cards never use background tints other than crema-50 or crema-100.

---

## Iconography

TCCF does not ship an icon font. The brand's iconographic vocabulary is **mark-based, not glyph-based**: the crown crest, the circular tagline stamp, the "TC" and "CF" ringed monograms, and the ® / © / ™ family of certification marks.

### House marks (in `assets/`)
- `logo-primary.svg` — TCCF crown crest + "The Charlotte Coffee Festival" wordmark, side-by-side.
- `lockup-primary.svg` — circular badge with full tagline curving around the rim, crest centered.
- `lockup-black.png`, `lockup-crema.png`, `lockup-black-on-crema.png`, `lockup-crema-on-black.png` — bitmap variants for each background.
- The **crown crest** alone (with "TCCF" in the ringed sub-mark beneath it) can be extracted from the SVG as a standalone marque.
- The **"TC" and "CF" sub-marks** (small ringed monograms) work as a 24–28px stamp-style indicator next to dates, prices, or section titles — these are part of the visual language and should be used like icons.

### Functional UI icons
The brand has no proprietary icon set. For nav arrows, hamburger, close, calendar, pin, ticket, etc., use **Lucide Icons** (https://lucide.dev/) at **1.5px stroke**. Rationale: Lucide's geometric, slightly utilitarian look pairs well with Styrene B caps and avoids the rounded/playful tone of Phosphor or Feather.

⚠ **Flagged substitution** — no icon set was provided by the user. If TCCF has a preferred icon library, swap in `assets/icons/` and update this section.

### Unicode characters as marks
Used deliberately:
- `·` — separator in eyebrows (`VOL. 02 · SEP 12`)
- `&` — preferred over the word "and" in display
- `©` `®` `™` — visual rhyme with the brand's stamp aesthetic, fine to use ornamentally
- `★` — recognition only (Pour Master award, judges' pick)
- `→` `←` — wayfinding arrows in nav and CTAs

### Emoji
**Never.** See Content Fundamentals.

---

## Open questions & flagged substitutions

These should be resolved by the brand owner before production use:

1. **No icon set** was provided. We are recommending **Lucide** as a stand-in. → *Confirm or replace.*
2. **No product surfaces** (website, app, codebase, Figma) were provided. → *UI kits and slide templates were not generated. Share screenshots, a Figma file, or a codebase if you'd like high-fidelity recreations.*
3. **No photography** was provided. → *Imagery rules are written; real photography needed to validate.*

---

## Quick start (for designers using this system)

```html
<link rel="stylesheet" href="colors_and_type.css">

<header class="site">
  <span class="eyebrow">VOL. 02 · SEP 12, 2026</span>
  <h1 class="hero">
    <span class="script">The</span><br>
    Charlotte<br>Coffee<br>Festival
  </h1>
  <p class="lede">A celebration of coffee &amp; the people that shape it.</p>
</header>
```

That's most of the brand, right there.
