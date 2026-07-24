import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_APPLICATIONS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const application = await Application.findById(params.id)
            .populate('committeeId', 'name type color')
            .populate('recruitmentId', 'name')
            .populate('interview.interviewerId', 'name email');

        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(application);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_APPLICATIONS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const application = await Application.findByIdAndUpdate(params.id, body, { new: true });
        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'UPDATE_APPLICATION', 'Application', params.id, body);
        return NextResponse.json(application);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
