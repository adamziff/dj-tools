import { Track } from "../types";

function stripLeadingBulletsOrNumbers(line: string): string {
    return line.replace(/^\s*(\d+\.|[-•])\s*/u, "").trim();
}

function splitArtistTitle(raw: string): { artist: string; titleWithMix: string } {
    // Try en dash, em dash, or hyphen with spaces
    const parts = raw.split(/\s[–—-]\s/u);
    if (parts.length >= 2) {
        return { artist: parts[0].trim(), titleWithMix: parts.slice(1).join(" - ").trim() };
    }
    return { artist: "", titleWithMix: raw.trim() };
}

function separateMix(titleWithMix: string): { title: string; mix?: string } {
    const match = titleWithMix.match(/^(.*?)(\s*\(([^)]*)\))?\s*$/u);
    if (!match) return { title: titleWithMix.trim() };
    const title = (match[1] ?? "").trim();
    const mix = match[3]?.trim();
    return mix ? { title, mix } : { title };
}

function looksLikeTsvHeader(line: string): boolean {
    const cols = line.split('\t');
    return cols.includes('Track Title') && cols.includes('Artist');
}

function parseTsv(lines: string[], max: number): Track[] {
    // skip header; map column indices
    const header = lines[0].split('\t');
    const idxTitle = header.findIndex((h) => h === 'Track Title');
    const idxArtist = header.findIndex((h) => h === 'Artist');
    const out: Track[] = [];
    for (let i = 1; i < lines.length && out.length < max; i++) {
        const row = lines[i];
        if (!row.trim()) continue;
        const cols = row.split('\t');
        const titleRaw = (cols[idxTitle] ?? '').trim();
        const artistRaw = (cols[idxArtist] ?? '').trim();
        if (!titleRaw && !artistRaw) continue;
        const { title, mix } = separateMix(titleRaw.replace(/\s*\[([^\]]+)\]\s*$/u, (_m, g1) => ` (${g1})`));
        out.push({
            id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
            artist: artistRaw,
            title,
            mix,
            included: true,
        });
    }
    return out;
}

export function parseTracklist(input: string, max: number = 100): Track[] {
    const rawLines = input.split(/\r?\n/u);
    const nonEmpty = rawLines.map((l) => l.trim()).filter((l) => l.length > 0);
    if (nonEmpty.length > 0 && looksLikeTsvHeader(nonEmpty[0])) {
        return parseTsv(nonEmpty, max);
    }

    const tracks: Track[] = [];
    for (const raw of nonEmpty) {
        if (tracks.length >= max) break;
        const cleaned = stripLeadingBulletsOrNumbers(raw);
        const { artist, titleWithMix } = splitArtistTitle(cleaned);
        const { title, mix } = separateMix(titleWithMix);
        tracks.push({
            id: globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2),
            artist,
            title,
            mix,
            included: true,
        });
    }
    return tracks;
}


