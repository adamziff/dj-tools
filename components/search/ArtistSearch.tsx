"use client";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import Image from "next/image";

type Artist = {
    id: string;
    name: string;
    images: { url: string }[];
};

export function ArtistSearch({ value, onChange, onSelect }: { value: string; onChange: (v: string) => void; onSelect: (artist: Artist) => void }) {
    const [results, setResults] = useState<Artist[]>([]);
    const [, setIsSearching] = useState(false);
    const suppressNextSearchRef = useRef(false);

    // Debounced search
    useEffect(() => {
        const q = value.trim();
        if (!q) {
            setResults([]);
            return;
        }

        if (suppressNextSearchRef.current) {
            suppressNextSearchRef.current = false;
            return;
        }

        const t = setTimeout(async () => {
            setIsSearching(true);
            try {
                const res = await fetch(`/api/spotify-search-artist?q=${encodeURIComponent(q)}`);
                const data = await res.json();
                if (res.ok) setResults(data.artists || []);
                else setResults([]);
            } catch {
                setResults([]);
            } finally {
                setIsSearching(false);
            }
        }, 250);
        return () => clearTimeout(t);
    }, [value]);

    return (
        <div className="relative z-50">
            <Input
                placeholder="Search for an artist"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-white/90 dark:bg-slate-900/60 border-slate-200/50 dark:border-slate-700/60"
            />
            {results.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-slate-700 rounded-md shadow-md max-h-80 overflow-y-auto">
                    {results.map((a) => (
                        <button
                            key={a.id}
                            className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                            onClick={() => {
                                suppressNextSearchRef.current = true;
                                setResults([]); // close dropdown immediately
                                onSelect(a);
                            }}
                        >
                            {a.images?.[a.images.length - 1]?.url && (
                                <Image src={a.images[a.images.length - 1].url} alt={a.name} width={24} height={24} className="h-6 w-6 rounded-sm object-cover" />
                            )}
                            <span className="text-sm">{a.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

export default ArtistSearch;


