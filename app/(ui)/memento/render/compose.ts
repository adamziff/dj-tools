import sharp from "sharp";
// Use dynamic import to access Resvg only on server and avoid client bundling issues
let ResvgCtor: any = null;
async function getResvg() {
    if (ResvgCtor) return ResvgCtor;
    try {
        // Prefer native if available
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = await import('@resvg/resvg-js');
        ResvgCtor = (mod as any).Resvg;
    } catch {
        ResvgCtor = null;
    }
    return ResvgCtor;
}
import { TEMPLATE_MAP, type BaseTemplateInput, type TemplateInput } from "./templates";
import { RenderPayload } from "../types";
import fs from 'node:fs/promises';
import path from 'node:path';

async function estimateDominantColorHex(img: sharp.Sharp): Promise<string | undefined> {
    try {
        const buf = await img.clone().resize(32, 32, { fit: 'cover' }).raw().toBuffer();
        // simple average color
        let r = 0, g = 0, b = 0; const n = buf.length / 3;
        for (let i = 0; i < buf.length; i += 3) { r += buf[i]; g += buf[i + 1]; b += buf[i + 2]; }
        r = Math.round(r / n); g = Math.round(g / n); b = Math.round(b / n);
        const toHex = (v: number) => v.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    } catch {
        return undefined;
    }
}

export async function composeMemento(payload: RenderPayload): Promise<Buffer> {
    const template = TEMPLATE_MAP[payload.templateId];
    if (!template) throw new Error("Unknown template");

    const scale = payload.preview ? 1 : 2;
    const width = template.width;
    const height = template.height;

    // Base canvas starts as empty black
    let base = sharp({ create: { width: width * scale, height: height * scale, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png();

    // Optional background SVG (e.g., neon grid)
    if (template.backgroundSvg) {
        const bgOpts: BaseTemplateInput = {
            partyName: payload.partyName,
            subtitleVariant: payload.subtitleVariant,
            date: payload.date,
            location: payload.location,
            notes: payload.notes,
            dominantColorHex: undefined,
            logoDataUrl: undefined,
            photoDataUrl: payload.photo?.dataUrl,
        };
        const bgSvg = template.backgroundSvg(bgOpts);
        base = base.composite([{ input: Buffer.from(bgSvg), left: 0, top: 0 }]);
    }

    // Photo will be embedded directly in SVG now, so no Sharp compositing needed

    // Overlay SVG
    const dominantColorHex = await estimateDominantColorHex(base);
    // Load logo from memento/logo.svg or logo.png if requested
    let logoDataUrl: string | undefined;
    try {
        const root = process.cwd();
        const tryRead = async (p: string) => { try { return await fs.readFile(p); } catch { return null; } };
        const svg = await tryRead(path.join(root, 'memento', 'logo.svg'));
        const png = svg ? null : await tryRead(path.join(root, 'memento', 'logo.png'));
        const buf = svg ?? png;
        if (buf && (payload.showLogo ?? false)) {
            const mime = svg ? 'image/svg+xml' : 'image/png';
            logoDataUrl = `data:${mime};base64,${buf.toString('base64')}`;
        }
    } catch {}
    const overlayOpts: TemplateInput = {
        partyName: payload.partyName,
        subtitleVariant: payload.subtitleVariant,
        date: payload.date,
        location: payload.location,
        notes: payload.notes,
        tracks: payload.tracks,
        dominantColorHex,
        logoDataUrl,
        photoDataUrl: payload.photo?.dataUrl,
    };
    let overlaySvg = template.overlaySvg(overlayOpts);
    // Embed fonts directly into SVG via @font-face to avoid missing fonts in prod
    try {
        const cwd = process.cwd();
        const geist = await fs.readFile(path.join(cwd, 'app', 'fonts', 'GeistVF.woff'));
        const geistMono = await fs.readFile(path.join(cwd, 'app', 'fonts', 'GeistMonoVF.woff'));
        const geistB64 = Buffer.from(geist).toString('base64');
        const geistMonoB64 = Buffer.from(geistMono).toString('base64');
        const style = `<style><![CDATA[
            @font-face { font-family: 'Geist'; src: url(data:font/woff;base64,${geistB64}) format('woff'); font-weight: 100 900; font-style: normal; font-display: swap; }
            @font-face { font-family: 'Geist Mono'; src: url(data:font/woff;base64,${geistMonoB64}) format('woff'); font-weight: 100 900; font-style: normal; font-display: swap; }
        ]]></style>`;
        overlaySvg = overlaySvg.replace(/<svg([^>]*)>/, (m) => `${m}${style}`);
    } catch {}

    // Prefer Resvg (WASM) to rasterize text reliably in prod; fallback to Sharp
    try {
        const Resvg = await getResvg();
        if (!Resvg) throw new Error('Resvg not available');
        const renderer = new Resvg(overlaySvg, {
            fitTo: { mode: 'zoom', value: scale },
            font: { loadSystemFonts: false, defaultFontFamily: 'Geist' },
        });
        const rendered = renderer.render();
        const png = Buffer.from(rendered.asPng());
        base = base.composite([{ input: png, left: 0, top: 0 }]);
    } catch {
        const scaledSvg = await sharp(Buffer.from(overlaySvg))
            .resize(width * scale, height * scale, { fit: 'fill' })
            .png()
            .toBuffer();
        base = base.composite([{ input: scaledSvg, left: 0, top: 0 }]);
    }

    return base.png({ compressionLevel: 9 }).toBuffer();
}
