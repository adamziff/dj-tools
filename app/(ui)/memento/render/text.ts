export function formatTrackNumber(indexZeroBased: number): string {
    const n = indexZeroBased + 1;
    return `${n < 10 ? "0" : ""}${n}.`;
}

export function ellipsize(input: string, maxChars: number): string {
    if (input.length <= maxChars) return input;
    return input.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "…";
}

export function escapeXml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}

export type FlowOptions = {
    x: number;
    y: number;
    width: number;
    height: number;
    baseFontSize: number; // px
    minFontSize?: number; // px
    lineHeightEm?: number; // e.g., 1.4
    gap?: number; // px between columns
    maxColumns?: number; // default 3
};

export function flowTracksToTspans(
    tracks: Array<{ artist: string; title: string; mix?: string }>,
    opts: FlowOptions
): { tspans: string; fontSize: number; columns: number; rendered: number; omitted: number } {
    const {
        x, y, width, height,
        baseFontSize,
        minFontSize = 14,
        lineHeightEm = 1.4,
        gap = 28,
        maxColumns = 3,
    } = opts;

    // Helper to compute column/line capacity for a given font size
    const capacityFor = (fontSize: number) => {
        const lineHeightPx = fontSize * lineHeightEm;
        const linesPerCol = Math.max(1, Math.floor(height / lineHeightPx));
        for (let cols = 1; cols <= maxColumns; cols++) {
            const colWidth = (width - gap * (cols - 1)) / cols;
            if (colWidth < 260 && cols < maxColumns) continue; // avoid too narrow columns until needed
            const totalLines = linesPerCol * cols;
            if (totalLines >= tracks.length) return { cols, linesPerCol };
        }
        return { cols: maxColumns, linesPerCol };
    };

    let fontSize = baseFontSize;
    let { cols, linesPerCol } = capacityFor(fontSize);
    while ((linesPerCol * cols) < tracks.length && fontSize > minFontSize) {
        fontSize -= 1;
        ({ cols, linesPerCol } = capacityFor(fontSize));
    }

    const colWidth = (width - gap * (cols - 1)) / cols;
    const xPositions = Array.from({ length: cols }, (_, i) => x + Math.round(i * (colWidth + gap)));
    const firstLineY = y;
    const lineHt = fontSize * lineHeightEm;
    const linesCap = linesPerCol * cols;
    const renderCount = Math.min(tracks.length, linesCap);
    const omitted = Math.max(0, tracks.length - renderCount);

    const colChunks: Array<Array<string>> = Array.from({ length: cols }, () => []);
    const toLine = (t: { artist: string; title: string; mix?: string }, i: number) => {
        const num = String(i + 1).padStart(2, '0');
        const line = [t.artist, t.title, t.mix ? `(${t.mix})` : ''].filter(Boolean).join(' – ');
        return `${num}. ${escapeXml(line)}`;
    };

    for (let i = 0; i < renderCount; i++) {
        const col = Math.floor(i / linesPerCol);
        colChunks[col].push(toLine(tracks[i], i));
    }
    if (omitted > 0) {
        const col = cols - 1;
        // Replace last line with +N more if we are exactly full; otherwise append new entry within cap
        if (colChunks[col].length >= linesPerCol) {
            colChunks[col][linesPerCol - 1] = `+${omitted} more`;
        } else {
            colChunks[col].push(`+${omitted} more`);
        }
    }

    // Build tspans per column
    let tspans = '';
    for (let c = 0; c < cols; c++) {
        const colX = xPositions[c];
        const lines = colChunks[c];
        if (lines.length === 0) continue;
        // First line uses absolute x,y
        tspans += `<tspan x="${colX}" y="${firstLineY}">${lines[0]}</tspan>`;
        for (let r = 1; r < lines.length; r++) {
            tspans += `<tspan x="${colX}" dy="${(lineHt).toFixed(0)}">${lines[r]}</tspan>`;
        }
    }

    return { tspans, fontSize, columns: cols, rendered: renderCount, omitted };
}

