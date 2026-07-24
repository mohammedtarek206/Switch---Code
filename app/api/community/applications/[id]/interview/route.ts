import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

// POST or PUT interview data for an application
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_INTERVIEWS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { date, interviewerId, technicalScore, hrScore, communication, problemSolving, notes, decision } = body;

        const interview: Record<string, unknown> = {};
        if (date !== undefined) interview['interview.date'] = date;
        if (interviewerId !== undefined) interview['interview.interviewerId'] = interviewerId;
        if (technicalScore !== undefined) interview['interview.technicalScore'] = technicalScore;
        if (hrScore !== undefined) interview['interview.hrScore'] = hrScore;
        if (communication !== undefined) interview['interview.communication'] = communication;
        if (problemSolving !== undefined) interview['interview.problemSolving'] = problemSolving;
        if (notes !== undefined) interview['interview.notes'] = notes;
        if (decision !== undefined) {
            interview['interview.decision'] = decision;
            // Update top-level status based on decision
            if (decision === 'accepted') interview.status = 'accepted';
            else if (decision === 'rejected') interview.status = 'rejected';
            else if (decision === 'waiting') interview.status = 'waiting';
        }

        const application = await Application.findByIdAndUpdate(
            params.id,
            { $set: interview },
            { new: true }
        );

        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'UPDATE_INTERVIEW', 'Application', params.id, body);
        return NextResponse.json(application);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
