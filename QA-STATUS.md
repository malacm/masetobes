# QA status — Mason Tobia portfolio

Working doc for the QA pass against the feedback sheet. Delete when the pass is done.

Sheet: https://docs.google.com/spreadsheets/d/1jcynh_e3mEVuusKZKiAdTLtpZjcjwWPKOYktkXh-8pY
(Readable without Drive auth via `?export?format=csv&gid=0`.)

Figma file key: `0XhYCJWc1hxW93a12xgnSa`

> The sheet was written against the **deployed** build, not `main`. At least two
> items were already fixed locally before the pass began. Re-test against `main`
> before treating anything below as outstanding.

## Item status

| # | Item | Page | Status |
|---|------|------|--------|
| 1 | Missing glass effect (global) | Global/Menu | **done** — MusicPlayer + ContactForm were the only surfaces using `--pill-bg` with no `backdrop-filter` |
| 2 | Symbol/initials spacing in footer | Footer | **done** — `--symbol-gap: var(--gap-col)`; verified 20px desktop / 10px mobile on both render paths |
| 3 | Nav / Music player vs Figma | Global/Menu | **done** — home player rebuilt against node `1:40459`; nav already matched. Off-home fan-out has no Figma node |
| 4 | About overlay vs Figma | About | **done** — built against node `1:40520`; copy restructured in Sanity to match |
| 5 | Hover state missing glass | Projects Collection | **already fixed** — verified by screenshot, thumbnail visibly blurred |
| 6 | Overlay info type size vs Figma | Projects Collection | **done** — checked against node `1:39464`; the code already matched on every property |
| 7 | Mobile hover: keep or remove? | Projects Collection | **done** — Mason chose remove; gated behind `@media (hover: hover)` |
| 8 | Intro section vs Figma | Individual Project | **done** — mobile rebuilt (`1:38959`/`1:38964`); desktop (`1:98`) measured against the frame and already matched |
| 9 | Outro section vs Figma | Individual Project | **done** — mobile rebuilt (`1:39020`/`1:39028`); desktop (`1:205`, `1:223`) measured and already matched |
| 10 | Music player unresolved on mobile | Global/Menu | **done** — expansion was hover-only, so it was dead on touch |
| 11 | Videos not loading | Global/Menu | **already fixed** — all report `readyState 4` |
| 12 | Type styles inconsistent | Global/Menu | **done** — every type value audited against Figma across all 7 projects, both breakpoints |
| 13 | Simpler entry animation, no movement | — | **superseded** — scroll-driven motion removed entirely; replaced by a page-transition veil (see below) |

## Known Figma node IDs

- Desktop home (variation 01) `1:40441` · its music-player bar `1:40459`
- Desktop home (about overlay) `1:40494` · the overlay panel itself `1:40520`
- Desktop home (variation 02) `1:40522`
- Project header/intro `1:98` · credits `1:205` · pager `1:223`
- Work index cards `1:39056`; card image boxes `1:39059 / 39074 / 39102 / 39109 / 39130 / 39139 / 39146`
- Hover state overlay `1:39464`
- Desktop nav `1:89` · mobile nav `1:996`
- Per-project galleries and slot map: `scripts/figma-slots.json`

## Figma MCP

Two servers are registered and healthy:
- `plugin:figma:figma` (remote, OAuth)
- `figma-dev` → `http://127.0.0.1:3845/mcp` (Figma desktop Dev Mode server)

The local server exposes `get_design_context`, `get_metadata`, `get_screenshot`,
`get_variable_defs`, `get_motion_context`, `get_figjam`. It takes **no `fileKey`** —
it reads whichever file is open in the Figma desktop app, so keep the right file open.

## Session 3 — what landed

Figma desktop Dev Mode server reached the file fine; both nodes resolved.

**#3 music player** (`MusicPlayer.svelte`, home layout only). The design's pill is
the *same* pill as a nav link — the player was using its own larger one:

| | design (`1:40459`) | was | now |
|---|---|---|---|
| bottom offset | 20px (page pad) | 24px | `var(--page-pad-y)` |
| pill height | 30px | ~36px (8px pad) | 30px |
| pill pad-x | 10px | 16px | `var(--pill-pad-x)` |
| "now playing" pill | 229px | 220–320px | 229px |
| mobile pill | — | 16px / 6×10 pad | 14px / 21px tall, matching the mobile nav pill |

Measured in the browser at 1440: 56 + 229 + 58 with 10px gaps = 363 against the
design's 365. The 2px is Hauss metrics on the two short words, not layout.

**#4 about overlay** (`AboutOverlay.svelte`, `Nav.svelte`, `tokens.css`).
The scrim was wrong in kind, not degree — the design is a *light* wash:

| | design (`1:40520`) | was | now |
|---|---|---|---|
| scrim | `rgba(255,255,255,.2)`, blur 20px | `rgba(0,0,0,.45)`, blur 24px | tokenised `--overlay-bg` / `--overlay-blur` |
| text origin | 20,20 | 64px top | `var(--page-pad-y) var(--page-pad-x)` |
| size | 32px / 1.1 / -0.02em | 24px / 1.4 / none | 32px / 1.1 / `--track-tight` |
| measure | unwrapped | capped 720px | uncapped (cap kept for the contact form) |
| wordmark | hidden (`1:40498`) | showing under the scrim | hidden while the overlay is open |

Every baseline lands within 1px of the design at 1440.

## The about copy — fixed at the source

`siteSettings.aboutContent` had been filled by pasting plain text into a single
block, so none of the design's structure was in the content: the client list ran
inline as "• Potato Head • Buck Mason • …", and the contact line appeared twice
(once as prose, once as the overlay's own clickable one).

Rather than reshape it at render time, the field was rewritten as real portable
text — `scripts/set-about-content.mjs`, re-runnable, dry-run by default:

```bash
node scripts/set-about-content.mjs                 # show what it would write
node scripts/set-about-content.mjs --commit        # write it
```

Backup of the pre-change document (rev `mDCaFc696BskawMgz11nVR`) is in the
session scratchpad; Sanity's own document history also covers it. New rev is
`zo5ZPSU152tNE7qkLHHZqh`.

Two supporting changes made that possible:

- **`accent` decorator** added to the `aboutContent` block in
  `schemas/siteSettings.ts`, rendered by `components/portable/AccentMark.svelte`.
  This is what puts "Zero Studios" in `#a6bf86`. It is colour only — the design
  shows no destination, so it is a highlight rather than a link. If it should
  actually link to Zero Studios, say so and it becomes a normal annotation.
  Being a token (`--accent-link`), it follows the theme: verified swapping to
  `#ffc438` under `data-theme="alt"`.
  **Update:** Mason supplied the URL, so "Zero Studios" is now a real link
  annotation to <https://www.zero.nyc/> rather than the bare decorator — it
  renders in the same accent colour via `LinkMark`, and opens in a new tab. The
  `accent` decorator stays in the schema for highlighting text that has no
  destination.
- **`link` annotation now renders at all.** `@portabletext/svelte` ships no
  default component for it — unknown marks emit their children bare — so an
  annotated link in the bio came out as unstyled plain text and the
  `a.inline-link` rule in `AboutOverlay` never matched anything. That rule was
  dangling from the start. `components/portable/LinkMark.svelte` fixes it.

Since the content is now structured properly, the interim
`src/lib/sanity/aboutContent.ts` normalizer was deleted — leaving a silent
content-rewriting layer in the render path would have meant a stray "•" in a
paragraph quietly turning into a list.

The Studio at `/studio` picks the Accent button up automatically; it is embedded
in this app, so it ships with the next site deploy — no separate studio deploy.

No mobile frame exists for either node, so mobile follows the established
token pattern (32→20px type, nav-sized pills). Worth a look from Mason.

## #6 — checked, nothing to change

Node `1:39464` against `.overlay` in `src/routes/(site)/work/+page.svelte`:
16px / bold / line-height 1.1 / tracking -0.02em / lowercase / `#f6f6f6`, roles
in a 4px-gap column on the left, year right, 20px padding. Every one already
matched — the item was never actually broken, just never verified. Confirmed in
the browser that all seven cards carry roles and a year, so the panel has data.

## Mobile pass — the ten 402-wide frames

| frame | what it is |
|---|---|
| `1:39566` / `1:39652` | work index, colour variations 01 / 02 |
| `1:39773` | work index, 1:1 crop of the nav + first card |
| `1:39857` | work index with the info panel showing on a card |
| `1:38719` / `1:38815` | Dome project page, variations 01 / 02 |
| `1:38947` | Dome project page, 1:1 crop of the header — the useful one |
| `1:582` / `1:707` | Potato Head Music project page, variations 01 / 02 |
| `1:868` | Potato Head Music header crop |

**Work index already matched.** Measured at 402: first card at 10,102, 382 wide,
60px between cards, 8px from image to caption, 20px title, 16px plus. Nothing to
change.

**Project page — what moved** (`work/[slug]/+page.svelte`):

- Role and year were stacked, each on its own line at 20px. The design puts them
  on **one `space-between` row at 12px** — bold label, regular values, 10px
  label→values, 5px between values — sitting a 60px section break below the
  statement. The two `.info-block`s are now wrapped in a `.meta-row`; the wrapper
  is `display: contents` on desktop so both blocks stay direct children of the
  12-column grid and nothing about the desktop layout changes.
- First media sat a full 60px section break below the header. The design gives it
  a **10px row gutter**, same as the gaps within the gallery.
- Credits stacked into three rows on mobile (links, then label, then names). The
  design **keeps the desktop shape**: label and names inline on the left at 12px,
  the two accent links pinned right.
- Pager pills were 22px type in the mobile *nav* pill (3px radius, 6px padding).
  The design keeps a **30px pill, 5px radius, 5px padding, 20px type** here — the
  pager is deliberately not the nav pill on mobile.

Verified against the frames at 402 using layout offsets (the reveal's transforms
make `getBoundingClientRect` misleading mid-animation): header title at y=102,
rule at 136, 60px to the role/year row, 10px to the first image, 10px from the
gallery to credits, 60px to the pager. Every value within 1px of Figma, the 1px
being the 0.5px rule painting as a whole device pixel.

### One real bug found on the way

Dome's statement was rendering at **double size** — 96px on mobile, 192px on
desktop. Its `description` is authored as a heading block in Sanity, so
PortableText emits an `<h1>`, and the browser's default `h1 { font-size: 2em }`
doubled it; `reset.css` zeroes margins but not heading sizes. Potato Head Music
is authored as a normal block and was always correct, which is why it never
showed up. `.description` now pins font-size, weight and line-height for `p` and
`h1`–`h4`, so the statement's size comes from the design regardless of which
block style the copy carries. No content change needed.

Related, not fixed: the page then has two `<h1>`s — `.tagline` is already one.
Worth deciding whether the statement should be a normal block in Sanity.

### Worth a word from Mason

`1:39857` shows the work-index info panel **open on mobile**, but #7 was decided
the other way ("remove it on mobile") and that is what shipped. The frame and the
decision disagree; the decision won.

## Type audit — all seven projects, both breakpoints

Desktop frames: Dome `1:38334` · Potato Head Music `1:86` · Collection 002
`1:1228` · Nusa Caña `1:1945` · WHR `1:2748` · Little Sun `1:20449` · Buck Mason
`1:38057` · Personal `1:39951`. Specs pulled from `1:98` (header), `1:205`
(credits), `1:223` (pager), `1:39069` (work-index caption).

**The desktop type scale was already right.** Measured against Figma:

| | design | code |
|---|---|---|
| project title | Bold 48 / 1.1 / -0.02em | ✓ |
| statement | Bold 96 / 0.9 / -0.04em, 690 wide | ✓ (690×259 vs 258) |
| role/year labels | **Bold** 20 / 1.3 / lowercase | ✓ |
| role/year values | **Regular** 20 / 1.3 / lowercase | ✓ |
| credits label | Bold 20 / 1.1 / lowercase | ✓ |
| credits names | Regular 20 / 1.3 | ✓ |
| credits links | Bold 20 / **leading-none** / `#a6bf86` | ✗ was 1.4 → fixed |
| pager | Bold 40 / normal / `#a6bf86` | ✓ |
| work card title | Bold 32 / 1.1, `#f6f6f6` | ✓ |
| work card `+` | Bold 24 / 1.1, **pure white** | ✓ |

Only one real mismatch: `.credits-links` inherited the 1.4 body line-height,
giving a 28px box where the design has 20px, which dropped the two links 4px
below the collaborators label. Now `line-height: 1`.

**Correction to the earlier note:** the desktop pager is **40px**, not the ~48px
guessed from the frame height last session. Hauss's `normal` line-height is
~1.475, so 40px fills the 59px box. The code was already correct.

Verified by loading all seven projects in same-origin iframes at 1440 and at 402
and diffing computed weight/size/line-height/tracking: **byte-identical across
all seven at both widths**, and matching the design values above. Dome's `<h1>`
now renders at 96/48px like every other project's `<p>`.

### Off the type scale, but no design exists for them

Not mismatches — Figma has no frame for any of these: `.empty` states on /work
and /personal (18px), `GalleryItem figcaption` (14px, and unused — 0 of 107
gallery items carry a caption), `.placeholder` (dev-only), `ContactForm` (16px),
the off-home music fan controls (18px), and the `Footer` text fallback, which
never renders because the wordmark SVG is uploaded.

### One Figma inconsistency, deliberately not matched

Desktop credits: the label and the links carry `tracking-[-0.4px]`, the names
carry none. On mobile (`1:39020`) *nothing* in the credits carries tracking, not
even the label. The code applies `--track-tight` consistently throughout. Since
the two breakpoints disagree with each other, this reads as authoring drift
rather than intent — worth a look from Mason, but not worth putting an
inconsistency into the stylesheet to mirror one.

## Personal page — the three missing SVGs

Frames: desktop `1:39951`, mobile `1:40203`.

The design's gallery is 33 items. Sanity had **33 items in the same order with
the same widths** — the page was structurally correct. Three of them were empty:
typed `video`, no file, carrying only an `aspectRatio` to reserve the box. Those
ratios turned out to be an exact fingerprint of the design's three *vector*
artworks, which is how each slot was matched to its node:

| slot | layout | reserved ratio | Figma node | exported size |
|---|---|---|---|---|
| 5 | third | 1 | `1:39971` | 452.981 × 452.981 |
| 17 | full | 1.864 | `1:39994` | 1399.94 × 750.962 |
| 27 | third | 1.416 | `1:40015` | 452.981 × 319.987 |

So they were never video slots — they were artwork waiting to be exported. Each
is now an `svg` item pointing at the asset Figma exported, uploaded to Sanity by
`scripts/add-personal-svgs.mjs` (dry-run by default, aborts if a slot already has
an image):

```bash
node scripts/add-personal-svgs.mjs            # show the plan
node scripts/add-personal-svgs.mjs --commit   # upload + patch
```

The exported bytes are committed at `scripts/assets/personal/node-<id>.svg` so
the upload is reproducible — do not hand-edit them, re-export from the node id in
the filename. `personalGallery` is now at rev `CRVsOIdia6NNOSopJ7kYNV` with **zero
empty slots**.

A fourth vector in the design, `Wordmark_5` (`1:39977`), is *not* missing — it was
already in place as a 2800×1010 PNG.

**No code changes were needed.** Verified in the browser:

- desktop 1440 — slot 5 sits at x=967 w=453 beside its 927-wide neighbour, slot
  17 spans the full 1400, slot 27 is 453 with a 927 to its right at x=493. Every
  value matches the frame.
- mobile 402 — every item full-width 382 at x=10, first at y=102, 10px gutters.
  `Gallery`'s existing `grid-column: 1 / -1` rule already did this.
- The CDN serves them as `image/svg+xml` 200, and the asset refs encode
  `453x453` / `1400x751` / `453x320`, so `imageAspectRatio` reserves the right box
  before they load.

### One small design discrepancy

Desktop `1:40000` orders the pair Special_Place_Green **Back** then **Front**;
mobile `1:40247`/`1:40248` orders them **Front** then **Back**. The gallery is one
ordered array, so it cannot differ per breakpoint — it currently renders Back
then Front at both widths. Worth Mason confirming which he wants.

## Hero promotion — Potato Head Music + Nusa Caña

Both designs open on a full-bleed hero with a wordmark centred on it
(`1:896`/`1:899` and `1:1971`/`1:1973`). In Sanity neither project had a hero at
all — the opening picture was just `galleryItems[0]`, and gallery items have no
logo overlay. That is why the logo looked unsupported: **the feature was already
built, these two just weren't using the slot it lives on.** Dome already was.

Already in place, no code written this round:

| field | what it does |
|---|---|
| `heroVideo` | plays in place of the image — autoplay, muted, loop, playsinline |
| `heroVideoPoster` | still shown before/while the video loads |
| `heroImage` | fallback when there is no video |
| `heroLogo` | SVG/PNG layered over the hero |
| `heroLogoPosition` | 9 anchors, defaults to Center |
| `heroLogoWidth` | logo width as a % of the hero, 5–100 |

`scripts/promote-hero.mjs` moves item 1 into the hero and attaches the wordmark.
It aborts if a hero already exists, if item 1 is not an image, or if its ratio
does not match the design hero — which is what confirmed the item and the hero
are the same picture:

| project | design hero | item ratio | logo |
|---|---|---|---|
| Potato Head Music | `1:896` 382 × 255.121 = 1.497 | 2800×1870 = 1.497 | centre, 49% (186.634/382) |
| Nusa Caña | `1:1971` 1400 × 787.5 = 1.778 | 2800×1575 = 1.778 | centre, 32% (454/1400) |

The image asset is reused rather than re-uploaded, and is set as **both**
`heroImage` and `heroVideoPoster`, so dropping a file into `heroVideo` is the only
step left — the page switches over on its own. Documents backed up to
`.backups/` (gitignored) before writing; Sanity history also covers it.

Verified at 1440: Nusa Caña hero at y=721 against the design's 720, ratio 1.778,
logo centred to the pixel at 32%, 20px to the gallery. Potato Head Music ratio
1.497, logo centred at 49%. Both wordmarks render as SVG over the right artwork.

## Video assets — 24 clips outstanding

Slot numbers below are **after** the hero promotion, which shifted Potato Head
Music and Nusa Caña down by one. Ratios come from the design and are the crop to
export to.

| project | hero video | gallery slots (position, width, ratio) |
|---|---|---|
| Little Sun | — | 1 full 1.497 · 2 full 0.801 · 4 small-half 1 · 6 large-half 0.8 · **9, 10, 11 full 2.975** |
| WHR | — | 3 half 0.813 · 7 two-thirds 1 · 10 two-thirds 1 · 12 half 0.8 · 15 half 0.8 |
| Potato Head Music | **yes** | 4 half 0.75 · 7 half 0.562 · 10 half 1 · 13 half 0.75 · 15 half 0.75 |
| Nusa Caña | **yes** | 5 half 0.75 · 7 large-half 0.946 · 10 large-half 1 |
| Buck Mason | — | 8 half 0.75 · 9 full 0.75 |

Dome's 5 hero-adjacent videos are all supplied and playing. Collection 002 has no
video slots.

Buck Mason slot 9 is still worth a check — `full` at 0.75 renders a 1400×1867
portrait video, unlike every other full-width slot on the site.

## Animation overhaul — no scroll motion, one page transition

Supersedes the fade-on-trigger pass below. The client does not want content
reacting to the reader moving through a page **at all**, so scroll-driven motion
is gone rather than simplified. `src/lib/animations/reveal.ts` is deleted, along
with every `use:reveal`, `use:revealItems`, `use:revealOnEnter` and
`use:driftOnScroll` in the app. Nothing imports `ScrollTrigger` any more and
there are no scroll listeners left. `gsap` stays only for the theme-toggle blur,
which is not scroll-related.

Dead code that went with it: `Gallery`'s `revealDelay` and `eagerFirstRow` props
and the `eagerCount` first-row calculation, and the `GALLERY_DELAY` constant on
the project page.

**Scope note:** the brief said project index and individual projects, but the
personal gallery ran the same reveals through `Gallery`. Leaving them there would
have meant one page still animating on scroll, so it was included. Trivially
reversible if that is wrong.

### The replacement

A single glass veil in `src/routes/(site)/+layout.svelte`, driven by SvelteKit's
`onNavigate` / `afterNavigate`:

1. click → `covering = true`, veil fades in over **220ms**
2. `onNavigate` returns a promise that resolves at 220ms — SvelteKit holds the
   DOM swap until then, so the new page is only ever revealed from behind a fully
   opaque veil
3. `afterNavigate` → `covering = false`, veil clears over **280ms**

Out is slower than in on purpose: covering should feel decisive, uncovering
should feel like it is getting out of the way.

It is the site's own vocabulary — `background: var(--bg)` plus
`backdrop-filter: blur(var(--veil-blur))`, the same treatment as the nav pills
(10px), the work hover panel (15px) and the about overlay (20px). The new token
sits at **16px**, between the pill glass and the overlay.

Two details that make it read as seamless rather than as a page reload:

- **z-index 25** — above the page content, *below* the music player (30) and the
  nav (50). The persistent chrome stays sharp while the content frosts over, so
  the change reads as one page rearranging itself. Confirmed visually: mid-fade
  the nav pills and the player are crisp while the header and hero are soft.
- **`position: fixed`** — the blur only ever costs the viewport, not the full
  height of a 20,000px gallery. A filter on the content wrapper itself would have
  forced the browser to rasterise the whole document.

Skipped entirely on `prefers-reduced-motion`, on same-path hash links, and when
leaving the app (`navigation.willUnload`), where the veil would just flash before
the browser's own paint.

### Smooth scrolling — added, then removed

Lenis went in, felt "heavy and jittery", and came back out. The reference the
client gave — <https://mouthwash.studio> — was inspected directly and **does not
smooth-scroll at all**: no Lenis, no Locomotive, no GSAP `ScrollSmoother`
wrapper, no transformed content element, `scroll-behavior: auto`, and the
document scrolling natively. It carries GSAP 3.11.5, but for element animation.

So the glide people read on that site is native trackpad momentum on a light
page. Replacing that with a JS-interpolated approximation — on a site with
several `backdrop-filter` surfaces, which are expensive to composite — is what
produced the heaviness and the stutter. `lenis` is uninstalled and
`smoothScroll.ts` is deleted; scrolling is native again.

Kept from that detour: `.nvmrc` pinned to `20.20.2` and `engines.node` declared,
which fixed a genuine pre-existing block on `npm install`.

### The page transition — three bugs, not a tuning problem

It read as "instant loading" because it largely *was* invisible:

1. **The fill was opaque.** `background: var(--bg)` painted straight over the
   `backdrop-filter` result, so the blur never rendered at all. What was left was
   a dark fade against a dark page — nearly imperceptible. The fill is now
   `--veil-bg`, `rgba(…, 0.72)`.
2. **Fading opacity defeats a backdrop-filter.** Animating the element's opacity
   blends the filtered backdrop with the unfiltered one, so at half opacity the
   page underneath is still sharp and the frost only arrives in the last instant.
   Opacity now stays at 1 and the **blur radius** is what animates, so the page
   visibly defocuses.
3. **220/280ms was too quick to register.** Now 380ms in, 520ms out, on
   `cubic-bezier(0.6, 0, 0.35, 1)` and `cubic-bezier(0.22, 1, 0.36, 1)`. Blur
   raised 16px → 28px.

Because a permanently-on `backdrop-filter` costs a viewport compositing pass on
every scrolled frame — the exact thing that made Lenis feel bad — the veil runs
two states: `armed` puts it on screen doing nothing, `active` runs the ramp. At
rest it carries no filter and is `visibility: hidden`.

Mouthwash does the same kind of thing: a fixed `#loader` curtain at z-index
100000 over `rgba(0,0,0,0.1)`, and a header on `opacity 0.35s`.

**One bug found and fixed during this pass:** the `armed → active` handoff first
used `requestAnimationFrame` to commit the `from` state. rAF does not fire in a
background tab, which left the veil armed at blur(0) and stuck there permanently.
It now forces a style flush by reading `offsetHeight`, which is deterministic.

### Verified

- No Lenis anywhere: `html.className` is empty and scrolling is native again.
- A real click runs the whole veil lifecycle in order —
  `hidden → armed → armed+active → armed → hidden` — ending clean with no filter
  left on the element.
- `backdrop-filter` was confirmed to render in this environment (a control
  element blurred half the viewport), so the weak frost was a real bug rather
  than a capture artifact.

- Every route — `/`, `/work`, `/work/dome`, `/work/nusa-cana`, `/personal` —
  renders with all content at `opacity: 1`, no inline animation styles and no
  transforms. 148 elements checked across the five.
- A real click through `/work` → `/work/dome` recorded the full sequence:
  veil covers → path changes behind it → veil clears.
- The veil resolves to `fixed`, `z-index: 25`, `blur(16px)`, `pointer-events: none`.

A side benefit: with no rAF-driven animation gating first paint, the preview
finally screenshots reliably, which is how the frosted mid-transition state above
was confirmed.

## Earlier pass — entry animation reduced to a fade (superseded)

Mason's call: remove all scaling and movement, leave a fade tied to the trigger.
`src/lib/animations/reveal.ts` now animates **opacity and nothing else**.

What went:

- the `MOTION` table entirely — `blur` (y 48/22, blur 14/7) and `scale`
  (y 32/16, scale 0.94/0.96) presets, and the `motion` option that picked between
  them
- the scrub window (`top bottom` → `top 35%`), which bound progress to scroll
  position. Below-fold items now fire once at `top 85%` with
  `toggleActions: 'play none none reverse'`. A scrubbed opacity leaves content
  half-transparent while you read it, which is the quality the simpler treatment
  is meant to remove
- `driftOnScroll`'s upward travel and blur on the way out. It keeps the opacity
  fade so the header still hands off to the gallery — the one place opacity stays
  scroll-bound, because it is an exit that tracks the reader rather than an
  arrival

What stayed: the staggered on-load arrival for anything on the first screen, the
`eager` opt-in for the opening image, the reduced-motion bail-out, and the
`ScrollTrigger.refresh()` on image load.

This is global — work index, project pages and the personal gallery all use these
actions, so the whole site's entry motion changed together.

Verified at the property level: GSAP now writes `opacity` and `visibility` and
nothing else (`transform: none`, `filter: none` on every card), and no `y`,
`scale`, `blur` or `filter` remains anywhere in the module.

> Not visually confirmed. The in-app preview pane was hidden for this pass, so
> the tab reported `document.visibilityState: "hidden"` and `requestAnimationFrame`
> never fired — GSAP's ticker is rAF-driven, so no tween could advance no matter
> which tab was used. The property-level check above is solid; the *feel* of the
> fade wants Mason's eye in a real browser.

## What is actually left

Nothing in code. All 13 sheet items are closed. The only outstanding work is
**content**: the 24 video clips listed above, which Mason uploads in `/studio`.

Two open questions that need Mason, neither blocking:

- Special_Place_Green pair order — desktop and mobile frames disagree (see above)
- Buck Mason gallery slot 9, `full` at ratio 0.75
- The contact form has no Figma frame at all; it is the one surface designed only
  in code

## #7 — removed on mobile

Gated on `@media (hover: hover)` rather than a width breakpoint, so it is the
pointer that decides: a touch device never synthesises hover (verified —
`matchMedia('(hover: hover)').matches` is `false` under the mobile profile, so
the rule cannot apply), while a narrow laptop window keeps the preview.
`:focus-visible` keeps both the panel and the caption blur outside the media
query, so the info stays reachable by keyboard.

## Content: nothing outstanding

`scripts/import-from-figma.mjs --content` is **no longer needed** — the note that
used to live here was stale. Verified against Sanity: all seven work projects
have a tagline, description, two info blocks (role + year), collaborators, and
both an Instagram and a website URL. #8 and #9 have all the data they need.
