import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSAssignment from '@/models/LMSAssignment';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - All assignments for admin with submission counts
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();
        const assignments = await LMSAssignment.find({}).populate('trackId', 'name').sort({ createdAt: -1 });

        const assignmentIds = assignments.map((a) => a._id);
        const counts = await AssignmentSubmission.aggregate([
            { $match: { assignmentId: { $in: assignmentIds } } },
            { $group: { _id: '$assignmentId', count: { $sum: 1 } } },
        ]);

        const countsMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

        const result = assignments.map((a) => ({
            ...a.toObject(),
            submissionCount: countsMap.get(a._id.toString()) || 0,
        }));

        return NextResponse.json({ assignments: result });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}
