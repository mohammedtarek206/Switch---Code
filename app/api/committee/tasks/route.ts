import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import Committee from '@/models/Committee';
import CommunityTeam from '@/models/CommunityTeam';
import { authenticateRequest } from '@/lib/auth';

const LEADER_ROLES = ['committee_leader', 'vice_committee_leader', 'admin', 'super_admin', 'president', 'vice_president'];

/* ─────────── GET: List tasks for this committee ─────────── */
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const _c = Committee; const _t = CommunityTeam;

        const { searchParams } = new URL(request.url);
        const committeeId = searchParams.get('committeeId');
        const memberId = searchParams.get('memberId'); // filter by single member
        const status = searchParams.get('status');
        const priority = searchParams.get('priority');

        const filter: any = {};

        if (committeeId) {
            filter.committeeId = committeeId;
        } else {
            // default to requesting user's committee
            const dbUser = await User.findById(user.userId).select('committeeId role');
            if (!dbUser?.committeeId) return NextResponse.json([], { status: 200 });
            filter.committeeId = dbUser.committeeId;
        }

        // Non-leaders only see their own tasks
        if (!LEADER_ROLES.includes(user.role)) {
            filter.assignees = user.userId;
        } else if (memberId) {
            filter.assignees = memberId;
        }

        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        const tasks = await Task.find(filter)
            .populate('assignees', 'name avatar username')
            .populate('createdBy', 'name avatar')
            .populate('reviewedBy', 'name')
            .sort({ createdAt: -1 })
            .lean();

        return NextResponse.json(tasks, { status: 200 });
    } catch (error: any) {
        console.error('Tasks GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/* ─────────── POST: Create task (leaders only) ─────────── */
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !LEADER_ROLES.includes(user.role)) {
            return NextResponse.json({ error: 'Only leaders can create tasks' }, { status: 403 });
        }

        const data = await request.json();
        if (!data.title || !data.committeeId) {
            return NextResponse.json({ error: 'Title and Committee are required' }, { status: 400 });
        }

        await connectDB();

        const task = new Task({
            ...data,
            createdBy: user.userId,
            activityLog: [{ actorId: user.userId, action: 'Task created', createdAt: new Date() }],
        });
        await task.save();

        const populated = await Task.findById(task._id)
            .populate('assignees', 'name avatar username')
            .populate('createdBy', 'name avatar');

        return NextResponse.json(populated, { status: 201 });
    } catch (error: any) {
        console.error('Tasks POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/* ─────────── PUT: Update task ─────────── */
export async function PUT(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const data = await request.json();
        const { id, action, ...fields } = data;
        if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });

        await connectDB();
        const task = await Task.findById(id);
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const isLeader = LEADER_ROLES.includes(user.role);
        const isAssignee = task.assignees.map((a: any) => a.toString()).includes(user.userId);

        // Member actions
        if (action === 'UPDATE_PROGRESS') {
            if (!isAssignee && !isLeader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            task.progress = fields.progress;
            if (fields.progress === 100 && task.status === 'in_progress') task.status = 'review';
            if (fields.progress > 0 && task.status === 'todo') task.status = 'in_progress';
            task.activityLog.push({ actorId: user.userId, action: `Progress updated to ${fields.progress}%`, createdAt: new Date() });
        } else if (action === 'ADD_COMMENT') {
            task.comments.push({ authorId: user.userId, content: fields.content, createdAt: new Date() });
            task.activityLog.push({ actorId: user.userId, action: 'Comment added', createdAt: new Date() });
        } else if (action === 'REQUEST_REVIEW') {
            if (!isAssignee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            task.status = 'review';
            task.activityLog.push({ actorId: user.userId, action: 'Review requested', createdAt: new Date() });
        } else if (action === 'TOGGLE_CHECKLIST') {
            const item = task.checklist.id(fields.checklistItemId);
            if (item) item.done = !item.done;
        }
        // Leader review actions
        else if (action === 'APPROVE') {
            if (!isLeader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            task.status = 'done';
            task.reviewNote = fields.reviewNote || 'Approved';
            task.reviewedBy = user.userId;
            task.reviewedAt = new Date();
            task.activityLog.push({ actorId: user.userId, action: 'Task approved', createdAt: new Date() });
        } else if (action === 'REJECT') {
            if (!isLeader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            task.status = 'revision';
            task.reviewNote = fields.reviewNote || 'Needs revision';
            task.reviewedBy = user.userId;
            task.reviewedAt = new Date();
            task.activityLog.push({ actorId: user.userId, action: 'Task sent back for revision', createdAt: new Date() });
        } else if (action === 'REOPEN') {
            if (!isLeader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            task.status = 'in_progress';
            task.activityLog.push({ actorId: user.userId, action: 'Task reopened', createdAt: new Date() });
        }
        // Full update (leader)
        else {
            if (!isLeader) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            Object.assign(task, fields);
            task.activityLog.push({ actorId: user.userId, action: 'Task updated', createdAt: new Date() });
        }

        await task.save();
        const populated = await Task.findById(id).populate('assignees', 'name avatar username').populate('createdBy', 'name').populate('reviewedBy', 'name');
        return NextResponse.json(populated, { status: 200 });
    } catch (error: any) {
        console.error('Tasks PUT error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/* ─────────── DELETE ─────────── */
export async function DELETE(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !LEADER_ROLES.includes(user.role)) {
            return NextResponse.json({ error: 'Only leaders can delete tasks' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Task ID required' }, { status: 400 });

        await connectDB();
        await Task.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Task deleted' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
