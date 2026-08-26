import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSEnrollment from '@/models/LMSEnrollment';
import LMSTrack from '@/models/LMSTrack';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get the current user's enrollment
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const enrollment = await LMSEnrollment.findOne({ userId: user.userId }).populate('trackId');
        return NextResponse.json({ enrollment });
    } catch (error: any) {
        console.error('Enrollment GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch enrollment' }, { status: 500 });
    }
}

// POST - Enroll in a track (or switch tracks)
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { trackId } = await request.json();
        if (!trackId) return NextResponse.json({ error: 'trackId is required' }, { status: 400 });

        await connectDB();

        // Verify track exists and is active
        const track = await LMSTrack.findOne({ _id: trackId, status: 'active' });
        if (!track) return NextResponse.json({ error: 'Track not found or inactive' }, { status: 404 });

        // Upsert enrollment (user can switch track)
        const enrollment = await LMSEnrollment.findOneAndUpdate(
            { userId: user.userId },
            {
                userId: user.userId,
                trackId,
                enrollmentDate: new Date(),
                status: 'active',
            },
            { upsert: true, new: true }
        ).populate('trackId');

        return NextResponse.json({ enrollment, message: 'Enrolled successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Enrollment POST error:', error);
        return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 });
    }
}
