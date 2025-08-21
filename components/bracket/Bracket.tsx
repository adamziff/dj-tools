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

    return (
        <div className="overflow-x-auto">
            <div className="grid gap-3 md:gap-4 min-w-[900px] md:min-w-[1200px]" style={{ gridTemplateColumns: `repeat(${roundNames.length}, minmax(0, 1fr))` }}>
                {roundNames.map((title, colIdx) => (
                    <div key={title} className="space-y-2">
                        <div className="text-center font-semibold text-xs md:text-sm mb-2">{title}</div>
                        {(rounds[colIdx] || []).map((m, i) => (
                            <Card key={m.id} className="p-2 bg-white/70 dark:bg-slate-900/50 backdrop-blur border-slate-200/60 dark:border-slate-700/60 shadow-sm">
                                <div className="flex flex-col gap-2">
                                    <button
                                        className={`text-left p-2 rounded border text-xs md:text-sm ${m.winnerId === m.a?.id ? 'bg-green-100 dark:bg-green-900/30 border-green-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                        onClick={() => m.a && selectWinner(colIdx, i, m.a.id)}
                                        disabled={!m.a}
                                    >
                                        <div className="flex items-center gap-2">
                                            {m.a?.image && (
                                                <Image src={m.a.image} alt="" width={24} height={24} className="h-5 w-5 md:h-6 md:w-6 rounded-sm object-cover" />
                                            )}
                                            <div className="text-[10px] md:text-xs">{m.a ? `(${m.a.seed}) ${m.a.name}` : 'TBD'}</div>
                                        </div>
                                    </button>
                                    <button
                                        className={`text-left p-2 rounded border text-xs md:text-sm ${m.winnerId === m.b?.id ? 'bg-green-100 dark:bg-green-900/30 border-green-400' : 'hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                                        onClick={() => m.b && selectWinner(colIdx, i, m.b.id)}
                                        disabled={!m.b}
                                    >
                                        <div className="flex items-center gap-2">
                                            {m.b?.image && (
                                                <Image src={m.b.image} alt="" width={24} height={24} className="h-5 w-5 md:h-6 md:w-6 rounded-sm object-cover" />
                                            )}
                                            <div className="text-[10px] md:text-xs">{m.b ? `(${m.b.seed}) ${m.b.name}` : 'TBD'}</div>
                                        </div>
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Bracket;


