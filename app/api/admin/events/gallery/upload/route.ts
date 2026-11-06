import { NextRequest, NextResponse } from 'next/server';
import cloudinary from '@/lib/cloudinary';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        // Only Admins / Super Admins with specific roles can upload. Or users with edit event permission.
        if (!['admin', 'super_admin'].includes(user.role) && !hasPermission(user.role, userPerms, PERMISSIONS.EDIT_EVENT)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'it-spark/general';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate File
        const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPG, PNG, WEBP allowed.' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) { // 10 MB
            return NextResponse.json({ error: 'Image size is too large. Max allowed is 10MB.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload using upload_stream
        const uploadResult = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    resource_type: 'image',
                    format: 'webp', // Auto convert to webp
                    transformation: [
                        { quality: 'auto', fetch_format: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            imageUrl: (uploadResult as any).secure_url,
            publicId: (uploadResult as any).public_id,
        });
    } catch (error: any) {
        console.error('Cloudinary upload error:', error);
        return NextResponse.json({ error: 'Failed to upload image. Please try again.' }, { status: 500 });
    }
}
