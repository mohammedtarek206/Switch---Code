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
            return NextResponse.json({
                message: 'You are already registered! Here is your barcode again.',
                registration: existing
            }, { status: 200 }); // Status 200 so UI treats it as success and shows barcode
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
