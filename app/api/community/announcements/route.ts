import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const announcements = await Announcement.find()
            .populate('createdBy', 'name')
            .sort({ createdAt: -1 })
            .limit(50);
        return NextResponse.json(announcements);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_ANNOUNCEMENTS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { title, body, targetType, targetId } = await req.json();
        if (!title || !body) {
            return NextResponse.json({ error: 'title and body required' }, { status: 400 });
        }

        const announcement = await Announcement.create({
            title, body,
            targetType: targetType || 'all',
            targetId,
            createdBy: user.userId,
        });

        await logActivity(user.userId, 'CREATE_ANNOUNCEMENT', 'Announcement', announcement._id.toString(), { title });

        return NextResponse.json(announcement, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_ANNOUNCEMENTS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id } = await req.json();
        await Announcement.findByIdAndDelete(id);

        await logActivity(user.userId, 'DELETE_ANNOUNCEMENT', 'Announcement', id);
        return NextResponse.json({ message: 'Deleted' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
