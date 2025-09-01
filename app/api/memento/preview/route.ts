import { NextRequest } from "next/server";
import { composeMemento } from "@/app/(ui)/memento/render/compose";
import { RenderPayload } from "@/app/(ui)/memento/types";

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RenderPayload;
        if (body.photo?.dataUrl) {
            console.log('[memento/preview] photo dataUrl length', body.photo.dataUrl.length);
        }
        const buf = await composeMemento({ ...body, preview: true });
        const u8 = new Uint8Array(buf);
        const blob = new Blob([u8], { type: 'image/png' });
        return new Response(blob, { headers: { 'Content-Type': 'image/png' } });
    } catch (err) {
        console.error('[memento/preview] error', err);
        return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
