import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const filter: Record<string, unknown> = {};
        const committeeId = searchParams.get('committeeId');
        const status = searchParams.get('status');
        const assigneeId = searchParams.get('assigneeId');

        if (committeeId) filter.committeeId = committeeId;
        if (status) filter.status = status;
        if (assigneeId) filter.assigneeId = assigneeId;

        const tasks = await Task.find(filter)
            .populate('assigneeId', 'name avatar')
            .populate('createdBy', 'name')
            .populate('committeeId', 'name color')
            .sort({ createdAt: -1 });

        return NextResponse.json(tasks);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_TASKS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { title, committeeId } = body;
        if (!title || !committeeId) {
            return NextResponse.json({ error: 'title and committeeId required' }, { status: 400 });
        }

        const task = await Task.create({ ...body, createdBy: user.userId });
        await logActivity(user.userId, 'CREATE_TASK', 'Task', task._id.toString(), { title });

        return NextResponse.json(task, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
