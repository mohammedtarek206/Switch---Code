import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventQuestion from '@/models/EventQuestion';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const event = await Event.findById(params.id)
            .populate('committeeId', 'name color')
            .populate('createdBy', 'name email');
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(event);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.EDIT_EVENT)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();

        // Sync questions if provided
        if (body.questions && Array.isArray(body.questions)) {
            // Re-create the questions array for simplicity
            await EventQuestion.deleteMany({ eventId: params.id });
            const qs = body.questions.map((q: any) => ({
                ...q,
                eventId: params.id,
            }));
            await EventQuestion.insertMany(qs);
        }
        delete body.questions; // remove from event fields

        const event = await Event.findByIdAndUpdate(params.id, body, { new: true });
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'EDIT_EVENT', 'Event', params.id, body);
        return NextResponse.json(event);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.DELETE_EVENT)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const event = await Event.findByIdAndDelete(params.id);
        if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'DELETE_EVENT', 'Event', params.id);
        return NextResponse.json({ message: 'Deleted' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
