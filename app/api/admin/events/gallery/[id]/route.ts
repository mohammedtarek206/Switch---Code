import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventGalleryImage from '@/models/EventGalleryImage';
import { authenticateRequest } from '@/lib/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();

        const image = await EventGalleryImage.findByIdAndUpdate(params.id, body, { new: true })
            .populate('eventId', 'title _id');

        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        return NextResponse.json(image);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const image = await EventGalleryImage.findById(params.id);
        if (!image) {
            return NextResponse.json({ error: 'Image not found' }, { status: 404 });
        }

        // Try to delete from Cloudinary first
        if (image.publicId) {
            try {
                await cloudinary.uploader.destroy(image.publicId);
            } catch (cloudErr) {
                console.error("Cloudinary deletion failed, continuing DB deletion:", cloudErr);
            }
        }

        await EventGalleryImage.findByIdAndDelete(params.id);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
