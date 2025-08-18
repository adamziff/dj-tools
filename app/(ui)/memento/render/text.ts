export function formatTrackNumber(indexZeroBased: number): string {
    const n = indexZeroBased + 1;
    return `${n < 10 ? "0" : ""}${n}.`;
}

export function ellipsize(input: string, maxChars: number): string {
    if (input.length <= maxChars) return input;
    return input.slice(0, Math.max(0, maxChars - 1)).trimEnd() + "…";
}


