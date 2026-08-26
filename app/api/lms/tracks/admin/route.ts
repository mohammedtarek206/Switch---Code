import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSTrack from '@/models/LMSTrack';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - All tracks including inactive (admin view)
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();
        const tracks = await LMSTrack.find({}).sort({ sortOrder: 1, createdAt: -1 });
        return NextResponse.json({ tracks });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch tracks' }, { status: 500 });
    }
}
