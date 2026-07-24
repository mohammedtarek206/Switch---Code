import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import { authenticateRequest } from '@/lib/auth';

// POST check-in/check-out via QR
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { registrationId, action } = await req.json();
        if (!registrationId || !action) {
            return NextResponse.json({ error: 'registrationId and action required' }, { status: 400 });
        }

        const update: Record<string, unknown> = {};
        if (action === 'checkin') {
            update.checkIn = new Date();
            update.attended = true;
        } else if (action === 'checkout') {
            update.checkOut = new Date();
        } else {
            return NextResponse.json({ error: 'action must be checkin or checkout' }, { status: 400 });
        }

        const reg = await EventRegistration.findByIdAndUpdate(registrationId, update, { new: true });
        if (!reg) return NextResponse.json({ error: 'Registration not found' }, { status: 404 });

        return NextResponse.json(reg);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
