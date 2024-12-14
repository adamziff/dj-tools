// app/api/verify-email/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        // Get the allowed emails from environment variable
        const allowedEmails = process.env.SPOTIFY_EMAIL_LIST?.split(',') || [];

        // Check if the email is in the allowed list
        const isAllowed = allowedEmails.includes(email.toLowerCase().trim());

        return NextResponse.json({ isAllowed });
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}