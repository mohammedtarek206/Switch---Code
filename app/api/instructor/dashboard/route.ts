import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import InstructorAssignment from '@/models/InstructorAssignment';
import TrackEnrollment from '@/models/TrackEnrollment';
import LMSEnrollment from '@/models/LMSEnrollment';
import LMSTrack from '@/models/LMSTrack';
import LMSVideo from '@/models/LMSVideo';
import LMSMaterial from '@/models/LMSMaterial';
import LMSAssignment from '@/models/LMSAssignment';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import Announcement from '@/models/Announcement';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole, userHasAnyRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isAdmin = isAdminRole(authUser.role, authUser.roles);
        const isInstructor = userHasAnyRole(authUser, ['instructor', 'mentor']);
        if (!isAdmin && !isInstructor) {
            return NextResponse.json({ error: 'Forbidden: Instructor access only' }, { status: 403 });
        }

        await connectDB();

        const [dbUser, availableTracks, assignments] = await Promise.all([
            User.findById(authUser.userId)
                .select('name email role roles accountStatus canPublishDirectly avatar')
                .lean(),
            LMSTrack.find({ status: 'active' }).select('_id name category level description').sort({ sortOrder: 1 }).lean(),
            InstructorAssignment.find({
                userId: authUser.userId,
                status: 'approved',
            })
                .populate('trackId')
                .lean<Array<{ trackId?: { _id?: { toString(): string }; [key: string]: unknown } }>>(),
        ]);

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const trackIds = assignments
            .map((a) => a.trackId?._id?.toString())
            .filter(Boolean) as string[];

        if (trackIds.length === 0) {
            return NextResponse.json({
                pendingReview: false,
                user: dbUser,
                assignments,
                tracks: [],
                availableTracks,
                students: [],
                videos: [],
                materials: [],
                lmsAssignments: [],
                submissions: [],
                announcements: [],
            });
        }

        const [
            trackEnrollments,
            legacyEnrollments,
            videos,
            materials,
            lmsAssignments,
            announcements,
        ] = await Promise.all([
            TrackEnrollment.find({ trackId: { $in: trackIds }, status: { $in: ['active', 'completed'] } })
                .populate('userId', 'name email phone avatar university governorate')
                .populate('trackId', 'name')
                .lean(),
            LMSEnrollment.find({ trackId: { $in: trackIds }, status: 'active' })
                .populate('userId', 'name email phone avatar university governorate')
                .populate('trackId', 'name')
                .lean(),
            LMSVideo.find({ trackId: { $in: trackIds } }).sort({ order: 1, createdAt: -1 }).lean(),
            LMSMaterial.find({ trackId: { $in: trackIds } }).sort({ order: 1, createdAt: -1 }).lean(),
            LMSAssignment.find({ trackId: { $in: trackIds } }).sort({ order: 1, createdAt: -1 }).lean(),
            Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(10).lean(),
        ]);

        const assignmentIds = (lmsAssignments as Array<{ _id: unknown }>).map((a) => a._id);
        const submissions = assignmentIds.length
            ? await AssignmentSubmission.find({ assignmentId: { $in: assignmentIds } })
                  .populate('userId', 'name email avatar')
                  .populate('assignmentId', 'title maxScore trackId')
                  .sort({ submittedAt: -1 })
                  .lean()
            : [];

        const studentMap = new Map<string, unknown>();
        type EnrolledRow = {
            userId?: { _id?: { toString(): string }; [key: string]: unknown };
            trackId?: { name?: string };
            status?: string;
        };
        for (const en of [...(trackEnrollments as unknown as EnrolledRow[]), ...(legacyEnrollments as unknown as EnrolledRow[])]) {
            if (en.userId?._id) {
                studentMap.set(en.userId._id.toString(), {
                    ...en.userId,
                    trackName: en.trackId?.name,
                    enrollmentStatus: en.status,
                });
            }
        }

        return NextResponse.json({
            pendingReview: false,
            user: dbUser,
            assignments,
            tracks: assignments.map((a) => a.trackId).filter(Boolean),
            availableTracks,
            students: Array.from(studentMap.values()),
            videos,
            materials,
            lmsAssignments,
            submissions,
            announcements,
        });
    } catch (error) {
        console.error('Instructor dashboard error:', error);
        return NextResponse.json({ error: 'Failed to load instructor dashboard' }, { status: 500 });
    }
}
