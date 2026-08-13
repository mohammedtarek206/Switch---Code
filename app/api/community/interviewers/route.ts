import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Interviewer from '@/models/Interviewer';
import User from '@/models/User';
import Application from '@/models/Application';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

// GET all interviewers with populated user, committees details and application counts/stats
export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_INTERVIEWS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        // 1. Get raw search params
        const { searchParams } = new URL(req.url);
        const candidatesOnly = searchParams.get('candidates') === 'true';

        if (candidatesOnly) {
            // Fetch users eligible to be interviewers (all roles except student and member, and not yet an interviewer)
            const activeInterviewersList = await Interviewer.find().select('userId').lean();
            const activeInterviewerIds = activeInterviewersList.map(i => i.userId.toString());

            const users = await User.find({
                role: { $nin: ['student', 'member'] },
                isActive: true,
                _id: { $nin: activeInterviewerIds }
            })
                .select('_id name email role avatar')
                .sort({ name: 1 })
                .lean();

            return NextResponse.json(users);
        }

        // Fetch all interviewers with details
        const interviewers = await Interviewer.find()
            .populate('userId', 'name email role avatar isActive')
            .populate('committees', 'name color type')
            .sort({ createdAt: -1 })
            .lean();

        // Calculate counts dynamically for each interviewer
        const result = [];
        for (const item of interviewers) {
            if (!item.userId) continue; // Skip if orphaned references
            const interviewerUserId = (item.userId as any)._id;

            const [assigned, pending, completed] = await Promise.all([
                Application.countDocuments({ 'interview.interviewerId': interviewerUserId }),
                Application.countDocuments({
                    'interview.interviewerId': interviewerUserId,
                    'interview.interviewStatus': { $ne: 'Completed' }
                }),
                Application.countDocuments({
                    'interview.interviewerId': interviewerUserId,
                    'interview.interviewStatus': 'Completed'
                })
            ]);

            result.push({
                ...item,
                stats: { assigned, pending, completed }
            });
        }

        return NextResponse.json(result);
    } catch (e: any) {
        console.error('Error fetching interviewers:', e);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST new interviewer profile mapping
export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_INTERVIEWS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { userId, committees, isActive } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Verify user exists and check role
        const targetUser = await User.findById(userId);
        if (!targetUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Create new interviewer
        const interviewer = await Interviewer.create({
            userId,
            committees: committees || [],
            isActive: isActive !== false
        });

        await logActivity(user.userId, 'ADD_INTERVIEWER', 'Interviewer', interviewer._id.toString(), {
            userId,
            committees
        });

        return NextResponse.json(interviewer, { status: 201 });
    } catch (err: any) {
        if (err.code === 11000) {
            return NextResponse.json({ error: 'Interviewer profile already exists for this user' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
