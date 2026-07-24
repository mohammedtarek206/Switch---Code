import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET() {
    try {
        await connectDB();
        const events = await Event.find()
            .populate('committeeId', 'name color')
            .populate('createdBy', 'name')
            .sort({ date: -1 });
        return NextResponse.json(events);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.CREATE_EVENT)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { title, description, date } = body;

        if (!title || !description || !date) {
            return NextResponse.json({ error: 'title, description, date required' }, { status: 400 });
        }

        const event = await Event.create({ ...body, createdBy: user.userId });
        await logActivity(user.userId, 'CREATE_EVENT', 'Event', event._id.toString(), { title });

        return NextResponse.json(event, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
