import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.VIEW_LOGS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const logs = await ActivityLog.find()
            .populate('userId', 'name role email')
            .sort({ createdAt: -1 })
            .limit(100);

        return NextResponse.json(logs);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
