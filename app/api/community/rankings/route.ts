import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import User from '@/models/User';
import Task from '@/models/Task';
import EventRegistration from '@/models/EventRegistration';
import Event from '@/models/Event';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const committees = await Committee.find({ isActive: true });

        const rankings = await Promise.all(
            committees.map(async (c) => {
                const committeeId = c._id;

                // Members count
                const membersCount = await User.countDocuments({ committeeId });

                // Tasks completed & total
                const totalTasks = await Task.countDocuments({ committeeId });
                const completedTasks = await Task.countDocuments({ committeeId, status: 'done' });
                const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

                // Events organized by this committee
                const eventsCount = await Event.countDocuments({ committeeId });

                // Calculate average performance score of members
                const members = await User.find({ committeeId }).select('performanceScore');
                const totalScore = members.reduce((sum, member) => sum + (member.performanceScore || 0), 0);
                const avgPerformance = members.length ? Math.round(totalScore / members.length) : 0;

                // Simple scoring algorithm for ranking
                const rankingScore = (membersCount * 2) + avgPerformance + (eventsCount * 5) + (taskCompletionRate * 0.5);

                return {
                    id: committeeId,
                    name: c.name,
                    color: c.color,
                    icon: c.icon,
                    type: c.type,
                    membersCount,
                    eventsCount,
                    completedTasks,
                    totalTasks,
                    taskCompletionRate,
                    avgPerformance,
                    rankingScore: Math.round(rankingScore),
                };
            })
        );

        // Sort by rankingScore descending
        rankings.sort((a, b) => b.rankingScore - a.id.toString().localeCompare(b.id.toString())); // Fallback tie-breaker

        return NextResponse.json(rankings.sort((a, b) => b.rankingScore - a.rankingScore));
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
