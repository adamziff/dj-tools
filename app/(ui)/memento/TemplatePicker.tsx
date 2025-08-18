"use client";

import type { TemplateId, SubtitleVariant } from "./types";

type Props = {
    templateId: TemplateId;
    subtitleVariant: SubtitleVariant;
    onChange: (t: { templateId: TemplateId; subtitleVariant: SubtitleVariant }) => void;
};

const templates: Array<{ id: TemplateId; name: string }> = [
    { id: 'poster-bold', name: 'Poster Bold' },
    { id: 'minimal-card', name: 'Minimal Card' },
    { id: 'neon-grid', name: 'Neon Grid' },
    { id: 'story-vertical', name: 'Story Vertical' },
    { id: 'polaroid-collage', name: 'Polaroid Collage' },
];

export default function TemplatePicker({ templateId, subtitleVariant, onChange }: Props) {
    return (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {templates.map((t) => (
                <button
                    key={t.id}
                    onClick={() => onChange({ templateId: t.id, subtitleVariant })}
                    className={`rounded-md border p-3 text-left text-sm ${templateId === t.id ? 'ring-2 ring-black' : ''}`}
                    aria-pressed={templateId === t.id}
                >
                    <div className="h-24 w-full rounded bg-muted" />
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


