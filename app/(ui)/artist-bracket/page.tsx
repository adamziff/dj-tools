'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import SpotifyAuthCard from '../converter/spotify-auth';

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

function buildInitialRound64(seeds: TrackSeed[]): Matchup[] {
    const n = seeds.length; // expect 64
    const matchups: Matchup[] = [];
    for (let i = 0; i < n / 2; i++) {
        const top = seeds[i];
        const bottom = seeds[n - 1 - i];
        matchups.push({ id: `r64-${i}`, a: top, b: bottom });
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

function Bracket({ seeds, onChampion }: { seeds: TrackSeed[]; onChampion: (t: TrackSeed) => void }) {
    const [rounds, setRounds] = useState<Matchup[][]>(() => [buildInitialRound64(seeds)]);

    useEffect(() => {
        setRounds([buildInitialRound64(seeds)]);
    }, [seeds]);

    const roundNames = ['Round of 64', 'Round of 32', 'Sweet 16', 'Elite 8', 'Final 4', 'Championship'];

    const selectWinner = (roundIndex: number, matchupIndex: number, winnerId: string) => {
        setRounds((prev) => {
            const copy = prev.map((r) => r.map((m) => ({ ...m })));
            copy[roundIndex][matchupIndex].winnerId = winnerId;

            // If round complete, create next round or update next round pairing
            const currentRound = copy[roundIndex];
            const isComplete = currentRound.every((m) => !!m.winnerId);
            const isLastRound = roundIndex === (roundNames.length - 1);
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

            if (isComplete && isLastRound) {
                const finalMatch = currentRound[0];
                const champ = finalMatch.winnerId === finalMatch.a?.id ? finalMatch.a : finalMatch.b;
                if (champ) onChampion(champ);
            }

            return copy;
        });
    };

    return (
        <div className="overflow-x-auto">
            <div className="grid grid-cols-7 gap-4 min-w-[1200px]">
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
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Artist[]>([]);
    const [selected, setSelected] = useState<Artist | null>(null);
    const [seeds, setSeeds] = useState<TrackSeed[]>([]);
    const [champion, setChampion] = useState<TrackSeed | null>(null);

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch('/api/check-auth');
                const data = await res.json();
                setIsAuthenticated(data.isAuthenticated);
            } catch (e) {
                // noop
            }
        };
        check();
    }, []);

    const initiateSpotifyLogin = async () => {
        try {
            const response = await fetch('/api/spotify-callback', {
                method: 'GET',
                redirect: 'manual'
            });
            if (response.type === 'opaqueredirect') {
                window.location.href = response.url;
            }
        } catch (e) {
            // noop
        }
    };

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
            const res = await fetch(`/api/spotify-artist-tracks?artistId=${selected.id}`);
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
                    <SpotifyAuthCard error={error} isAuthenticated={isAuthenticated} initiateSpotifyLogin={initiateSpotifyLogin} />

                    {isAuthenticated && (
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
                                <Button onClick={generateBracket} disabled={!selected || isSearching}>
                                    {isSearching ? 'Loading…' : 'Generate 64-Song Bracket'}
                                </Button>
                                {selected && (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">Selected: <span className="font-medium">{selected.name}</span></div>
                                )}
                            </div>

                            {seeds.length > 0 && (
                                <div className="space-y-4">
                                    <Bracket seeds={seeds} onChampion={setChampion} />
                                    {champion && (
                                        <Card className="p-4">
                                            <div className="text-center">Champion: <span className="font-semibold">{champion.name}</span></div>
                                        </Card>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

