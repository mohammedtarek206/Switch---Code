import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Interviewer from '@/models/Interviewer';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_INTERVIEWS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const interviewer = await Interviewer.findById(params.id)
            .populate('userId', 'name email role avatar isActive')
            .populate('committees', 'name color type')
            .lean();

        if (!interviewer) return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 });
        return NextResponse.json(interviewer);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_INTERVIEWS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { committees, isActive, name, email } = body;

        const interviewer = await Interviewer.findById(params.id);
        if (!interviewer) return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 });

        // Update interviewer specific fields
        if (committees !== undefined) interviewer.committees = committees;
        if (isActive !== undefined) interviewer.isActive = isActive;
        await interviewer.save();

        // Update associated user details
        if (name !== undefined || email !== undefined) {
            const userUpdate: any = {};
            if (name) userUpdate.name = name;
            if (email) userUpdate.email = email;
            await User.findByIdAndUpdate(interviewer.userId, userUpdate);
        }

        await logActivity(user.userId, 'EDIT_INTERVIEWER', 'Interviewer', params.id, body);

        // Fetch freshly updated profile with populated fields
        const updated = await Interviewer.findById(params.id)
            .populate('userId', 'name email role avatar isActive')
            .populate('committees', 'name color type')
            .lean();

        return NextResponse.json(updated);
    } catch (e: any) {
        if (e.code === 11000) {
            return NextResponse.json({ error: 'Email already in use by another user' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_INTERVIEWS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const interviewer = await Interviewer.findByIdAndDelete(params.id);
        if (!interviewer) return NextResponse.json({ error: 'Interviewer not found' }, { status: 404 });

        await logActivity(user.userId, 'DELETE_INTERVIEWER', 'Interviewer', params.id);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
