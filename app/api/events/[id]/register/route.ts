import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { name, email, phone, university, faculty } = await req.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
        }

        await connectDB();

        const event = await Event.findById(params.id);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (!event.registrationOpen) {
            return NextResponse.json({ error: 'Registration for this event is closed' }, { status: 400 });
        }

        if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
            return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
        }

        // Check capacity
        const currentRegs = await EventRegistration.countDocuments({ eventId: params.id, status: { $ne: 'rejected' } });
        let status: 'registered' | 'waitlist' = 'registered';

        if (event.seats && currentRegs >= event.seats) {
            if (event.hasWaitingList) {
                status = 'waitlist';
            } else {
                return NextResponse.json({ error: 'Event is fully booked' }, { status: 400 });
            }
        }

        // Check duplicate
        const existing = await EventRegistration.findOne({ eventId: params.id, email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json({ error: 'You have already registered for this event with this email' }, { status: 400 });
        }

        const registration = await EventRegistration.create({
            eventId: params.id,
            name,
            email: email.toLowerCase(),
            phone,
            university,
            faculty,
            status,
            attended: false,
        });

        return NextResponse.json({
            message: status === 'waitlist' ? 'Added to waiting list' : 'Successfully registered!',
            registration
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
    }
}
