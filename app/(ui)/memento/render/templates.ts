import { TemplateId, SubtitleVariant, Track } from "../types";
import { escapeXml, flowTracksToTspans, fitTextSizeToWidth } from "./text";

export interface TemplateConfig {
    width: number;
    height: number;
    // optional background generator without the photo (e.g., neon grid)
    backgroundSvg?: (opts: BaseTemplateInput) => string;
    // overlay text/shape SVG layer
    overlaySvg: (opts: TemplateInput) => string;
    // photo placement instructions
    photoPlacement: PhotoPlacement;
    // background effects applied to the photo layer
    backgroundEffects?: { blur?: number; dim?: number };
}

export type PhotoPlacement =
    | { mode: 'cover' }
    | { mode: 'rect'; x: number; y: number; width: number; height: number; fit?: 'cover' | 'contain'; rotate?: number; cornerRadius?: number };

export interface BaseTemplateInput {
    partyName: string;
    subtitleVariant: SubtitleVariant;
    date?: string;
    location?: string;
    notes?: string;
    dominantColorHex?: string;
    logoDataUrl?: string;
    photoDataUrl?: string;
}

export interface TemplateInput extends BaseTemplateInput {
    tracks: Array<Pick<Track, "artist" | "title" | "mix">>;
}

export const TEMPLATE_MAP: Record<TemplateId, TemplateConfig> = {
    portrait: {
        width: 1080,
        height: 1350,
        // show the whole photo, never crop
        photoPlacement: { mode: 'rect', x: 80, y: 180, width: 920, height: 720, fit: 'cover', cornerRadius: 16 },
        overlaySvg: (opts) => {
            const { partyName, subtitleVariant, date, location, tracks, logoDataUrl, photoDataUrl } = opts as TemplateInput & { logoDataUrl?: string; photoDataUrl?: string };
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const titleSize = fitTextSizeToWidth(partyName, 1080 - 160, 72, 28);
            const flow = flowTracksToTspans(tracks, {
                x: 80,
                y: 940,  // Moved down for more spacing
                width: 920,
                height: 330,
                baseFontSize: 16,
                minFontSize: 8,
                lineHeightEm: 1.3,
                gap: 18,
                maxColumns: 2,
            });
            const accent = `#5FC9E1`;
            const zigzag = `<polyline points="80,170 140,160 200,170 260,160 320,170" stroke="${accent}" stroke-width="2" fill="none"/>`;
            return `<?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1350">
                <defs>
                    <clipPath id="photoClip">
                        <rect x="80" y="180" width="920" height="720" rx="16" ry="16"/>
                    </clipPath>
                </defs>
                ${photoDataUrl ? `<image xlink:href="${photoDataUrl}" x="80" y="180" width="920" height="720" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClip)"/>` : ''}
                <rect x="64" y="160" width="952" height="760" rx="20" ry="20" fill="#333" fill-opacity="0.3" stroke="#5FC9E1" stroke-width="1"/>
                ${zigzag}
                <text x="80" y="120" font-family="system-ui, sans-serif" font-size="${titleSize}" font-weight="800" fill="#fff">${escapeXml(partyName)}</text>
                ${logoDataUrl ? `<image xlink:href="${logoDataUrl}" x="900" y="40" width="120" height="80" preserveAspectRatio="xMidYMid meet"/>` : ''}
                <text x="80" y="160" font-family="system-ui, sans-serif" font-size="22" fill="#d1f5ff" letter-spacing="1">${escapeXml(subtitle)}</text>
                <text font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${flow.fontSize}" fill="#fff">${flow.tspans}</text>
                <text x="80" y="1290" font-family="system-ui, sans-serif" font-size="18" fill="#e5faff">${escapeXml([date, location].filter(Boolean).join(' • '))}</text>
            </svg>`;
        },
    },
    landscape: {
        width: 1600,
        height: 900,
        photoPlacement: { mode: 'rect', x: 80, y: 180, width: 900, height: 600, fit: 'cover', cornerRadius: 16 },
        overlaySvg: (opts) => {
            const { partyName, subtitleVariant, date, location, tracks, logoDataUrl, photoDataUrl } = opts as TemplateInput & { logoDataUrl?: string; photoDataUrl?: string };
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const titleSize = fitTextSizeToWidth(partyName, 1500 - 160, 64, 26);
            const flow = flowTracksToTspans(tracks, {
                x: 1040,
                y: 220,
                width: 480,
                height: 560,
                baseFontSize: 20,
                minFontSize: 10,
                lineHeightEm: 1.4,
                gap: 18,
                maxColumns: 1,
            });
            const accent = `#5FC9E1`;
            const zigzag = `<polyline points="80,170 140,160 200,170 260,160 320,170 380,160 440,170" stroke="${accent}" stroke-width="2" fill="none"/>`;
            const trident = !logoDataUrl ? `
                <g transform="translate(1520,120)" stroke="${accent}" stroke-width="3" fill="none">
                    <line x1="0" y1="0" x2="0" y2="36"/>
                    <line x1="-10" y1="0" x2="-10" y2="30"/>
                    <line x1="10" y1="0" x2="10" y2="30"/>
                    <polyline points="-10,0 0,-14 10,0" />
                </g>` : '';
            return `<?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1600" height="900">
                <defs>
                    <clipPath id="photoClipLandscape">
                        <rect x="80" y="180" width="900" height="600" rx="16" ry="16"/>
                    </clipPath>
                </defs>
                ${photoDataUrl ? `<image xlink:href="${photoDataUrl}" x="80" y="180" width="900" height="600" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClipLandscape)"/>` : ''}
                ${zigzag}
                <text x="80" y="120" font-family="system-ui, sans-serif" font-size="${titleSize}" font-weight="800" fill="#fff">${escapeXml(partyName)}</text>
                ${logoDataUrl ? `<image xlink:href="${logoDataUrl}" x="1400" y="40" width="160" height="100" preserveAspectRatio="xMidYMid meet"/>` : ''}
                ${trident}
                <text x="80" y="160" font-family="system-ui, sans-serif" font-size="22" fill="#d1f5ff">${escapeXml(subtitle)}</text>
                <text font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${flow.fontSize}" fill="#eaffff">${flow.tspans}</text>
                <text x="80" y="860" font-family="system-ui, sans-serif" font-size="18" fill="#e5faff">${escapeXml([date, location].filter(Boolean).join(' • '))}</text>
            </svg>`;
        },
    },
    square: {
        width: 1080,
        height: 1080,
        photoPlacement: { mode: 'rect', x: 80, y: 180, width: 920, height: 520, fit: 'cover', cornerRadius: 16 },
        overlaySvg: (opts) => {
            const { partyName, subtitleVariant, date, location, tracks, logoDataUrl, photoDataUrl } = opts as TemplateInput & { logoDataUrl?: string; photoDataUrl?: string };
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const titleSize = fitTextSizeToWidth(partyName, 1080 - 160, 64, 26);
            const flow = flowTracksToTspans(tracks, {
                x: 80,
                y: 760,
                width: 920,
                height: 260,
                baseFontSize: 18,
                minFontSize: 10,
                lineHeightEm: 1.35,
                gap: 22,
                maxColumns: 2,
            });
            const accent = `#5FC9E1`;
            const trident = !logoDataUrl ? `
                <g transform="translate(980,110)" stroke="${accent}" stroke-width="3" fill="none">
                    <line x1="0" y1="0" x2="0" y2="36"/>
                    <line x1="-10" y1="0" x2="-10" y2="30"/>
                    <line x1="10" y1="0" x2="10" y2="30"/>
                    <polyline points="-10,0 0,-14 10,0" />
                </g>` : '';
            return `<?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1080" height="1080">
                <defs>
                    <clipPath id="photoClipSquare">
                        <rect x="80" y="180" width="920" height="520" rx="16" ry="16"/>
                    </clipPath>
                </defs>
                ${photoDataUrl ? `<image xlink:href="${photoDataUrl}" x="80" y="180" width="920" height="520" preserveAspectRatio="xMidYMid slice" clip-path="url(#photoClipSquare)"/>` : ''}
                <rect x="64" y="160" width="952" height="560" rx="20" ry="20" fill="#333" fill-opacity="0.3" stroke="#5FC9E1" stroke-width="1"/>
                <text x="80" y="120" font-family="system-ui, sans-serif" font-size="${titleSize}" font-weight="800" fill="#fff">${escapeXml(partyName)}</text>
                ${logoDataUrl ? `<image xlink:href="${logoDataUrl}" x="900" y="40" width="120" height="80" preserveAspectRatio="xMidYMid meet"/>` : ''}
                ${trident}
                <text x="80" y="160" font-family="system-ui, sans-serif" font-size="22" fill="#d1f5ff">${escapeXml(subtitle)}</text>
                <text font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${flow.fontSize}" fill="#fff">${flow.tspans}</text>
                <text x="80" y="1040" font-family="system-ui, sans-serif" font-size="18" fill="#e5faff">${escapeXml([date, location].filter(Boolean).join(' • '))}</text>
            </svg>`;
        },
    },
};
