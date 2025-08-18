import { NextRequest } from "next/server";
import { composeMemento } from "@/app/(ui)/memento/render/compose";
import { RenderPayload } from "@/app/(ui)/memento/types";

export const runtime = 'nodejs';

function validate(body: RenderPayload) {
    if (!body.partyName || !body.partyName.trim()) throw new Error('Party name is required');
    if (!Array.isArray(body.tracks)) throw new Error('Tracks must be an array');
    if (body.tracks.length < 1) throw new Error('At least one track is required');
    if (body.tracks.length > 100) throw new Error('Max 100 tracks');
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as RenderPayload;
        validate(body);
        const buf = await composeMemento({ ...body, preview: false });
        return new Response(buf, { headers: { 'Content-Type': 'image/png' } });
    } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }
}


