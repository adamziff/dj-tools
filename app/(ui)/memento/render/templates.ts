import { TemplateId, SubtitleVariant, Track } from "../types";
import { ellipsize } from "./text";

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
}

export interface TemplateInput extends BaseTemplateInput {
    tracks: Array<Pick<Track, "artist" | "title" | "mix">>;
}

export const TEMPLATE_MAP: Record<TemplateId, TemplateConfig> = {
    "poster-bold": {
        width: 1080,
        height: 1350,
        photoPlacement: { mode: 'cover' },
        overlaySvg: (opts) => {
            const { partyName, subtitleVariant, date, location, tracks, dominantColorHex } = opts as TemplateInput & { dominantColorHex?: string };
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const list = tracks
                .slice(0, 30)
                .map((t, i) => {
                    const num = String(i + 1).padStart(2, '0');
                    const line = [t.artist, t.title, t.mix ? `(${t.mix})` : ''].filter(Boolean).join(' – ');
                    return `<tspan x="64" dy="1.4em">${num}. ${escapeXml(line)}</tspan>`;
                })
                .join("");
            const gradient = (hex?: string) => hex ? `
                <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="${hex}" stop-opacity="0.15"/>
                    <stop offset="100%" stop-color="#000" stop-opacity="0.65"/>
                </linearGradient>
            ` : `
                <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stop-color="#000" stop-opacity="0.1"/>
                    <stop offset="100%" stop-color="#000" stop-opacity="0.6"/>
                </linearGradient>
            `;
            return `<?xml version="1.0" encoding="UTF-8"?>
			<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
				<defs>
					${gradient(dominantColorHex)}
				</defs>
				<rect width="100%" height="100%" fill="url(#g)"/>
				<text x="64" y="120" font-family="system-ui, sans-serif" font-size="64" font-weight="800" fill="#fff">${escapeXml(ellipsize(partyName, 36))}</text>
				<text x="64" y="172" font-family="system-ui, sans-serif" font-size="24" letter-spacing="1.5" fill="#fff" opacity="0.9">${escapeXml(subtitle)}</text>
				<text x="64" y="240" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" fill="#fff" opacity="0.95">${list}</text>
				<text x="64" y="1290" font-family="system-ui, sans-serif" font-size="20" fill="#fff" opacity="0.9">${escapeXml([date, location].filter(Boolean).join(' • '))}</text>
			</svg>`;
        },
    },
    "minimal-card": {
        width: 1080,
        height: 1080,
        photoPlacement: { mode: 'cover' },
        backgroundEffects: { blur: 18, dim: 0.45 },
        overlaySvg: ({ partyName, subtitleVariant, tracks }) => {
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const list = tracks.slice(0, 20).map((t, i) => {
                const num = String(i + 1).padStart(2, '0');
                const line = [t.artist, t.title, t.mix ? `(${t.mix})` : ''].filter(Boolean).join(' – ');
                return `<tspan x="120" dy="1.5em">${num}. ${escapeXml(line)}</tspan>`;
            }).join("");
            return `<?xml version="1.0" encoding="UTF-8"?>
			<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080">
				<defs>
					<filter id="blur"><feGaussianBlur in="SourceGraphic" stdDeviation="16"/></filter>
				</defs>
				<rect width="100%" height="100%" fill="rgba(0,0,0,0.45)"/>
				<rect x="80" y="120" width="920" height="840" rx="24" fill="#fff" fill-opacity="0.92"/>
				<text x="120" y="200" font-family="system-ui, sans-serif" font-size="56" font-weight="700" fill="#111">${escapeXml(ellipsize(partyName, 28))}</text>
				<text x="120" y="246" font-family="system-ui, sans-serif" font-size="22" fill="#444">${escapeXml(subtitle)}</text>
				<text x="120" y="300" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" fill="#111">${list}</text>
			</svg>`;
        },
    },
    "neon-grid": {
        width: 1600,
        height: 900,
        photoPlacement: { mode: 'rect', x: 950, y: 140, width: 600, height: 620, fit: 'cover', rotate: -2, cornerRadius: 16 },
        backgroundSvg: () => `<?xml version="1.0" encoding="UTF-8"?>
		<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
			<defs>
				<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stop-color="#0b1020"/>
					<stop offset="100%" stop-color="#12001f"/>
				</linearGradient>
			</defs>
			<rect width="100%" height="100%" fill="url(#bg)"/>
			<g stroke="#0ff" stroke-opacity="0.35" stroke-width="1">
				${Array.from({ length: 20 }, (_, i) => `<line x1="${i * 80}" y1="0" x2="${i * 80}" y2="900"/>`).join('')}
				${Array.from({ length: 12 }, (_, i) => `<line x1="0" y1="${i * 75}" x2="1600" y2="${i * 75}"/>`).join('')}
			</g>
		</svg>`,
        overlaySvg: ({ partyName, subtitleVariant, tracks }) => {
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const list = tracks.slice(0, 35).map((t, i) => {
                const num = String(i + 1).padStart(2, '0');
                const line = [t.artist, t.title, t.mix ? `(${t.mix})` : ''].filter(Boolean).join(' – ');
                return `<tspan x="80" dy="1.4em">${num}. ${escapeXml(line)}</tspan>`;
            }).join("");
            return `<?xml version="1.0" encoding="UTF-8"?>
			<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900">
				<text x="80" y="120" font-family="system-ui, sans-serif" font-size="64" font-weight="800" fill="#e0e8ff">${escapeXml(ellipsize(partyName, 40))}</text>
				<text x="80" y="172" font-family="system-ui, sans-serif" font-size="22" fill="#c7d2fe">${escapeXml(subtitle)}</text>
				<text x="80" y="240" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="20" fill="#a5b4fc">${list}</text>
			</svg>`;
        },
    },
    "story-vertical": {
        width: 1080,
        height: 1920,
        photoPlacement: { mode: 'cover' },
        overlaySvg: ({ partyName, subtitleVariant, date, location, tracks }) => {
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const list = tracks.slice(0, 25).map((t, i) => {
                const num = String(i + 1).padStart(2, '0');
                const line = [t.artist, t.title, t.mix ? `(${t.mix})` : ''].filter(Boolean).join(' – ');
                return `<tspan x="64" dy="1.4em">${num}. ${escapeXml(line)}</tspan>`;
            }).join("");
            return `<?xml version="1.0" encoding="UTF-8"?>
			<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920">
				<rect x="0" y="0" width="1080" height="420" fill="rgba(0,0,0,0.55)"/>
				<rect x="0" y="1320" width="1080" height="600" rx="24" fill="rgba(17,17,17,0.6)"/>
				<text x="64" y="120" font-family="system-ui, sans-serif" font-size="60" font-weight="800" fill="#fff">${escapeXml(ellipsize(partyName, 32))}</text>
				<text x="64" y="172" font-family="system-ui, sans-serif" font-size="24" fill="#fff" opacity="0.9">${escapeXml(subtitle)}</text>
				<text x="64" y="1390" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="22" fill="#fff">${list}</text>
				<text x="64" y="1860" font-family="system-ui, sans-serif" font-size="20" fill="#fff" opacity="0.9">${escapeXml([date, location].filter(Boolean).join(' • '))}</text>
			</svg>`;
        },
    },
    "polaroid-collage": {
        width: 1240,
        height: 1548,
        photoPlacement: { mode: 'rect', x: 90, y: 120, width: 560, height: 720, fit: 'cover', rotate: -3, cornerRadius: 8 },
        overlaySvg: ({ partyName, subtitleVariant, tracks }) => {
            const subtitle = subtitleVariant === 'from' ? 'From DJ Ziff' : 'DJ Ziff Afterparty Setlist';
            const list = tracks.slice(0, 28).map((t, i) => {
                const num = String(i + 1).padStart(2, '0');
                const line = [t.artist, t.title, t.mix ? `(${t.mix})` : ''].filter(Boolean).join(' – ');
                return `<tspan x="760" dy="1.4em">${num}. ${escapeXml(line)}</tspan>`;
            }).join("");
            return `<?xml version="1.0" encoding="UTF-8"?>
			<svg xmlns="http://www.w3.org/2000/svg" width="1240" height="1548">
				<rect x="40" y="40" width="1160" height="1468" fill="#f8fafc" stroke="#e2e8f0"/>
				<rect x="80" y="120" width="560" height="720" fill="#e5e7eb"/>
				<text x="100" y="880" font-family="system-ui, sans-serif" font-size="24" fill="#111">${escapeXml(subtitle)}</text>
				<text x="100" y="930" font-family="system-ui, sans-serif" font-size="56" font-weight="800" fill="#111">${escapeXml(ellipsize(partyName, 30))}</text>
				<text x="760" y="180" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="18" fill="#111">${list}</text>
			</svg>`;
        },
    },
};

function escapeXml(input: string): string {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");
}


