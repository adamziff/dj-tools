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


