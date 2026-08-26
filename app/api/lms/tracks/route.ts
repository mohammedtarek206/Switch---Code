import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSTrack from '@/models/LMSTrack';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - All active LMS tracks (public for authenticated users)
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const tracks = await LMSTrack.find({ status: 'active' }).sort({ sortOrder: 1, createdAt: -1 });
        return NextResponse.json({ tracks });
    } catch (error: any) {
        console.error('LMS Tracks GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
    }
}

// POST - Admin creates new LMS track
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: Token expired or missing. Please log in again.' }, { status: 401 });
        }
        if (!isLMSAdmin(user.role)) {
            return NextResponse.json({ error: `Unauthorized: Role '${user.role}' is not allowed to manage tracks.` }, { status: 403 });
        }

        const data = await request.json();
        await connectDB();

        const track = new LMSTrack({ ...data, createdBy: user.userId });
        await track.save();

        return NextResponse.json({ track, message: 'Track created successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('LMS Tracks POST error:', error);
        return NextResponse.json({ error: 'Failed to create track' }, { status: 500 });
    }
}
