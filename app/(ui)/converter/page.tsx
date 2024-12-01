'use client';

import { useState, useEffect, ChangeEvent, FormEvent, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Edit2, Save, X } from 'lucide-react';

interface Track {
    originalName: string;
    searchQuery: string;
    spotifyUri?: string;
    spotifyTrackName?: string;
    spotifyArtistName?: string;
    status: 'pending' | 'found' | 'not_found';
    isEditing?: boolean;
}

interface SpotifySearchResult {
    uri: string;
    name: string;
    artists: { name: string }[];
}

function ConverterContent() {
    const searchParams = useSearchParams();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [tracks, setTracks] = useState<Track[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
    const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
    const [editingTrack, setEditingTrack] = useState<string>('');

    const processM3u8Line = (line: string): string => {
        const afterFirstComma = line.split(/,(.+)/)[1];
        return (afterFirstComma || line).replace(/\s*-\s*/g, ' ').trim();
    };

    const searchSpotifyTrack = async (searchQuery: string): Promise<SpotifySearchResult | null> => {
        try {
            const response = await fetch(`/api/spotify-search?q=${encodeURIComponent(searchQuery)}`);
            const data = await response.json();

            if (data.tracks?.items?.length > 0) {
                const track = data.tracks.items[0];
                return {
                    uri: track.uri,
                    name: track.name,
                    artists: track.artists
                };
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
            if (updatedTracks[i].status === 'found') continue; // Skip already found tracks

            const track = updatedTracks[i];
            const result = await searchSpotifyTrack(track.searchQuery);

            updatedTracks[i] = {
                ...track,
                spotifyUri: result?.uri,
                spotifyTrackName: result?.name,
                spotifyArtistName: result?.artists[0]?.name,
                status: result ? 'found' : 'not_found'
            };

            setTracks([...updatedTracks]);
        }

        setIsSearching(false);
    };

    const handleEditTrack = (index: number) => {
        const track = tracks[index];
        setEditingTrack(track.searchQuery);
        setTracks(tracks.map((t, i) =>
            i === index ? { ...t, isEditing: true } : t
        ));
    };

    const handleCancelEdit = (index: number) => {
        setTracks(tracks.map((t, i) =>
            i === index ? { ...t, isEditing: false } : t
        ));
        setEditingTrack('');
    };

    const handleSaveEdit = async (index: number) => {
        if (!editingTrack.trim()) return;

        const updatedTracks = [...tracks];
        const track = updatedTracks[index];

        // Update the search query
        track.searchQuery = editingTrack;
        track.isEditing = false;
        track.status = 'pending';

        // Search for the updated track
        const result = await searchSpotifyTrack(editingTrack);

        updatedTracks[index] = {
            ...track,
            spotifyUri: result?.uri,
            spotifyTrackName: result?.name,
            spotifyArtistName: result?.artists[0]?.name,
            status: result ? 'found' : 'not_found'
        };

        setTracks(updatedTracks);
        setEditingTrack('');
    };

    useEffect(() => {
        const errorParam = searchParams.get('error');
        if (errorParam) {
            setError(errorParam);
        }
        checkAuthStatus();
    }, [searchParams]);

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

    const processCrateFile = (buffer: ArrayBuffer): string[] => {
        const data = new Uint8Array(buffer);
        const decoder = new TextDecoder('utf-8');
        const content = decoder.decode(data);

        // Remove the version header
        const contentWithoutHeader = content.replace(/^vrsn.*?\/Serato ScratchLive Crate/, '');

        // Split by 'otrk' to get individual track entries
        const tracks = contentWithoutHeader.split('otrk').filter(Boolean);

        const songNames = tracks.map(track => {
            // Remove 'ptrk' and any binary data
            const cleanPath = track.replace('ptrk', '').replace(/[^\x20-\x7E]/g, '');

            try {
                // Split the path into components and filter out empty strings
                const parts = cleanPath.split('/').filter(Boolean);

                // Skip entries that don't look like proper file paths
                if (parts.length < 3) return '';

                // Get artist name (2 positions before the filename)
                let artist = parts[parts.length - 3];
                if (!artist || artist === 'Unknown Artist') artist = '';

                // Get the filename (last part) and clean it
                const filename = parts[parts.length - 1];

                // Clean up the song name, but preserve DJ-related text
                const songName = filename
                    .replace(/\.(m4a|mp3|wav)$/, '')  // Remove file extension
                    .replace(/^Music /, '')           // Remove leading "Music" word
                    .replace(/  +/g, ' ')             // Remove multiple spaces
                    .replace(/^Unknown Artist /, '')           // Remove leading "Music" word
                    .trim();

                const searchQuery = `${artist} ${songName}`;
                // console.log('Found track:', searchQuery); // Debug log
                return searchQuery;
            } catch (error) {
                console.error('Error processing track:', cleanPath);
                console.log(error);
                return '';
            }
        }).filter(name => name && !name.includes('Serato ScratchLive')); // Filter out the header line and empty entries

        // console.log('Total tracks found:', songNames.length); // Debug log
        return songNames;
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

        const allowedExtensions = ['m3u8', 'crate'];
        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
            setError('Please upload only .m3u8 or .crate files');
            return;
        }

        setFile(selectedFile);

        if (fileExtension === 'crate') {
            const reader = new FileReader();
            reader.onload = (event) => {
                const buffer = event.target?.result as ArrayBuffer;
                const processedTrackNames = processCrateFile(buffer);

                const processedTracks: Track[] = processedTrackNames.map(trackName => ({
                    originalName: trackName,
                    searchQuery: trackName,
                    status: 'pending' as const // explicitly type as 'pending'
                }));

                setTracks(processedTracks);
            };
            reader.readAsArrayBuffer(selectedFile);
        } else {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                const lines = text.split(/\r\n|\n/);

                const processedTracks: Track[] = lines
                    .filter((_, index) => index % 2 === 1)
                    .map(line => line.trim())
                    .filter(line => line !== '')
                    .map(line => ({
                        originalName: line,
                        searchQuery: processM3u8Line(line),
                        status: 'pending' as const // explicitly type as 'pending'
                    }));

                setTracks(processedTracks);
            };
            reader.readAsText(selectedFile);
        }
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
                        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-md mb-4">
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
                            <p className="text-green-600 dark:text-green-400 font-medium">✅ Successfully authenticated with Spotify</p>
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
                                <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400 p-4 rounded-md">
                                    {error}
                                </div>
                            )}

                            <Input
                                type="file"
                                accept=".m3u8,.crate"
                                onChange={handleFileChange}
                                className="w-full"
                            />

                            {tracks.length > 0 && (
                                <div className="space-y-4">
                                    <div className="bg-gray-100 dark:bg-slate-800/50 p-4 rounded-md">
                                        <p className="font-semibold mb-2">
                                            Uploaded {file?.name} - {tracks.length} tracks
                                        </p>
                                        <div className="max-h-96 overflow-y-auto">
                                            {tracks.map((track, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-2 mb-2 rounded ${track.status === 'found'
                                                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400'
                                                        : track.status === 'not_found'
                                                            ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400'
                                                            : 'bg-white dark:bg-slate-700/50'
                                                        }`}
                                                >
                                                    {track.isEditing ? (
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                value={editingTrack}
                                                                onChange={(e) => setEditingTrack(e.target.value)}
                                                                className="flex-1 text-sm"
                                                                placeholder="Enter artist and song name"
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleSaveEdit(index)}
                                                                className="px-2 h-8"
                                                            >
                                                                <Save className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleCancelEdit(index)}
                                                                className="px-2 h-8"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-sm font-medium">
                                                                    {track.searchQuery}
                                                                </p>
                                                                <Button
                                                                    size="sm"
                                                                    variant="ghost"
                                                                    onClick={() => handleEditTrack(index)}
                                                                    className="px-2 h-8 shrink-0"
                                                                    disabled={isSearching}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                            {track.status === 'found' && (
                                                                <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">
                                                                    Found: {track.spotifyTrackName} by {track.spotifyArtistName}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        className={`w-full font-semibold transition-colors ${!tracks.some(track => track.status === 'found')
                                            ? 'bg-[#1DB954] hover:bg-[#1ed760] dark:hover:bg-[#1ed760]/80 text-white dark:text-white'
                                            : 'bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-black dark:text-white border border-gray-200 dark:border-slate-600'
                                            } disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400`}
                                        disabled={!file || isSearching}
                                    >
                                        {isSearching ? 'Searching Spotify...' : 'Search Tracks'}
                                    </Button>

                                    {tracks.some(track => track.status === 'found') && !playlistUrl && (
                                        <Button
                                            onClick={createPlaylist}
                                            className="w-full bg-[#1DB954] hover:bg-[#1ed760] dark:hover:bg-[#1ed760]/80 text-white dark:text-white font-semibold disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:text-gray-500 dark:disabled:text-gray-400 transition-colors"
                                            disabled={isCreatingPlaylist}
                                        >
                                            {isCreatingPlaylist ? 'Creating Playlist...' : 'Create Spotify Playlist'}
                                        </Button>
                                    )}

                                    {playlistUrl && (
                                        <div className="bg-green-100 dark:bg-green-900/20 p-4 rounded-md">
                                            <p className="font-medium mb-2 text-green-800 dark:text-green-400">
                                                ✅ Playlist created successfully!
                                            </p>
                                            <a
                                                href={playlistUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
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

// Main component wrapped with Suspense
export default function SpotifyConverterPage() {
    return (
        <Suspense fallback={
            <div className="container mx-auto px-4 py-8">
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Loading...</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>Please wait while we load the converter...</p>
                    </CardContent>
                </Card>
            </div>
        }>
            <ConverterContent />
        </Suspense>
    );
}