# Project Worklog — آتلیه نئون (Atelier Neon)

Persian RTL neon sign design shop (real glass-tube neon only, no pricing, no admin panel).
Stack: Next.js 16 App Router, TS, Tailwind 4, shadcn/ui, Prisma+SQLite, zustand persist, framer-motion, sonner.
Single visible route: `/` + `POST /api/orders`.

---
Task ID: 1
Agent: main
Task: Project kickoff — analysis of reference (customneon.com/create-neon-sign) + uploaded test HTML components + worklog init

Work Log:
- Extracted /home/z/my-project/upload/component.zip → basePageLayout.html, navbar.html, productCard.html, productSlider.html
- Read all four: user's taste = Persian RTL, Vazirmatn font, soft rounded classic cards (rounded-3xl+), calm palette, subtle dot-grid paper texture, embla sliders, clean shop feel
- Fetched customneon.com/create-neon-sign via page_reader: key features = live preview, dark wall preview, multi-layer glow, visual font chips, glowing color swatches, "created on this page" UGC gallery, 3 steps, FAQ accordion, power on/off
- Decision: build single-page Persian RTL shop «آتلیه نئون» with canvas-based neon renderer (5 glow layers), light+dark classic theme (warm rose accent, no indigo/blue theme), no pricing/admin (order dialog saves to DB with design JSON + JPEG preview)

Stage Summary:
- Direction locked: classic warm theme, rose-red accent, real-neon-only product
- Next: prisma schema → layout/theme → neon engine → designer → sections → order API → verify

---
Task ID: 2-9
Agent: main
Task: Build complete «آتلیه نئون» — Persian RTL real-neon sign design shop (single route /), light+dark classic theme, no pricing/admin

Work Log:
- lib/neon.ts: canvas neon engine — 5-layer glow (wide halo / tight halo / tube body / bright core / hot filament), stroke-based hollow tube letters, night+day walls w/ ambient tint + vignette, floor reflection (night), off-state pale glass tubes, flickerLevel(t) buzz+stutter, auto-fit multi-line layout, exportNeonImage (1600x1000 PNG / JPEG for orders), estimateSizeCm, digit normalization
- 9 real neon colors (rose/red/orange/gold/green/aqua/ice/violet/warm-white), 8 fonts (4 Persian: Lalezar/Vazirmatn/Naskh/Amiri + 4 Latin: Pacifico/GreatVibes/Monoton/Bebas)
- design-store.ts: zustand + persist (draft autosave in localStorage)
- NeonCanvas.tsx: dpr-aware, ResizeObserver, fonts-ready gating, rAF loop for flicker
- Designer.tsx: preview card (wall tabs, power switch, flicker switch, size estimate, download, order) + controls card (textarea 3-line/30-char, font chips w/ live samples, glowing color swatches, 6 size chips)
- OrderDialog.tsx: summary (mini canvas + badges), name/phone(Persian-digit normalize)/note, success view with code NE-XXXX + copy + download
- api/orders/route.ts: zod validation, unique short code, stores design + JPEG dataURL; prisma Order model pushed to SQLite
- Sections: Navbar (sticky blur, theme toggle), Hero (live neon canvas + floaty), Gallery (6 clickable presets → apply to store + scroll), CraftStrip (AI-generated workshop photo + real-neon story), Steps (3), FAQ (accordion), Footer (mt-auto sticky bottom)
- Generated images: public/images/workshop.jpg + hero-wall.jpg (z-ai image CLI)

Bugs found & fixed during Agent Browser E2E:
1. Grid blowout: font-chip flex row forced min-content 842px → preview column collapsed to 238px. Fixed with min-w-0 on cards + chip row.
2. Flicker never animated: flicker was in store but NOT in NeonSpec passed to canvas (spec.flicker undefined). Added flicker to NeonSpec + memo deps.
3. Hero caption sticker overlapped canvas edge → moved to clean caption row below.
4. ESLint react-hooks/set-state-in-effect on mounted pattern → replaced with useSyncExternalStore-based useMounted.
5. Touch sizes: navbar CTA h-9, size chips py-2.5.

E2E verified (agent-browser): SSR RTL renders; text/color/font/wall/power/size all update canvas (pixel-verified); 2-line text; flicker rAF animates (61 frames/1.2s, pixel delta confirmed); order submitted E2E → DB record NE-4859 w/ normalized phone + 93KB JPEG; success dialog shows code; gallery preset click applies + scrolls; dark mode + light mode both clean; mobile 390px stacks, no real horizontal scroll (body overflow-x clip, scrollX=0); FAQ accordion single-open works; 0 console errors, 0 hydration warnings; lint clean (1 false-positive warning re fonts rule for pages router).

Stage Summary:
- Site fully functional at / — classic warm rose theme, light+dark, Persian RTL, Vazirmatn UI
- Real-neon renderer is WYSIWYG (same drawNeon for preview & export)
- Orders persisted in SQLite w/ preview image for admin review

---
Task ID: 10
Agent: main
Task: Full self-critique pass — heavy review of the built site (code + live browser + VLM visual analysis + WCAG math + edge-case E2E)

Work Log:
- Re-read all source files (neon.ts, Designer, NeonCanvas, OrderDialog, store, sections, API, globals.css)
- Browser E2E re-verification: 0 console errors, 0 page errors, SSR fine, downloads work, order flow intact
- Captured 10 screenshots (light/dark fold, designer, mobile, day-wall, off, empty, order dialog, long-line, craftstrip)
- VLM harsh critique on: exported neon PNG (verdict: flat text + blur layers, not tube-like), fold, dark designer, mobile, day-wall, workshop AI image (anatomy defects)
- Computed WCAG contrast: dark-mode white-on-primary = 3.71:1 (FAIL AA); light primary text on bg 4.31:1 (FAIL small text); muted 4.64:1 pass
- Verified bugs: (1) textarea 92 chars but canvas silently renders only 30/line; (2) order button enabled on empty text → placeholder "NEON" gets ordered; (3) tablist a11y name "شبروز" (no aria-label); (4) flicker switch has no visible label (tooltip-only → mystery on touch); (5) footer IG handle "atelier.neon@" wrong @ position; (6) hero-wall.jpg 140KB unused asset; (7) export PNG 1.9MB + Persian filename; (8) NE-XXXX 4-digit code collision risk after 5 retries; (9) Google Fonts CDN dependency — blocked/slow in Iran → fontsReady gate could spin forever (P0 deployment risk)
- Filtered VLM false alarms (workshop image "missing" = lazy-load screenshot artifact; mobile text hallucinations)

Stage Summary:
- Heavy critique delivered to user in chat: core neon realism ~5.5/10 (bright yes, tube-accurate no), functional 8/10, a11y/contrast fixes needed, P0 = self-host fonts + render v2 (hot color core, blurred reflection, light-wrap, electrode hints)
- All evidence artifacts in /home/z/my-project/tool-results/critique/

---
Task ID: 11
Agent: main
Task: V2 rebuild per user feedback — tool-only English studio (no hero/header/footer/steps/faq), single press buttons, 16 Latin fonts grid, 17 colors, 4 color modes, 12 prettier presets, mobile floating mini-preview

Work Log:
- neon.ts: added ColorMode (solid/gradient/duo/rainbow), colorId2, 17 neon colors, 16 Latin display fonts (Pacifico/GreatVibes/Sacramento/Satisfy/Dancing/Kaushan/Yellowtail/Lobster/Caveat/Bebas/Monoton/Righteous/Passion/Marker/Audiowide/Playfair), per-letter segment renderer (duo alternation + rainbow hue wheel w/ hslToHex), real linear-gradient strokeStyle for gradient mode, ambientGlowColor for wall/shadow
- Fixed reflection clipping: mirrored pass now clipped to reflection band (VLM confirmed soft fade, no hard cut)
- design-store: mode/colorId2 + fresh key "neon-studio-draft", skipHydration + manual rehydrate in Designer (fixed returning-user SSR hydration mismatch)
- Designer: toggle switches REMOVED -> single press buttons (Night/Day wall chips, Flicker, Power On/Off with aria-pressed); font grid (3/4 cols, no horizontal scroll); color-mode chips; second-color swatch row (gradient/duo); per-line overflow warning + char counter; download/order disabled when text empty
- Mobile floating mini-preview: rAF-throttled scroll watch on preview rect (bottom < 72), AnimatePresence slide-up card w/ live NeonCanvas aspect 2.6, tap = scroll back to preview, hidden while order dialog open, lg:hidden
- OrderDialog: full English, international phone regex ^\+?[0-9]{7,15}$, mode badge, names via NEON_FONTS/NEON_COLORS lookup
- Gallery: 12 prettier presets incl. gradient/duo/rainbow showcases
- layout/page: lang=en dir=ltr, Inter UI font, 17-family Google Fonts link, metadata English, no brand name anywhere; ThemeFab floating corner toggle; deleted Navbar/Hero/CraftStrip/Steps/Faq/Footer + unused public/images
- prisma: added colorId2/colorName2/mode columns, db:push OK; API: English errors, stores human-readable names

E2E verified (agent-browser):
- 0 console errors, 0 hydration mismatches (fixed ThemeFab aria-label SSR/client mismatch + zustand skipHydration)
- 4 color modes: gradient pixel-verified (left RGB 229,166,178 -> right 136,224,213), duo letters alternate (VLM), rainbow distinct letter hues (VLM), solid
- Power button toggles label On/Off + disables Flicker; Night/Day render walls
- Font grid click switches renderer; gallery preset applies text+font+mode and scrolls
- Mobile 390px: mini preview appears when preview scrolled away, hides on scroll-up, live-updates on color change, tap scrolls back; no horizontal scroll
- Order E2E: NE-7432 stored w/ mode=duo, colorName2=Ice Blue, fontName=Sacramento, 100KB JPEG
- PNG download works (neon-stay-wild.png); dark mode via FAB clean
- lint: 0 errors (1 known false-positive warning)

Stage Summary:
- Site is now a clean embeddable English neon studio: designer + 12 presets only, light/dark, single-button controls, richer fonts/colors/modes, mobile floating live preview

---
Task ID: 12
Agent: main
Task: PrintooNeon v3 — animated color modes (Flow / Per-Letter / Cycle), 27 self-hosted fonts + searchable picker, backgrounds, GIF export, GitHub repo

Work Log:
- GitHub: created repo AbstractAxisX/PrintooNeon (public), pushed pre-change state first per user mandate, .gitignore extended (db/, tool-results/, download/, examples/, tests/, mini-services/, upload/)
- Fonts: 27 display fonts + 4 Inter weights downloaded as woff2 from Google Fonts to /public/fonts (self-hosted, @font-face in globals.css — P0 CDN dependency eliminated), categories (script/hand/display/bold/clean/elegant), src/lib/fonts.ts registry + ensureFontsLoaded
- Engine v3 (src/lib/neon.ts rewrite): 4 color modes — solid / flow (animated RGB sweep across letters, 2-5 colors, speed slider) / perLetter (click letters to paint, brush separate from base) / cycle (one color at a time, hold N s + smoothstep crossfade, up to 8 colors, hold/fade sliders)
- Render pipeline: sign drawn on transparent layer (light strokes → ctx.filter blur bloom ×3 additive passes → tube body → hot core+filament with 'lighter'), composited over background + ambient wall tint + vignette; shadowBlur per-glyph fallback when ctx.filter unsupported; mirrored floor reflection w/ fade mask + blur on dark bgs; off-state pale glass; dpr-aware scratch canvases (size-keyed cache); rAF loop ~40fps cap for animated modes + IntersectionObserver pause when offscreen
- Backgrounds: 4 AI-generated wall photos (brick/concrete/wood/plaster, z-ai image CLI, JPG q76) + 6 solid presets + custom color input; background spec in design, baked into PNG/GIF exports; day/night + flicker REMOVED (power on/off kept)
- GIF export via gifenc (dynamic import, rgb565 quantize per frame): flow = 48 frames/full sweep, cycle = 1 long-delay frame per hold + 12 fade frames; downloadNeonFile → PNG (static modes) or GIF (animated), English filenames printoo-neon-*.png/gif; types in src/types/gifenc.d.ts
- UI: FontPicker (popover combobox w/ search, category headers, live font samples, grid); mode cards w/ icons + blurb; ColorPalette/ColorListPicker/ColorChipList (toggle add/remove chips); LetterPainter (char chips w/ glow + canvas click hit-testing w/ hover highlight); BackgroundPicker (thumbs + solids + custom); flow speed / cycle hold+fade sliders (shadcn Slider); brushColorId separated from base colorId (unpainted letters keep base)
- Store: design-store v3 (new fields, version 3, key printoo-neon-draft); OrderDialog sends mode/backgroundId/configJson (full design config); prisma schema: dropped colorId2/wallMode, added backgroundId/configJson; API validates configJson shape (mode enum, flow≤5/cycle≤8 color lists)
- Gallery: 12 presets using new modes + backgrounds (flow/cycle/perLetter showcases), live animating thumbnails, multi-dot color indicators
- Badge contrast fix (light mode: text-accent-foreground), fps throttle 24ms, mini floating preview verified w/ animated modes

E2E verified (agent-browser + VLM):
- 0 console/page errors, 0 hydration warnings, lint 0/0
- Solid renders (pixel-sampled); Flow animates (7734/17761 center pixels changed in 600ms); Cycle crossfades (81% changed in 1.5s); Per-letter: canvas click + chip click paint correctly (indices verified across spaces + multi-line), brush≠base verified, toggle-unpaint works
- Font picker: search "mono"→Monoton, "bungee"→Bungee selected + persisted; 27 fonts render in own typefaces
- Background switch (wood pixels verified), custom color #20403a renders at corner
- GIF downloads E2E: printoo-neon-good-vibes.gif (flow, 48f) + printoo-neon-stay-wild.gif (cycle); PNG: printoo-neon-stay-wild.png (1600×1000)
- Order E2E: NE-2051 stored (mode=flow, fontName=Bungee, backgroundId=brick, configJson 236B, JPEG 287KB); 500 fixed (stale Prisma client after db:push → dev server restart via .zscripts/dev.sh)
- Mobile 390px: mini preview shows when scrolled past (bottom<72), hides on return; no horizontal scroll; power off = 0 lit pixels
- VLM QA: 9/10 overall — "convincing neon tube effect… glow interacts realistically", layout "exceptionally clean"; minor badge contrast fixed + re-verified

Stage Summary:
- PrintooNeon live at / — 4 color modes (2 animated), 27 self-hosted fonts, 23 colors, background picker, PNG+GIF export, orders w/ full config
- Repo: https://github.com/AbstractAxisX/PrintooNeon (initial state pushed pre-change, final push after this task)

---
Task ID: 13
Agent: main
Task: User feedback fixes — restore Gradient mode + font picker popover → inline accordion + GitHub push

Work Log:
- Gradient mode RESTORED (was dropped in v3): ColorMode now solid/gradient/flow/perLetter/cycle; engine resolveFrameColors gradient branch = per-glyph lerp(A→B) across sign width (static, smooth stops, reuses gradientPaint path); dominant glow = mix(A,B)
- Spec/store: colorId2 + setColor2, Preset.colorId2, spec memo + dual palettes UI ("Main color"/"Second color" + live gradient preview strip), mode grid now 5 cards (grid-cols-3 sm:grid-cols-5) w/ Blend icon
- FontPicker popover DELETED → FontAccordion.tsx: shadcn Accordion (single collapsible) inline in the controls card, trigger shows active font in its own typeface, content = search input + category-grouped grid (max-h 340 scroll), stays open while browsing so live + floating mini preview react to picks
- drawOffSign now receives real mode (perLetter off-state keeps per-letter pale glass colors)
- OrderDialog: gradient badge "A → B", colorId2 in payload + configJson; prisma: colorId2/colorName2 columns restored, API mode enum + colorId2 validation + names
- Gallery: 3 gradient presets (Good Vibes rose→hotpink brick, dream big violet→ice charcoal, The Bar red→orange brick) + "Gradient" badge + 2-dot indicators
- Store: DEFAULT_DESIGN extracted, version 4 + migrate() (v3 drafts keep all fields, gain colorId2 default, letterColors sanitized) — fixes "couldn't be migrated" console error

E2E verified (agent-browser):
- Gradient: left pixel [218,81,114] rose vs right green after switching second color (pixel + VLM confirmed blend "yellow/gold → cyan/blue"), two-palette UI clean, 5 mode cards no clipping (desktop + 390px)
- Font accordion: expands inline (no popover element in DOM), aria-expanded, search "great"→1 result, pick applies + stays open, trigger shows picked font
- Migration: planted v3 draft → rehydrated as v4 w/ colorId2 default + letterColors kept, 0 console errors after fresh reload
- Order E2E gradient: NE-1809 stored (mode=gradient, Classic Rose → Neon Green, configJson colorId2=green)
- lint 0/0; dev server restarted via .zscripts/dev.sh after db:push (fresh Prisma client)

Stage Summary:
- 5 color modes incl. restored Gradient; fonts in an inline accordion; pushed to GitHub

---
Task ID: hotfix-font-accordion-height
Agent: main (Z.ai Code)
Task: Font accordion had a fixed height — only a few fonts visible, the rest overflowed/escaped the frame. User demanded: no height limit, all fonts shown comfortably.

Work Log:
- Located the bug: `FontAccordion.tsx` wrapped the font grid in `<ScrollArea className="max-h-[340px]">` — Radix ScrollArea mis-measures inside Radix Accordion's animated content, letting cards visually escape the border box.
- Removed the ScrollArea + max-height entirely; the grid renders at full natural height (~1100px for 27 fonts) and the page scrolls normally.
- Confirmed the parent controls Card in `Designer.tsx` has no overflow/max-height constraint.
- Made font-count labels dynamic (`NEON_FONTS.length`) in both FontAccordion and Designer (was hardcoded "27").
- Lint clean. E2E via agent-browser: opened accordion → 27/27 fonts rendered, `contentMaxHeight: none`, 0 cards outside the accordion frame (desktop 1440px and mobile 375px, 3-col grid intact).
- Search: "vibes" → exactly 1 result (Great Vibes); clearing restores all 27. Selection verified incl. the very last font (Cinzel) at the bottom of the tall list — header + aria-checked update correctly.
- Fresh browser launch: 0 page errors (earlier console entries were dev-only HMR artifacts from editing while the browser was open). dev.log: only 200/201 responses.
- Vision AI on full-page screenshot: all 6 category headers visible, Cinzel fully inside the bordered box, no card clipped or escaping.
- Committed `552b4d2` and pushed to github.com/AbstractAxisX/PrintooNeon (main).

Stage Summary:
- Font accordion now expands to full height — every font visible at once, no internal scroll, no clipping, no overflow bug.
- Screenshots: tool-results/font-accordion-fullpage.png (definitive), -open.png, -mobile.png, -desktop-final.png.
