import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

// POST / PUT interview data for an application
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
        const {
            date,
            interviewerId,
            interviewStatus,
            technicalScore,
            hrScore,
            communication,
            problemSolving,
            notes,
            recommendation,
            decision
        } = body;

        const update: Record<string, unknown> = {};
        if (date !== undefined) update['interview.date'] = date;
        if (interviewStatus !== undefined) update['interview.interviewStatus'] = interviewStatus;
        if (notes !== undefined) update['interview.notes'] = notes;
        if (recommendation !== undefined) update['interview.recommendation'] = recommendation;
        if (technicalScore !== undefined) update['interview.technicalScore'] = technicalScore;
        if (hrScore !== undefined) update['interview.hrScore'] = hrScore;
        if (communication !== undefined) update['interview.communication'] = communication;
        if (problemSolving !== undefined) update['interview.problemSolving'] = problemSolving;

        // Handle interviewer assignment with denormalization
        if (interviewerId !== undefined) {
            update['interview.interviewerId'] = interviewerId || null;
            if (interviewerId) {
                // Denormalize name/email for fast reads
                const interviewer = await User.findById(interviewerId).select('name email').lean() as { name?: string; email?: string } | null;
                if (interviewer) {
                    update['interview.interviewerName'] = interviewer.name || '';
                    update['interview.interviewerEmail'] = interviewer.email || '';
                }
                update['interview.assignedAt'] = new Date();
                update['interview.assignedBy'] = user.userId;
                // Auto-upgrade interviewStatus to "Assigned" if still unassigned
                if (!interviewStatus || interviewStatus === 'Not Assigned') {
                    update['interview.interviewStatus'] = 'Assigned';
                }
            } else {
                // Clearing the interviewer
                update['interview.interviewerName'] = '';
                update['interview.interviewerEmail'] = '';
                update['interview.assignedAt'] = null;
                if (!interviewStatus) {
                    update['interview.interviewStatus'] = 'Not Assigned';
                }
            }
        }

        // Handle final decision — also updates top-level status
        if (decision !== undefined) {
            update['interview.decision'] = decision || null;
            if (decision === 'accepted') { update.status = 'accepted'; update['interview.interviewStatus'] = 'Passed'; }
            else if (decision === 'rejected') { update.status = 'rejected'; update['interview.interviewStatus'] = 'Failed'; }
            else if (decision === 'waiting') { update.status = 'waiting'; }
        }

        const application = await Application.findByIdAndUpdate(
            params.id,
            { $set: update },
            { new: true }
        ).select('-applicantPassword').populate('committeeId', 'name').lean();

        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        // Send notification if interviewer assigned and applicant has a linked userId
        if (interviewerId && (application as any).userId) {
            try {
                const committeeName = (application as any).committeeId?.name || 'اللجنة';
                await Notification.create({
                    userId: (application as any).userId,
                    title: 'تم تحديد موعد المقابلة',
                    message: `تم تحديد مقابلتك في ${committeeName}. سيتم التواصل معك قريباً.`,
                    type: 'info',
                    link: '/applicant/dashboard',
                });
            } catch { /* Non-blocking */ }
        }

        await logActivity(user.userId, 'UPDATE_INTERVIEW', 'Application', params.id, body);
        return NextResponse.json(application);
    } catch (err) {
        console.error('Interview update error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
