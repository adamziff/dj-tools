import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

const SpotifyAuthCard = ({
    error,
    isAuthenticated,
    initiateSpotifyLogin
}: {
    error: string | null;
    isAuthenticated: boolean;
    initiateSpotifyLogin: () => void;
}) => {
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isValidating, setIsValidating] = useState(false);
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isUserAuthenticated, setIsUserAuthenticated] = useState(isAuthenticated);

    useEffect(() => {
        const checkAuthentication = async () => {
            try {
                const response = await fetch('/api/check-auth');
                const data = await response.json();
                setIsUserAuthenticated(data.isAuthenticated);
            } catch (error) {
                console.error('Auth check failed:', error);
            } finally {
                setIsCheckingAuth(false);
            }
        };

        checkAuthentication();
    }, []);

    const validateEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsValidating(true);
        setEmailError(null);

        try {
            const response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (data.isAllowed) {
                initiateSpotifyLogin();
            } else {
                setEmailError('Please contact adam@djziff.com for access.');
            }
        } catch (error) {
            console.log(error)
            setEmailError('An error occurred while validating your email.');
        } finally {
            setIsValidating(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <Card className="max-w-md mx-auto bg-white dark:bg-slate-900 shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Spotify Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-gray-500 dark:text-gray-400" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isUserAuthenticated) {
        return (
            <Card className="max-w-md mx-auto bg-white dark:bg-slate-900 shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Spotify Authentication</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center space-x-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <svg
                            className="h-6 w-6 text-green-600 dark:text-green-400"
                            fill="none"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <p className="text-green-600 dark:text-green-400 font-medium">
                            Successfully authenticated with Spotify
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-md mx-auto bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl font-bold text-center">Log in with Spotify</CardTitle>
                <p className="text-sm text-center text-gray-500 dark:text-gray-400">
                    Enter your Spotify account email address
                </p>
            </CardHeader>
            <CardContent>
                {error && (
                    <Alert variant="destructive" className="mb-6 border-red-500 dark:border-red-400">
                        <AlertDescription>
                            {error === 'state_mismatch' && 'Authentication failed: State mismatch'}
                            {error === 'token_exchange_failed' && 'Failed to exchange token'}
                        </AlertDescription>
                    </Alert>
                )}

                <form onSubmit={validateEmail} className="space-y-6">
                    <div className="space-y-2">
                        <Input
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-lg 
                         focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 
                         bg-white dark:bg-slate-800 
                         text-gray-900 dark:text-gray-100"
                        />
                    </div>

                    {emailError && (
                        <Alert
                            variant="destructive"
                            className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        >
                            <AlertDescription className="text-red-800 dark:text-red-400">
                                {emailError}
                            </AlertDescription>
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        className="w-full h-11 bg-[#1DB954] hover:bg-[#1ed760] dark:hover:bg-[#1ed760]/80
                       text-white font-semibold text-base
                       disabled:bg-gray-300 dark:disabled:bg-gray-700 
                       disabled:text-gray-500 dark:disabled:text-gray-400
                       transition-colors duration-200"
                        disabled={isValidating}
                    >
                        {isValidating ? (
                            <div className="flex items-center justify-center space-x-2">
                                <Loader2 className="h-5 w-5 animate-spin" />
                                <span>Checking access...</span>
                            </div>
                        ) : (
                            'Continue'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
};

export default SpotifyAuthCard;