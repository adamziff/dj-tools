export type TemplateId =
    | 'poster-bold'
    | 'minimal-card'
    | 'neon-grid'
    | 'story-vertical'
    | 'polaroid-collage';

export type SubtitleVariant = 'from' | 'afterparty';

export interface Track {
    id: string;
    artist: string;
    title: string;
    mix?: string;
    included: boolean;
}

export interface MementoPhoto {
    file?: File;
    url?: string;
    mime?: string;
}

export interface MementoState {
    partyName: string;
    date?: string;
    location?: string;
    notes?: string;
    tracks: Track[];
    templateId: TemplateId;
    subtitleVariant: SubtitleVariant;
    colorScheme?: string;
    photo: MementoPhoto;
}

export interface RenderPayload {
    templateId: TemplateId;
    partyName: string;
    subtitleVariant: SubtitleVariant;
    date?: string;
    location?: string;
    notes?: string;
    tracks: Array<Pick<Track, 'artist' | 'title' | 'mix'>>;
    photo: { dataUrl?: string; url?: string };
    preview?: boolean;
}


