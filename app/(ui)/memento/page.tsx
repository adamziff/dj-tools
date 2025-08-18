"use client";

import { useState } from "react";
import ImageDropzone from "./ImageDropzone";
import MetadataFields from "./MetadataFields";
import TracklistEditor from "./TracklistEditor";
import TemplatePicker from "./TemplatePicker";
import LivePreview from "./LivePreview";
import ExportBar from "./ExportBar";
import type { MementoState } from "./types";

export default function MementoPage() {
    const [state, setState] = useState<MementoState>({
        partyName: "",
        date: "",
        location: "",
        notes: "",
        tracks: [],
        templateId: 'poster-bold',
        subtitleVariant: 'from',
        photo: {},
    });
    const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <h1 className="text-3xl font-bold tracking-tight">Memento Generator</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Upload a photo, paste your tracklist, choose a template, and export a polished PNG.
            </p>

            <div className="mt-8 space-y-10">
                <section aria-labelledby="upload-section">
                    <h2 id="upload-section" className="text-xl font-semibold">
                        1. Upload
                    </h2>
                    <div className="mt-3">
                        <ImageDropzone value={photoDataUrl} onChange={(d) => setPhotoDataUrl(d)} />
                    </div>
                    <div className="mt-4">
                        <MetadataFields
                            partyName={state.partyName}
                            date={state.date}
                            location={state.location}
                            notes={state.notes}
                            onChange={(m) => setState((s) => ({ ...s, ...m }))}
                        />
                    </div>
                </section>

                <section aria-labelledby="tracklist-section">
                    <h2 id="tracklist-section" className="text-xl font-semibold">
                        2. Tracklist
                    </h2>
                    <div className="mt-3">
                        <TracklistEditor
                            tracks={state.tracks}
                            onChange={(tracks) => setState((s) => ({ ...s, tracks }))}
                        />
                    </div>
                </section>

                <section aria-labelledby="templates-section">
                    <h2 id="templates-section" className="text-xl font-semibold">
                        3. Templates
                    </h2>
                    <div className="mt-3">
                        <TemplatePicker
                            templateId={state.templateId}
                            subtitleVariant={state.subtitleVariant}
                            onChange={(t) => setState((s) => ({ ...s, ...t }))}
                        />
                    </div>
                </section>

                <section aria-labelledby="preview-section">
                    <h2 id="preview-section" className="text-xl font-semibold">
                        4. Preview
                    </h2>
                    <div className="mt-3 grid gap-4 md:grid-cols-2">
                        <LivePreview state={{ ...state, photoDataUrl }} />
                        <div className="rounded-lg border p-4">
                            <ExportBar state={{ ...state, photoDataUrl }} />
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}


