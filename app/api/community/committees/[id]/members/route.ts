import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import CommitteeMember from '@/models/CommitteeMember';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

// GET all members of a committee
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const members = await CommitteeMember.find({ committeeId: params.id })
            .populate('userId', 'name email avatar role performanceScore');
        return NextResponse.json(members);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST add a member to committee
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_MEMBERS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { userId, position } = await req.json();
        if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

        // Verify user exists
        const targetUser = await User.findById(userId);
        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const member = await CommitteeMember.create({
            userId,
            committeeId: params.id,
            position: position || 'Member',
        });

        // Update user's committeeId if not set
        if (!targetUser.committeeId) {
            await User.findByIdAndUpdate(userId, { committeeId: params.id });
        }

        await logActivity(user.userId, 'ADD_MEMBER', 'Committee', params.id, { userId, position });

        return NextResponse.json(member, { status: 201 });
    } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Member already in this committee' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT update member position/status
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_MEMBERS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { memberId, position, status } = await req.json();
        const update: Record<string, unknown> = {};
        if (position !== undefined) update.position = position;
        if (status !== undefined) update.status = status;

        const member = await CommitteeMember.findByIdAndUpdate(memberId, update, { new: true });
        if (!member) return NextResponse.json({ error: 'Member not found' }, { status: 404 });

        await logActivity(user.userId, 'UPDATE_MEMBER', 'Committee', params.id, { memberId, ...update });

        return NextResponse.json(member);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE remove member from committee
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_MEMBERS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { memberId } = await req.json();
        await CommitteeMember.findByIdAndDelete(memberId);

        await logActivity(user.userId, 'REMOVE_MEMBER', 'Committee', params.id, { memberId });

        return NextResponse.json({ message: 'Member removed' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
