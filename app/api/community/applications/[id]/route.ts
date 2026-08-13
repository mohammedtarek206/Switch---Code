import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import Notification from '@/models/Notification';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
    pending: 'قيد المراجعة',
    reviewing: 'تحت المراجعة',
    interview: 'مرحلة المقابلة',
    accepted: 'مقبول',
    rejected: 'غير مقبول',
    waiting: 'قائمة الانتظار',
};

// GET single application — Admin only
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_APPLICATIONS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const application = await Application.findById(params.id)
            .select('-applicantPassword')
            .populate('committeeId', 'name type color')
            .populate('recruitmentId', 'name formFields')
            .populate('interview.interviewerId', 'name email')
            .lean();

        if (!application) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(application);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// PUT — Update application (status, interview, adminNote)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_APPLICATIONS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();

        // Don't allow overwriting password from this endpoint
        delete body.applicantPassword;

        const oldApp = await Application.findById(params.id).select('status userId name committeeId').lean();
        if (!oldApp) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const application = await Application.findByIdAndUpdate(
            params.id,
            { $set: body },
            { new: true, runValidators: true }
        )
            .select('-applicantPassword')
            .populate('committeeId', 'name type color')
            .populate('recruitmentId', 'name formFields')
            .lean();

        // Send notification if status changed & userId exists
        if (body.status && body.status !== (oldApp as { status: string }).status) {
            const appWithCommittee = oldApp as { userId?: { toString(): string }; name: string; committeeId?: { name?: string } };
            const committeeName = appWithCommittee.committeeId
                ? (appWithCommittee.committeeId as { name?: string }).name || 'اللجنة'
                : 'اللجنة';

            if (appWithCommittee.userId) {
                try {
                    await Notification.create({
                        userId: appWithCommittee.userId,
                        title: 'تحديث حالة طلبك',
                        message: `تم تحديث حالة طلبك في ${committeeName} إلى: ${statusLabels[body.status] || body.status}`,
                        type: body.status === 'accepted' ? 'success' : body.status === 'rejected' ? 'error' : 'info',
                        link: '/applicant/dashboard',
                    });
                } catch {
                    // Non-blocking
                }
            }
        }

        await logActivity(user.userId, 'UPDATE_APPLICATION', 'Application', params.id, body);
        return NextResponse.json(application);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// DELETE — Remove application
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_APPLICATIONS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const deleted = await Application.findByIdAndDelete(params.id);
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'DELETE_APPLICATION', 'Application', params.id, {});
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
