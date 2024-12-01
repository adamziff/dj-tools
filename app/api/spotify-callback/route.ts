import { NextRequest, NextResponse } from 'next/server';
import querystring from 'querystring';
import crypto from 'crypto';

// Spotify API configuration
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID!;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET!;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI!;

// Scopes you want to request
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public'
].join(' ');

// Utility function to generate random string
function generateRandomString(length: number): string {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(crypto.randomBytes(length))
        .map((x) => possible[x % possible.length])
        .join('');
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const returnedState = searchParams.get('state');

    // If code and state exist, this is the callback from Spotify
    if (code && returnedState) {
        // Verify state to prevent CSRF
        const storedState = request.cookies.get('spotify_auth_state')?.value;

        if (returnedState !== storedState) {
            return NextResponse.redirect(new URL('/converter?error=state_mismatch', request.url));
        }

        try {
            // Exchange authorization code for access token
            const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`
                },
                body: querystring.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    redirect_uri: REDIRECT_URI
                })
            });

            const data = await tokenResponse.json();

            // Create a response and redirect to converter page with tokens
            const response = NextResponse.redirect(new URL('/converter', request.url));

            // Set tokens in secure, httpOnly cookies
            response.cookies.set('spotify_access_token', data.access_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: data.expires_in
            });

            response.cookies.set('spotify_refresh_token', data.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict'
            });

            return response;
        } catch (error) {
            console.log(error);
            return NextResponse.redirect(new URL('/converter?error=token_exchange_failed', request.url));
        }
    }

    // Initial authorization request
    const authState = generateRandomString(16);

    // Redirect to Spotify authorization page
    const authorizeUrl =
        `https://accounts.spotify.com/authorize?` +
        querystring.stringify({
            response_type: 'code',
            client_id: CLIENT_ID,
            scope: SCOPES,
            redirect_uri: REDIRECT_URI,
            state: authState
        });

    // Create a response with redirect and set state cookie
    const response = NextResponse.redirect(authorizeUrl);
    response.cookies.set('spotify_auth_state', authState, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 600
    });

    return response;
}