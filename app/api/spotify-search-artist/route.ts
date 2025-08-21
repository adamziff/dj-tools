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

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'No search query provided' }, { status: 400 });
    }

    let accessToken = request.cookies.get('spotify_access_token')?.value;
    if (!accessToken) {
        accessToken = await getAppAccessToken();
    }
    if (!accessToken) return NextResponse.json({ error: 'Spotify auth unavailable' }, { status: 503 });

    try {
        const response = await fetch(
            `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=artist&limit=10`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            }
        );

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json({ error: 'Spotify search failed', details: text }, { status: response.status });
        }

        const data = await response.json();

        const artists = (data.artists?.items || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            images: a.images || [],
            popularity: a.popularity,
            followers: a.followers?.total ?? 0,
        }));

        return NextResponse.json({ artists });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}

