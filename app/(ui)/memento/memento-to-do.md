## Memento feature — build plan (Next.js 15 + TypeScript + Tailwind + shadcn)

Opinionated, end-to-end task list to ship a polished “Memento” generator for DJs. Final export: high‑res PNG (2x scale), built from an uploaded event photo + curated tracklist, with 5 distinct templates featuring the party name and a DJ Ziff signature.

### 0) Tech decisions (locked)
- [x] Final export format: PNG (crisp text, transparency if needed, broad compatibility). Render at 2x.
- [x] Rendering approach: Compose with Sharp. Generate template layers as SVG; rasterize via @resvg/resvg-js when needed; composite with Sharp.
- [x] HEIC support: try client-side conversion with `heic2any`; server fallback via Sharp (only if libvips has HEIF). Gracefully error if neither available.
- [x] State is client-only; API is stateless for render.

### 1) Dependencies and project setup
- [x] Install server-side imaging libs:
  - `pnpm add sharp @resvg/resvg-js` (Sharp for compositing/output, Resvg for SVG rasterization)
- [x] Client-side HEIC conversion (optional but preferred):
  - `pnpm add heic2any` (dynamically import on use)
- [x] Drag-and-drop + sortable:
  - `pnpm add @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers`
- [ ] shadcn/ui components already present; ensure the following are available/added if missing: `Card`, `Button`, `Input`, `Textarea`, `Checkbox`, `Separator`, `Collapsible`, `Dialog`, `Select`, `Tabs`, `ScrollArea`, `Badge`, `Toggle`.
- [ ] Fonts: use `next/font/local` to embed template fonts (headline + body + mono). Add to `app/fonts/` and export TS helpers.
- [x] Types: create `app/(ui)/memento/types.ts` for shared interfaces.

### 2) Data model (TS types)
- [x] `Track` { id: string; artist: string; title: string; mix?: string; included: boolean }
- [x] `MementoState` { partyName: string; date?: string; location?: string; notes?: string; tracks: Track[]; templateId: TemplateId; subtitleVariant: 'from' | 'afterparty'; colorScheme?: string; photo: { file?: File; url?: string; mime?: string } }
- [x] `TemplateId` = 'poster-bold' | 'minimal-card' | 'neon-grid' | 'story-vertical' | 'polaroid-collage'
- [x] API payload type mirrors `MementoState` but serializable and pruned.

### 3) Routing and files
- [x] Page shell: `app/(ui)/memento/page.tsx` — sections: Upload, Tracklist, Templates, Preview, Export.
- [x] API routes:
  - [x] `app/api/memento/preview/route.ts` — returns low-res PNG preview (fast; scale 1x).
  - [x] `app/api/memento/render/route.ts` — returns final high-res PNG (2x; streamed response if large).
- [x] Rendering helpers:
  - [x] `app/(ui)/memento/render/shapes.ts` — small SVG utilities.
  - [x] `app/(ui)/memento/render/text.ts` — text layout helpers, line wrapping, ellipsis, number formatting (01., 02., …).
  - [x] `app/(ui)/memento/render/templates.ts` — functions to build per-template SVG layers and composition instructions.
  - [x] `app/(ui)/memento/render/compose.ts` — glue code: load image, rasterize SVG with Resvg when needed, composite with Sharp, output PNG.
- [x] Utils:
  - [x] `app/(ui)/memento/utils/parseTracklist.ts` — parse pasted text to `Track[]`.
  - [x] `app/(ui)/memento/utils/slugify.ts` — filename builder.
  - [x] `app/(ui)/memento/utils/image.ts` — HEIC handling, file to data URL, size checks.

### 4) UI components (client)
- [x] `ImageDropzone.tsx`
  - Accept `.jpg,.jpeg,.png,.heic`.
  - Preview via `next/image` or `<img>`; for HEIC, try client convert with `heic2any` (dynamic import), else send as-is and let server try.
  - Validate file size (e.g., ≤ 15MB) and dimensions.
- [x] `MetadataFields.tsx`
  - Inputs: Party name (required), Date (optional), Location (optional), Notes (optional).
- [x] `TracklistEditor.tsx`
  - Textarea paste-to-parse.
  - List with include/exclude (`Checkbox`), inline edit (`Input`), reorder (dnd-kit).
  - Bulk actions: Select all/none, Remove excluded.
  - Max default 100; show counter and truncation notice if exceeded.
- [x] `TemplatePicker.tsx`
  - Show 5 thumbnails. On select, update `templateId` and `subtitleVariant`.
  - Optional: color scheme presets per template.
- [x] `LivePreview.tsx`
  - Calls `/api/memento/preview` on state changes (debounced) to fetch a low-res PNG preview.
  - Loading states; retry on error.
- [x] `ExportBar.tsx`
  - “Generate PNG” button → calls `/api/memento/render` with full state; downloads as PNG.
  - “Copy filename” button → `slugify(partyName)_YYYY-MM-DD_DJ-Ziff.png`.

### 5) Tracklist parsing
- [x] Support two input modes:
  - TSV export like `HISTORY 2025-08-16 (3).txt` (tab-separated with header: `#\tArtwork\tTrack Title\tArtist\tAlbum\tGenre\tBPM\tRating\tTime\tKey\tDate Added`).
  - Free-form text lines like: `Artist – Track Title (Mix)`.
- [x] TSV detection:
  - If the first non-empty line contains both `Track Title` and `Artist` (tab-separated), treat as TSV.
  - Map columns by header; take `Track Title` and `Artist` for parsing; ignore other fields.
  - Skip the header row and any empty lines.
- [x] TSV parsing rules (per line):
  - Title = `Track Title` column; Artist = `Artist` column.
  - Extract optional mix from trailing square brackets or parentheses in the title, e.g. `Nissan Altima [Devault Remix]` → mix `Devault Remix`; `Deep End (SIDEPIECE Remix)` → mix `SIDEPIECE Remix`.
  - Keep other descriptors inside parentheses/brackets as part of mix if they occur at the end, e.g. `(Intro - Dirty)`.
- [x] Free-form parsing rules (per line):
  - Strip leading numbering/bullets: `^\s*(\d+\.|[-•])\s*`.
  - Split on en/em/normal hyphen with surrounding spaces to separate Artist vs Title.
  - Extract optional trailing mix in parentheses `(…)`.
- [x] Common rules:
  - Trim whitespace; collapse internal multiple spaces; normalize dashes.
  - Ignore completely empty lines; stop at max 100 tracks.
  - Generate `id` via `crypto.randomUUID()`; set `included = true` by default.
  - Preserve provided casing; do not title-case.

### 6) Rendering templates (5 styles)
All emit an SVG overlay layer (for text, shapes) and composition instructions for the photo. Export sizes are base; render at 2x for final.

- [ ] Common constants:
  - Poster Bold: 1080x1350
  - Minimal Card: 1080x1080
  - Neon Grid: 1600x900
  - Story Vertical: 1080x1920
  - Polaroid Collage: 1240x1548

- [x] 1) Poster Bold (Portrait)
  - Full-bleed photo; dark gradient top→bottom.
  - Party name large top-left; subtitle “From DJ Ziff” small-caps.
  - Tracklist left column (1–30); footer with date • location.
  - Gradient color from photo dominant color (approx via Sharp stats) with white text.

- [x] 2) Minimal Card (Square)
  - Blurred, dimmed photo as background.
  - Centered rounded card with shadow; party name prominent; subtitle “DJ Ziff Afterparty Setlist”.
  - Tracklist 1–20; auto two columns if needed.

- [x] 3) Neon Grid (Landscape)
  - Abstract gradient + neon grid background SVG.
  - Photo framed on right; left column for title + subtitle; tracklist box with clipping (fit 20–35).
  - Neon cyan/magenta on deep navy/black.

- [x] 4) Story Vertical (Full-screen)
  - Photo full-bleed; top ribbon for title + subtitle; bottom frosted glass panel with tracks (1–25).
  - Footer: date/location.

- [x] 5) Polaroid Collage (Portrait)
  - Paper texture background (SVG noise or embedded texture); tilted polaroid frame contains photo.
  - Caption “From DJ Ziff”; party name stamped large in typewriter/ink style.
  - Tracklist on right as a pinned note.

### 7) Server-side compose pipeline
- [x] Input normalization
  - Accept uploaded `photo` via multipart or data URL; or URL.
  - If HEIC: try Sharp decode. If unsupported, return 422 with a helpful message suggesting client-side conversion.
- [x] Photo processing
  - Fit/crop to template bounds as per layout (cover/contain, gravity center).
  - Optional: extract dominant color for gradients.
- [x] SVG overlay
  - Generate SVG strings for template text and shapes; embed fonts via `@font-face` or `data:` if required for Resvg.
  - Handle long party names by reducing font size until it fits or wrap to two lines.
  - Tracklist numbers as `01.`, `02.`, …; ellipsis long lines.
- [x] Rasterization and output
  - Rasterize overlay SVG with Resvg at desired dpi.
  - Composite: `photo` base → gradient/blur layers → overlay raster → export PNG.
  - For preview: render at 1x; final: 2x.
- [x] Streaming response
  - Use `ReadableStream` from Sharp PNG output for final route to avoid large buffers.

### 8) API contracts
- [x] POST `/api/memento/preview`
  - Body: JSON `{ templateId, partyName, subtitleVariant, date?, location?, notes?, tracks: Track[], photo: { dataUrl | url } }`
  - Returns: PNG image (Content-Type: `image/png`), low-res.
- [x] POST `/api/memento/render`
  - Same body; returns high-res PNG (streamed).
  - Validate: partyName required; at least one `included: true` track; track count ≤ 100.
  - Errors: 400 on validation; 415 unsupported media; 422 HEIC not supported by server.

### 9) Client state and preview
- [x] Keep `MementoState` in a reducer or `useState` with derived selectors.
- [x] Debounce preview requests (300–500ms) and cancel inflight when state changes.
- [ ] Show loading skeleton; on error, toast and retain previous preview.

### 10) Accessibility and UX
- [ ] Keyboard navigable: tab order across upload → metadata → tracklist → templates → export.
- [ ] Visible focus states (Tailwind focus rings) on all actionable elements.
- [ ] Announce validation errors with `aria-live`.
- [ ] Drag-and-drop reordering also supports keyboard (buttons to move up/down).

### 11) Performance
- [ ] Lazy-load heavy libs: dynamic import `heic2any`; only import Sharp/Resvg on API routes.
- [ ] Thumbnail previews: optionally memoize server preview by hashing input state minus excluded tracks.
- [ ] Avoid sending original full-res photo for every preview; reuse uploaded blob/data URL.

### 12) Validation and limits
- [ ] Party name required (non-empty after trim).
- [ ] At least 1 included track.
- [ ] Track count hard cap 100; soft cap 50 with notice in UI.
- [ ] File size limit (15–20MB); dimensions ≥ 1000px on the shortest side recommended.

### 13) Filenames and sharing
- [ ] File name: `slugify(partyName)_YYYY-MM-DD_DJ-Ziff.png` (date optional).
- [ ] “Copy filename” button to clipboard.
- [ ] Post-download toast with where the file saved (browser default) and a quick rename tip.

### 14) Testing and QA
- [ ] Unit: `parseTracklist` (various bullet/number formats, hyphens, parentheses)
- [ ] Unit: `slugify` and numbering format.
- [ ] API: preview/render happy paths; invalid input; HEIC unsupported path.
- [ ] Visual QA:
  - Bright vs dark photos; contrast remains AA at minimum.
  - Very long party names (wrap/resize logic works).
  - 10, 25, 50, 100 tracks across templates; truncation/ellipsis as intended.
  - Retina crispness: final PNG at 2x looks sharp.

### 15) Polishing
- [ ] Add loading shimmer for thumbnails and preview.
- [ ] Save/restore last session to `localStorage` (optional).
- [ ] Nice empty states with quick tips.
- [ ] Small watermark or “From DJ Ziff” lockup consistent across templates.

### 16) Future enhancements (backlog, not in v1)
- [ ] Allow multiple photos; choose one per template or montage.
- [ ] Export to WebP option in addition to PNG.
- [ ] Template color pickers and fine-grained spacing controls.
- [ ] Cloud storage for uploads and shareable links to mementos.
- [ ] Batch generate multiple templates at once.

---

### Concrete implementation checklist (by file)
- [ ] `app/(ui)/memento/page.tsx`
  - Layout with sections: Upload, Tracklist, Templates, Preview, Export
  - Wire components and state; pass state to preview API
- [ ] `app/(ui)/memento/ImageDropzone.tsx`
- [ ] `app/(ui)/memento/MetadataFields.tsx`
- [ ] `app/(ui)/memento/TracklistEditor.tsx`
- [ ] `app/(ui)/memento/TemplatePicker.tsx`
- [ ] `app/(ui)/memento/LivePreview.tsx`
- [ ] `app/(ui)/memento/ExportBar.tsx`
- [ ] `app/(ui)/memento/utils/parseTracklist.ts`
- [ ] `app/(ui)/memento/utils/slugify.ts`
- [ ] `app/(ui)/memento/utils/image.ts`
- [ ] `app/(ui)/memento/types.ts`
- [ ] `app/(ui)/memento/render/templates.ts`
- [ ] `app/(ui)/memento/render/text.ts`
- [ ] `app/(ui)/memento/render/shapes.ts`
- [ ] `app/(ui)/memento/render/compose.ts`
- [ ] `app/api/memento/preview/route.ts`
- [ ] `app/api/memento/render/route.ts`

### Acceptance criteria (recap)
- [ ] Supports .jpg/.png/.heic upload; HEIC auto-converts when possible.
- [ ] Tracklist paste/edit/reorder/exclude; at least one included track required.
- [ ] Five selectable templates; live previews update quickly.
- [ ] Export yields crisp 2x PNG, ready to share.
- [ ] Party name is prominent; includes “From DJ Ziff” or “DJ Ziff Afterparty Setlist” in every template.
- [ ] Works on modern desktop browsers; decent mobile behavior.


