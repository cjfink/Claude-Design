---
name: tccf-design
description: Use this skill to generate well-branded interfaces and assets for The Charlotte Coffee Festival (TCCF), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Two colors**: black (`#000`) and crema (`#ede7dd`). Almost everything else is restraint.
- **Three type voices**: display sans (Styrene B, ALL CAPS), italic script (Calligri, for connector words like *The*, *A Celebration of*), and mono (GT Flexa Mono, for eyebrows / codes / stamps).
- **Hero asset**: the circular tagline stamp in `assets/lockup-*.png` — used as ornament, can rotate slowly.
- **Tagline**: *A CELEBRATION OF COFFEE & THE PEOPLE THAT SHAPE IT.*
- **Vibe**: vintage coffee-bag stamp meets modern editorial. Print-flat, mostly orthogonal, no gradients, no emoji.

## Files

- `README.md` — full brand context, content + visual foundations, iconography
- `colors_and_type.css` — CSS variables to drop into any HTML file (`<link rel="stylesheet" href="colors_and_type.css">`)
- `fonts/` — webfont files
- `assets/` — logos and lockups (SVG + PNG, black/crema variants)
- `preview/` — example component HTML, useful as a reference / lift-and-shift starting point
