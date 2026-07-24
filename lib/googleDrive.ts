/**
 * Converts any Google Drive shareable link or file URL to a direct embeddable image URL.
 * Supports:
 * - https://drive.google.com/file/d/FILE_ID/view?usp=sharing
 * - https://drive.google.com/open?id=FILE_ID
 * - https://drive.google.com/uc?id=FILE_ID
 */
export function formatGoogleDriveImageUrl(url?: string): string {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    if (trimmed.includes('drive.google.com')) {
        const fileIdMatch =
            trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
            trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);

        if (fileIdMatch && fileIdMatch[1]) {
            return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
        }
    }

    return trimmed;
}
