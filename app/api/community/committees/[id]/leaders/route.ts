import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

// PUT assign/change leader and vice leader
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (
            !hasPermission(user.role, userPerms, PERMISSIONS.ASSIGN_LEADER) &&
            !hasPermission(user.role, userPerms, PERMISSIONS.ASSIGN_VICE_LEADER)
        ) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { leaderId, viceLeaderId } = await req.json();
        const update: Record<string, unknown> = {};
        if (leaderId !== undefined) update.leaderId = leaderId || null;
        if (viceLeaderId !== undefined) update.viceLeaderId = viceLeaderId || null;

        const committee = await Committee.findByIdAndUpdate(params.id, update, { new: true })
            .populate('leaderId', 'name email avatar')
            .populate('viceLeaderId', 'name email avatar');

        if (!committee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'ASSIGN_LEADERS', 'Committee', params.id, update);

        return NextResponse.json(committee);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
