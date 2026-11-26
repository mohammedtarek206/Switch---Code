import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import CommitteeMember from '@/models/CommitteeMember';
import Task from '@/models/Task';
import Announcement from '@/models/Announcement';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { canAccessCommittee, canManageCommittee, isAdminRole } from '@/lib/permissions';
import { notifyManyUsers, createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

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

        // Strict committee isolation check
        if (!canAccessCommittee(authUser, committeeId)) {
            const membership = await CommitteeMember.findOne({
                userId: authUser.userId,
                committeeId,
                status: 'active',
            }).lean();
            if (!membership) {
                return NextResponse.json(
                    { error: 'Forbidden: لا يمكنك الوصول إلى بيانات لجنة أخرى.' },
                    { status: 403 }
                );
            }
        }

        const isLeader =
            canManageCommittee(authUser, committeeId) ||
            (await Committee.exists({
                _id: committeeId,
                $or: [{ leaderId: authUser.userId }, { viceLeaderId: authUser.userId }],
            }));

        const isAdmin = isAdminRole(authUser.role, authUser.roles);
        const taskFilter: Record<string, unknown> = isLeader
            ? { committeeId, isDeleted: { $ne: true } }
            : { committeeId, assignees: authUser.userId, isDeleted: { $ne: true } };

        const [committee, members, tasks, announcements, allCommittees] = await Promise.all([
            Committee.findById(committeeId)
                .populate('leaderId', 'name avatar email')
                .populate('viceLeaderId', 'name avatar email')
                .lean(),
            CommitteeMember.find({ committeeId, status: 'active' })
                .populate('userId', 'name email avatar role position')
                .lean(),
            Task.find(taskFilter)
                .populate('assignees', 'name avatar email')
                .populate('createdBy', 'name')
                .populate('comments.authorId', 'name avatar')
                .populate('submissions.submittedBy', 'name avatar')
                .populate('submissions.reviewedBy', 'name')
                .sort({ createdAt: -1 })
                .lean<Array<{ status: string; deadline?: Date; [key: string]: unknown }>>(),
            Announcement.find({
                isActive: true,
                $or: [{ committeeId }, { committeeId: null }, { committeeId: { $exists: false } }],
            })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean(),
            isAdmin ? Committee.find({ isActive: true }).select('_id name dashboardType slug').sort({ displayOrder: 1, name: 1 }).lean() : Promise.resolve([]),
        ]);

        if (!committee) {
            return NextResponse.json({ error: 'Committee not found' }, { status: 404 });
        }

        const now = new Date();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'done').length;
        const pendingReviews = tasks.filter((t) => t.status === 'review').length;
        const overdueTasks = tasks.filter(
            (t) =>
                t.deadline && new Date(t.deadline) < now && !['done', 'cancelled'].includes(t.status)
        ).length;

        return NextResponse.json({
            committee,
            isLeader: Boolean(isLeader),
            isAdmin,
            allCommittees,
            stats: {
                totalMembers: members.length,
                activeTasks: totalTasks - completedTasks,
                completedTasks,
                pendingReviews,
                overdueTasks,
                completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
            },
            members,
            tasks,
            announcements,
        });
    } catch (error) {
        console.error('Committee workspace GET error:', error);
        return NextResponse.json({ error: 'Failed to load committee workspace' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const committeeId = body.committeeId || authUser.committeeId;
        if (!committeeId || !body.title) {
            return NextResponse.json({ error: 'title and committeeId are required' }, { status: 400 });
        }

        await connectDB();
        const isLeader =
            canManageCommittee(authUser, committeeId) ||
            Boolean(
                await Committee.exists({
                    _id: committeeId,
                    $or: [{ leaderId: authUser.userId }, { viceLeaderId: authUser.userId }],
                })
            );

        if (!isLeader) {
            return NextResponse.json(
                { error: 'Forbidden: فقط رئيس اللجنة أو نائبه أو الأدمن يمكنهم إنشاء مهام لهذه اللجنة.' },
                { status: 403 }
            );
        }

        const assignees: string[] = Array.isArray(body.assignees) ? body.assignees.filter(Boolean) : [];

        const task = await Task.create({
            title: body.title,
            description: body.description || '',
            committeeId,
            assignees,
            createdBy: authUser.userId,
            startDate: body.startDate ? new Date(body.startDate) : new Date(),
            deadline: body.deadline ? new Date(body.deadline) : undefined,
            priority: body.priority || 'medium',
            status: 'todo',
            attachments: Array.isArray(body.attachments) ? body.attachments : [],
            links: Array.isArray(body.links) ? body.links : [],
            activityLog: [
                {
                    actorId: authUser.userId,
                    action: 'CREATED',
                    detail: `تم إنشاء المهمة: ${body.title}`,
                },
            ],
        });

        if (assignees.length > 0) {
            await notifyManyUsers(assignees, {
                title: 'مهمة جديدة مسندة إليك',
                message: `تم إسناد مهمة "${body.title}" إليك.`,
                type: 'info',
                link: '/dashboard/committee',
            });
        }

        await logActivity(authUser.userId, 'CREATE_COMMITTEE_TASK', 'Task', task._id.toString(), {
            committeeId,
            title: body.title,
        });

        return NextResponse.json({ task, message: 'تم إنشاء المهمة بنجاح.' }, { status: 201 });
    } catch (error) {
        console.error('Committee workspace POST error:', error);
        return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { taskId, action, content, attachments, links, notes, feedback, status } = body;

        if (!taskId || !action) {
            return NextResponse.json({ error: 'taskId and action are required' }, { status: 400 });
        }

        await connectDB();
        const task = await Task.findById(taskId);
        if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 });

        const committeeId = task.committeeId.toString();
        const isLeader =
            canManageCommittee(authUser, committeeId) ||
            Boolean(
                await Committee.exists({
                    _id: committeeId,
                    $or: [{ leaderId: authUser.userId }, { viceLeaderId: authUser.userId }],
                })
            );
        const isAssignee = task.assignees.some(
            (a: { toString(): string }) => a.toString() === authUser.userId
        );

        if (action === 'submit_task') {
            if (!isAssignee && !isLeader) {
                return NextResponse.json({ error: 'Forbidden: هذه المهمة غير مسندة إليك.' }, { status: 403 });
            }

            const nextVersion = (task.submissions?.length || 0) + 1;
            task.submissions.push({
                version: nextVersion,
                submittedBy: authUser.userId as never,
                content: content || '',
                attachments: Array.isArray(attachments) ? attachments : [],
                links: Array.isArray(links) ? links : [],
                notes: notes || '',
                submittedAt: new Date(),
                status: 'pending_review',
            });
            task.status = 'review';
            task.activityLog.push({
                actorId: authUser.userId as never,
                action: 'SUBMITTED',
                detail: `تم إرسال تسليم رقم ${nextVersion}`,
                createdAt: new Date(),
            });
            await task.save();

            // Notify committee leaders
            const comm = await Committee.findById(committeeId).select('leaderId viceLeaderId').lean() as {
                leaderId?: { toString(): string };
                viceLeaderId?: { toString(): string };
            } | null;
            const leaderIds = [comm?.leaderId?.toString(), comm?.viceLeaderId?.toString()].filter(Boolean) as string[];
            await notifyManyUsers(leaderIds, {
                title: 'تسليم مهمة للمراجعة',
                message: `تم إرسال تسليم جديد في مهمة "${task.title}" (الإصدار ${nextVersion}).`,
                type: 'info',
                link: '/dashboard/committee',
            });

            return NextResponse.json({ task, message: 'تم إرسال التسليم للمراجعة بنجاح.' });
        }

        if (action === 'review_task') {
            if (!isLeader && !isAdminRole(authUser.role)) {
                return NextResponse.json(
                    { error: 'Forbidden: فقط قيادة اللجنة يمكنها مراجعة التسليمات.' },
                    { status: 403 }
                );
            }

            const decision = status === 'approved' ? 'approved' : 'revision_required';
            if (task.submissions && task.submissions.length > 0) {
                const latest = task.submissions[task.submissions.length - 1];
                latest.status = decision;
                latest.feedback = feedback || '';
                latest.reviewedBy = authUser.userId as never;
                latest.reviewedAt = new Date();
            }

            task.status = decision === 'approved' ? 'done' : 'revision';
            task.progress = decision === 'approved' ? 100 : task.progress;
            task.reviewNote = feedback || '';
            task.reviewedBy = authUser.userId as never;
            task.reviewedAt = new Date();
            task.activityLog.push({
                actorId: authUser.userId as never,
                action: decision === 'approved' ? 'APPROVED' : 'REVISION_REQUIRED',
                detail: feedback || '',
                createdAt: new Date(),
            });
            await task.save();

            const assigneeIds = task.assignees.map((a: { toString(): string }) => a.toString());
            await notifyManyUsers(assigneeIds, {
                title: decision === 'approved' ? 'تم قبول المهمة' : 'مطلوب تعديل على المهمة',
                message:
                    decision === 'approved'
                        ? `تم قبول تسليمك في مهمة "${task.title}".`
                        : `طلب رئيس اللجنة تعديلاً في مهمة "${task.title}": ${feedback || ''}`,
                type: decision === 'approved' ? 'success' : 'warning',
                link: '/dashboard/committee',
            });

            await logActivity(authUser.userId, 'REVIEW_TASK', 'Task', taskId, { decision });
            return NextResponse.json({ task, message: 'تم حفظ نتيجة المراجعة.' });
        }

        if (action === 'update_status' && status) {
            if (!isAssignee && !isLeader) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            const prevStatus = task.status;
            task.status = status;
            if (status === 'done') task.progress = 100;
            task.activityLog.push({
                actorId: authUser.userId as never,
                action: 'STATUS_CHANGED',
                detail: `${prevStatus} -> ${status}`,
                createdAt: new Date(),
            });
            await task.save();
            return NextResponse.json({ task });
        }

        if (action === 'add_comment' && body.comment) {
            if (!isAssignee && !isLeader && !isAdminRole(authUser.role, authUser.roles)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            task.comments.push({
                authorId: authUser.userId as never,
                content: String(body.comment).trim(),
                createdAt: new Date(),
            });
            await task.save();

            const notifyIds = task.assignees
                .map((a: { toString(): string }) => a.toString())
                .filter((id: string) => id !== authUser.userId);
            if (task.createdBy && task.createdBy.toString() !== authUser.userId) {
                notifyIds.push(task.createdBy.toString());
            }
            await notifyManyUsers(notifyIds, {
                title: 'تعليق جديد على مهمة',
                message: `تعليق جديد على "${task.title}": ${String(body.comment).slice(0, 80)}`,
                type: 'info',
                link: '/dashboard/committee',
            });
            return NextResponse.json({ task, message: 'تمت إضافة التعليق.' });
        }

        if (action === 'add_subtask' && body.subtaskTitle) {
            if (!isLeader && !isAssignee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            task.subtasks = task.subtasks || [];
            task.subtasks.push({ title: String(body.subtaskTitle).trim(), done: false });
            await task.save();
            return NextResponse.json({ task });
        }

        if (action === 'toggle_subtask' && body.subtaskId) {
            if (!isLeader && !isAssignee) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            const st = task.subtasks?.find((s: { _id?: { toString(): string } }) => s._id?.toString() === body.subtaskId);
            if (st) {
                st.done = !st.done;
                const total = task.subtasks.length;
                const doneCount = task.subtasks.filter((s: { done: boolean }) => s.done).length;
                if (total > 0) task.progress = Math.round((doneCount / total) * 100);
                await task.save();
            }
            return NextResponse.json({ task });
        }

        if (action === 'soft_delete') {
            if (!isLeader && !isAdminRole(authUser.role, authUser.roles)) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }
            task.isDeleted = true;
            await task.save();
            await logActivity(authUser.userId, 'SOFT_DELETE_TASK', 'Task', taskId, { title: task.title });
            return NextResponse.json({ message: 'تم أرشفة/حذف المهمة بنجاح.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Committee workspace PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }
}
