import sharp from "sharp";
// Remove native resvg for dev portability; Sharp can rasterize SVG sufficiently for our needs
import { TEMPLATE_MAP } from "./templates";
import { RenderPayload } from "../types";

async function rasterizeSvg(svg: string, width: number, height: number): Promise<Buffer> {
    return await sharp(Buffer.from(svg))
        .resize(width, height, { fit: 'fill' })
        .png()
        .toBuffer();
}

async function loadPhotoBuffer(input: { dataUrl?: string; url?: string }): Promise<Buffer> {
    if (input.dataUrl) {
        const b64 = input.dataUrl.split(",")[1];
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
    const width = template.width * scale;
    const height = template.height * scale;

    // Base canvas
    let base = sharp({ create: { width, height, channels: 3, background: { r: 0, g: 0, b: 0 } } }).png();

    // Optional background SVG (e.g., neon grid)
    if (template.backgroundSvg) {
        const bgSvg = template.backgroundSvg(payload as any);
        const bgPng = await rasterizeSvg(bgSvg, width, height);
        base = base.composite([{ input: bgPng, left: 0, top: 0 }]);
    }

    // Photo layer according to template placement
    try {
        const photoBuf = await loadPhotoBuffer(payload.photo);
        const placement = template.photoPlacement;
        if (placement.mode === 'cover') {
            let img = sharp(photoBuf).resize(width, height, { fit: 'cover', position: 'centre' });
            if (template.backgroundEffects?.blur) {
                img = img.blur(template.backgroundEffects.blur);
            }
            const resized = await img.toBuffer();
            base = base.composite([{ input: resized, left: 0, top: 0 }]);
            if (template.backgroundEffects?.dim) {
                const dimLevel = Math.max(0, Math.min(1, template.backgroundEffects.dim));
                const overlay = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="black" fill-opacity="${dimLevel}"/></svg>`);
                const dimPng = await rasterizeSvg(overlay.toString(), width, height);
                base = base.composite([{ input: dimPng, left: 0, top: 0 }]);
            }
        } else {
            const x = Math.round(placement.x * scale);
            const y = Math.round(placement.y * scale);
            const w = Math.round(placement.width * scale);
            const h = Math.round(placement.height * scale);
            let img = sharp(photoBuf).resize(w, h, { fit: placement.fit ?? 'cover', position: 'centre' });
            if (placement.rotate) {
                img = img.rotate(placement.rotate);
            }
            let buffer = await img.toBuffer();
            if (placement.cornerRadius && placement.cornerRadius > 0) {
                const r = Math.round(placement.cornerRadius * scale);
                const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect x="0" y="0" width="${w}" height="${h}" rx="${r}" ry="${r}"/></svg>`);
                buffer = await sharp(buffer).composite([{ input: await rasterizeSvg(mask.toString(), w, h), blend: 'dest-in' }]).toBuffer();
            }
            base = base.composite([{ input: buffer, left: x, top: y }]);
        }
    } catch (_) {
        // If photo missing/unreadable, proceed with just background/overlay
    }

    // Overlay SVG
    const dominantColorHex = await estimateDominantColorHex(base, width, height);
    const overlaySvg = template.overlaySvg({
        partyName: payload.partyName,
        subtitleVariant: payload.subtitleVariant,
        date: payload.date,
        location: payload.location,
        notes: payload.notes,
        tracks: payload.tracks,
        dominantColorHex,
    } as any);
    const overlayPng = await rasterizeSvg(overlaySvg, width, height);
    base = base.composite([{ input: overlayPng, left: 0, top: 0 }]);

    return base.png({ compressionLevel: 9 }).toBuffer();
}


