import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventGalleryImage from '@/models/EventGalleryImage';
import Event from '@/models/Event';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        // Get optional eventId filter
        const url = new URL(req.url);
        const eventId = url.searchParams.get('eventId');

        const query: any = { isPublished: true };
        if (eventId) {
            query.eventId = eventId;
        }

        const images = await EventGalleryImage.find(query)
            .populate({ path: 'eventId', select: 'title date location isOnline status banner _id' })
            .sort({ order: 1, createdAt: -1 })
            .lean();

        // Ensure we group by event if that's preferred by frontend, 
        // or just return the flat array. NextJS frontend will group it.
        return NextResponse.json(images, {
            headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=120' }
        });
    } catch (error) {
        console.error('Gallery GET Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
