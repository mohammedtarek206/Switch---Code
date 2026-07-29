import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const event = await Event.findById(params.id);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const applications = await EventRegistration.find({ eventId: params.id }).sort({ createdAt: -1 }).lean();

        const stats = {
            total: applications.length,
            accepted: applications.filter((a: any) => a.status === 'accepted').length,
            rejected: applications.filter((a: any) => a.status === 'rejected').length,
            waitlist: applications.filter((a: any) => a.status === 'waitlist').length,
            registered: applications.filter((a: any) => a.status === 'registered').length,
            attended: applications.filter((a: any) => a.attended).length,
            checkedIn: applications.filter((a: any) => a.checkIn).length,
            checkedOut: applications.filter((a: any) => a.checkOut).length,
        };

        return NextResponse.json({ event, applications, stats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { registrationId, status, action } = await req.json();

        const reg = await EventRegistration.findById(registrationId);
        if (!reg) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        if (status) {
            reg.status = status;
        }

        if (action === 'checkin') {
            reg.checkIn = new Date();
            reg.attended = true;
        } else if (action === 'checkout') {
            reg.checkOut = new Date();
        }

        await reg.save();
        return NextResponse.json({ message: 'Updated successfully', registration: reg });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
