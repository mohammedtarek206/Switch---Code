import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import CommitteeMember from '@/models/CommitteeMember';
import AttendanceRecord from '@/models/AttendanceRecord';
import MarketingCampaign from '@/models/MarketingCampaign';
import LogisticsItem from '@/models/LogisticsItem';
import TechnicalProject from '@/models/TechnicalProject';
import PartnerLead from '@/models/PartnerLead';
import Event from '@/models/Event';
import LMSTrack from '@/models/LMSTrack';
import InstructorAssignment from '@/models/InstructorAssignment';
import Performance from '@/models/Performance';
import { authenticateRequest } from '@/lib/auth';
import { canAccessCommittee, canManageCommittee, isAdminRole } from '@/lib/permissions';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

function resolveDashboardType(committee: { dashboardType?: string; slug?: string; name?: string }): string {
    if (committee.dashboardType && committee.dashboardType !== 'custom') {
        return committee.dashboardType;
    }
    const text = `${committee.slug || ''} ${committee.name || ''}`.toLowerCase();
    if (text.includes('hr') || text.includes('human')) return 'hr';
    if (text.includes('pr') || text.includes('marketing') || text.includes('media')) return 'pr_marketing';
    if (text.includes('operation') || text.includes('logistics') || text.includes('or ')) return 'operations';
    if (text.includes('technical') || text.includes('tech')) return 'technical';
    if (text.includes('education') || text.includes('training')) return 'education';
    return 'custom';
}

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const committeeId = searchParams.get('committeeId') || authUser.committeeId;
        const isAdmin = isAdminRole(authUser.role, authUser.roles);

        if (!committeeId) {
            return NextResponse.json({ error: 'committeeId is required' }, { status: 400 });
        }

        if (!canAccessCommittee(authUser, committeeId)) {
            const membership = await CommitteeMember.findOne({
                userId: authUser.userId,
                committeeId,
                status: 'active',
            }).lean();
            if (!membership) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
        }

        const committee = await Committee.findById(committeeId).lean() as {
            _id: unknown;
            name: string;
            slug: string;
            dashboardType?: string;
            leaderId?: { toString(): string };
            viceLeaderId?: { toString(): string };
        } | null;

        if (!committee) return NextResponse.json({ error: 'Committee not found' }, { status: 404 });

        const dashboardType = resolveDashboardType(committee);
        const isLeader =
            canManageCommittee(authUser, committeeId) ||
            committee.leaderId?.toString() === authUser.userId ||
            committee.viceLeaderId?.toString() === authUser.userId;

        const payload: Record<string, unknown> = {
            dashboardType,
            isLeader,
            isAdmin,
        };

        if (dashboardType === 'hr' || isLeader) {
            const attendanceFilter = isLeader
                ? { committeeId }
                : { committeeId, userId: authUser.userId };
            const [attendance, evaluations] = await Promise.all([
                AttendanceRecord.find(attendanceFilter)
                    .populate('userId', 'name email avatar')
                    .populate('recordedBy', 'name')
                    .sort({ date: -1 })
                    .limit(100)
                    .lean(),
                Performance.find(isLeader ? { committeeId } : { committeeId, memberId: authUser.userId })
                    .populate('memberId', 'name')
                    .populate('evaluatorId', 'name')
                    .sort({ createdAt: -1 })
                    .limit(30)
                    .lean(),
            ]);
            payload.attendance = attendance;
            payload.evaluations = evaluations;
        }

        if (dashboardType === 'pr_marketing') {
            const [campaigns, partnerLeads] = await Promise.all([
                MarketingCampaign.find({ committeeId })
                    .populate('createdBy', 'name')
                    .sort({ scheduledDate: 1, createdAt: -1 })
                    .lean(),
                PartnerLead.find({}).sort({ createdAt: -1 }).limit(50).lean(),
            ]);
            payload.campaigns = campaigns;
            payload.partnerLeads = partnerLeads;
        }

        if (dashboardType === 'operations') {
            const [logistics, events] = await Promise.all([
                LogisticsItem.find({ committeeId })
                    .populate('assignedTo', 'name')
                    .populate('eventId', 'title date')
                    .sort({ createdAt: -1 })
                    .lean(),
                Event.find({}).select('title date location seats status').sort({ date: -1 }).limit(20).lean(),
            ]);
            payload.logistics = logistics;
            payload.events = events;
        }

        if (dashboardType === 'technical') {
            const projects = await TechnicalProject.find({ committeeId })
                .populate('teamMembers', 'name avatar')
                .sort({ createdAt: -1 })
                .lean();
            payload.projects = projects;
        }

        if (dashboardType === 'education') {
            const [tracks, instructors] = await Promise.all([
                LMSTrack.find({ status: 'active' }).sort({ sortOrder: 1 }).lean(),
                InstructorAssignment.find({ status: 'approved' })
                    .populate('userId', 'name email')
                    .populate('trackId', 'name')
                    .lean(),
            ]);
            payload.tracks = tracks;
            payload.instructors = instructors;
        }

        return NextResponse.json(payload);
    } catch (error) {
        console.error('Committee modules GET error:', error);
        return NextResponse.json({ error: 'Failed to load committee modules' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { moduleType } = body;
        const committeeId = body.committeeId || authUser.committeeId;
        if (!committeeId || !moduleType) {
            return NextResponse.json({ error: 'committeeId and moduleType are required' }, { status: 400 });
        }

        await connectDB();
        const committee = await Committee.findById(committeeId).select('leaderId viceLeaderId').lean() as {
            leaderId?: { toString(): string };
            viceLeaderId?: { toString(): string };
        } | null;
        if (!committee) return NextResponse.json({ error: 'Committee not found' }, { status: 404 });

        const isLeader =
            canManageCommittee(authUser, committeeId) ||
            committee.leaderId?.toString() === authUser.userId ||
            committee.viceLeaderId?.toString() === authUser.userId;

        if (moduleType === 'attendance') {
            if (body.isLeaveRequest) {
                const record = await AttendanceRecord.create({
                    userId: authUser.userId,
                    committeeId,
                    date: body.date ? new Date(body.date) : new Date(),
                    status: 'excused',
                    isLeaveRequest: true,
                    leaveReason: body.leaveReason || '',
                    leaveStatus: 'pending',
                    recordedBy: authUser.userId,
                });
                return NextResponse.json({ record, message: 'تم إرسال طلب الاستئذان بنجاح.' }, { status: 201 });
            }

            if (!isLeader) return NextResponse.json({ error: 'Forbidden: Leaders only' }, { status: 403 });
            const record = await AttendanceRecord.create({
                userId: body.userId,
                committeeId,
                date: body.date ? new Date(body.date) : new Date(),
                status: body.status || 'present',
                checkInTime: body.checkInTime || '',
                notes: body.notes || '',
                recordedBy: authUser.userId,
            });
            await createNotification({
                userId: body.userId,
                title: 'تحديث سجل الحضور',
                message: `تم تسجيل حالتك (${body.status || 'present'}) ليوم ${new Date(record.date).toLocaleDateString('ar-EG')}.`,
                type: 'info',
                link: '/dashboard/committee',
            });
            await logActivity(authUser.userId, 'RECORD_ATTENDANCE', 'AttendanceRecord', record._id.toString(), {
                targetUserId: body.userId,
                status: record.status,
            });
            return NextResponse.json({ record, message: 'تم تسجيل الحضور بنجاح.' }, { status: 201 });
        }

        if (moduleType === 'campaign') {
            const campaign = await MarketingCampaign.create({
                committeeId,
                title: body.title,
                platform: body.platform || 'facebook',
                contentType: body.contentType || 'post',
                caption: body.caption || '',
                mediaUrl: body.mediaUrl || '',
                scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
                status: isLeader ? 'approved' : 'pending_approval',
                createdBy: authUser.userId,
            });
            return NextResponse.json({ campaign, message: 'تمت إضافة الحملة / المنشور بنجاح.' }, { status: 201 });
        }

        if (moduleType === 'logistics') {
            const item = await LogisticsItem.create({
                committeeId,
                eventId: body.eventId || undefined,
                title: body.title,
                category: body.category || 'equipment',
                quantity: Number(body.quantity) || 1,
                estimatedCost: Number(body.estimatedCost) || 0,
                actualCost: Number(body.actualCost) || 0,
                status: body.status || 'planned',
                notes: body.notes || '',
                createdBy: authUser.userId,
            });
            return NextResponse.json({ item, message: 'تمت إضافة بند اللوجستيات والميزانية بنجاح.' }, { status: 201 });
        }

        if (moduleType === 'project') {
            const project = await TechnicalProject.create({
                committeeId,
                name: body.name,
                description: body.description || '',
                githubUrl: body.githubUrl || '',
                docsUrl: body.docsUrl || '',
                status: body.status || 'in_development',
                progress: Number(body.progress) || 0,
                createdBy: authUser.userId,
            });
            return NextResponse.json({ project, message: 'تم إنشاء المشروع التقني بنجاح.' }, { status: 201 });
        }

        if (moduleType === 'bug' && body.projectId) {
            const project = await TechnicalProject.findOneAndUpdate(
                { _id: body.projectId, committeeId },
                {
                    $push: {
                        bugs: {
                            title: body.title,
                            severity: body.severity || 'medium',
                            status: 'open',
                            reportedBy: authUser.userId,
                            createdAt: new Date(),
                        },
                    },
                },
                { new: true }
            );
            return NextResponse.json({ project, message: 'تم تسجيل الـ Bug بنجاح.' }, { status: 201 });
        }

        return NextResponse.json({ error: 'Invalid moduleType' }, { status: 400 });
    } catch (error) {
        console.error('Committee modules POST error:', error);
        return NextResponse.json({ error: 'Failed to save item' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { moduleType, itemId, status, leaveStatus, progress } = body;
        if (!moduleType || !itemId) {
            return NextResponse.json({ error: 'moduleType and itemId are required' }, { status: 400 });
        }

        await connectDB();
        if (moduleType === 'attendance' && leaveStatus) {
            const record = await AttendanceRecord.findByIdAndUpdate(
                itemId,
                { leaveStatus, status: leaveStatus === 'approved' ? 'excused' : 'absent' },
                { new: true }
            );
            return NextResponse.json({ record });
        }
        if (moduleType === 'campaign' && status) {
            const campaign = await MarketingCampaign.findByIdAndUpdate(
                itemId,
                { status, approvedBy: status === 'approved' ? authUser.userId : undefined },
                { new: true }
            );
            return NextResponse.json({ campaign });
        }
        if (moduleType === 'logistics' && status) {
            const item = await LogisticsItem.findByIdAndUpdate(itemId, { status }, { new: true });
            return NextResponse.json({ item });
        }
        if (moduleType === 'project') {
            const update: Record<string, unknown> = {};
            if (status) update.status = status;
            if (progress !== undefined) update.progress = Number(progress);
            const project = await TechnicalProject.findByIdAndUpdate(itemId, update, { new: true });
            return NextResponse.json({ project });
        }

        return NextResponse.json({ error: 'Invalid update' }, { status: 400 });
    } catch (error) {
        console.error('Committee modules PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
}
