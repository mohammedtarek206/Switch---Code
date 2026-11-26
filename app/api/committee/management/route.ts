import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import CommitteeMember from '@/models/CommitteeMember';
import Task from '@/models/Task';
import AttendanceRecord from '@/models/AttendanceRecord';
import Meeting from '@/models/Meeting';
import Announcement from '@/models/Announcement';
import ActivityLog from '@/models/ActivityLog';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole, userHasRole } from '@/lib/permissions';
import { notifyAdmins, notifyManyUsers } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

const ALL_VICE_PERMISSIONS = [
    'create_tasks',
    'assign_tasks',
    'review_tasks',
    'manage_attendance',
    'publish_announcements',
    'manage_meetings',
    'view_reports',
    'edit_members',
] as const;

type ManagementRole = 'admin' | 'head' | 'acting_head' | 'vice_head';

async function resolveManagementAccess(
    userId: string,
    role: string,
    roles: string[] | undefined,
    committeeId: string
): Promise<{
    allowed: boolean;
    mgmtRole?: ManagementRole;
    permissions: string[];
    committee?: Record<string, unknown>;
}> {
    const committee = await Committee.findById(committeeId)
        .populate('leaderId', 'name email avatar')
        .populate('viceLeaderId', 'name email avatar')
        .populate('viceLeaderIds', 'name email avatar')
        .populate('actingHeadId', 'name email avatar')
        .populate('managementNotes.authorId', 'name role')
        .populate('managementNotes.targetMemberId', 'name')
        .lean<{
            _id: { toString(): string };
            leaderId?: { _id?: { toString(): string } };
            viceLeaderId?: { _id?: { toString(): string } };
            viceLeaderIds?: Array<{ _id?: { toString(): string } }>;
            actingHeadId?: { _id?: { toString(): string } };
            viceHeadPermissions?: string[];
            [key: string]: unknown;
        }>();

    if (!committee) {
        return { allowed: false, permissions: [] };
    }

    if (isAdminRole(role, roles)) {
        return { allowed: true, mgmtRole: 'admin', permissions: [...ALL_VICE_PERMISSIONS], committee };
    }

    const isHead = committee.leaderId?._id?.toString() === userId;
    const isActingHead = committee.actingHeadId?._id?.toString() === userId;
    if (isHead || isActingHead) {
        return {
            allowed: true,
            mgmtRole: isHead ? 'head' : 'acting_head',
            permissions: [...ALL_VICE_PERMISSIONS],
            committee,
        };
    }

    const isVice =
        committee.viceLeaderId?._id?.toString() === userId ||
        Boolean(committee.viceLeaderIds?.some((v) => v._id?.toString() === userId));

    if (isVice || (userHasRole({ role, roles }, 'vice_committee_leader') && committee._id.toString() === committeeId)) {
        // Double check user belongs to this committee if matched via role
        if (!isVice) {
            const memberRecord = await CommitteeMember.findOne({ userId, committeeId, status: 'active' }).lean();
            if (!memberRecord) return { allowed: false, permissions: [] };
        }
        return {
            allowed: true,
            mgmtRole: 'vice_head',
            permissions: Array.isArray(committee.viceHeadPermissions)
                ? committee.viceHeadPermissions
                : ['create_tasks', 'assign_tasks', 'review_tasks', 'manage_attendance'],
            committee,
        };
    }

    return { allowed: false, permissions: [] };
}

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const requestedCommitteeId = searchParams.get('committeeId');
        const committeeId = requestedCommitteeId || authUser.committeeId;

        if (!committeeId) {
            return NextResponse.json({ error: 'لا توجد لجنة مرتبطة بحسابك.' }, { status: 400 });
        }

        const access = await resolveManagementAccess(authUser.userId, authUser.role, authUser.roles, committeeId);
        if (!access.allowed || !access.committee) {
            return NextResponse.json(
                { error: 'Forbidden: لوحة الإدارة مخصصة لرئيس اللجنة ونائبه والأدمن فقط.' },
                { status: 403 }
            );
        }

        const isAdmin = access.mgmtRole === 'admin';
        const now = new Date();

        const [members, tasks, attendance, meetings, announcements, recentActivity, allCommittees] = await Promise.all([
            CommitteeMember.find({ committeeId })
                .populate('userId', 'name email phone avatar role position performanceScore isActive')
                .sort({ joinedAt: -1 })
                .lean<Array<{
                    _id: unknown;
                    status: string;
                    position: string;
                    joinedAt: Date;
                    userId?: { _id?: { toString(): string }; name?: string; email?: string; isActive?: boolean; performanceScore?: number };
                }>>(),
            Task.find({ committeeId, isDeleted: { $ne: true } })
                .select('title status priority deadline assignees createdAt')
                .lean<Array<{
                    _id: unknown;
                    title: string;
                    status: string;
                    priority: string;
                    deadline?: Date;
                    assignees?: Array<{ toString(): string }>;
                }>>(),
            AttendanceRecord.find({ committeeId })
                .populate('userId', 'name')
                .sort({ date: -1 })
                .limit(100)
                .lean<Array<{ userId?: { _id?: { toString(): string }; name?: string }; status: string; date: Date }>>(),
            Meeting.find({ committeeId }).sort({ date: -1 }).limit(15).lean(),
            Announcement.find({ targetCommittee: committeeId }).sort({ createdAt: -1 }).limit(15).lean(),
            ActivityLog.find({ targetId: committeeId }).populate('userId', 'name').sort({ createdAt: -1 }).limit(20).lean(),
            isAdmin ? Committee.find({ isActive: true }).select('_id name dashboardType').sort({ displayOrder: 1, name: 1 }).lean() : Promise.resolve([]),
        ]);

        const activeMembers = members.filter((m) => m.status === 'active' && m.userId?.isActive !== false);
        const inactiveMembers = members.filter((m) => m.status !== 'active' || m.userId?.isActive === false);

        const completedTasks = tasks.filter((t) => t.status === 'done').length;
        const overdueTasks = tasks.filter(
            (t) => t.deadline && new Date(t.deadline) < now && !['done', 'cancelled'].includes(t.status)
        ).length;
        const pendingReviewTasks = tasks.filter((t) => t.status === 'review').length;

        const presentCount = attendance.filter((a) => a.status === 'present').length;
        const lateCount = attendance.filter((a) => a.status === 'late').length;
        const absentCount = attendance.filter((a) => a.status === 'absent').length;
        const attendanceRate = attendance.length > 0 ? Math.round(((presentCount + lateCount) / attendance.length) * 100) : 100;

        return NextResponse.json({
            committee: access.committee,
            mgmtRole: access.mgmtRole,
            effectivePermissions: access.permissions,
            allAvailablePermissions: ALL_VICE_PERMISSIONS,
            allCommittees,
            overview: {
                totalMembers: members.length,
                activeMembers: activeMembers.length,
                inactiveMembers: inactiveMembers.length,
                totalTasks: tasks.length,
                completedTasks,
                pendingReviewTasks,
                overdueTasks,
                completionRate: tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0,
                attendanceRate,
                presentCount,
                lateCount,
                absentCount,
            },
            members,
            meetings,
            announcements,
            recentActivity,
        });
    } catch (error) {
        console.error('Committee management GET error:', error);
        return NextResponse.json({ error: 'Failed to load management dashboard' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { action } = body;
        const committeeId = body.committeeId || authUser.committeeId;
        if (!committeeId || !action) {
            return NextResponse.json({ error: 'committeeId and action are required' }, { status: 400 });
        }

        await connectDB();
        const access = await resolveManagementAccess(authUser.userId, authUser.role, authUser.roles, committeeId);
        if (!access.allowed) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const isHeadOrAdmin = ['head', 'acting_head', 'admin'].includes(access.mgmtRole || '');

        if (action === 'update_vice_permissions') {
            if (!isHeadOrAdmin) {
                return NextResponse.json(
                    { error: 'Forbidden: فقط رئيس اللجنة أو الأدمن يمكنه تعديل صلاحيات نائب الرئيس.' },
                    { status: 403 }
                );
            }
            const validPerms = Array.isArray(body.viceHeadPermissions)
                ? body.viceHeadPermissions.filter((p: string) =>
                      (ALL_VICE_PERMISSIONS as readonly string[]).includes(p)
                  )
                : [];
            await Committee.updateOne({ _id: committeeId }, { viceHeadPermissions: validPerms });
            await logActivity(authUser.userId, 'UPDATE_VICE_HEAD_PERMISSIONS', 'Committee', committeeId, {
                viceHeadPermissions: validPerms,
            });
            return NextResponse.json({ message: 'تم تحديث صلاحيات نائب رئيس اللجنة بنجاح.' });
        }

        if (action === 'assign_acting_head') {
            if (!isHeadOrAdmin) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            await Committee.updateOne(
                { _id: committeeId },
                { actingHeadId: body.actingHeadId || null }
            );
            await logActivity(authUser.userId, 'ASSIGN_ACTING_HEAD', 'Committee', committeeId, {
                actingHeadId: body.actingHeadId,
            });
            return NextResponse.json({ message: 'تم تحديث القائم بأعمال رئيس اللجنة.' });
        }

        if (action === 'add_management_note') {
            if (!body.content || !String(body.content).trim()) {
                return NextResponse.json({ error: 'الملاحظة مطلوبة.' }, { status: 400 });
            }
            await Committee.updateOne(
                { _id: committeeId },
                {
                    $push: {
                        managementNotes: {
                            authorId: authUser.userId,
                            content: String(body.content).trim(),
                            targetMemberId: body.targetMemberId || undefined,
                            createdAt: new Date(),
                        },
                    },
                }
            );
            return NextResponse.json({ message: 'تمت إضافة الملاحظة الإدارية بنجاح.' });
        }

        if (action === 'add_objective') {
            if (!body.title) return NextResponse.json({ error: 'عنوان الهدف مطلوب.' }, { status: 400 });
            await Committee.updateOne(
                { _id: committeeId },
                {
                    $push: {
                        monthlyObjectives: {
                            title: String(body.title).trim(),
                            progress: Number(body.progress) || 0,
                            targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
                            status: 'in_progress',
                        },
                    },
                }
            );
            return NextResponse.json({ message: 'تمت إضافة الهدف الشهري بنجاح.' });
        }

        if (action === 'create_meeting') {
            if (!access.permissions.includes('manage_meetings')) {
                return NextResponse.json({ error: 'Forbidden: لا تملك صلاحية إنشاء الاجتماعات.' }, { status: 403 });
            }
            const meeting = await Meeting.create({
                committeeId,
                createdBy: authUser.userId,
                title: body.title,
                agenda: body.agenda || '',
                date: body.date ? new Date(body.date) : new Date(),
                time: body.time || '19:00',
                location: body.location || 'Online',
                meetLink: body.meetLink || '',
            });

            const memberRows = await CommitteeMember.find({ committeeId, status: 'active' }).select('userId').lean<Array<{ userId: { toString(): string } }>>();
            await notifyManyUsers(
                memberRows.map((m) => m.userId.toString()),
                {
                    title: 'اجتماع جديد للجنة',
                    message: `تم جدولة اجتماع "${body.title}" بتاريخ ${new Date(meeting.date).toLocaleDateString('ar-EG')}.`,
                    type: 'info',
                    link: '/dashboard/committee',
                }
            );
            await logActivity(authUser.userId, 'CREATE_MEETING', 'Committee', committeeId, { title: body.title });
            return NextResponse.json({ meeting, message: 'تم إنشاء الاجتماع وإبلاغ الأعضاء.' }, { status: 201 });
        }

        if (action === 'create_announcement') {
            if (!access.permissions.includes('publish_announcements')) {
                return NextResponse.json({ error: 'Forbidden: لا تملك صلاحية نشر الإعلانات.' }, { status: 403 });
            }
            const announcement = await Announcement.create({
                title: body.title,
                body: body.body,
                section: 'committee',
                targetCommittee: committeeId,
                createdBy: authUser.userId,
            });
            const memberRows = await CommitteeMember.find({ committeeId, status: 'active' }).select('userId').lean<Array<{ userId: { toString(): string } }>>();
            await notifyManyUsers(
                memberRows.map((m) => m.userId.toString()),
                {
                    title: `إعلان داخلي: ${body.title}`,
                    message: String(body.body).slice(0, 140),
                    type: 'info',
                    link: '/dashboard/committee',
                }
            );
            await logActivity(authUser.userId, 'CREATE_ANNOUNCEMENT', 'Committee', committeeId, { title: body.title });
            return NextResponse.json({ announcement, message: 'تم نشر الإعلان الداخلي.' }, { status: 201 });
        }

        if (action === 'recommend_member') {
            if (!isHeadOrAdmin && !access.permissions.includes('edit_members')) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            await notifyAdmins({
                title: 'توصية بترقية أو نقل عضو',
                message: `أوصى قائد اللجنة بخصوص العضو (${body.memberName || body.memberId}): ${body.recommendation}`,
                type: 'info',
                link: '/admin/community/leadership',
            });
            await logActivity(authUser.userId, 'RECOMMEND_MEMBER', 'Committee', committeeId, {
                memberId: body.memberId,
                recommendation: body.recommendation,
            });
            return NextResponse.json({ message: 'تم إرسال التوصية إلى الإدارة بنجاح.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Committee management POST error:', error);
        return NextResponse.json({ error: 'Failed to execute management action' }, { status: 500 });
    }
}
