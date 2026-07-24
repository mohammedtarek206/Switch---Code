import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import { authenticateRequest } from '@/lib/auth';

// POST add a comment to a task
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { content } = await req.json();
        if (!content) return NextResponse.json({ error: 'content required' }, { status: 400 });

        const task = await Task.findByIdAndUpdate(
            params.id,
            { $push: { comments: { authorId: user.userId, content, createdAt: new Date() } } },
            { new: true }
        ).populate('comments.authorId', 'name avatar');

        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });
        return NextResponse.json(task.comments);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
