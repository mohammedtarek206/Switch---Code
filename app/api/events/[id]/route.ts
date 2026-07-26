import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const event = await Event.findById(params.id).lean() as any;

        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const registeredCount = await EventRegistration.countDocuments({
            eventId: params.id,
            status: { $ne: 'rejected' }
        });

        const seatsLeft = event.seats ? Math.max(0, event.seats - registeredCount) : null;

        return NextResponse.json({
            ...event,
            seatsLeft
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
