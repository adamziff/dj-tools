import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const accessToken = request.cookies.get('spotify_access_token')?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Get request body
        const { name, tracks } = await request.json();

        // First, get the user's ID
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            console.error('Failed to get user data:', errorData);
            return NextResponse.json({ error: 'Failed to get user data' }, { status: userResponse.status });
        }

        const userData = await userResponse.json();

        // Create the playlist
        const createPlaylistResponse = await fetch(
            `https://api.spotify.com/v1/users/${userData.id}/playlists`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    description: 'created with djziff.com',
                    public: false
                })
            }
        );

        if (!createPlaylistResponse.ok) {
            const errorData = await createPlaylistResponse.json();
            console.error('Failed to create playlist:', errorData);
            return NextResponse.json({ error: 'Failed to create playlist' }, { status: createPlaylistResponse.status });
        }

        const playlistData = await createPlaylistResponse.json();

        if (!playlistData.id || !playlistData.external_urls?.spotify) {
            console.error('Invalid playlist data received:', playlistData);
            return NextResponse.json({ error: 'Invalid playlist data received' }, { status: 500 });
        }

        // Add tracks to the playlist
        const addTracksResponse = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistData.id}/tracks`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: tracks
                })
            }
        );

        if (!addTracksResponse.ok) {
            const errorData = await addTracksResponse.json();
            console.error('Failed to add tracks:', errorData);
            return NextResponse.json({ error: 'Failed to add tracks to playlist' }, { status: addTracksResponse.status });
        }

        return NextResponse.json({
            success: true,
            playlistId: playlistData.id,
            playlistUrl: playlistData.external_urls.spotify,
            playlistData: playlistData // Temporary: for debugging
        });
    } catch (error) {
        console.error('Playlist creation failed:', error);
        return NextResponse.json({
            error: 'Failed to create playlist',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}