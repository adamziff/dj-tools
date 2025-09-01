"use client";

import { useCallback, useRef, useState } from "react";
import { fileToDataUrl, maybeConvertHeicToPng, downscaleDataUrl } from "./utils/image";

type Props = {
    value?: string | null;
    onChange: (dataUrl: string) => void;
};

export default function ImageDropzone({ value, onChange }: Props) {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || !files.length) return;
        const file = files[0];
        const converted = await maybeConvertHeicToPng(file);
        const originalDataUrl = await fileToDataUrl(converted as File);
        // Downscale to keep request payloads well below Next.js body limits
        const dataUrl = await downscaleDataUrl(originalDataUrl, 1600, 0.85);
        onChange(dataUrl);
    }, [onChange]);

    const hasImage = Boolean(value);

    return (
        <div
            className={`rounded-lg border border-dashed p-6 text-sm border-border bg-transparent`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
            role="button"
            aria-label="Upload image"
            onClick={() => inputRef.current?.click()}
        >
            {!hasImage && (
                <p className="text-muted-foreground">
                    {dragOver ? 'Release to upload…' : 'Drag & drop a .jpg/.png/.heic here, or click to choose.'}
                </p>
            )}
            {hasImage && (
                <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={value as string} alt="Uploaded preview" className="h-16 w-16 rounded object-cover" />
                    <div className="text-sm">
                        <div className="font-medium">Photo added</div>
                        <div className="text-muted-foreground">Click to replace</div>
                    </div>
                </div>
            )}
            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/heic,image/heif"
                className="hidden"
                onChange={(e) => handleFiles(e.currentTarget.files)}
            />
        </div>
    );
}

