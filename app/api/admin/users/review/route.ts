import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Committee from '@/models/Committee';
import Event from '@/models/Event';
import Task from '@/models/Task';
import Application from '@/models/Application';
import InstructorAssignment from '@/models/InstructorAssignment';
import TrackEnrollment from '@/models/TrackEnrollment';
import LMSEnrollment from '@/models/LMSEnrollment';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser || !isAdminRole(authUser.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
        }

        await connectDB();

        const [
            totalUsers,
            totalStudents,
            totalInstructors,
            totalCommitteeMembers,
            pendingRegistrations,
            pendingInstructorApps,
            pendingCommitteeApps,
            activeCommittees,
            totalEvents,
            activeTasks,
            completedTasks,
            pendingInstructorsList,
            pendingStudentsList,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'instructor', accountStatus: 'active' }),
            User.countDocuments({
                role: { $in: ['member', 'committee_leader', 'vice_committee_leader', 'hr', 'pr', 'marketing', 'media', 'technical'] },
            }),
            User.countDocuments({ accountStatus: { $in: ['pending_review', 'pending_verification'] } }),
            User.countDocuments({ role: 'instructor', accountStatus: 'pending_review' }),
            Application.countDocuments({ status: { $in: ['pending', 'reviewing', 'shortlisted', 'interview'] } }),
            Committee.countDocuments({ isActive: true }),
            Event.countDocuments({}),
            Task.countDocuments({ status: { $nin: ['done', 'cancelled'] } }),
            Task.countDocuments({ status: 'done' }),
            User.find({ role: 'instructor', accountStatus: 'pending_review' })
                .select('-password -tempPassword')
                .sort({ createdAt: -1 })
                .lean<Array<{ _id: { toString(): string }; [key: string]: unknown }>>(),
            User.find({ role: 'student', accountStatus: { $in: ['pending_review', 'pending_verification'] } })
                .select('-password -tempPassword')
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        // Attach requested tracks for pending instructors
        const pendingInstructorIds = pendingInstructorsList.map((u) => u._id);
        const instructorAssignments = pendingInstructorIds.length
            ? await InstructorAssignment.find({ userId: { $in: pendingInstructorIds } })
                  .populate('trackId', 'name category')
                  .lean<Array<{ userId: { toString(): string }; [key: string]: unknown }>>()
            : [];

        const enrichedInstructors = pendingInstructorsList.map((u) => ({
            ...u,
            requestedTracks: instructorAssignments.filter(
                (a) => a.userId.toString() === u._id.toString()
            ),
        }));

        return NextResponse.json({
            stats: {
                totalUsers,
                totalStudents,
                totalInstructors,
                totalCommitteeMembers,
                pendingRegistrations,
                pendingInstructorApps,
                pendingCommitteeApps,
                activeCommittees,
                totalEvents,
                activeTasks,
                completedTasks,
            },
            pendingInstructors: enrichedInstructors,
            pendingStudents: pendingStudentsList,
        });
    } catch (error) {
        console.error('Admin review GET error:', error);
        return NextResponse.json({ error: 'Failed to load review queue' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser || !isAdminRole(authUser.role)) {
            return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
        }

        const body = await req.json();
        const { userId, action, trackIds, canPublishDirectly, reason } = body;

        if (!userId || !action) {
            return NextResponse.json({ error: 'userId and action are required' }, { status: 400 });
        }

        await connectDB();
        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Prevent non-super_admin from modifying super_admin or admin accounts
        if (
            ['super_admin', 'admin'].includes(targetUser.role) &&
            authUser.role !== 'super_admin'
        ) {
            return NextResponse.json(
                { error: 'Forbidden: Only super_admin can modify admin accounts' },
                { status: 403 }
            );
        }

        if (action === 'approve_instructor') {
            targetUser.accountStatus = 'active';
            targetUser.isActive = true;
            targetUser.role = 'instructor';
            targetUser.canPublishDirectly = Boolean(canPublishDirectly);
            await targetUser.save();

            if (Array.isArray(trackIds) && trackIds.length > 0) {
                await InstructorAssignment.updateMany(
                    { userId: targetUser._id, trackId: { $nin: trackIds } },
                    { status: 'rejected' }
                );
                for (const tid of trackIds) {
                    await InstructorAssignment.findOneAndUpdate(
                        { userId: targetUser._id, trackId: tid },
                        {
                            userId: targetUser._id,
                            trackId: tid,
                            status: 'approved',
                            canPublishDirectly: Boolean(canPublishDirectly),
                            assignedBy: authUser.userId,
                            assignedAt: new Date(),
                        },
                        { upsert: true }
                    );
                }
            } else {
                await InstructorAssignment.updateMany(
                    { userId: targetUser._id },
                    {
                        status: 'approved',
                        canPublishDirectly: Boolean(canPublishDirectly),
                        assignedBy: authUser.userId,
                        assignedAt: new Date(),
                    }
                );
            }

            await createNotification({
                userId: targetUser._id.toString(),
                title: 'تم قبولك كمحاضر في Switch Code!',
                message: 'تم اعتماد حسابك كمحاضر وتفعيل لوحة تحكم المحاضرين الخاصة بك.',
                type: 'success',
                link: '/instructor/dashboard',
                emailTo: targetUser.email,
                sendEmail: true,
            });
        } else if (action === 'reject_instructor' || action === 'reject_user') {
            targetUser.accountStatus = 'rejected';
            targetUser.isActive = false;
            await targetUser.save();

            await InstructorAssignment.updateMany(
                { userId: targetUser._id },
                { status: 'rejected' }
            );

            await createNotification({
                userId: targetUser._id.toString(),
                title: 'تحديث بخصوص طلب حسابك',
                message: reason || 'نأسف، لم يتم قبول طلبك في الوقت الحالي.',
                type: 'warning',
                emailTo: targetUser.email,
                sendEmail: true,
            });
        } else if (action === 'approve_user' || action === 'reactivate_user') {
            targetUser.accountStatus = 'active';
            targetUser.isActive = true;
            targetUser.emailVerified = true;
            await targetUser.save();

            await createNotification({
                userId: targetUser._id.toString(),
                title: 'تم تفعيل حسابك',
                message: 'حسابك نشط الآن ويمكنك استخدام جميع صلاحياتك.',
                type: 'success',
                link: '/login',
            });
        } else if (action === 'suspend_user') {
            targetUser.accountStatus = 'suspended';
            targetUser.isActive = false;
            await targetUser.save();
        } else if (action === 'assign_student_tracks' && Array.isArray(trackIds)) {
            for (const tid of trackIds) {
                await TrackEnrollment.findOneAndUpdate(
                    { userId: targetUser._id, trackId: tid },
                    { userId: targetUser._id, trackId: tid, status: 'active', approvedBy: authUser.userId, approvedAt: new Date() },
                    { upsert: true }
                );
            }
            if (trackIds[0]) {
                await LMSEnrollment.findOneAndUpdate(
                    { userId: targetUser._id },
                    { userId: targetUser._id, trackId: trackIds[0], status: 'active' },
                    { upsert: true }
                );
            }
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await logActivity(authUser.userId, `ADMIN_${action.toUpperCase()}`, 'User', userId, {
            trackIds,
            reason,
        });

        return NextResponse.json({ message: 'تم تنفيذ الإجراء بنجاح.', user: targetUser });
    } catch (error) {
        console.error('Admin review PATCH error:', error);
        return NextResponse.json({ error: 'Failed to process review action' }, { status: 500 });
    }
}
