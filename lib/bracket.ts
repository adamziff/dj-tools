export type TrackSeed = {
    id: string;
    name: string;
    image: string | null;
    popularity: number;
    preview_url: string | null;
    uri: string;
    seed: number;
};

export type Matchup = {
    id: string;
    a: TrackSeed | null;
    b: TrackSeed | null;
    winnerId?: string;
};

export function buildInitialRound(seeds: TrackSeed[]): Matchup[] {
    const n = seeds.length;
    const matchups: Matchup[] = [];

    // For 64-team bracket, use proper March Madness seeding
    if (n === 64) {
        const regions = [
            [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15], // Region 1
            [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15], // Region 2  
            [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15], // Region 3
            [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15]  // Region 4
        ];

        let matchupIndex = 0;
        for (let region = 0; region < 4; region++) {
            const regionSeeds = regions[region];
            for (let i = 0; i < regionSeeds.length; i += 2) {
                const seed1 = regionSeeds[i] + (region * 16); // Offset by region
                const seed2 = regionSeeds[i + 1] + (region * 16);
                const team1 = seeds[seed1 - 1]; // Convert to 0-based index
                const team2 = seeds[seed2 - 1];
                matchups.push({ id: `r${n}-${matchupIndex}`, a: team1, b: team2 });
                matchupIndex++;
            }
        }
    }
    // For 32-team bracket
    else if (n === 32) {
        const regions = [
            [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15], // Region 1 (seeds 1-16)
            [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15]  // Region 2 (seeds 17-32)
        ];

        let matchupIndex = 0;
        for (let region = 0; region < 2; region++) {
            const regionSeeds = regions[region];
            for (let i = 0; i < regionSeeds.length; i += 2) {
                const seed1 = regionSeeds[i] + (region * 16);
                const seed2 = regionSeeds[i + 1] + (region * 16);
                const team1 = seeds[seed1 - 1];
                const team2 = seeds[seed2 - 1];
                matchups.push({ id: `r${n}-${matchupIndex}`, a: team1, b: team2 });
                matchupIndex++;
            }
        }
    }
    // For 16-team bracket
    else if (n === 16) {
        const regionSeeds = [1, 16, 8, 9, 5, 12, 4, 13, 6, 11, 3, 14, 7, 10, 2, 15];
        for (let i = 0; i < regionSeeds.length; i += 2) {
            const seed1 = regionSeeds[i];
            const seed2 = regionSeeds[i + 1];
            const team1 = seeds[seed1 - 1];
            const team2 = seeds[seed2 - 1];
            matchups.push({ id: `r${n}-${i / 2}`, a: team1, b: team2 });
        }
    }
    // For 8-team bracket, use simple 1v8, 4v5, 3v6, 2v7 pattern
    else if (n === 8) {
        const pairings = [[1, 8], [4, 5], [3, 6], [2, 7]];
        for (let i = 0; i < pairings.length; i++) {
            const [seed1, seed2] = pairings[i];
            const team1 = seeds[seed1 - 1];
            const team2 = seeds[seed2 - 1];
            matchups.push({ id: `r${n}-${i}`, a: team1, b: team2 });
        }
    }
    // Fallback to original logic for other sizes
    else {
        for (let i = 0; i < Math.floor(n / 2); i++) {
            const top = seeds[i];
            const bottom = seeds[n - 1 - i];
            matchups.push({ id: `r${n}-${i}`, a: top, b: bottom });
        }
    }

    return matchups;
}

export function advanceRound(prevRound: Matchup[]): Matchup[] {
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

export function computeRoundNames(size: number): string[] {
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

// Efficiently propagate a change from a specific matchup forward through subsequent rounds.
// Only updates the affected path (pair index chain) instead of recomputing entire bracket.
export function propagateWinnerChange(
    rounds: Matchup[][],
    roundIndex: number,
    matchupIndex: number
): Matchup[][] {
    const nextRounds = rounds.map((r) => r.map((m) => ({ ...m })));

    for (let r = roundIndex; r < nextRounds.length - 1; r++) {
        const currentRound = nextRounds[r];
        const nextRound = nextRounds[r + 1];
        const pairIndex = Math.floor(matchupIndex / 2);
        const isFirst = matchupIndex % 2 === 0;
        const currentMatch = currentRound[matchupIndex];
        const winner = currentMatch.winnerId === currentMatch.a?.id ? currentMatch.a : currentMatch.winnerId === currentMatch.b?.id ? currentMatch.b : null;

        if (!nextRound) break;

        if (isFirst) {
            nextRound[pairIndex].a = winner || null;
        } else {
            nextRound[pairIndex].b = winner || null;
        }

        // If downstream node had a winner that no longer matches either side, clear it
        const downstream = nextRound[pairIndex];
        if (downstream.winnerId && downstream.winnerId !== downstream.a?.id && downstream.winnerId !== downstream.b?.id) {
            downstream.winnerId = undefined;
        }

        // Continue path to next rounds
        matchupIndex = pairIndex;
    }

    return nextRounds;
}

export function pickFinalFour(rounds: Matchup[][]): TrackSeed[] {
    if (!rounds || rounds.length < 2) return [];
    const semifinalRound = rounds[rounds.length - 2] || [];
    const participants: TrackSeed[] = [];
    for (const m of semifinalRound) {
        if (m.a) participants.push(m.a);
        if (m.b) participants.push(m.b);
    }
    return participants.slice(0, 4);
}

export function getChampion(rounds: Matchup[][]): TrackSeed | null {
    const last = rounds[rounds.length - 1]?.[0];
    if (!last || !last.winnerId) return null;
    return last.winnerId === last.a?.id ? last.a || null :
        last.winnerId === last.b?.id ? last.b || null : null;
}

