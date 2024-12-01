import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ChevronDown, ListMusic } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import ExportInstructions from './export-instructions';
import { useState } from 'react';

export default function ExplanationSection() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Card className="max-w-md mx-auto mb-8 bg-white dark:bg-slate-900">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger
                    className="w-full cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                    <CardHeader className="border-b border-gray-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ListMusic className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                                <CardTitle className="text-gray-900 dark:text-gray-50">Not sure what to do? Start here!</CardTitle>
                            </div>
                            <ChevronDown
                                className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
                            />
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="space-y-6 pt-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">Stop manually copying playlists</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Ever wanted to listen to your DJ playlist on Spotify? Or had a client ask &ldquo;hey can you send me your playlist?&rdquo;
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 pt-4">
                                With this tool, you can take a playlist from your DJ software and automatically create a Spotify playlist on your account.
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 pt-4">
                                Currently supported: Rekordbox (.m3u8) and Serato (.crate).
                            </p>
                        </div>

                        <ExportInstructions />

                        <Separator className="bg-gray-200 dark:bg-slate-700" />

                        <div className="space-y-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-50">2. Convert your playlist:</h3>
                            <ol className="text-sm text-gray-600 dark:text-gray-400 list-decimal ml-4 space-y-2">
                                <li>Sign in below with your Spotify account</li>
                                <li>Click &ldquo;Choose File&rdquo; and upload your .m3u8 or .crate file</li>
                                <li>Review the track list and edit if needed</li>
                                <li>Click &ldquo;Search Tracks&rdquo;</li>
                                <li>If any tracks are not matched (red background) or matched incorrectly, edit the name and save to try again</li>
                                <li>When you&apos;re happy with your track list, click &ldquo;Create Spotify Playlist&rdquo;</li>
                            </ol>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}