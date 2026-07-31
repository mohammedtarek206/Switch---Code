import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import Event from '@/models/Event';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const search = searchParams.get('search') || '';
        const eventId = searchParams.get('eventId') || '';
        const status = searchParams.get('status') || '';
        const university = searchParams.get('university') || '';
        const governorate = searchParams.get('governorate') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = parseInt(searchParams.get('limit') || '50', 10);

        const filter: any = {};

        if (eventId) {
            filter.eventId = eventId;
        }

        if (status) {
            filter.status = status;
        }

        if (university) {
            filter.university = { $regex: university, $options: 'i' };
        }

        if (governorate) {
            filter.governorate = { $regex: governorate, $options: 'i' };
        }

        if (search) {
            // Find matching events by title first
            const matchingEvents = await Event.find({ title: { $regex: search, $options: 'i' } }).select('_id');
            const matchingEventIds = matchingEvents.map(e => e._id);

            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { eventId: { $in: matchingEventIds } }
            ];
        }

        const skip = (page - 1) * limit;

        const [applications, totalCount, allEvents] = await Promise.all([
            EventRegistration.find(filter)
                .populate('eventId', 'title date location')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            EventRegistration.countDocuments(filter),
            Event.find().select('_id title date').sort({ createdAt: -1 }).lean()
        ]);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const [totalApps, pendingApps, acceptedApps, rejectedApps, todayApps] = await Promise.all([
            EventRegistration.countDocuments(),
            EventRegistration.countDocuments({ status: 'pending' }),
            EventRegistration.countDocuments({ status: 'accepted' }),
            EventRegistration.countDocuments({ status: 'rejected' }),
            EventRegistration.countDocuments({ createdAt: { $gte: startOfToday } })
        ]);

        const stats = {
            total: totalApps,
            pending: pendingApps,
            accepted: acceptedApps,
            rejected: rejectedApps,
            today: todayApps
        };

        return NextResponse.json({
            applications,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit)
            },
            stats,
            events: allEvents
        });
    } catch (error: any) {
        console.error('Fetch Event Applications Error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { registrationId, status, adminNotes, action } = await req.json();

        const reg = await EventRegistration.findById(registrationId);
        if (!reg) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        if (status) {
            reg.status = status;
        }

        if (adminNotes !== undefined) {
            reg.adminNotes = adminNotes;
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
        console.error('Update Event Registration Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
