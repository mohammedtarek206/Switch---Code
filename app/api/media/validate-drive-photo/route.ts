import { NextRequest, NextResponse } from 'next/server';
import { validateGoogleDrivePhoto } from '@/lib/googleDrive';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const rl = checkRateLimit(`drive-validate:${ip}`, 30, 10 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { valid: false, error: 'Too many requests. Please wait a few minutes.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const url = typeof body?.url === 'string' ? body.url.trim() : '';
        if (!url) {
            return NextResponse.json(
                { valid: false, error: 'يرجى إدخال رابط Google Drive.' },
                { status: 400 }
            );
        }

        const result = await validateGoogleDrivePhoto(url);
        if (!result.valid) {
            return NextResponse.json(result, { status: 400 });
        }

        return NextResponse.json({
            valid: true,
            fileId: result.fileId,
            displayUrl: result.displayUrl,
            source: 'google_drive',
            contentType: result.contentType,
        });
    } catch {
        return NextResponse.json(
            { valid: false, error: 'حدث خطأ أثناء التحقق من رابط الصورة.' },
            { status: 500 }
        );
    }
}
