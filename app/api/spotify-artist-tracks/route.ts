import { NextRequest, NextResponse } from 'next/server';

async function getAppAccessToken(): Promise<string | null> {
    try {
        const clientId = process.env.SPOTIFY_CLIENT_ID!;
        const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            },
            body: new URLSearchParams({ grant_type: 'client_credentials' }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.access_token || null;
    } catch {
        return null;
    }
}

type SpotifyAlbum = {
    id: string;
    album_type: string;
    total_tracks: number;
};

type SpotifyTrack = {
    id: string;
    name: string;
    popularity: number;
    artists: { id: string; name: string }[];
    album: { images?: { url: string; width: number; height: number }[] };
    preview_url: string | null;
    uri: string;
};

async function fetchAllAlbums(artistId: string, accessToken: string): Promise<SpotifyAlbum[]> {
    let url = `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,compilation,appears_on&market=US&limit=50`;
    const albums: SpotifyAlbum[] = [];
    // Cap pages to avoid excessive requests
    let pagesFetched = 0;
    const maxPages = 5; // up to 250 albums
    while (url && pagesFetched < maxPages) {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) break;
        const data = await res.json();
        for (const a of data.items || []) {
            albums.push({ id: a.id, album_type: a.album_type, total_tracks: a.total_tracks });
        }
        url = data.next;
        pagesFetched++;
    }
    return albums;
}

async function fetchAlbumTrackIds(albumId: string, accessToken: string): Promise<string[]> {
    let url = `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50&market=US`;
    const trackIds: string[] = [];
    while (url) {
        const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
        if (!res.ok) break;
        const data = await res.json();
        for (const t of data.items || []) {
            if (t && t.id) trackIds.push(t.id);
        }
        url = data.next;
    }
    return trackIds;
}

async function fetchTracksDetails(trackIds: string[], accessToken: string): Promise<SpotifyTrack[]> {
    const result: SpotifyTrack[] = [];
    for (let i = 0; i < trackIds.length; i += 50) {
        const batch = trackIds.slice(i, i + 50);
        const res = await fetch(`https://api.spotify.com/v1/tracks?ids=${batch.join(',')}`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (!res.ok) continue;
        const data = await res.json();
        for (const t of data.tracks || []) {
            if (!t) continue;
            result.push({
                id: t.id,
                name: t.name,
                popularity: t.popularity,
                artists: (t.artists || []).map((a: any) => ({ id: a.id, name: a.name })),
                album: { images: t.album?.images || [] },
                preview_url: t.preview_url,
                uri: t.uri,
            });
        }
    }
    return result;
}

function normalizeTitle(name: string): string {
    return name
        .toLowerCase()
        .replace(/\s*\([^)]*(remaster|live|edit|version|mono|stereo|deluxe)[^)]*\)\s*/gi, ' ')
        .replace(/-\s*(remaster|live|edit|version).*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export async function GET(request: NextRequest) {
    const artistId = request.nextUrl.searchParams.get('artistId');
    const sizeParam = request.nextUrl.searchParams.get('size');
    if (!artistId) {
        return NextResponse.json({ error: 'Missing artistId' }, { status: 400 });
    }
    const allowedSizes = [8, 16, 32, 64];
    const desiredSize = Math.max(8, Math.min(64, Number(sizeParam) || 64));
    const requestedSize = allowedSizes.includes(desiredSize) ? desiredSize : 64;

    let accessToken = request.cookies.get('spotify_access_token')?.value;
    if (!accessToken) {
        accessToken = await getAppAccessToken();
    }
    if (!accessToken) return NextResponse.json({ error: 'Spotify auth unavailable' }, { status: 503 });

    try {
        const albums = await fetchAllAlbums(artistId, accessToken);
        // Prefer albums and singles first
        const prioritized = [
            ...albums.filter(a => a.album_type === 'album'),
            ...albums.filter(a => a.album_type === 'single'),
            ...albums.filter(a => a.album_type === 'compilation'),
            ...albums.filter(a => a.album_type === 'appears_on'),
        ];

        const seenTrackIds = new Set<string>();
        const allTrackIds: string[] = [];

        for (const album of prioritized) {
            const ids = await fetchAlbumTrackIds(album.id, accessToken);
            for (const id of ids) {
                if (!seenTrackIds.has(id)) {
                    seenTrackIds.add(id);
                    allTrackIds.push(id);
                }
            }
            if (allTrackIds.length >= 300) break; // cap
        }

        const tracks = await fetchTracksDetails(allTrackIds, accessToken);

        // Keep tracks where the artist is one of the artists on the track
        const filtered = tracks.filter(t => t.artists.some(a => a.id === artistId));

        // Deduplicate by normalized title to avoid duplicates across versions; keep highest popularity
        const titleToTrack = new Map<string, SpotifyTrack>();
        for (const t of filtered) {
            const key = normalizeTitle(t.name);
            const existing = titleToTrack.get(key);
            if (!existing || t.popularity > existing.popularity) {
                titleToTrack.set(key, t);
            }
        }

        const uniqueTracks = Array.from(titleToTrack.values());

        uniqueTracks.sort((a, b) => b.popularity - a.popularity);

        // Pick the largest allowed size that is <= requestedSize and <= available tracks
        const available = uniqueTracks.length;
        const effectiveSize = allowedSizes
            .filter((n) => n <= requestedSize && n <= available)
            .sort((a, b) => b - a)[0];

        if (!effectiveSize) {
            return NextResponse.json({ error: 'Not enough songs found to build a bracket.' }, { status: 400 });
        }

        const topN = uniqueTracks.slice(0, effectiveSize);

        const simplified = topN.map((t, index) => ({
            id: t.id,
            name: t.name,
            popularity: t.popularity,
            image: t.album.images?.[0]?.url || null,
            preview_url: t.preview_url,
            uri: t.uri,
            seed: index + 1,
        }));

        return NextResponse.json({ tracks: simplified });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to load artist tracks' }, { status: 500 });
    }
}

