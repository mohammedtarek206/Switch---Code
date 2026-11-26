import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import CommitteeMember from '@/models/CommitteeMember';
import User from '@/models/User';
import LeadershipHistory from '@/models/LeadershipHistory';
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
        const [committees, members, history, eligibleUsers] = await Promise.all([
            Committee.find({})
                .populate('leaderId', 'name email avatar role')
                .populate('viceLeaderId', 'name email avatar role')
                .sort({ name: 1 })
                .lean(),
            CommitteeMember.find({ status: 'active' })
                .populate('userId', 'name email avatar role position')
                .lean(),
            LeadershipHistory.find({})
                .populate('committeeId', 'name')
                .populate('userId', 'name email')
                .populate('changedBy', 'name')
                .sort({ createdAt: -1 })
                .limit(50)
                .lean(),
            User.find({
                isActive: true,
                accountStatus: 'active',
                role: { $nin: ['student'] },
            })
                .select('name email role committeeId avatar')
                .sort({ name: 1 })
                .lean(),
        ]);

        return NextResponse.json({ committees, members, history, eligibleUsers });
    } catch (error) {
        console.error('Leadership GET error:', error);
        return NextResponse.json({ error: 'Failed to load leadership data' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser || !isAdminRole(authUser.role)) {
            return NextResponse.json(
                { error: 'Forbidden: Only Admin can assign or change committee leadership.' },
                { status: 403 }
            );
        }

        const { committeeId, userId, action, targetCommitteeId, reason } = await req.json();
        if (!committeeId || !userId || !action) {
            return NextResponse.json({ error: 'committeeId, userId, and action are required' }, { status: 400 });
        }

        await connectDB();
        const [committee, targetUser] = await Promise.all([
            Committee.findById(committeeId),
            User.findById(userId),
        ]);

        if (!committee || !targetUser) {
            return NextResponse.json({ error: 'Committee or User not found' }, { status: 404 });
        }

        if (action === 'assign_head') {
            if (committee.viceLeaderId && committee.viceLeaderId.toString() === userId) {
                committee.viceLeaderId = undefined;
            }
            // Demote previous head to member if exists
            if (committee.leaderId && committee.leaderId.toString() !== userId) {
                const prevHeadId = committee.leaderId.toString();
                await User.updateOne(
                    { _id: prevHeadId, role: 'committee_leader' },
                    { role: 'member', position: 'Member' }
                );
                await CommitteeMember.updateOne(
                    { committeeId, userId: prevHeadId },
                    { position: 'Member' }
                );
            }

            committee.leaderId = targetUser._id;
            await committee.save();

            const prevRole = targetUser.role;
            if (!isAdminRole(targetUser.role)) {
                targetUser.role = 'committee_leader';
            }
            targetUser.committeeId = committee._id;
            targetUser.position = 'Committee Head';
            targetUser.accountStatus = 'active';
            targetUser.isActive = true;
            await targetUser.save();

            await CommitteeMember.findOneAndUpdate(
                { userId: targetUser._id, committeeId: committee._id },
                { userId: targetUser._id, committeeId: committee._id, position: 'Head', status: 'active' },
                { upsert: true }
            );

            await LeadershipHistory.create({
                committeeId: committee._id,
                userId: targetUser._id,
                previousRole: prevRole,
                newRole: 'committee_leader',
                action: 'assign_head',
                changedBy: authUser.userId,
                reason,
            });

            await createNotification({
                userId: targetUser._id.toString(),
                title: 'تعيين قيادي جديد',
                message: `تم تعيينك رئيساً (Head) للجنة ${committee.name}.`,
                type: 'success',
                link: '/dashboard/committee',
            });
        } else if (action === 'assign_vice_head') {
            if (committee.leaderId && committee.leaderId.toString() === userId) {
                return NextResponse.json(
                    { error: 'هذا العضو هو رئيس اللجنة بالفعل. لا يمكن تعيينه كـ Head و Vice Head معاً.' },
                    { status: 400 }
                );
            }

            if (committee.viceLeaderId && committee.viceLeaderId.toString() !== userId) {
                const prevViceId = committee.viceLeaderId.toString();
                await User.updateOne(
                    { _id: prevViceId, role: 'vice_committee_leader' },
                    { role: 'member', position: 'Member' }
                );
                await CommitteeMember.updateOne(
                    { committeeId, userId: prevViceId },
                    { position: 'Member' }
                );
            }

            committee.viceLeaderId = targetUser._id;
            await committee.save();

            const prevRole = targetUser.role;
            if (!isAdminRole(targetUser.role)) {
                targetUser.role = 'vice_committee_leader';
            }
            targetUser.committeeId = committee._id;
            targetUser.position = 'Vice Head';
            targetUser.accountStatus = 'active';
            targetUser.isActive = true;
            await targetUser.save();

            await CommitteeMember.findOneAndUpdate(
                { userId: targetUser._id, committeeId: committee._id },
                { userId: targetUser._id, committeeId: committee._id, position: 'Vice Head', status: 'active' },
                { upsert: true }
            );

            await LeadershipHistory.create({
                committeeId: committee._id,
                userId: targetUser._id,
                previousRole: prevRole,
                newRole: 'vice_committee_leader',
                action: 'assign_vice_head',
                changedBy: authUser.userId,
                reason,
            });

            await createNotification({
                userId: targetUser._id.toString(),
                title: 'تعيين نائب رئيس لجنة',
                message: `تم تعيينك نائباً لرئيس اللجنة (Vice Head) في ${committee.name}.`,
                type: 'success',
                link: '/dashboard/committee',
            });
        } else if (action === 'add_member') {
            if (!isAdminRole(targetUser.role) && ['committee_applicant', 'student'].includes(targetUser.role)) {
                targetUser.role = 'member';
            }
            targetUser.committeeId = committee._id;
            targetUser.accountStatus = 'active';
            targetUser.isActive = true;
            await targetUser.save();

            await CommitteeMember.findOneAndUpdate(
                { userId: targetUser._id, committeeId: committee._id },
                { userId: targetUser._id, committeeId: committee._id, position: 'Member', status: 'active' },
                { upsert: true }
            );

            await LeadershipHistory.create({
                committeeId: committee._id,
                userId: targetUser._id,
                previousRole: targetUser.role,
                newRole: 'member',
                action: 'add_member',
                changedBy: authUser.userId,
                reason,
            });

            await createNotification({
                userId: targetUser._id.toString(),
                title: 'إضافة إلى لجنة',
                message: `تمت إضافتك كعضو في لجنة ${committee.name}.`,
                type: 'success',
                link: '/dashboard/committee',
            });
        } else if (action === 'remove_member') {
            if (committee.leaderId?.toString() === userId) committee.leaderId = undefined;
            if (committee.viceLeaderId?.toString() === userId) committee.viceLeaderId = undefined;
            await committee.save();

            await CommitteeMember.updateOne(
                { userId: targetUser._id, committeeId: committee._id },
                { status: 'inactive' }
            );
            if (targetUser.committeeId?.toString() === committeeId) {
                targetUser.committeeId = undefined;
                if (['committee_leader', 'vice_committee_leader'].includes(targetUser.role)) {
                    targetUser.role = 'member';
                }
                await targetUser.save();
            }

            await LeadershipHistory.create({
                committeeId: committee._id,
                userId: targetUser._id,
                previousRole: targetUser.role,
                newRole: 'removed',
                action: 'remove_member',
                changedBy: authUser.userId,
                reason,
            });
        } else if (action === 'transfer_member' && targetCommitteeId) {
            const targetComm = await Committee.findById(targetCommitteeId);
            if (!targetComm) return NextResponse.json({ error: 'Target committee not found' }, { status: 404 });

            if (committee.leaderId?.toString() === userId) committee.leaderId = undefined;
            if (committee.viceLeaderId?.toString() === userId) committee.viceLeaderId = undefined;
            await committee.save();

            await CommitteeMember.updateOne(
                { userId: targetUser._id, committeeId: committee._id },
                { status: 'inactive' }
            );

            await CommitteeMember.findOneAndUpdate(
                { userId: targetUser._id, committeeId: targetComm._id },
                { userId: targetUser._id, committeeId: targetComm._id, position: 'Member', status: 'active' },
                { upsert: true }
            );

            targetUser.committeeId = targetComm._id;
            if (['committee_leader', 'vice_committee_leader'].includes(targetUser.role)) {
                targetUser.role = 'member';
            }
            await targetUser.save();

            await LeadershipHistory.create({
                committeeId: committee._id,
                targetCommitteeId: targetComm._id,
                userId: targetUser._id,
                previousRole: targetUser.role,
                newRole: 'transferred',
                action: 'transfer_member',
                changedBy: authUser.userId,
                reason,
            });
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        await logActivity(authUser.userId, `LEADERSHIP_${action.toUpperCase()}`, 'Committee', committeeId, {
            targetUserId: userId,
            targetCommitteeId,
        });

        return NextResponse.json({ message: 'تم تحديث قيادة/عضوية اللجنة بنجاح.' });
    } catch (error) {
        console.error('Leadership POST error:', error);
        return NextResponse.json({ error: 'Failed to update leadership' }, { status: 500 });
    }
}
