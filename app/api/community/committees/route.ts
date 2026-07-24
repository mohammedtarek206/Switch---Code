import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET() {
    try {
        await connectDB();
        const committees = await Committee.find()
            .populate('leaderId', 'name email avatar')
            .populate('viceLeaderId', 'name email avatar')
            .sort({ createdAt: -1 });
        return NextResponse.json(committees);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.CREATE_COMMITTEE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { name, description, image, type, icon, color } = body;

        if (!name || !description || !type) {
            return NextResponse.json({ error: 'name, description, type are required' }, { status: 400 });
        }

        const committee = await Committee.create({ name, description, image, type, icon, color });

        await logActivity(user.userId, 'CREATE_COMMITTEE', 'Committee', committee._id.toString(), { name });

        return NextResponse.json(committee, { status: 201 });
    } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Committee name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
