import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';

export default function ExportInstructions() {
    const [isRekordboxOpen, setIsRekordboxOpen] = useState(false);
    const [isSeratoOpen, setIsSeratoOpen] = useState(false);

    return (
        <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-50 mb-2">1. Export your playlist:</h3>

            <div className="space-y-4">
                <Collapsible open={isRekordboxOpen} onOpenChange={setIsRekordboxOpen}>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                        <CollapsibleTrigger className="flex items-start justify-between w-full text-left">
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">Rekordbox (.m3u8)</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Export your playlist to an uploadable format.
                                </p>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform mt-1 ${isRekordboxOpen ? 'transform rotate-180' : ''}`} />
                        </CollapsibleTrigger>

                        <CollapsibleContent className="pt-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p className="mb-1"><strong className="text-gray-900 dark:text-gray-200">Windows/Mac:</strong></p>
                                <ol className="list-decimal ml-4 space-y-1">
                                    <li>Right-click on a playlist in Rekordbox</li>
                                    <li>Select &ldquo;Export Playlist&rdquo;</li>
                                    <li>Choose &ldquo;M3U8&rdquo; as the format</li>
                                    <li>Save the file</li>
                                </ol>
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>

                <Collapsible open={isSeratoOpen} onOpenChange={setIsSeratoOpen}>
                    <div className="p-4 rounded-lg bg-gray-50 dark:bg-slate-800/50">
                        <CollapsibleTrigger className="flex items-start justify-between w-full text-left">
                            <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-50">Serato (.crate)</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Serato doesn&apos;t have an &apos;Export Crate&apos; function. Instead, playlists are stored as &apos;.crate&apos; files.
                                </p>
                            </div>
                            <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform mt-1 ${isSeratoOpen ? 'transform rotate-180' : ''}`} />
                        </CollapsibleTrigger>

                        <CollapsibleContent className="pt-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                                <p className="mb-1"><strong className="text-gray-900 dark:text-gray-200">Windows:</strong></p>
                                <ol className="list-decimal ml-4 space-y-1">
                                    <li>Navigate to C:\Users\[Username]\_Serato_\Subcrates</li>
                                    <li>Select your desired .crate file</li>
                                </ol>

                                <p className="mb-1 mt-2"><strong className="text-gray-900 dark:text-gray-200">Mac:</strong></p>
                                <ol className="list-decimal ml-4 space-y-1">
                                    <li>Navigate to Users/[Username]/Music/_Serato_/Subcrates</li>
                                    <li>Select your desired .crate file</li>
                                </ol>
                            </div>
                        </CollapsibleContent>
                    </div>
                </Collapsible>
            </div>
        </div>
    );
}