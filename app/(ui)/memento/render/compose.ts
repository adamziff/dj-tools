import sharp from "sharp";
// Remove native resvg for dev portability; Sharp can rasterize SVG sufficiently for our needs
import { TEMPLATE_MAP } from "./templates";
import { RenderPayload } from "../types";
import fs from 'node:fs/promises';
import path from 'node:path';

async function rasterizeSvg(svg: string, width: number, height: number): Promise<Buffer> {
    return await sharp(Buffer.from(svg))
        .resize(width, height, { fit: 'fill' })
        .png()
        .toBuffer();
}

async function loadPhotoBuffer(input: { dataUrl?: string; url?: string }): Promise<Buffer> {
    if (input.dataUrl) {
        const parts = input.dataUrl.split(",");
        if (parts.length !== 2) {
            throw new Error(`Invalid dataUrl format: expected "data:mime;base64,data" but got ${parts.length} parts`);
        }
        const b64 = parts[1];
        return Buffer.from(b64, "base64");
    }
    if (input.url) {
        const res = await fetch(input.url);
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
        return Buffer.from(await res.arrayBuffer());
    }
    throw new Error("No image provided");
}

async function estimateDominantColorHex(img: sharp.Sharp, width: number, height: number): Promise<string | undefined> {
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
        const bgSvg = template.backgroundSvg(payload as any);
        base = base.composite([{ input: Buffer.from(bgSvg), left: 0, top: 0 }]);
    }

    // Photo will be embedded directly in SVG now, so no Sharp compositing needed

    // Overlay SVG
    const dominantColorHex = await estimateDominantColorHex(base, width, height);
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
    const overlaySvg = template.overlaySvg({
        partyName: payload.partyName,
        subtitleVariant: payload.subtitleVariant,
        date: payload.date,
        location: payload.location,
        notes: payload.notes,
        tracks: payload.tracks,
        dominantColorHex,
        logoDataUrl,
        photoDataUrl: payload.photo?.dataUrl,
    } as any);
    // Scale the SVG to match the canvas size
    const scaledSvg = await sharp(Buffer.from(overlaySvg))
        .resize(width * scale, height * scale, { fit: 'fill' })
        .png()
        .toBuffer();
        
    base = base.composite([{ input: scaledSvg, left: 0, top: 0 }]);

    return base.png({ compressionLevel: 9 }).toBuffer();
}
