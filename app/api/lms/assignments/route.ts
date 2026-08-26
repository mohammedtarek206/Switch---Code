import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSAssignment from '@/models/LMSAssignment';
import LMSEnrollment from '@/models/LMSEnrollment';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch assignments for student's enrolled track
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const enrollment = await LMSEnrollment.findOne({ userId: user.userId, status: 'active' });
        if (!enrollment) {
            return NextResponse.json({ assignments: [], noTrack: true });
        }

        const assignments = await LMSAssignment.find({
            trackId: enrollment.trackId,
            published: true,
        }).sort({ order: 1, deadline: 1 });

        const assignmentIds = assignments.map((a) => a._id);
        const submissions = await AssignmentSubmission.find({
            userId: user.userId,
            assignmentId: { $in: assignmentIds },
        });

        const submissionsMap = new Map(submissions.map((s) => [s.assignmentId.toString(), s]));

        const assignmentsWithStatus = assignments.map((assignment) => {
            const submission = submissionsMap.get(assignment._id.toString());
            return {
                ...assignment.toObject(),
                submission: submission
                    ? {
                        status: submission.status,
                        submittedAt: submission.submittedAt,
                        score: submission.score,
                        feedback: submission.feedback,
                    }
                    : null,
            };
        });

        return NextResponse.json({ assignments: assignmentsWithStatus, trackId: enrollment.trackId });
    } catch (error: any) {
        console.error('Assignments GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}

// POST - Admin creates assignment
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: Token expired or missing. Please log in again.' }, { status: 401 });
        }
        if (!isLMSAdmin(user.role)) {
            return NextResponse.json({ error: `Unauthorized: Role '${user.role}' is not allowed to manage assignments.` }, { status: 403 });
        }

        const data = await request.json();
        await connectDB();

        const assignment = new LMSAssignment({ ...data, createdBy: user.userId });
        await assignment.save();

        return NextResponse.json({ assignment, message: 'Assignment created successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Assignments POST error:', error);
        return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
    }
}
