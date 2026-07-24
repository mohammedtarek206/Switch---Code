import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Committee from '@/models/Committee';
import CommunityTeam from '@/models/CommunityTeam';
import Badge from '@/models/Badge';
import CommitteeMember from '@/models/CommitteeMember';
import Task from '@/models/Task';
import PerformanceScore from '@/models/PerformanceScore';
import { authenticateRequest } from '@/lib/auth';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(_req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const _c = Committee;
        const _t = CommunityTeam;
        const _b = Badge;

        const member = await User.findById(params.id)
            .select('-password -accessCode')
            .populate('committeeId', 'name color icon')
            .populate('teamId', 'name color icon')
            .populate('badges', 'name icon color description');

        if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const [committees, tasks, scores] = await Promise.all([
            CommitteeMember.find({ userId: params.id }).populate('committeeId', 'name color'),
            Task.find({ assigneeId: params.id }).sort({ createdAt: -1 }).limit(10),
            PerformanceScore.find({ userId: params.id }).sort({ year: -1, month: -1 }).limit(12),
        ]);

        return NextResponse.json({ member, committees, tasks, scores });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const isAdmin = ['super_admin', 'admin'].includes(user.role);
        if (user.userId !== params.id && !isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        if (!isAdmin) {
            delete body.role;
            delete body.permissions;
        }
        delete body.password;
        delete body.accessCode;

        const member = await User.findByIdAndUpdate(params.id, body, { new: true })
            .select('-password -accessCode');
        if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(member);
    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
    }
}
