"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";

type Props = {
    partyName: string;
    date?: string;
    location?: string;
    notes?: string;
    onChange: (next: { partyName: string; date?: string; location?: string; notes?: string }) => void;
};

export default function MetadataFields({ partyName, date, location, notes, onChange }: Props) {
    const id = useId();
    return (
        <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Party name</span>
                <Input
                    aria-labelledby={`${id}-party`}
                    id={`${id}-party`}
                    value={partyName}
                    onChange={(e) => onChange({ partyName: e.target.value, date, location, notes })}
                />
            </label>
            <label className="flex flex-col gap-1">
                <span className="text-sm font-medium">Date</span>
                <Input
                    placeholder="YYYY-MM-DD"
                    type="date"
                    value={date ?? ''}
                    onChange={(e) => onChange({ partyName, date: e.target.value, location, notes })}
                />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Location</span>
                <Input
                    value={location ?? ''}
                    onChange={(e) => onChange({ partyName, date, location: e.target.value, notes })}
                />
            </label>
            <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-sm font-medium">Notes</span>
                <textarea
                    className="min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
                    value={notes ?? ''}
                    onChange={(e) => onChange({ partyName, date, location, notes: e.target.value })}
                />
            </label>
        </div>
    );
}


