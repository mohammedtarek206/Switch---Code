export function extractYouTubeId(urlOrId: string): string {
    if (!urlOrId) return '';
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
        return trimmed;
    }
    const match = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/);
    if (match && match[1]) {
        return match[1];
    }
    return trimmed;
}

export function getYouTubeThumbnail(videoUrlOrId: string): string {
    const id = extractYouTubeId(videoUrlOrId);
    if (!id || id.length !== 11) return '';
    return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}
