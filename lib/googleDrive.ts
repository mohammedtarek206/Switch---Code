const ALLOWED_DRIVE_HOSTS = new Set([
    'drive.google.com',
    'docs.google.com',
    'lh3.googleusercontent.com',
]);

const ALLOWED_IMAGE_MIME_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
]);

const FILE_ID_REGEX = /^[a-zA-Z0-9_-]{10,80}$/;

export interface DriveValidationResult {
    valid: boolean;
    fileId?: string;
    displayUrl?: string;
    contentType?: string;
    error?: string;
}

/**
 * Extracts Google Drive File ID strictly from allowed Google Drive URLs.
 * Prevents SSRF by rejecting non-Google-Drive domains and invalid IDs.
 */
export function extractGoogleDriveFileId(rawUrl?: string): string | null {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    } catch {
        return null;
    }

    if (parsed.protocol !== 'https:') {
        return null;
    }

    if (!ALLOWED_DRIVE_HOSTS.has(parsed.hostname.toLowerCase())) {
        return null;
    }

    // Check /file/d/<ID>/...
    const fileMatch = parsed.pathname.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch && FILE_ID_REGEX.test(fileMatch[1])) {
        return fileMatch[1];
    }

    // Check /d/<ID> (lh3.googleusercontent.com/d/<ID>)
    const lh3Match = parsed.pathname.match(/^\/d\/([a-zA-Z0-9_-]+)/);
    if (lh3Match && FILE_ID_REGEX.test(lh3Match[1])) {
        return lh3Match[1];
    }

    // Check ?id=<ID>
    const queryId = parsed.searchParams.get('id');
    if (queryId && FILE_ID_REGEX.test(queryId)) {
        return queryId;
    }

    return null;
}

/**
 * Converts any Google Drive shareable link or file URL to a direct embeddable image URL.
 */
export function formatGoogleDriveImageUrl(url?: string): string {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (!trimmed) return '';

    const fileId = extractGoogleDriveFileId(trimmed);
    if (fileId) {
        return `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    return trimmed;
}

/**
 * Server-side SSRF-safe validation of a Google Drive photo URL.
 * Verifies:
 * 1. URL belongs strictly to allowed Google Drive domains & has valid File ID.
 * 2. Image is publicly accessible (no private/login HTML redirect).
 * 3. Actual Content-Type is JPEG, PNG, or WebP (rejects HTML, SVG, executables).
 */
export async function validateGoogleDrivePhoto(rawUrl: string): Promise<DriveValidationResult> {
    const fileId = extractGoogleDriveFileId(rawUrl);
    if (!fileId) {
        return {
            valid: false,
            error: 'رابط Google Drive غير صالح. تأكد من نسخ رابط مشاركة صحيح من drive.google.com.',
        };
    }

    const candidateUrls = [
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/uc?export=view&id=${fileId}`,
    ];

    for (const targetUrl of candidateUrls) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 8000);

            const res = await fetch(targetUrl, {
                method: 'GET',
                redirect: 'follow',
                signal: controller.signal,
                headers: {
                    Range: 'bytes=0-1023',
                    Accept: 'image/jpeg,image/png,image/webp,*/*',
                },
            });

            clearTimeout(timeout);

            if (!res.ok) {
                continue;
            }

            // Ensure final URL after redirects is still a Google host (prevent open-redirect SSRF)
            try {
                const finalHost = new URL(res.url).hostname.toLowerCase();
                if (
                    !finalHost.endsWith('googleusercontent.com') &&
                    !finalHost.endsWith('google.com')
                ) {
                    return {
                        valid: false,
                        error: 'مصدر الصورة غير موثوق.',
                    };
                }
            } catch {
                continue;
            }

            const rawContentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();

            if (!ALLOWED_IMAGE_MIME_TYPES.has(rawContentType)) {
                if (rawContentType.includes('text/html')) {
                    return {
                        valid: false,
                        error: 'الملف غير متاح للعرض العام. تأكد من ضبط المشاركة على Anyone with the link – Viewer وأن الملف صورة.',
                    };
                }
                return {
                    valid: false,
                    error: `نوع الملف غير مدعوم (${rawContentType || 'unknown'}). يُسمح فقط بصور JPEG وPNG وWebP.`,
                };
            }

            return {
                valid: true,
                fileId,
                displayUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
                contentType: rawContentType,
            };
        } catch {
            // Try next candidate URL
        }
    }

    return {
        valid: false,
        error: 'تعذر الوصول إلى الصورة. تأكد من أن الرابط عام (Anyone with the link – Viewer) وأنه ملف صورة صالح.',
    };
}
