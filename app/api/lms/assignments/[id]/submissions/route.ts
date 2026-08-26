import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Admin: view all submissions for a specific assignment
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        const submissions = await AssignmentSubmission.find({ assignmentId: params.id })
            .populate('userId', 'name email')
            .sort({ submittedAt: -1 });

        return NextResponse.json({ submissions });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
    }
}

// PATCH - Admin grades a submission
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { submissionId, score, feedback, status } = await request.json();
        await connectDB();

        const submission = await AssignmentSubmission.findByIdAndUpdate(
            submissionId,
            { score, feedback, status: status || 'graded', gradedBy: user.userId, gradedAt: new Date() },
            { new: true }
        );

        if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

        return NextResponse.json({ submission, message: 'Submission graded' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 });
    }
}
