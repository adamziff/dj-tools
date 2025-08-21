'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ArtistSearch from '@/components/search/ArtistSearch';
import { Button } from '@/components/ui/button';
import Bracket from '@/components/bracket/Bracket';
import { pickFinalFour, getChampion } from '@/lib/bracket';

type Artist = {
    id: string;
    name: string;
    images: { url: string }[];
};

import type { TrackSeed, Matchup } from '@/lib/bracket';

export default function ArtistBracketPage() {
    const [, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [isSearching] = useState(false);
    const [selected, setSelected] = useState<Artist | null>(null);
    const [seeds, setSeeds] = useState<TrackSeed[]>([]);
    const [champion, setChampion] = useState<TrackSeed | null>(null);
    const [roundsSnapshot, setRoundsSnapshot] = useState<Matchup[][]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [bracketSize, setBracketSize] = useState<number>(8);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // Keep champion in sync with the latest rounds snapshot so it clears/updates
    // when upstream selections invalidate a previous champion.
    useEffect(() => {
        const champ = getChampion(roundsSnapshot);
        setChampion(champ);
    }, [roundsSnapshot]);

    // search handled by ArtistSearch

    const generateBracket = async () => {
        if (!selected) return;
        setError(null);
        setSeeds([]);
        setChampion(null);
        try {
            setIsGenerating(true);
            const res = await fetch(`/api/spotify-artist-tracks?artistId=${selected.id}&size=${bracketSize}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to fetch tracks');
            if (!data.tracks || data.tracks.length < 2) {
                setError('Not enough songs found to build a bracket.');
                return;
            }
            setSeeds(data.tracks as TrackSeed[]);
        } catch (e: unknown) {
            setError((e as Error).message || 'Error generating bracket');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Card className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-xl">
                <CardHeader>
                    <CardTitle>
                        <span className="bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent text-2xl md:text-3xl font-extrabold tracking-tight">
                            Musician March Madness
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <ArtistSearch
                            value={query}
                            onChange={setQuery}
                            onSelect={(a) => {
                                setSelected(a);
                                setQuery(a.name);
                            }}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="bracket-size" className="text-sm text-gray-600 dark:text-gray-400">Bracket size:</label>
                                <select
                                    id="bracket-size"
                                    className="border rounded px-2 py-1 bg-white/90 dark:bg-slate-900/60 text-sm"
                                    value={bracketSize}
                                    onChange={(e) => setBracketSize(Number(e.target.value))}
                                >
                                    {[8, 16, 32, 64].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <Button onClick={generateBracket} disabled={!selected || isSearching || isGenerating} className="relative">
                                {(isGenerating) ? (
                                    <span className="inline-flex items-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        Generating…
                                    </span>
                                ) : (
                                    (isSearching ? 'Loading…' : `Generate ${bracketSize}-Song Bracket`)
                                )}
                            </Button>
                            {selected && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">Selected: <span className="font-medium">{selected.name}</span></div>
                            )}
                        </div>

                        {seeds.length > 0 && (
                            <div className="space-y-4">
                                <Bracket seeds={seeds} onChampion={setChampion} onRoundsChange={setRoundsSnapshot} />
                                {champion && (
                                    <Card className="p-4 bg-white/80 dark:bg-slate-900/60 backdrop-blur">
                                        <div className="text-center text-lg">
                                            <span className="text-gray-600 dark:text-gray-300">Champion:</span> <span className="font-semibold">{champion.name}</span>
                                        </div>
                                        <div className="flex justify-center mt-4">
                                            <Button onClick={() => generateShareImage()}>Download PNG</Button>
                                        </div>
                                        {imageUrl && (
                                            <div className="mt-4">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img src={imageUrl} alt="Shareable bracket result" className="max-w-full h-auto mx-auto" />
                                            </div>
                                        )}
                                    </Card>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
    function generateShareImage() {
        try {
            if (!selected) {
                setError('Please select an artist.');
                return;
            }
            const ff = pickFinalFour(roundsSnapshot);
            const champ = champion || getChampion(roundsSnapshot);
            if (!champ) {
                setError('Please finish the bracket to select a champion.');
                return;
            }
            const canvas = drawShareImage({ artistName: selected.name, finalFour: ff, champion: champ });
            const url = canvas.toDataURL('image/png');
            setImageUrl(url);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selected.name.replace(/\s+/g, '-')}-bracket.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch {
            // ignore
        }
    }
}

// moved to lib/bracket

function drawShareImage(opts: { artistName: string; finalFour: TrackSeed[]; champion: TrackSeed }): HTMLCanvasElement {
    const width = 1200;
    const height = 630;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(0.5, '#1e293b'); // slate-800
    gradient.addColorStop(1, '#0f172a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Accent gradient for title text
    const titleGradient = ctx.createLinearGradient(40, 40, 700, 100);
    titleGradient.addColorStop(0, '#f472b6'); // pink-400
    titleGradient.addColorStop(0.5, '#22d3ee'); // cyan-400
    titleGradient.addColorStop(1, '#34d399'); // green-400

    // Title
    ctx.font = '800 46px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillStyle = titleGradient;
    ctx.fillText('Artist Song Bracket', 40, 70);

    // Artist label
    ctx.font = '700 34px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillStyle = '#93c5fd';
    wrapText(ctx, `Artist: ${opts.artistName}`, 40, 120, width - 80, 38);

    // Champion card
    const cardX = 40;
    const cardY = 160;
    const cardW = width - 80;
    const cardH = 170;
    // Card background with soft gradient
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(59, 130, 246, 0.25)'); // blue-500/25
    cardGrad.addColorStop(1, 'rgba(16, 185, 129, 0.25)'); // emerald-500/25
    ctx.fillStyle = cardGrad;
    ctx.fillRect(cardX, cardY, cardW, cardH);
    // Border
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cardX, cardY, cardW, cardH);

    ctx.fillStyle = '#e5e7eb';
    ctx.font = '800 38px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillText('Champion', cardX + 20, cardY + 52);
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 32px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    wrapText(ctx, opts.champion.name, cardX + 20, cardY + 98, cardW - 40, 36);

    // Final Four section
    const ffX = 40;
    const ffY = 370;
    const ffW = (width - 80 - 30) / 2;
    const ffH = 112;

    ctx.font = '800 28px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillStyle = '#e5e7eb';
    ctx.fillText('Final Four', ffX, ffY - 16);

    for (let i = 0; i < Math.min(4, opts.finalFour.length); i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = ffX + col * (ffW + 30);
        const y = ffY + row * (ffH + 20);

        // Card background
        ctx.fillStyle = 'rgba(15, 23, 42, 0.8)'; // slate-900/80
        ctx.fillRect(x, y, ffW, ffH);
        // Border
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x, y, ffW, ffH);
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 20px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
        wrapText(ctx, `(${opts.finalFour[i].seed}) ${opts.finalFour[i].name}`, x + 16, y + 36, ffW - 32, 26);
    }

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    const date = new Date().toLocaleDateString();
    ctx.fillText(`Created on ${date} · djziff.com`, 40, height - 30);

    return canvas;
}

function wrapText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = words[n] + ' ';
            currentY += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
}


