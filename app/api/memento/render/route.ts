import { NextRequest } from "next/server";
import { composeMemento } from "@/app/(ui)/memento/render/compose";
import { RenderPayload } from "@/app/(ui)/memento/types";

export const runtime = 'nodejs';

function validate(body: RenderPayload) {
    if (!body.partyName || !body.partyName.trim()) throw new Error('Party name is required');
    if (!Array.isArray(body.tracks)) throw new Error('Tracks must be an array');
    if (body.tracks.length < 1) throw new Error('At least one track is required');
    if (body.tracks.length > 200) throw new Error('Max 200 tracks');
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RenderPayload;
        validate(body);
        // debug: ensure photo made it to the server
        if (body.photo?.dataUrl) {
            console.log('[memento/render] photo dataUrl length', body.photo.dataUrl.length);
        } else if (body.photo?.url) {
            console.log('[memento/render] photo url', body.photo.url);
        } else {
            console.log('[memento/render] no photo provided');
        }
        const buf = await composeMemento({ ...body, preview: false });
        const u8 = new Uint8Array(buf);
        const blob = new Blob([u8], { type: 'image/png' });
        return new Response(blob, { headers: { 'Content-Type': 'image/png' } });
    } catch (err) {
        console.error('[memento/render] error', err);
        return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
