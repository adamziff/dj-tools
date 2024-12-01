'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';

interface Track {
    originalName: string;
    searchQuery: string;
    spotifyUri?: string;
    status: 'pending' | 'found' | 'not_found';
}

export default function SpotifyConverterPage() {
    const searchParams = useSearchParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);

    const processM3u8Line = (line: string): string => {
        const afterComma = line.includes(',') ? line.split(',')[1] : line;
        return afterComma.replace(/\s*-\s*/g, ' ').trim();
    };

    const searchSpotifyTrack = async (searchQuery: string): Promise<string | null> => {
        try {
            const response = await fetch(`/api/spotify-search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data.tracks?.items?.length > 0) {
                return data.tracks.items[0].uri;
            }
            return null;
        } catch (error) {
            console.error('Search failed:', error);
            return null;
        }
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!file || tracks.length === 0) {
            setError('Please upload a file first');
            return;
        }

        setIsSearching(true);

        const updatedTracks = [...tracks];
        for (let i = 0; i < updatedTracks.length; i++) {
            const track = updatedTracks[i];
            const uri = await searchSpotifyTrack(track.searchQuery);

            updatedTracks[i] = {
                ...track,
                spotifyUri: uri || undefined,
                status: uri ? 'found' : 'not_found'
            };

            setTracks([...updatedTracks]);
        }

        setIsSearching(false);
    };

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(errorParam);
        }
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            setIsAuthenticated(data.isAuthenticated);
        } catch (error) {
            console.error('Authentication check failed:', error);
        }
    };

    const initiateSpotifyLogin = async () => {
        try {
            const response = await fetch('/api/spotify-callback', {
                method: 'GET',
                redirect: 'manual'
            });

            if (response.type === 'opaqueredirect') {
                window.location.href = response.url;
            }
        } catch (error) {
            console.error('Spotify login error:', error);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        setError(null);
        setTracks([]);
        setPlaylistUrl(null);

        if (!e.target.files || e.target.files.length === 0) {
            return;
        }

        const selectedFile = e.target.files[0];
        const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();

        const allowedExtensions = ['m3u8']; // add other file extensions here
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            setError('Please upload only .m3u8 files');
            return;
        }

        setFile(selectedFile);

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            const lines = text.split(/\r\n|\n/);

            let processedTracks: Track[];
            if (fileExtension === 'm3u8') {
                processedTracks = lines
                    .filter((_, index) => index % 2 === 1)
                    .map(line => line.trim())
                    .filter(line => line !== '') // Filter out empty lines
                    .map(line => ({
                        originalName: line,
                        searchQuery: processM3u8Line(line),
                        status: 'pending'
                    }));
            } else {
                processedTracks = lines
                    .filter(line => line.trim() !== '')
                    .map(line => ({
                        originalName: line,
                        searchQuery: line,
                        status: 'pending'
                    }));
            }

            setTracks(processedTracks);
        };
        reader.readAsText(selectedFile);
    };

    const createPlaylist = async () => {
        if (!file || !tracks.length) return;

        const foundTracks = tracks
            .filter(track => track.status === 'found' && track.spotifyUri)
            .map(track => track.spotifyUri!);

        if (foundTracks.length === 0) {
            setError('No tracks were found on Spotify');
            return;
        }

        setIsCreatingPlaylist(true);
        try {
            const response = await fetch('/api/spotify-create-playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: file.name.split('.')[0], // Use filename without extension
                    tracks: foundTracks
                })
            });

            const data = await response.json();
            if (data.success) {
                setPlaylistUrl(data.playlistUrl);
            } else {
                setError('Failed to create playlist');
            }
        } catch (error) {
            console.log(error)
            setError('Failed to create playlist');
        } finally {
            setIsCreatingPlaylist(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <CardTitle>Spotify Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="bg-red-100 text-red-800 p-4 rounded-md mb-4">
                            {error === 'state_mismatch' && 'Authentication failed: State mismatch'}
                            {error === 'token_exchange_failed' && 'Failed to exchange token'}
                        </div>
                    )}

                    {!isAuthenticated ? (
                        <div className="space-y-4">
                            <p>Connect your Spotify account to get started</p>
                            <Button
                                onClick={initiateSpotifyLogin}
                                className="w-full"
                            >
                                Login with Spotify
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <p className="text-green-600 font-medium">✅ Successfully authenticated with Spotify</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {isAuthenticated && (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Playlist Converter</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && error !== 'state_mismatch' && error !== 'token_exchange_failed' && (
                                <div className="bg-red-100 text-red-800 p-4 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Input
                                type="file"
                                accept=".m3u8,.txt,.csv"
                                onChange={handleFileChange}
                                className="w-full"
                            />

                            {tracks.length > 0 && (
                                <div className="space-y-4">
                                    <div className="bg-gray-100 p-4 rounded-md">
                                        <p className="font-semibold mb-2">
                                            Uploaded {file?.name} - {tracks.length} tracks
                                        </p>
                                        <div className="max-h-96 overflow-y-auto">
                                            {tracks.map((track, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-2 mb-2 rounded ${track.status === 'found'
                                                        ? 'bg-green-100'
                                                        : track.status === 'not_found'
                                                            ? 'bg-red-100'
                                                            : 'bg-white'
                                                        }`}
                                                >
                                                    <p className="text-sm font-medium">
                                                        {track.searchQuery}
                                                    </p>
                                                    {track.spotifyUri && (
                                                        <p className="text-xs text-gray-600 mt-1">
                                                            URI: {track.spotifyUri}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full"
                                        disabled={!file || isSearching}
                                    >
                                        {isSearching ? 'Searching Spotify...' : 'Search Tracks'}
                                    </Button>

                                    {tracks.some(track => track.status === 'found') && !playlistUrl && (
                                        <Button
                                            onClick={createPlaylist}
                                            className="w-full"
                                            disabled={isCreatingPlaylist}
                                        >
                                            {isCreatingPlaylist ? 'Creating Playlist...' : 'Create Spotify Playlist'}
                                        </Button>
                                    )}

                                    {playlistUrl && (
                                        <div className="bg-green-100 p-4 rounded-md">
                                            <p className="font-medium mb-2">✅ Playlist created successfully!</p>
                                            <a
                                                href={playlistUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline"
                                            >
                                                Open in Spotify
                                            </a>
                                        </div>
                                    )}
                                </div>
                            )}
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}