"use client";

import { useEffect, useRef, useState } from "react";
import type { MementoState, RenderPayload, Track } from "./types";

type Props = {
    state: Omit<MementoState, 'photo'> & { photoDataUrl?: string };
};

export default function LivePreview({ state }: Props) {
    const [src, setSrc] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        abortRef.current?.abort();
        abortRef.current = controller;

        const body: RenderPayload = {
            partyName: state.partyName,
            subtitleVariant: state.subtitleVariant,
            templateId: state.templateId,
            date: state.date,
            location: state.location,
            notes: state.notes,
            tracks: state.tracks.filter((t) => t.included).map(({ artist, title, mix }) => ({ artist, title, mix })),
            photo: { dataUrl: state.photoDataUrl },
            preview: true,
        };

        const timeout = setTimeout(async () => {
            try {
                const res = await fetch('/api/memento/preview', { method: 'POST', body: JSON.stringify(body), signal: controller.signal, headers: { 'Content-Type': 'application/json' } });
                if (!res.ok) {
                    // eslint-disable-next-line no-console
                    console.error('Preview error', res.status, await res.text());
                    return;
                }
                const blob = await res.blob();
                setSrc(URL.createObjectURL(blob));
            } catch (_) {
                // ignore; likely aborted or network issue
            }
        }, 400);

        return () => {
            clearTimeout(timeout);
            controller.abort();
        };
    }, [state.partyName, state.subtitleVariant, state.templateId, state.date, state.location, state.notes, JSON.stringify(state.tracks), state.photoDataUrl]);

    return (
        <div className="aspect-[4/5] w-full overflow-hidden rounded-lg border bg-muted">
            {src ? (
                <img src={src} alt="Memento preview" className="h-full w-full object-contain" />
            ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview will appear here</div>
            )}
        </div>
    );
}


