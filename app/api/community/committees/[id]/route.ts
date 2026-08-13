import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';
import { revalidatePath } from 'next/cache';

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
        if (body.name && !body.slug) {
            body.slug = body.name
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
        }

        const committee = await Committee.findByIdAndUpdate(params.id, body, { new: true });
        if (!committee) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'EDIT_COMMITTEE', 'Committee', params.id, body);

        try {
            revalidatePath('/join');
        } catch (e) {
            console.error('Error revalidating path:', e);
        }

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

        try {
            revalidatePath('/join');
        } catch (e) {
            console.error('Error revalidating path:', e);
        }

        return NextResponse.json({ message: 'Deleted' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
