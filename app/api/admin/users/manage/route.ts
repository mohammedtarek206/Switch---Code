import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import Committee from '@/models/Committee';
import CommitteeMember from '@/models/CommitteeMember';
import LMSTrack from '@/models/LMSTrack';
import InstructorAssignment from '@/models/InstructorAssignment';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser || !isAdminRole(authUser.role, authUser.roles)) {
            return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
        }

        await connectDB();
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [
            totalUsers,
            students,
            instructors,
            committeeMembers,
            committeeHeads,
            committeeViceHeads,
            activeAccounts,
            suspendedAccounts,
            newRegistrations,
            legacyPendingCount,
            users,
            committees,
            tracks,
        ] = await Promise.all([
            User.countDocuments({}),
            User.countDocuments({ $or: [{ role: 'student' }, { roles: 'student' }] }),
            User.countDocuments({ $or: [{ role: 'instructor' }, { roles: 'instructor' }] }),
            User.countDocuments({
                $or: [
                    { role: { $in: ['member', 'hr', 'pr', 'marketing', 'media', 'technical'] } },
                    { roles: 'member' },
                ],
            }),
            User.countDocuments({ $or: [{ role: 'committee_leader' }, { roles: 'committee_leader' }] }),
            User.countDocuments({ $or: [{ role: 'vice_committee_leader' }, { roles: 'vice_committee_leader' }] }),
            User.countDocuments({ isActive: { $ne: false }, accountStatus: { $ne: 'suspended' } }),
            User.countDocuments({ $or: [{ isActive: false }, { accountStatus: 'suspended' }] }),
            User.countDocuments({ createdAt: { $gte: sevenDaysAgo } }),
            User.countDocuments({ accountStatus: { $in: ['pending_review', 'pending_verification'] } }),
            User.find({})
                .select('-password -tempPassword -emailVerificationToken -passwordResetToken')
                .populate('committeeId', 'name color')
                .sort({ createdAt: -1 })
                .limit(200)
                .lean(),
            Committee.find({ isActive: true }).select('_id name registrationOpen availableForRegistration maxMembers currentMemberCount').sort({ displayOrder: 1, name: 1 }).lean(),
            LMSTrack.find({ status: 'active' }).select('_id name category').sort({ sortOrder: 1 }).lean(),
        ]);

        return NextResponse.json({
            stats: {
                totalUsers,
                students,
                instructors,
                committeeMembers,
                committeeHeads,
                committeeViceHeads,
                activeAccounts,
                suspendedAccounts,
                newRegistrations,
                legacyPendingCount,
            },
            users,
            committees,
            tracks,
        });
    } catch (error) {
        console.error('Admin users manage GET error:', error);
        return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser || !isAdminRole(authUser.role, authUser.roles)) {
            return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
        }

        const body = await req.json();
        const { action, userId, roles, primaryRole, trackIds, committeeId, canPublishDirectly } = body;

        await connectDB();

        if (action === 'activate_legacy_pending') {
            const res = await User.updateMany(
                { accountStatus: { $in: ['pending_review', 'pending_verification'] } },
                { $set: { accountStatus: 'active', isActive: true } }
            );
            await logActivity(authUser.userId, 'MIGRATE_LEGACY_PENDING_USERS', 'User', undefined, {
                modifiedCount: res.modifiedCount,
            });
            return NextResponse.json({
                message: `تم تفعيل ${res.modifiedCount} حساباً معلقاً قديماً بأمان.`,
                modifiedCount: res.modifiedCount,
            });
        }

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        const targetUser = await User.findById(userId);
        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (['super_admin', 'admin'].includes(targetUser.role) && authUser.role !== 'super_admin') {
            return NextResponse.json({ error: 'Only super_admin can modify admin accounts' }, { status: 403 });
        }

        if (action === 'update_roles') {
            const cleanRoles: UserRole[] = Array.isArray(roles)
                ? (roles.filter((r: string) =>
                      authUser.role === 'super_admin' ? true : !['super_admin', 'admin'].includes(r)
                  ) as UserRole[])
                : [targetUser.role];

            if (cleanRoles.length === 0) {
                return NextResponse.json({ error: 'يجب تحديد دور واحد على الأقل.' }, { status: 400 });
            }

            const nextPrimary = primaryRole && cleanRoles.includes(primaryRole) ? primaryRole : cleanRoles[0];
            targetUser.role = nextPrimary;
            targetUser.roles = Array.from(new Set([nextPrimary, ...cleanRoles]));
            if (canPublishDirectly !== undefined) {
                targetUser.canPublishDirectly = Boolean(canPublishDirectly);
            }
            await targetUser.save();
        } else if (action === 'assign_instructor_tracks' && Array.isArray(trackIds)) {
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
                        canPublishDirectly: true,
                        assignedBy: authUser.userId,
                        assignedAt: new Date(),
                    },
                    { upsert: true }
                );
            }
        } else if (action === 'transfer_committee' && committeeId) {
            if (targetUser.committeeId) {
                await Committee.updateOne(
                    { _id: targetUser.committeeId, currentMemberCount: { $gt: 0 } },
                    { $inc: { currentMemberCount: -1 } }
                );
                await CommitteeMember.updateOne(
                    { userId: targetUser._id, committeeId: targetUser.committeeId },
                    { status: 'inactive' }
                );
            }
            targetUser.committeeId = committeeId;
            if (!targetUser.roles?.includes('member')) {
                targetUser.roles = Array.from(new Set([...(targetUser.roles || [targetUser.role]), 'member'])) as UserRole[];
            }
            await targetUser.save();

            await CommitteeMember.findOneAndUpdate(
                { userId: targetUser._id, committeeId },
                { userId: targetUser._id, committeeId, position: 'Member', status: 'active' },
                { upsert: true }
            );
            await Committee.updateOne({ _id: committeeId }, { $inc: { currentMemberCount: 1 } });
        } else if (action === 'suspend') {
            targetUser.accountStatus = 'suspended';
            targetUser.isActive = false;
            await targetUser.save();
        } else if (action === 'reactivate') {
            targetUser.accountStatus = 'active';
            targetUser.isActive = true;
            await targetUser.save();
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await logActivity(authUser.userId, `ADMIN_USER_${String(action).toUpperCase()}`, 'User', userId, {
            roles,
            committeeId,
            trackIds,
        });

        return NextResponse.json({ message: 'تم تحديث بيانات المستخدم بنجاح.', user: targetUser });
    } catch (error) {
        console.error('Admin users manage PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
    }
}
