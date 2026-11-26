import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import LMSAssignment from '@/models/LMSAssignment';
import InstructorAssignment from '@/models/InstructorAssignment';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { submissionId, score, feedback, status } = await req.json();
        if (!submissionId) {
            return NextResponse.json({ error: 'submissionId is required' }, { status: 400 });
        }

        await connectDB();
        const submission = await AssignmentSubmission.findById(submissionId);
        if (!submission) {
            return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
        }

        const assignment = await LMSAssignment.findById(submission.assignmentId).lean() as {
            _id: unknown;
            title: string;
            trackId: { toString(): string };
        } | null;

        if (!assignment) {
            return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
        }

        if (!isAdminRole(authUser.role)) {
            const assigned = await InstructorAssignment.findOne({
                userId: authUser.userId,
                trackId: assignment.trackId,
                status: 'approved',
            }).lean();
            if (!assigned) {
                return NextResponse.json(
                    { error: 'Forbidden: You are not assigned to this track' },
                    { status: 403 }
                );
            }
        }

        if (score !== undefined) submission.score = Number(score);
        if (feedback !== undefined) submission.feedback = String(feedback);
        if (status && ['submitted', 'reviewed', 'graded', 'returned'].includes(status)) {
            submission.status = status;
        } else {
            submission.status = 'graded';
        }
        submission.gradedBy = authUser.userId as never;
        submission.gradedAt = new Date();
        await submission.save();

        await createNotification({
            userId: submission.userId.toString(),
            title: 'تم تقييم تسليمك',
            message: `تمت مراجعة تسليمك في "${assignment.title}"${score !== undefined ? ` - الدرجة: ${score}` : ''}.`,
            type: 'success',
            link: '/learn/assignments',
        });

        await logActivity(authUser.userId, 'GRADE_SUBMISSION', 'AssignmentSubmission', submissionId, {
            score,
            status: submission.status,
        });

        return NextResponse.json({ submission, message: 'تم حفظ التقييم بنجاح.' });
    } catch (error) {
        console.error('Instructor submission PATCH error:', error);
        return NextResponse.json({ error: 'Failed to grade submission' }, { status: 500 });
    }
}
