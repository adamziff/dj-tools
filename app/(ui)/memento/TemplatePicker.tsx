"use client";

import { useEffect, useRef, useState } from "react";
import type { TemplateId, SubtitleVariant, RenderPayload } from "./types";

type Props = {
    templateId: TemplateId;
    subtitleVariant: SubtitleVariant;
    onChange: (t: { templateId: TemplateId; subtitleVariant: SubtitleVariant }) => void;
};

const templates: Array<{ id: TemplateId; name: string }> = [
    { id: 'portrait', name: 'Portrait' },
    { id: 'landscape', name: 'Landscape' },
    { id: 'square', name: 'Square' },
];

export default function TemplatePicker({ templateId, subtitleVariant, onChange }: Props) {
    const [thumbs, setThumbs] = useState<Record<TemplateId, string | null>>({ portrait: null, landscape: null, square: null });
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        abortRef.current?.abort();
        abortRef.current = controller;
        (async () => {
            try {
                const base: Omit<RenderPayload, 'templateId'> = { partyName: 'Preview', subtitleVariant, date: '', location: '', notes: '', tracks: [], photo: {}, preview: true };
                const pairs = await Promise.all(templates.map(async (t) => {
                    const res = await fetch('/api/memento/preview', { method: 'POST', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...base, templateId: t.id }) });
                    if (!res.ok) return [t.id, null] as const;
                    const blob = await res.blob();
                    return [t.id, URL.createObjectURL(blob)] as const;
                }));
                const next: Record<TemplateId, string | null> = { portrait: null, landscape: null, square: null };
                for (const [id, url] of pairs) next[id] = url;
                setThumbs(next);
            } catch { /* ignore */ }
        })();
        return () => controller.abort();
    }, [subtitleVariant]);

    return (
        <div className="grid grid-cols-3 gap-3">
            {templates.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onChange({ templateId: t.id, subtitleVariant })}
                    className={`rounded-md border p-3 text-left text-sm ${templateId === t.id ? 'ring-2 ring-black' : ''}`}
                    aria-pressed={templateId === t.id}
                >
                    {thumbs[t.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumbs[t.id] as string} alt={`${t.name} preview`} className="h-24 w-full rounded object-cover" />
                    ) : (
                        <div className="h-24 w-full rounded bg-muted" />
                    )}
                    <div className="mt-2 font-medium">{t.name}</div>
                </button>
            ))}
            <div className="col-span-full mt-2 flex items-center gap-2 text-sm">
                <label className="inline-flex items-center gap-2">
                    <input
                        type="radio"
                        name="subtitle"
                        checked={subtitleVariant === 'from'}
                        onChange={() => onChange({ templateId, subtitleVariant: 'from' })}
                    />
                    <span>From DJ Ziff</span>
                </label>
                <label className="inline-flex items-center gap-2">
                    <input
                        type="radio"
                        name="subtitle"
                        checked={subtitleVariant === 'afterparty'}
                        onChange={() => onChange({ templateId, subtitleVariant: 'afterparty' })}
                    />
                    <span>DJ Ziff Afterparty Setlist</span>
                </label>
            </div>
        </div>
    );
}
