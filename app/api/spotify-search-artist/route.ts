import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ error: 'No search query provided' }, { status: 400 });
    }

    const accessToken = request.cookies.get('spotify_access_token')?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

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

