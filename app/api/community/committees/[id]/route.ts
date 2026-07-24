import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const committee = await Committee.findById(params.id)
            .populate('leaderId', 'name email avatar role')
            .populate('viceLeaderId', 'name email avatar role');
        if (!committee) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(committee);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.EDIT_COMMITTEE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const committee = await Committee.findByIdAndUpdate(params.id, body, { new: true });
        if (!committee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'EDIT_COMMITTEE', 'Committee', params.id, body);

        return NextResponse.json(committee);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.DELETE_COMMITTEE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const committee = await Committee.findByIdAndDelete(params.id);
        if (!committee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'DELETE_COMMITTEE', 'Committee', params.id);

        return NextResponse.json({ message: 'Deleted' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
