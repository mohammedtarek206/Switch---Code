import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Committee from '@/models/Committee';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import Application from '@/models/Application';
import Task from '@/models/Task';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

const CACHE_HEADERS = {
    'Cache-Control': 'private, max-age=0, stale-while-revalidate=60',
};

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (authUser as { permissions?: string[] }).permissions || [];
        if (!hasPermission(authUser.role, userPerms, PERMISSIONS.VIEW_LOGS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const COMMUNITY_ROLES = [
            'super_admin', 'admin', 'president', 'vice_president',
            'hr', 'pr', 'marketing', 'media', 'technical',
            'instructor', 'mentor', 'committee_leader',
            'vice_committee_leader', 'member',
        ];

        // ── Run all independent queries in parallel ──────────────────────────
        const [
            totalMembers,
            activeUsers,
            inactiveUsers,
            totalCommittees,
            totalEvents,
            totalApps,
            acceptedApps,
            totalTasks,
            completedTasks,
            totalRegs,
            attendedRegs,
            topPerformanceMember,
            // Single aggregation replaces the N+1 per-event loop
            eventRegCounts,
        ] = await Promise.all([
            User.countDocuments({ role: { $in: COMMUNITY_ROLES } }),
            User.countDocuments({ isActive: true }),
            User.countDocuments({ isActive: false }),
            Committee.countDocuments({ isActive: true }),
            Event.countDocuments(),
            Application.countDocuments(),
            Application.countDocuments({ status: 'accepted' }),
            Task.countDocuments(),
            Task.countDocuments({ status: 'done' }),
            EventRegistration.countDocuments(),
            EventRegistration.countDocuments({ attended: true }),
            User.findOne({ role: { $ne: 'student' } })
                .sort({ performanceScore: -1 })
                .select('name performanceScore avatar')
                .lean(),
            // Aggregate registration counts per event in a SINGLE query
            EventRegistration.aggregate([
                {
                    $group: {
                        _id: '$eventId',
                        count: { $sum: 1 },
                    },
                },
                {
                    $lookup: {
                        from: 'events',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'event',
                        pipeline: [{ $project: { title: 1 } }],
                    },
                },
                { $unwind: { path: '$event', preserveNullAndEmpty: true } },
                { $project: { _id: 0, title: '$event.title', registrations: '$count' } },
            ]),
        ]);

        const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const attendanceRate = totalRegs ? Math.round((attendedRegs / totalRegs) * 100) : 0;

        const maxEvent = eventRegCounts.length
            ? eventRegCounts.reduce((a: any, b: any) => (a.registrations > b.registrations ? a : b))
            : null;
        const minEvent = eventRegCounts.length
            ? eventRegCounts.reduce((a: any, b: any) => (a.registrations < b.registrations ? a : b))
            : null;

        return NextResponse.json(
            {
                members: { total: totalMembers, active: activeUsers, inactive: inactiveUsers },
                committees: { total: totalCommittees },
                events: { total: totalEvents, maxTicket: maxEvent, minTicket: minEvent },
                applications: { total: totalApps, accepted: acceptedApps },
                tasks: { total: totalTasks, completed: completedTasks, completionRate: taskCompletionRate },
                attendance: { rate: attendanceRate, totalRegistrations: totalRegs, totalAttended: attendedRegs },
                topScorer: topPerformanceMember,
                volunteerHours: totalMembers * 12,
                trainingHours: totalEvents * 3,
            },
            { headers: CACHE_HEADERS }
        );
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
