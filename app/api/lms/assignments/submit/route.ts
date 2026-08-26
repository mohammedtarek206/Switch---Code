import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import LMSAssignment from '@/models/LMSAssignment';
import LMSEnrollment from '@/models/LMSEnrollment';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Student submits assignment
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { assignmentId, submissionText, submissionUrl } = await request.json();
        if (!assignmentId) return NextResponse.json({ error: 'assignmentId is required' }, { status: 400 });

        await connectDB();

        // Verify assignment exists
        const assignment = await LMSAssignment.findById(assignmentId);
        if (!assignment) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });

        // Verify enrollment
        const enrollment = await LMSEnrollment.findOne({ userId: user.userId, trackId: assignment.trackId });
        if (!enrollment) return NextResponse.json({ error: 'Not enrolled in this track' }, { status: 403 });

        // Check deadline
        if (assignment.deadline && new Date() > assignment.deadline) {
            return NextResponse.json({ error: 'Assignment deadline has passed' }, { status: 400 });
        }

        // Upsert submission (student can resubmit)
        const submission = await AssignmentSubmission.findOneAndUpdate(
            { userId: user.userId, assignmentId },
            {
                userId: user.userId,
                assignmentId,
                submissionText,
                submissionUrl,
                submittedAt: new Date(),
                status: 'submitted',
            },
            { upsert: true, new: true }
        );

        return NextResponse.json({ submission, message: 'Assignment submitted successfully' });
    } catch (error: any) {
        console.error('Assignment submit error:', error);
        return NextResponse.json({ error: 'Failed to submit assignment' }, { status: 500 });
    }
}
