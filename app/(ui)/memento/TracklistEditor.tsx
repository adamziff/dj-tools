"use client";

import { useMemo, useState } from "react";
import { parseTracklist } from "./utils/parseTracklist";
import type { Track } from "./types";

type Props = {
    initialText?: string;
    tracks: Track[];
    onChange: (tracks: Track[]) => void;
};

export default function TracklistEditor({ initialText = "", tracks, onChange }: Props) {
    const [raw, setRaw] = useState(initialText);
    const [inputMode, setInputMode] = useState<'file' | 'text'>('file');
    const [fileName, setFileName] = useState<string | null>(null);
    const [lastParsedCount, setLastParsedCount] = useState<number | null>(null);

    const includedCount = useMemo(() => tracks.filter((t) => t.included).length, [tracks]);


    return (
        <div className="grid gap-4">
            <div className="flex items-center gap-3 text-sm">
                <label className="inline-flex items-center gap-2">
                    <input type="radio" name="tlmode" checked={inputMode === 'file'} onChange={() => setInputMode('file')} />
                    File
                </label>
                <label className="inline-flex items-center gap-2">
                    <input type="radio" name="tlmode" checked={inputMode === 'text'} onChange={() => setInputMode('text')} />
                    Text
                </label>
                {fileName && <span className="text-muted-foreground">{fileName}</span>}
            </div>
            {inputMode === 'file' ? (
                <input
                    type="file"
                    accept="text/plain,.txt"
                    className="rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                    onChange={async (e) => {
                        const f = e.currentTarget.files?.[0];
                        if (!f) return;
                        setFileName(f.name);
                        const text = await f.text();
                        setRaw(text);
                        const parsed = parseTracklist(text);
                        onChange(parsed);
                        setLastParsedCount(parsed.length);
                    }}
                />
            ) : (
                <textarea
                    className="min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    placeholder="Paste tracklist here (TSV or Artist – Title (Mix))"
                    value={raw}
                    onChange={(e) => setRaw(e.target.value)}
                />
            )}
            <div>
                <button onClick={() => { const parsed = parseTracklist(raw); onChange(parsed); setLastParsedCount(parsed.length); }} className="mt-1 rounded-md border px-3 py-1 text-sm">Parse tracklist</button>
            </div>
            {lastParsedCount !== null && (
                <div className="text-xs text-muted-foreground">Parsed {lastParsedCount} tracks</div>
            )}
            <div className="text-xs text-muted-foreground">
                {includedCount} / {tracks.length} included
            </div>
            <ul className="max-h-64 overflow-auto rounded-md border">
                {tracks.map((t, idx) => (
                    <li key={t.id} className="flex items-center gap-3 border-b px-3 py-2 last:border-none">
                        <input
                            type="checkbox"
                            checked={t.included}
                            onChange={(e) => onChange(tracks.map((x) => x.id === t.id ? { ...x, included: e.target.checked } : x))}
                        />
                        <span className="text-xs text-muted-foreground w-8 tabular-nums">{String(idx + 1).padStart(2, '0')}.</span>
                        <input
                            className="h-8 w-40 rounded border border-input bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground"
                            value={t.artist}
                            onChange={(e) => onChange(tracks.map((x) => x.id === t.id ? { ...x, artist: e.target.value } : x))}
                        />
                        <span className="text-muted-foreground">–</span>
                        <input
                            className="h-8 w-56 rounded border border-input bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground"
                            value={t.title}
                            onChange={(e) => onChange(tracks.map((x) => x.id === t.id ? { ...x, title: e.target.value } : x))}
                        />
                        <input
                            className="h-8 w-40 rounded border border-input bg-transparent px-2 text-sm text-foreground placeholder:text-muted-foreground"
                            placeholder="Mix (optional)"
                            value={t.mix ?? ''}
                            onChange={(e) => onChange(tracks.map((x) => x.id === t.id ? { ...x, mix: e.target.value } : x))}
                        />
                    </li>
                ))}
            </ul>
            <div className="flex gap-2 text-sm">
                <button
                    onClick={() => onChange(tracks.map((t) => ({ ...t, included: true })))}
                    className="rounded-md border px-3 py-1"
                >
                    Select all
                </button>
                <button
                    onClick={() => onChange(tracks.map((t) => ({ ...t, included: false })))}
                    className="rounded-md border px-3 py-1"
                >
                    Select none
                </button>
                <button
                    onClick={() => onChange(tracks.filter((t) => t.included))}
                    className="rounded-md border px-3 py-1"
                >
                    Remove excluded
                </button>
            </div>
        </div>
    );
}

