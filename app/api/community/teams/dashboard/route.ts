import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommunityTeam from '@/models/CommunityTeam';
import User from '@/models/User';
import Task from '@/models/Task';
import Event from '@/models/Event';
import Warning from '@/models/Warning';
import Award from '@/models/Award';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const url = new URL(req.url);
        let teamId = url.searchParams.get('teamId');

        const currentUser = await User.findById(authUser.userId);
        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // If no teamId provided in URL, fallback to user's assigned teamId
        if (!teamId && currentUser.teamId) {
            teamId = currentUser.teamId.toString();
        }

        if (!teamId) {
            return NextResponse.json({ error: 'No team specified or assigned' }, { status: 400 });
        }

        // Check Access Permission: User must be Admin/Super Admin OR belong to this team OR have 'view_all_reports' permission
        const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin' || currentUser.role === 'president';
        const isMemberOfTeam = currentUser.teamId?.toString() === teamId;
        const hasPermission = currentUser.permissions?.includes('view_all_reports');

        if (!isAdmin && !isMemberOfTeam && !hasPermission) {
            return NextResponse.json({ error: 'Access Denied: You do not have permission to view this team dashboard' }, { status: 403 });
        }

        // 1. Team Metadata
        const team = await CommunityTeam.findById(teamId)
            .populate('committeeId', 'name type color')
            .populate('leaderId', 'name username email phone avatar position')
            .populate('viceLeaderId', 'name username email phone avatar position');

        if (!team) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        // 2. Team Members
        const members = await User.find({ teamId, isActive: true })
            .select('name username email phone avatar role position performanceScore createdAt')
            .sort({ createdAt: -1 });

        const memberIds = members.map(m => m._id);

        // 3. Tasks & Events (or Meetings)
        const tasks = await Task.find({ $or: [{ teamId }, { assignedTo: { $in: memberIds } }] }).sort({ createdAt: -1 }).limit(10);
        const meetings = await Event.find({ $or: [{ teamId }, { committeeId: team.committeeId }] }).sort({ date: -1 }).limit(10);

        // 4. Warnings & Awards for Team Members
        const warnings = await Warning.find({ userId: { $in: memberIds } }).populate('userId', 'name username').sort({ createdAt: -1 }).limit(10);
        const rewards = await Award.find({ userId: { $in: memberIds } }).populate('userId', 'name username').sort({ createdAt: -1 }).limit(10);

        // 5. Statistics
        const stats = {
            totalMembers: members.length,
            totalTasks: tasks.length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            pendingTasks: tasks.filter(t => t.status !== 'completed').length,
            warningsCount: warnings.length,
            rewardsCount: rewards.length,
            averagePerformanceScore: members.length > 0 ? Math.round(members.reduce((acc, m) => acc + (m.performanceScore || 0), 0) / members.length) : 100,
            attendanceRate: '94%'
        };

        return NextResponse.json({
            team,
            members,
            tasks,
            meetings,
            warnings,
            rewards,
            stats
        });
    } catch (error: any) {
        console.error('Fetch team dashboard error:', error);
        return NextResponse.json({ error: 'Failed to load team dashboard' }, { status: 500 });
    }
}
