import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import VideoProgress from '@/models/VideoProgress';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Mark video progress
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { videoId, watchedDuration, completed } = await request.json();
        if (!videoId) return NextResponse.json({ error: 'videoId is required' }, { status: 400 });

        await connectDB();

        const progress = await VideoProgress.findOneAndUpdate(
            { userId: user.userId, videoId },
            {
                userId: user.userId,
                videoId,
                watchedDuration: watchedDuration || 0,
                completed: completed || false,
                lastWatchedAt: new Date(),
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ progress, message: 'Progress updated' });
    } catch (error: any) {
        console.error('Video progress error:', error);
        return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }
}
