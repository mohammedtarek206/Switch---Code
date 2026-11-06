import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { authenticateRequest } from '@/lib/auth';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        const ALLOWED_ROLES = ['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr', 'media', 'marketing'];
        if (!user || !ALLOWED_ROLES.includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File;
        const folder = formData.get('folder') as string || 'it-spark/events/general';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Validate image
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Only JPEG, PNG, WEBP are allowed.' }, { status: 400 });
        }

        if (file.size > 10 * 1024 * 1024) { // 10 MB limit
            return NextResponse.json({ error: 'Image size is too large. Max 10MB.' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder,
                    format: 'auto',
                    quality: 'auto',
                    resource_type: 'image',
                },
                (error, result) => {
                    if (error) return reject(error);
                    resolve(result);
                }
            );
            uploadStream.end(buffer);
        });

        return NextResponse.json({
            imageUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
        }, { status: 200 });

    } catch (error: any) {
        console.error('Cloudinary Upload Error:', error);
        return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
    }
}
