import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import MaterialProgress from '@/models/MaterialProgress';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Mark material as opened/completed
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { materialId } = await request.json();
        if (!materialId) return NextResponse.json({ error: 'materialId is required' }, { status: 400 });

        await connectDB();

        const progress = await MaterialProgress.findOneAndUpdate(
            { userId: user.userId, materialId },
            { userId: user.userId, materialId, openedAt: new Date(), completed: true },
            { upsert: true, new: true }
        );

        return NextResponse.json({ progress, message: 'Progress saved' });
    } catch (error: any) {
        console.error('Material progress error:', error);
        return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
    }
}
