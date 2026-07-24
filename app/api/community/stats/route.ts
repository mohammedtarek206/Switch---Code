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

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (authUser as { permissions?: string[] }).permissions || [];
        if (!hasPermission(authUser.role, userPerms, PERMISSIONS.VIEW_LOGS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        // 1. Basic Stats
        const totalMembers = await User.countDocuments({
            role: {
                $in: [
                    'super_admin', 'admin', 'president', 'vice_president',
                    'hr', 'pr', 'marketing', 'media', 'technical',
                    'instructor', 'mentor', 'committee_leader',
                    'vice_committee_leader', 'member'
                ]
            }
        });

        const totalCommittees = await Committee.countDocuments({ isActive: true });
        const totalEvents = await Event.countDocuments();
        const totalApps = await Application.countDocuments();
        const acceptedApps = await Application.countDocuments({ status: 'accepted' });
        const totalTasks = await Task.countDocuments();
        const completedTasks = await Task.countDocuments({ status: 'done' });
        const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 2. Attendance & Volunteer stats
        const totalRegs = await EventRegistration.countDocuments();
        const attendedRegs = await EventRegistration.countDocuments({ attended: true });
        const attendanceRate = totalRegs ? Math.round((attendedRegs / totalRegs) * 100) : 0;

        // 3. User distribution active vs inactive
        const activeUsers = await User.countDocuments({ isActive: true });
        const inactiveUsers = await User.countDocuments({ isActive: false });

        // 4. Bests metrics (top statistics)
        const topPerformanceMember = await User.findOne({
            role: { $ne: 'student' }
        }).sort({ performanceScore: -1 }).select('name performanceScore avatar');

        const mostActiveCommittee = await Committee.findOne(); // simple stub or calculated

        // Fetch stats for events: max/min registration
        const allEvents = await Event.find().select('title');
        const eventStats = await Promise.all(allEvents.map(async (e) => {
            const count = await EventRegistration.countDocuments({ eventId: e._id });
            return { title: e.title, registrations: count };
        }));

        // Sort to find max/min
        const maxEvent = eventStats.length ? eventStats.reduce((prev, current) => (prev.registrations > current.registrations) ? prev : current) : null;
        const minEvent = eventStats.length ? eventStats.reduce((prev, current) => (prev.registrations < current.registrations) ? prev : current) : null;

        return NextResponse.json({
            members: { total: totalMembers, active: activeUsers, inactive: inactiveUsers },
            committees: { total: totalCommittees },
            events: { total: totalEvents, maxTicket: maxEvent, minTicket: minEvent },
            applications: { total: totalApps, accepted: acceptedApps },
            tasks: { total: totalTasks, completed: completedTasks, completionRate: taskCompletionRate },
            attendance: { rate: attendanceRate, totalRegistrations: totalRegs, totalAttended: attendedRegs },
            topScorer: topPerformanceMember,
            volunteerHours: totalMembers * 12, // mock standard volunteer index
            trainingHours: totalEvents * 3, // mock standard training index
        });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
