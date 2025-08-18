export function svgLinearGradient(id: string, stops: Array<{ offset: number; color: string; opacity?: number }>) {
    const stopTags = stops
        .sort((a, b) => a.offset - b.offset)
        .map((s) => `<stop offset="${Math.round(s.offset * 100)}%" stop-color="${s.color}"${s.opacity !== undefined ? ` stop-opacity="${s.opacity}"` : ''}/>`)
        .join("");
    return `<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">${stopTags}</linearGradient>`;
}


