import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Performance from '@/models/Performance';
import Warning from '@/models/Warning';
import Reward from '@/models/Reward';
import Meeting from '@/models/Meeting';
import Task from '@/models/Task';
import User from '@/models/User';
import Committee from '@/models/Committee';
import CommunityTeam from '@/models/CommunityTeam';
import { authenticateRequest } from '@/lib/auth';

const LEADER_ROLES = ['committee_leader', 'vice_committee_leader', 'admin', 'super_admin', 'president', 'vice_president', 'hr'];

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const _c = Committee; const _t = CommunityTeam;

        const { searchParams } = new URL(request.url);
        const committeeId = searchParams.get('committeeId') || user.committeeId;

        if (!committeeId) return NextResponse.json({ error: 'No committee found' }, { status: 400 });

        const memberId = searchParams.get('memberId') || user.userId;

        // For self-view or leader viewing specific member
        const isLeader = LEADER_ROLES.includes(user.role);
        const targetId = (isLeader && searchParams.get('memberId')) ? searchParams.get('memberId') : user.userId;

        const [evaluations, warnings, rewards, meetings, tasks, members] = await Promise.all([
            Performance.find({ committeeId, memberId: targetId }).populate('evaluatorId', 'name').sort({ createdAt: -1 }).limit(20),
            Warning.find({ committeeId, memberId: targetId }).populate('issuedBy', 'name').sort({ createdAt: -1 }),
            Reward.find({ committeeId, memberId: targetId }).populate('grantedBy', 'name').sort({ createdAt: -1 }),
            Meeting.find({ committeeId }).sort({ date: -1 }).limit(10).populate('createdBy', 'name'),
            Task.find({ committeeId, assignees: targetId }).sort({ deadline: 1 }).limit(10).populate('assignees', 'name avatar'),
            isLeader ? User.find({ committeeId, isActive: true }).select('name username avatar role position performanceScore').lean() : Promise.resolve([]),
        ]);

        // Compute avg evaluation score
        const avgScore = evaluations.length > 0
            ? Math.round(evaluations.reduce((a: any, b: any) => a + b.totalScore, 0) / evaluations.length)
            : 0;

        // Leader: committee stats
        let committeeStats = null;
        if (isLeader) {
            const [totalTasks, completedTasks, lateTasks, allWarnings, allRewards] = await Promise.all([
                Task.countDocuments({ committeeId }),
                Task.countDocuments({ committeeId, status: 'done' }),
                Task.countDocuments({ committeeId, deadline: { $lt: new Date() }, status: { $nin: ['done', 'cancelled'] } }),
                Warning.countDocuments({ committeeId }),
                Reward.countDocuments({ committeeId }),
            ]);

            committeeStats = {
                memberCount: members.length,
                totalTasks,
                completedTasks,
                lateTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                totalWarnings: allWarnings,
                totalRewards: allRewards,
            };
        }

        return NextResponse.json({
            evaluations,
            warnings,
            rewards,
            meetings,
            tasks,
            members,
            avgScore,
            committeeStats,
        }, { status: 200 });
    } catch (error: any) {
        console.error('Committee workspace GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
