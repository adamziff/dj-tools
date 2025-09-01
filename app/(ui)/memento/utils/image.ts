export async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error);
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
    });
}

export async function maybeConvertHeicToPng(file: File): Promise<File | Blob> {
    if (!/\.(heic|heif)$/i.test(file.name) && file.type !== 'image/heic' && file.type !== 'image/heif') {
        return file;
    }
    try {
        const mod = await import('heic2any');
        const blob = await (mod.default as any)({ blob: file, toType: 'image/png' });
        return blob as Blob;
    } catch (_) {
        // Fallback: return original; server may try to decode
        return file;
    }
}

export async function downscaleDataUrl(
    dataUrl: string,
    maxDim: number = 1600,
    quality: number = 0.85
): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img as HTMLImageElement;
            const scale = Math.min(1, maxDim / Math.max(width, height));
            const w = Math.max(1, Math.round(width * scale));
            const h = Math.max(1, Math.round(height * scale));
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(dataUrl); return; }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, w, h);
            const out = canvas.toDataURL('image/jpeg', quality);
            resolve(out);
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
}

