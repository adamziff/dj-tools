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
            <Card className="max-w-5xl mx-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white border-0 shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none"></div>
                <CardHeader className="relative z-10 bg-gradient-to-r from-slate-800/50 to-slate-900/50 backdrop-blur border-b border-slate-700/50 overflow-visible">
                    <div className="text-center space-y-4">
                        <div className="flex items-center justify-center gap-3">
                            <div className="text-4xl animate-pulse">🎵</div>
                            <CardTitle>
                                <span className="bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent text-3xl md:text-4xl font-extrabold tracking-tight drop-shadow-lg">
                                    Musician March Madness
                                </span>
                            </CardTitle>
                            <div className="text-4xl animate-pulse" style={{ animationDelay: '0.5s' }}>🏆</div>
                        </div>
                        <div className="text-sm md:text-base text-slate-300 font-medium">
                            Choose your favorite artist and fill out your bracket
                        </div>
                        <div className="flex justify-center">
                            <div className="h-1 w-32 bg-gradient-to-r from-fuchsia-400 via-cyan-400 to-emerald-400 rounded-full shadow-lg"></div>
                        </div>
                    </div>
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
                                <label htmlFor="bracket-size" className="text-sm text-gray-600 dark:text-gray-400">Bracket size: Top </label>
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
                                <label htmlFor="bracket-size" className="text-sm text-gray-600 dark:text-gray-400">songs</label>
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
                        </div>

                        {isGenerating && (
                            <div className="flex items-center justify-center py-20">
                                <div className="text-center space-y-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                                        {/* <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-600 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div> */}
                                    </div>
                                    <div className="text-lg font-semibold text-white">
                                        Generating your bracket...
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        Fetching most-streamed {bracketSize} songs and creating matchups
                                    </div>
                                </div>
                            </div>
                        )}

                        {!isGenerating && seeds.length > 0 && (
                            <div className="space-y-6">
                                <Bracket seeds={seeds} onChampion={setChampion} onRoundsChange={setRoundsSnapshot} />
                                {champion && (
                                    <Card className="p-6 bg-gradient-to-br from-emerald-500/20 via-blue-500/20 to-purple-500/20 border-emerald-400/30 shadow-xl">
                                        <div className="text-center">
                                            <div className="flex items-center justify-center gap-3 mb-4">
                                                <div className="text-3xl">🎉</div>
                                                <h3 className="text-xl md:text-2xl font-bold text-emerald-300">Share Your Results!</h3>
                                            </div>
                                            <Button
                                                onClick={() => generateShareImage()}
                                                size="lg"
                                                className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all"
                                            >
                                                <span className="flex items-center gap-2">
                                                    📸 Download PNG
                                                </span>
                                            </Button>
                                            {imageUrl && (
                                                <div className="mt-6 p-4 bg-black/20 rounded-xl">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrl} alt="Shareable bracket result" className="max-w-full h-auto mx-auto rounded-lg shadow-lg" />
                                                    <div className="mt-4 text-sm text-gray-300">
                                                        Right-click to save or share on social media!
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
    const height = 800;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Modern gradient background
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 2);
    gradient.addColorStop(0, '#1e293b'); // slate-800
    gradient.addColorStop(0.7, '#0f172a'); // slate-900
    gradient.addColorStop(1, '#020617'); // slate-950
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Add some visual flair - subtle pattern
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 50; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3 + 1, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title with better spacing
    const titleGradient = ctx.createLinearGradient(60, 40, 800, 100);
    titleGradient.addColorStop(0, '#f472b6'); // pink-400
    titleGradient.addColorStop(0.5, '#22d3ee'); // cyan-400
    titleGradient.addColorStop(1, '#34d399'); // green-400

    ctx.font = 'bold 52px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = titleGradient;
    ctx.fillText('Musician March Madness', 60, 90);

    // Artist label with better contrast
    ctx.font = 'bold 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#e2e8f0'; // slate-200
    ctx.fillText(`Artist: ${opts.artistName}`, 60, 150);

    // Champion section with better layout
    const champY = 200;
    const champH = 180;

    // Champion background with rounded corners effect
    const champGrad = ctx.createLinearGradient(60, champY, width - 60, champY + champH);
    champGrad.addColorStop(0, 'rgba(253, 224, 71, 0.2)'); // yellow-300/20
    champGrad.addColorStop(0.5, 'rgba(34, 197, 94, 0.2)'); // green-500/20
    champGrad.addColorStop(1, 'rgba(59, 130, 246, 0.2)'); // blue-500/20

    ctx.fillStyle = champGrad;
    roundRect(ctx, 60, champY, width - 120, champH, 20);
    ctx.fill();

    // Champion border
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.6)'; // yellow-300/60
    ctx.lineWidth = 3;
    roundRect(ctx, 60, champY, width - 120, champH, 20);
    ctx.stroke();

    // Crown emoji and title
    ctx.font = 'bold 42px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24'; // amber-400
    ctx.fillText('👑 CHAMPION', 80, champY + 50);

    // Champion name with better typography
    ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#ffffff';
    wrapText(ctx, opts.champion.name, 80, champY + 100, width - 160, 42);

    // Seed number
    ctx.font = '24px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Seed #${opts.champion.seed}`, 80, champY + 150);

    // Final Four section with improved spacing
    const ffY = 420;
    const ffSpacing = 30;
    const ffCardW = (width - 120 - ffSpacing) / 2;
    const ffCardH = 140;

    ctx.font = 'bold 32px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Final Four', 60, ffY - 20);

    for (let i = 0; i < Math.min(4, opts.finalFour.length); i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = 60 + col * (ffCardW + ffSpacing);
        const y = ffY + row * (ffCardH + 20);

        // Card with rounded corners
        ctx.fillStyle = 'rgba(51, 65, 85, 0.8)'; // slate-700/80
        roundRect(ctx, x, y, ffCardW, ffCardH, 15);
        ctx.fill();

        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, ffCardW, ffCardH, 15);
        ctx.stroke();

        // Song info
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
        wrapText(ctx, `#${opts.finalFour[i].seed} ${opts.finalFour[i].name}`, x + 20, y + 40, ffCardW - 40, 28);
    }

    // Footer with better styling
    ctx.font = '18px system-ui, -apple-system, Segoe UI, Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const date = new Date().toLocaleDateString();
    const footerText = `Created ${date} • djziff.com`;
    const footerWidth = ctx.measureText(footerText).width;
    ctx.fillText(footerText, (width - footerWidth) / 2, height - 40);

    return canvas;

    // Helper function for rounded rectangles
    function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
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


