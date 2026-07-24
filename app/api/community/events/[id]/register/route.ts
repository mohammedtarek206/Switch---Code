import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import Event from '@/models/Event';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const registrations = await EventRegistration.find({ eventId: params.id })
            .populate('userId', 'name email')
            .sort({ createdAt: -1 });
        return NextResponse.json(registrations);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const event = await Event.findById(params.id);
        if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        if (!event.registrationOpen) return NextResponse.json({ error: 'Registration is closed' }, { status: 400 });

        const body = await req.json();
        const { name, email, phone, formData } = body;
        if (!name || !email) return NextResponse.json({ error: 'name and email required' }, { status: 400 });

        // Check seats
        if (event.seats) {
            const count = await EventRegistration.countDocuments({ eventId: params.id });
            if (count >= event.seats) {
                return NextResponse.json({ error: 'Event is full' }, { status: 400 });
            }
        }

        const reg = await EventRegistration.create({
            eventId: params.id,
            name,
            email,
            phone,
            formData: formData || {},
        });

        return NextResponse.json({ message: 'Registered successfully', id: reg._id }, { status: 201 });
    } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Already registered' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
