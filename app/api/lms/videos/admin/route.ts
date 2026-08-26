import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSVideo from '@/models/LMSVideo';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - All videos (admin)
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();
        const videos = await LMSVideo.find({}).populate('trackId', 'name').sort({ createdAt: -1 });
        return NextResponse.json({ videos });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}
