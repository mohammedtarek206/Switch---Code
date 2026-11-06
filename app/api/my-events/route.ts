import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import { authenticateRequest } from '@/lib/auth';
import Event from '@/models/Event';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const registrations = await EventRegistration.find({ userId: user.userId })
            .populate({
                path: 'eventId',
                model: Event,
                select: 'title date location isOnline whatsAppGroupLink status banner _id',
            })
            .sort({ createdAt: -1 });

        return NextResponse.json(registrations);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
