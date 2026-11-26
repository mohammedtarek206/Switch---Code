import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import AttendanceRecord from '@/models/AttendanceRecord';
import CommitteeMember from '@/models/CommitteeMember';
import { authenticateRequest } from '@/lib/auth';
import { canAccessCommittee, isAdminRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const requestedCommitteeId = searchParams.get('committeeId');
        const isAdmin = isAdminRole(authUser.role, authUser.roles);
        const committeeId = requestedCommitteeId === 'all' && isAdmin ? null : requestedCommitteeId || authUser.committeeId;

        if (committeeId && !canAccessCommittee(authUser, committeeId)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const taskFilter: Record<string, unknown> = { isDeleted: { $ne: true } };
        const attFilter: Record<string, unknown> = {};
        const memFilter: Record<string, unknown> = { status: 'active' };

        if (committeeId) {
            taskFilter.committeeId = committeeId;
            attFilter.committeeId = committeeId;
            memFilter.committeeId = committeeId;
        }

        const [tasks, attendance, members] = await Promise.all([
            Task.find(taskFilter).select('assignees status deadline createdAt').lean<Array<{
                assignees?: Array<{ toString(): string }>;
                status: string;
                deadline?: Date;
                createdAt: Date;
            }>>(),
            AttendanceRecord.find(attFilter).select('userId status date').lean<Array<{
                userId?: { toString(): string };
                status: string;
                date: Date;
            }>>(),
            CommitteeMember.find(memFilter)
                .populate('userId', 'name email performanceScore')
                .populate('committeeId', 'name')
                .lean<Array<{
                    userId?: { _id?: { toString(): string }; name?: string; email?: string; performanceScore?: number };
                    committeeId?: { name?: string };
                    position?: string;
                }>>(),
        ]);

        const now = new Date();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'done').length;
        const overdueTasks = tasks.filter(
            (t) => t.deadline && new Date(t.deadline) < now && !['done', 'cancelled'].includes(t.status)
        ).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        const presentOrLate = attendance.filter((a) => a.status === 'present' || a.status === 'late').length;
        const attendanceRate = attendance.length > 0 ? Math.round((presentOrLate / attendance.length) * 100) : 100;

        const memberPerformance = members
            .filter((m) => m.userId?._id)
            .map((m) => {
                const uid = m.userId!._id!.toString();
                const mTasks = tasks.filter((t) => t.assignees?.some((a) => a.toString() === uid));
                const mCompleted = mTasks.filter((t) => t.status === 'done').length;
                const mOverdue = mTasks.filter(
                    (t) => t.deadline && new Date(t.deadline) < now && !['done', 'cancelled'].includes(t.status)
                ).length;
                const mAtt = attendance.filter((a) => a.userId?.toString() === uid);
                const mPresent = mAtt.filter((a) => a.status === 'present' || a.status === 'late').length;

                return {
                    userId: uid,
                    name: m.userId?.name || 'Member',
                    email: m.userId?.email || '',
                    committee: m.committeeId?.name || '',
                    position: m.position || 'Member',
                    assignedTasks: mTasks.length,
                    completedTasks: mCompleted,
                    overdueTasks: mOverdue,
                    completionRate: mTasks.length > 0 ? Math.round((mCompleted / mTasks.length) * 100) : 0,
                    attendanceRate: mAtt.length > 0 ? Math.round((mPresent / mAtt.length) * 100) : 100,
                    performanceScore: m.userId?.performanceScore || 0,
                };
            });

        return NextResponse.json({
            summary: {
                totalTasks,
                completedTasks,
                overdueTasks,
                completionRate,
                attendanceRate,
                totalMembers: memberPerformance.length,
            },
            memberPerformance,
        });
    } catch (error) {
        console.error('Performance analytics GET error:', error);
        return NextResponse.json({ error: 'Failed to load performance analytics' }, { status: 500 });
    }
}
