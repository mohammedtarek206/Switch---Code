import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Badge from '@/models/Badge';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET() {
    try {
        await connectDB();
        const badges = await Badge.find().sort({ name: 1 });
        return NextResponse.json(badges);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_BADGES)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { name, description, icon, color, isAuto, autoCondition } = await req.json();
        if (!name || !description) {
            return NextResponse.json({ error: 'name and description required' }, { status: 400 });
        }

        const badge = await Badge.create({ name, description, icon, color, isAuto, autoCondition });
        await logActivity(user.userId, 'CREATE_BADGE', 'Badge', badge._id.toString(), { name });

        return NextResponse.json(badge, { status: 201 });
    } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 11000) return NextResponse.json({ error: 'Badge name exists' }, { status: 409 });
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_BADGES)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id, ...update } = await req.json();
        const badge = await Badge.findByIdAndUpdate(id, update, { new: true });
        if (!badge) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(badge);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_BADGES)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id } = await req.json();
        await Badge.findByIdAndDelete(id);

        await logActivity(user.userId, 'DELETE_BADGE', 'Badge', id);
        return NextResponse.json({ message: 'Deleted' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
