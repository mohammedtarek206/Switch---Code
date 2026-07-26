import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import HomepageConfig from '@/models/HomepageConfig';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import Recruitment from '@/models/Recruitment';
import Announcement from '@/models/Announcement';
import Committee from '@/models/Committee';
import Partner from '@/models/Partner';
import User from '@/models/User';
import Project from '@/models/Project';
import Track from '@/models/Track';
import ExamResult from '@/models/ExamResult';
import PublicTeamMember from '@/models/PublicTeamMember';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();

        // 1. Get or create homepage config
        let config = await HomepageConfig.findOne().populate('pinnedEventId pinnedRecruitmentId pinnedAnnouncementId');
        if (!config) {
            config = await HomepageConfig.create({});
        }

        const now = new Date();

        // 2. Fetch Events (Upcoming & Past)
        const [upcomingEventsRaw, pastEventsRaw] = await Promise.all([
            Event.find({ date: { $gte: now } }).sort({ date: 1 }).populate('committeeId', 'name color').lean(),
            Event.find({ date: { $lt: now } }).sort({ date: -1 }).limit(6).populate('committeeId', 'name color').lean(),
        ]);

        // Attach remaining seats for upcoming events
        const upcomingEvents = await Promise.all(
            upcomingEventsRaw.map(async (ev: any) => {
                const regCount = await EventRegistration.countDocuments({ eventId: ev._id, status: { $ne: 'rejected' } });
                const totalSeats = ev.seats || 50;
                const seatsLeft = Math.max(0, totalSeats - regCount);
                return { ...ev, seatsLeft, regCount };
            })
        );

        const pastEvents = pastEventsRaw;

        // 3. Active Recruitment
        let activeRecruitment = null;
        if (config.pinnedRecruitmentId) {
            activeRecruitment = config.pinnedRecruitmentId;
        } else {
            activeRecruitment = await Recruitment.findOne({ isOpen: true }).sort({ createdAt: -1 }).lean();
        }

        // 4. Statistics (Dynamic Counters)
        const [
            membersCount,
            committeesCount,
            eventsCount,
            traineesCount,
            coursesCount,
            certificatesCount,
            projectsCount,
            partnersCount
        ] = await Promise.all([
            User.countDocuments({ isActive: true }),
            Committee.countDocuments(),
            Event.countDocuments(),
            User.countDocuments({ role: { $in: ['student', 'trainee', 'member'] } }),
            Track.countDocuments(),
            ExamResult.countDocuments({ status: 'Pass' }),
            Project.countDocuments(),
            Partner.countDocuments(),
        ]);

        const stats = {
            membersCount: membersCount || 250,
            committeesCount: committeesCount || 8,
            eventsCount: eventsCount || 24,
            traineesCount: traineesCount || 1500,
            coursesCount: coursesCount || 12,
            certificatesCount: (certificatesCount || 450) + 120,
            projectsCount: projectsCount || 35,
            partnersCount: partnersCount || 14,
        };

        // 5. Highlights / Hall of Fame
        const topMembers = await User.find({ isActive: true })
            .select('name username avatar role position performanceScore committeeId')
            .populate('committeeId', 'name color')
            .sort({ performanceScore: -1 })
            .limit(10)
            .lean();

        const publicTeam = await PublicTeamMember.find({ isActive: true }).sort({ order: 1 }).limit(10).lean();

        const highlights = {
            memberOfTheMonth: topMembers[0] || null,
            mostActiveMember: topMembers[1] || topMembers[0] || null,
            highestRatedMember: topMembers[2] || topMembers[0] || null,
            bestLeader: topMembers.find(m => m.role === 'committee_leader') || topMembers[0] || null,
            bestViceLeader: topMembers.find(m => m.role === 'vice_committee_leader') || topMembers[1] || null,
            bestVolunteer: topMembers[3] || topMembers[0] || null,
            bestTechnical: topMembers.find(m => m.role === 'technical') || topMembers[0] || null,
            bestHR: topMembers.find(m => m.role === 'hr') || topMembers[0] || null,
            bestPR: topMembers.find(m => m.role === 'pr') || topMembers[0] || null,
            bestMarketing: topMembers.find(m => m.role === 'marketing') || topMembers[0] || null,
            bestMedia: topMembers.find(m => m.role === 'media') || topMembers[0] || null,
        };

        // 6. Announcements / News
        const news = await Announcement.find({ target: { $in: ['all', 'public'] } })
            .sort({ createdAt: -1 })
            .limit(6)
            .populate('authorId', 'name avatar')
            .lean();

        // 7. Featured Committees
        const committees = await Committee.find().populate('leaderId', 'name avatar username').lean();

        // 8. Partners & Sponsors
        const partners = await Partner.find().sort({ createdAt: -1 }).lean();

        // 9. Success Stories & Projects
        const projects = await Project.find().limit(6).lean();

        return NextResponse.json({
            config,
            stats,
            upcomingEvents,
            pastEvents,
            activeRecruitment,
            highlights,
            news,
            committees,
            partners,
            projects,
            publicTeam,
        });
    } catch (error: any) {
        console.error('Homepage API GET error:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch homepage data' }, { status: 500 });
    }
}
