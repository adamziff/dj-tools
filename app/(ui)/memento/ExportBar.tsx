"use client";

import { slugify } from "./utils/slugify";
import type { MementoState, RenderPayload } from "./types";

type Props = {
    state: MementoState;
};

export default function ExportBar({ state }: Props) {
    const disabled = !state.partyName.trim() || state.tracks.filter((t) => t.included).length < 1;

    async function handleDownload() {
        const body: RenderPayload = {
            partyName: state.partyName,
            subtitleVariant: state.subtitleVariant,
            templateId: state.templateId,
            date: state.date,
            location: state.location,
            notes: state.notes,
            tracks: state.tracks.filter((t) => t.included).map(({ artist, title, mix }) => ({ artist, title, mix })),
            photo: state.photo,
            preview: false,
            showLogo: state.showLogo,
        };
        const res = await fetch('/api/memento/render', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
        if (!res.ok) {
            console.error('Download error', res.status, await res.text());
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const date = state.date ? `${state.date}_` : '';
        a.download = `${slugify(state.partyName)}_${date}DJ-Ziff.png`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return (
        <div className="flex items-center gap-3">
            <button disabled={disabled} onClick={handleDownload} className="rounded-md border px-3 py-2 text-sm disabled:opacity-50">
                Download PNG
            </button>
        </div>
    );
}

