"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MementoState, RenderPayload } from "./types";

type Props = {
    state: MementoState;
};

export default function LivePreview({ state }: Props) {
    const [src, setSrc] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const [loading, setLoading] = useState(false);

    const photoSig = state.photo?.dataUrl ?? "";

    const includedTracks = useMemo(() => (
        state.tracks.filter((t) => t.included).map(({ artist, title, mix }) => ({ artist, title, mix }))
    ), [state.tracks]);

    const previewBody = useMemo<RenderPayload>(() => ({
        partyName: state.partyName,
        subtitleVariant: state.subtitleVariant,
        templateId: state.templateId,
        date: state.date,
        location: state.location,
        notes: state.notes,
        tracks: includedTracks,
        photo: { dataUrl: photoSig },
        preview: true,
        showLogo: state.showLogo,
    }), [state.partyName, state.subtitleVariant, state.templateId, state.date, state.location, state.notes, includedTracks, photoSig, state.showLogo]);

    useEffect(() => {
        const controller = new AbortController();
        abortRef.current?.abort();
        abortRef.current = controller;

        const body: RenderPayload = previewBody;

        const timeout = setTimeout(async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/memento/preview', { method: 'POST', body: JSON.stringify(body), signal: controller.signal, headers: { 'Content-Type': 'application/json' } });
                if (!res.ok) {
                    // eslint-disable-next-line no-console
                    console.error('Preview error', res.status, await res.text());
                    return;
                }
                const blob = await res.blob();
                setSrc(URL.createObjectURL(blob));
            } catch {
                // ignore; likely aborted or network issue
            } finally { setLoading(false); }
        }, 400);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [previewBody]);

    return (
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg border bg-muted">
            {loading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                </div>
            )}
            {src ? (
                // next/image does not support object URLs well; this preview uses a blob URL
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt="Memento preview" className="h-full w-full object-contain" />
            ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview will appear here</div>
            )}
        </div>
    );
}
