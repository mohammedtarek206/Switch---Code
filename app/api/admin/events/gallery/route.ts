import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventGalleryImage from '@/models/EventGalleryImage';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        // Only admins
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const url = new URL(req.url);
        const eventId = url.searchParams.get('eventId');

        const query: any = {};
        if (eventId) {
            query.eventId = eventId;
        }

        const images = await EventGalleryImage.find(query)
            .populate('eventId', 'title _id')
            .sort({ order: 1, createdAt: -1 })
            .lean();

        return NextResponse.json(images);
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();

        // Expects an array of images to insert at once
        const { images } = body;

        if (!images || !Array.isArray(images) || images.length === 0) {
            return NextResponse.json({ error: 'No images provided' }, { status: 400 });
        }

        const docsToInsert = images.map((img: any) => ({
            ...img,
            createdBy: user.userId,
        }));

        const inserted = await EventGalleryImage.insertMany(docsToInsert);

        // Return populated versions
        const populated = await EventGalleryImage.find({ _id: { $in: inserted.map(i => i._id) } })
            .populate('eventId', 'title _id');

        return NextResponse.json(populated, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
