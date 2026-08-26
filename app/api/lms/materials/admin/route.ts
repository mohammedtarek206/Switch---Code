import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSMaterial from '@/models/LMSMaterial';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();
        const materials = await LMSMaterial.find({}).populate('trackId', 'name').sort({ createdAt: -1 });
        return NextResponse.json({ materials });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch materials' }, { status: 500 });
    }
}
