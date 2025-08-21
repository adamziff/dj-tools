'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// Removed login component for bracket flow

type Artist = {
    id: string;
    name: string;
    images: { url: string; width: number; height: number }[];
    popularity: number;
    followers: number;
};

type TrackSeed = {
    id: string;
    name: string;
    image: string | null;
    popularity: number;
    preview_url: string | null;
    uri: string;
    seed: number;
};

type Matchup = {
    id: string;
    a: TrackSeed | null;
    b: TrackSeed | null;
    winnerId?: string;
};

function buildInitialRound(seeds: TrackSeed[]): Matchup[] {
    const n = seeds.length;
    const matchups: Matchup[] = [];
    for (let i = 0; i < Math.floor(n / 2); i++) {
        const top = seeds[i];
        const bottom = seeds[n - 1 - i];
        matchups.push({ id: `r${n}-${i}`, a: top, b: bottom });
    }
    return matchups;
}

function advanceRound(prevRound: Matchup[]): Matchup[] {
    const winners: (TrackSeed | null)[] = [];
    for (const m of prevRound) {
        const winner = m.winnerId === m.a?.id ? m.a : m.winnerId === m.b?.id ? m.b : null;
        winners.push(winner);
    }
    const next: Matchup[] = [];
    for (let i = 0; i < winners.length; i += 2) {
        next.push({ id: `${prevRound[0]?.id}-n${i / 2}`, a: winners[i] || null, b: winners[i + 1] || null });
    }
    return next;
}

function Bracket({ seeds, onChampion, onRoundsChange }: { seeds: TrackSeed[]; onChampion: (t: TrackSeed) => void; onRoundsChange?: (rounds: Matchup[][]) => void }) {
    const [rounds, setRounds] = useState<Matchup[][]>(() => [buildInitialRound(seeds)]);

    const totalRounds = Math.max(1, Math.log2(Math.max(1, seeds.length)));

    function getRoundNames(size: number): string[] {
        const names: string[] = [];
        const labels: Record<number, string> = {
            64: 'Round of 64',
            32: 'Round of 32',
            16: 'Sweet 16',
            8: 'Elite 8',
            4: 'Final 4',
            2: 'Championship',
        };
        let n = size;
        while (n >= 2) {
            names.push(labels[n] || `Round of ${n}`);
            n = n / 2;
        }
        return names;
    }

    const roundNames = getRoundNames(seeds.length);

    useEffect(() => {
        const initial = [buildInitialRound(seeds)];
        setRounds(initial);
    }, [seeds]);

    // Notify parent when rounds change (avoid calling during render/update functions)
    useEffect(() => {
        onRoundsChange?.(rounds);
    }, [rounds, onRoundsChange]);

    // Notify parent when a champion is decided
    useEffect(() => {
        const lastRound = rounds[rounds.length - 1];
        if (!lastRound || lastRound.length === 0) return;
        const finalMatch = lastRound[0];
        if (!finalMatch?.winnerId) return;
        const champ = finalMatch.winnerId === finalMatch.a?.id ? finalMatch.a : finalMatch.b;
        if (champ) onChampion(champ);
    }, [rounds, onChampion]);

    const selectWinner = (roundIndex: number, matchupIndex: number, winnerId: string) => {
        setRounds((prev) => {
            const copy = prev.map((r) => r.map((m) => ({ ...m })));
            copy[roundIndex][matchupIndex].winnerId = winnerId;

            // If round complete, create next round or update next round pairing
            const currentRound = copy[roundIndex];
            const isComplete = currentRound.every((m) => !!m.winnerId);
            const isLastRound = roundIndex === totalRounds - 1;
            if (!isLastRound) {
                if (!copy[roundIndex + 1]) {
                    copy[roundIndex + 1] = advanceRound(currentRound);
                } else {
                    // Update winners into already created next round
                    const next = copy[roundIndex + 1];
                    const pairIndex = Math.floor(matchupIndex / 2);
                    const isFirst = matchupIndex % 2 === 0;
                    const winner = currentRound[matchupIndex].winnerId === currentRound[matchupIndex].a?.id
                        ? currentRound[matchupIndex].a
                        : currentRound[matchupIndex].b;
                    if (isFirst) next[pairIndex].a = winner || null; else next[pairIndex].b = winner || null;
                }
            }

            return copy;
        });
    };

    return (
        <div className="overflow-x-auto">
            <div className="grid gap-4 min-w-[1200px]" style={{ gridTemplateColumns: `repeat(${roundNames.length + 1}, minmax(0, 1fr))` }}>
                {roundNames.map((title, colIdx) => (
                    <div key={title} className="space-y-2">
                        <div className="text-center font-semibold text-sm mb-2">{title}</div>
                        {(rounds[colIdx] || []).map((m, i) => (
                            <Card key={m.id} className="p-2">
                                <div className="flex flex-col gap-2">
                                    <button
                                        className={`text-left p-2 rounded border ${m.winnerId === m.a?.id ? 'bg-green-100 dark:bg-green-900/30 border-green-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                        onClick={() => m.a && selectWinner(colIdx, i, m.a.id)}
                                        disabled={!m.a}
                                    >
                                        <div className="flex items-center gap-2">
                                            {m.a?.image && <img src={m.a.image} alt="" className="h-6 w-6 rounded-sm object-cover" />}
                                            <div className="text-xs">{m.a ? `(${m.a.seed}) ${m.a.name}` : 'TBD'}</div>
                                        </div>
                                    </button>
                                    <button
                                        className={`text-left p-2 rounded border ${m.winnerId === m.b?.id ? 'bg-green-100 dark:bg-green-900/30 border-green-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                        onClick={() => m.b && selectWinner(colIdx, i, m.b.id)}
                                        disabled={!m.b}
                                    >
                                        <div className="flex items-center gap-2">
                                            {m.b?.image && <img src={m.b.image} alt="" className="h-6 w-6 rounded-sm object-cover" />}
                                            <div className="text-xs">{m.b ? `(${m.b.seed}) ${m.b.name}` : 'TBD'}</div>
                                        </div>
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ))}
                <div className="space-y-2">
                    <div className="text-center font-semibold text-sm mb-2">Winner</div>
                    <Card className="p-4 text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-300">Pick winners to decide the champion</div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function ArtistBracketPage() {
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Artist[]>([]);
    const [selected, setSelected] = useState<Artist | null>(null);
    const [seeds, setSeeds] = useState<TrackSeed[]>([]);
    const [champion, setChampion] = useState<TrackSeed | null>(null);
    const [roundsSnapshot, setRoundsSnapshot] = useState<Matchup[][]>([]);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [bracketSize, setBracketSize] = useState<number>(64);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }
        const t = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/spotify-search-artist?q=${encodeURIComponent(query)}`);
                const data = await res.json();
                if (res.ok) setResults(data.artists || []);
                else setResults([]);
            } catch (_) {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 300);
        return () => clearTimeout(t);
    }, [query]);

    const generateBracket = async () => {
        if (!selected) return;
        setError(null);
        setSeeds([]);
        setChampion(null);
        try {
            const res = await fetch(`/api/spotify-artist-tracks?artistId=${selected.id}&size=${bracketSize}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || 'Failed to fetch tracks');
            if (!data.tracks || data.tracks.length < 2) {
                setError('Not enough songs found to build a bracket.');
                return;
            }
            setSeeds(data.tracks as TrackSeed[]);
        } catch (e: any) {
            setError(e.message || 'Error generating bracket');
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Card className="max-w-4xl mx-auto">
                <CardHeader>
                    <CardTitle>Artist Song Bracket</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-4">
                        <div className="relative">
                            <Input
                                placeholder="Search for an artist"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            {results.length > 0 && (
                                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-md shadow-md max-h-64 overflow-y-auto">
                                    {results.map((a) => (
                                        <button
                                            key={a.id}
                                            className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                                            onClick={() => {
                                                setSelected(a);
                                                setQuery(a.name);
                                                setResults([]);
                                            }}
                                        >
                                            {a.images?.[a.images.length - 1]?.url && (
                                                <img src={a.images[a.images.length - 1].url} alt={a.name} className="h-6 w-6 rounded-sm object-cover" />
                                            )}
                                            <span className="text-sm">{a.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <label htmlFor="bracket-size" className="text-sm text-gray-600 dark:text-gray-400">Bracket size:</label>
                                <select
                                    id="bracket-size"
                                    className="border rounded px-2 py-1 bg-white dark:bg-slate-900 text-sm"
                                    value={bracketSize}
                                    onChange={(e) => setBracketSize(Number(e.target.value))}
                                >
                                    {[8, 16, 32, 64].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <Button onClick={generateBracket} disabled={!selected || isSearching}>
                                {isSearching ? 'Loading…' : `Generate ${bracketSize}-Song Bracket`}
                            </Button>
                            {selected && (
                                <div className="text-sm text-gray-600 dark:text-gray-400">Selected: <span className="font-medium">{selected.name}</span></div>
                            )}
                        </div>

                        {seeds.length > 0 && (
                            <div className="space-y-4">
                                <Bracket seeds={seeds} onChampion={setChampion} onRoundsChange={setRoundsSnapshot} />
                                {champion && (
                                    <Card className="p-4">
                                        <div className="text-center">Champion: <span className="font-semibold">{champion.name}</span></div>
                                        <div className="flex justify-center mt-4">
                                            <Button onClick={() => generateShareImage()}>Download PNG</Button>
                                        </div>
                                        {imageUrl && (
                                            <div className="mt-4">
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
        } catch (e) {
            // ignore
        }
    }
}

function pickFinalFour(rounds: Matchup[][]): TrackSeed[] {
    if (!rounds || rounds.length < 2) return [];
    const semifinalRound = rounds[rounds.length - 2] || [];
    const participants: TrackSeed[] = [];
    for (const m of semifinalRound) {
        if (m.a) participants.push(m.a);
        if (m.b) participants.push(m.b);
    }
    return participants.slice(0, 4);
}

function getChampion(rounds: Matchup[][]): TrackSeed | null {
    const last = rounds[rounds.length - 1]?.[0];
    if (!last) return null;
    return last.winnerId === last.a?.id ? last.a || null : last.b || null;
}

function drawShareImage(opts: { artistName: string; finalFour: TrackSeed[]; champion: TrackSeed }): HTMLCanvasElement {
    const width = 1200;
    const height = 630;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillText('DJ Tools - Artist Song Bracket', 40, 70);

    // Artist
    ctx.font = 'bold 36px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillStyle = '#93c5fd';
    ctx.fillText(`Artist: ${opts.artistName}`, 40, 120);

    // Champion box
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(40, 160, width - 80, 160);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 40px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillText('Champion', 60, 210);
    ctx.font = 'bold 34px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    wrapText(ctx, opts.champion.name, 60, 250, width - 120, 38);

    // Final Four grid
    const ffX = 40;
    const ffY = 360;
    const ffW = (width - 80 - 30) / 2;
    const ffH = 110;

    ctx.font = 'bold 28px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Final Four', ffX, ffY - 16);

    for (let i = 0; i < Math.min(4, opts.finalFour.length); i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        const x = ffX + col * (ffW + 30);
        const y = ffY + row * (ffH + 20);

        // Card
        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.fillRect(x, y, ffW, ffH);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
        wrapText(ctx, `(${opts.finalFour[i].seed}) ${opts.finalFour[i].name}`, x + 16, y + 36, ffW - 32, 26);
    }

    // Footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif';
    ctx.fillText('Create your own at djziff.com', 40, height - 30);

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


