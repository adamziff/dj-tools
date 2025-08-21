"use client";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import type { Matchup, TrackSeed } from "@/lib/bracket";
import { advanceRound, buildInitialRound, computeRoundNames, propagateWinnerChange } from "@/lib/bracket";

export function Bracket({ seeds, onChampion, onRoundsChange }: { seeds: TrackSeed[]; onChampion: (t: TrackSeed) => void; onRoundsChange?: (rounds: Matchup[][]) => void }) {
    const [rounds, setRounds] = useState<Matchup[][]>(() => [buildInitialRound(seeds)]);

    const totalRounds = useMemo(() => Math.max(1, Math.log2(Math.max(1, seeds.length))), [seeds.length]);
    const roundNames = useMemo(() => computeRoundNames(seeds.length), [seeds.length]);

    useEffect(() => {
        const initial = [buildInitialRound(seeds)];
        setRounds(initial);
        // Build subsequent empty rounds structure
        const roundsCount = Math.max(1, Math.log2(Math.max(1, seeds.length)));
        let current = initial[0];
        const full: Matchup[][] = [current];
        for (let i = 1; i < roundsCount; i++) {
            const next = advanceRound(current);
            full.push(next);
            current = next;
        }
        setRounds(full);
    }, [seeds]);

    useEffect(() => {
        onRoundsChange?.(rounds);
    }, [rounds, onRoundsChange]);

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

            // Ensure next round exists
            if (!copy[roundIndex + 1] && roundIndex < totalRounds - 1) {
                copy[roundIndex + 1] = advanceRound(copy[roundIndex]);
            }

            // Propagate only along the path from this matchup forward
            const updated = propagateWinnerChange(copy, roundIndex, matchupIndex);
            return updated;
        });
    };

    // Check for champion to show prominent display
    const currentChampion = useMemo(() => {
        const lastRound = rounds[rounds.length - 1];
        if (!lastRound || lastRound.length === 0) return null;
        const finalMatch = lastRound[0];
        if (!finalMatch?.winnerId) return null;
        return finalMatch.winnerId === finalMatch.a?.id ? finalMatch.a : finalMatch.b;
    }, [rounds]);

    return (
        <div className="space-y-6">
            {/* Champion Display - Always visible and prominent */}
            <div className="relative">
                <Card className="p-6 bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 border-yellow-400/30 shadow-xl">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <div className="text-2xl">👑</div>
                            <h3 className="text-xl md:text-2xl font-bold text-yellow-300">Champion</h3>
                        </div>
                        {currentChampion ? (
                            <div className="flex items-center justify-center gap-4 p-4 bg-black/20 rounded-lg">
                                {currentChampion.image && (
                                    <Image
                                        src={currentChampion.image}
                                        alt={currentChampion.name}
                                        width={64}
                                        height={64}
                                        className="h-12 w-12 md:h-16 md:w-16 rounded-lg object-cover shadow-lg"
                                    />
                                )}
                                <div className="text-left">
                                    <div className="text-lg md:text-xl font-bold text-white">{currentChampion.name}</div>
                                    <div className="text-sm text-yellow-200">Seed #{currentChampion.seed}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-400 text-lg">Complete the bracket to crown your favorite song</div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Bracket Grid */}
            <div className="overflow-x-auto pb-4">
                <div className="grid gap-4 md:gap-6 min-w-fit" style={{ gridTemplateColumns: `repeat(${roundNames.length}, minmax(240px, 1fr))` }}>
                    {roundNames.map((title, colIdx) => (
                        <div key={title} className="space-y-4">
                            <div className="text-center font-bold text-sm md:text-lg mb-4 text-white bg-gradient-to-r from-purple-600 to-blue-600 py-2 px-4 rounded-lg shadow-lg">
                                {title}
                            </div>
                            <div className="space-y-3">
                                {(rounds[colIdx] || []).map((m, i) => (
                                    <Card key={m.id} className="p-3 bg-white/90 dark:bg-slate-800/90 backdrop-blur border-2 border-slate-300/80 dark:border-slate-600/80 shadow-lg hover:shadow-xl transition-all">
                                        <div className="space-y-2">
                                            <button
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm md:text-base ${!m.a
                                                    ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                                                    : m.winnerId === m.a?.id
                                                        ? 'bg-green-100 dark:bg-green-900/40 border-green-400 shadow-lg transform scale-[1.02]'
                                                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                                                    }`}
                                                onClick={() => m.a && selectWinner(colIdx, i, m.a.id)}
                                                disabled={!m.a}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {m.a?.image && (
                                                        <Image
                                                            src={m.a.image}
                                                            alt=""
                                                            width={40}
                                                            height={40}
                                                            className="h-8 w-8 md:h-10 md:w-10 rounded-md object-cover shadow-sm"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-medium truncate ${!m.a ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                            {m.a ? m.a.name : 'TBD'}
                                                        </div>
                                                        {m.a && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Seed #{m.a.seed}</div>
                                                        )}
                                                    </div>
                                                    {m.winnerId === m.a?.id && m.a && (
                                                        <div className="text-green-600 dark:text-green-400 text-xl">✓</div>
                                                    )}
                                                </div>
                                            </button>

                                            <div className="text-center text-xs text-gray-400 font-medium">VS</div>

                                            <button
                                                className={`w-full text-left p-3 rounded-lg border-2 transition-all text-sm md:text-base ${!m.b
                                                    ? 'bg-gray-100 dark:bg-gray-800/50 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                                                    : m.winnerId === m.b?.id
                                                        ? 'bg-green-100 dark:bg-green-900/40 border-green-400 shadow-lg transform scale-[1.02]'
                                                        : 'hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500'
                                                    }`}
                                                onClick={() => m.b && selectWinner(colIdx, i, m.b.id)}
                                                disabled={!m.b}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {m.b?.image && (
                                                        <Image
                                                            src={m.b.image}
                                                            alt=""
                                                            width={40}
                                                            height={40}
                                                            className="h-8 w-8 md:h-10 md:w-10 rounded-md object-cover shadow-sm"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`font-medium truncate ${!m.b ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                                            {m.b ? m.b.name : 'TBD'}
                                                        </div>
                                                        {m.b && (
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">Seed #{m.b.seed}</div>
                                                        )}
                                                    </div>
                                                    {m.winnerId === m.b?.id && m.b && (
                                                        <div className="text-green-600 dark:text-green-400 text-xl">✓</div>
                                                    )}
                                                </div>
                                            </button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Bracket;


