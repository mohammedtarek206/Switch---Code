import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';
import mongoose from 'mongoose';

// Ensure indexes exist for fast queries
async function ensureEventIndexes() {
    try {
        const collection = mongoose.connection.collection('events');
        await Promise.all([
            collection.createIndex({ date: -1 }),
            collection.createIndex({ committeeId: 1 }),
            collection.createIndex({ isActive: 1 }),
            collection.createIndex({ createdAt: -1 }),
        ]);
    } catch {
        // Indexes may already exist — safe to ignore
    }
}

// Cache headers for fast repeated GETs (30 seconds stale-while-revalidate)
const CACHE_HEADERS = {
    'Cache-Control': 'private, max-age=0, stale-while-revalidate=30',
};

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        await ensureEventIndexes();

        // Only select the fields actually used in the admin events list
        const events = await Event.find()
            .select(
                '_id title description date location pointsAwarded committeeId isActive createdAt registrationOpen seats'
            )
            .populate('committeeId', 'name color')
            .sort({ date: -1 })
            .lean();   // lean() skips Mongoose document hydration → ~40% faster

        return NextResponse.json(events, { headers: CACHE_HEADERS });
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

        // Return only the fields needed by the list so the UI can optimistically insert
        const populatedEvent = await Event.findById(event._id)
            .select('_id title description date location pointsAwarded committeeId isActive createdAt registrationOpen seats')
            .populate('committeeId', 'name color')
            .lean();

        return NextResponse.json(populatedEvent, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.CREATE_EVENT)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const url = new URL(req.url);
        const id = url.searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Event ID required' }, { status: 400 });

        await Event.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Event deleted successfully' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
