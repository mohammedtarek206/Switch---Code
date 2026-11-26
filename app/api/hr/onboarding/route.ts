import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CommitteeMember from '@/models/CommitteeMember';
import Task from '@/models/Task';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole, userHasAnyRole } from '@/lib/permissions';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isAdminRole(authUser.role, authUser.roles) && !userHasAnyRole(authUser, ['hr'])) {
            return NextResponse.json({ error: 'Forbidden: HR access only' }, { status: 403 });
        }

        await connectDB();
        const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

        const [newMembers, allMembers, activeTasks] = await Promise.all([
            User.find({
                createdAt: { $gte: fourteenDaysAgo },
                isActive: { $ne: false },
                role: { $in: ['member', 'committee_leader', 'vice_committee_leader', 'hr', 'pr', 'media', 'marketing', 'technical'] },
            })
                .select('name email phone role committeeId avatar createdAt')
                .populate('committeeId', 'name')
                .sort({ createdAt: -1 })
                .lean(),
            CommitteeMember.find({ status: 'active' })
                .populate('userId', 'name email phone avatar role performanceScore')
                .populate('committeeId', 'name')
                .sort({ joinedAt: -1 })
                .limit(100)
                .lean(),
            Task.countDocuments({ status: { $nin: ['done', 'cancelled'] } }),
        ]);

        return NextResponse.json({
            newMembers,
            allMembers,
            stats: {
                newMembersCount: newMembers.length,
                totalActiveMembers: allMembers.length,
                activeTasks,
            },
        });
    } catch (error) {
        console.error('HR onboarding GET error:', error);
        return NextResponse.json({ error: 'Failed to load HR onboarding data' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isAdminRole(authUser.role, authUser.roles) && !userHasAnyRole(authUser, ['hr'])) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { userId, title, message } = await req.json();
        if (!userId || !message) {
            return NextResponse.json({ error: 'userId and message are required' }, { status: 400 });
        }

        await createNotification({
            userId,
            title: title || 'رسالة متابعة من HR Committee',
            message,
            type: 'info',
            link: '/dashboard/committee',
        });

        return NextResponse.json({ message: 'تم إرسال رسالة المتابعة للعضو بنجاح.' });
    } catch (error) {
        console.error('HR onboarding POST error:', error);
        return NextResponse.json({ error: 'Failed to send onboarding message' }, { status: 500 });
    }
}
