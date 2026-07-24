import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Badge from '@/models/Badge';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

// POST grant a badge to a member
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_BADGES)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { badgeId } = await req.json();
        const badge = await Badge.findById(badgeId);
        if (!badge) return NextResponse.json({ error: 'Badge not found' }, { status: 404 });

        const member = await User.findByIdAndUpdate(
            params.id,
            { $addToSet: { badges: badgeId } },
            { new: true }
        ).populate('badges', 'name icon color');

        await logActivity(user.userId, 'GRANT_BADGE', 'User', params.id, { badgeId, badgeName: badge.name });
        return NextResponse.json(member?.badges);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE remove a badge from a member
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_BADGES)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { badgeId } = await req.json();
        const member = await User.findByIdAndUpdate(
            params.id,
            { $pull: { badges: badgeId } },
            { new: true }
        ).populate('badges', 'name icon color');

        await logActivity(user.userId, 'REVOKE_BADGE', 'User', params.id, { badgeId });
        return NextResponse.json(member?.badges);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
