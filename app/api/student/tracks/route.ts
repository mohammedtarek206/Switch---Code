import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import TrackEnrollment from '@/models/TrackEnrollment';
import LMSEnrollment from '@/models/LMSEnrollment';
import LMSTrack from '@/models/LMSTrack';
import LMSVideo from '@/models/LMSVideo';
import LMSMaterial from '@/models/LMSMaterial';
import LMSAssignment from '@/models/LMSAssignment';
import InstructorAssignment from '@/models/InstructorAssignment';
import VideoProgress from '@/models/VideoProgress';
import Announcement from '@/models/Announcement';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const [trackEnrollments, legacyEnrollment, allTracks] = await Promise.all([
            TrackEnrollment.find({ userId: user.userId, status: { $in: ['active', 'completed', 'pending'] } })
                .populate('trackId')
                .lean(),
            LMSEnrollment.findOne({ userId: user.userId }).populate('trackId').lean() as Promise<{
                trackId?: { _id: unknown };
                status?: string;
                enrollmentDate?: Date;
            } | null>,
            LMSTrack.find({ status: 'active' }).sort({ sortOrder: 1, name: 1 }).lean(),
        ]);

        // Merge legacy LMSEnrollment if not in TrackEnrollment
        const enrolledMap = new Map<string, Record<string, unknown>>();
        type TrackEnrRow = { trackId?: { _id?: { toString(): string } }; status: string; enrollmentDate: Date };
        for (const en of trackEnrollments as unknown as TrackEnrRow[]) {
            if (en.trackId?._id) {
                enrolledMap.set(en.trackId._id.toString(), {
                    track: en.trackId,
                    status: en.status,
                    enrollmentDate: en.enrollmentDate,
                });
            }
        }
        if (legacyEnrollment?.trackId?._id) {
            const tid = legacyEnrollment.trackId._id.toString();
            if (!enrolledMap.has(tid)) {
                enrolledMap.set(tid, {
                    track: legacyEnrollment.trackId,
                    status: legacyEnrollment.status || 'active',
                    enrollmentDate: legacyEnrollment.enrollmentDate,
                });
            }
        }

        const enrolledTrackIds = Array.from(enrolledMap.keys());

        // Fetch content ONLY for enrolled tracks
        const [videos, materials, assignments, instructors, completedVideos, announcements] =
            enrolledTrackIds.length > 0
                ? await Promise.all([
                      LMSVideo.find({
                          trackId: { $in: enrolledTrackIds },
                          published: true,
                          approvalStatus: { $ne: 'rejected' },
                      })
                          .sort({ order: 1, createdAt: 1 })
                          .lean(),
                      LMSMaterial.find({
                          trackId: { $in: enrolledTrackIds },
                          published: true,
                      })
                          .sort({ order: 1, createdAt: 1 })
                          .lean(),
                      LMSAssignment.find({
                          trackId: { $in: enrolledTrackIds },
                          published: true,
                      })
                          .sort({ order: 1, deadline: 1 })
                          .lean(),
                      InstructorAssignment.find({
                          trackId: { $in: enrolledTrackIds },
                          status: 'approved',
                      })
                          .populate('userId', 'name avatar bio social')
                          .lean(),
                      VideoProgress.find({ userId: user.userId, completed: true })
                          .select('videoId')
                          .lean(),
                      Announcement.find({ isActive: true }).sort({ createdAt: -1 }).limit(10).lean(),
                  ])
                : [[], [], [], [], [], []];

        const completedVideoIds = new Set(
            (completedVideos as unknown as Array<{ videoId: { toString(): string } }>).map((v) => v.videoId.toString())
        );

        const enrichedTracks = Array.from(enrolledMap.entries()).map(([tid, info]) => {
            const tVideos = (videos as unknown as Array<{ _id: { toString(): string }; trackId: { toString(): string } }>).filter(
                (v) => v.trackId.toString() === tid
            );
            const tMaterials = (materials as unknown as Array<{ trackId: { toString(): string } }>).filter(
                (m) => m.trackId.toString() === tid
            );
            const tAssignments = (assignments as unknown as Array<{ trackId: { toString(): string } }>).filter(
                (a) => a.trackId.toString() === tid
            );
            const tInstructors = (instructors as unknown as Array<{ trackId: { toString(): string }; userId: unknown }>)
                .filter((i) => i.trackId.toString() === tid)
                .map((i) => i.userId);

            const watchedCount = tVideos.filter((v) => completedVideoIds.has(v._id.toString())).length;
            const progress = tVideos.length > 0 ? Math.round((watchedCount / tVideos.length) * 100) : 0;

            return {
                ...info,
                instructors: tInstructors,
                videos: tVideos.map((v) => ({
                    ...v,
                    watched: completedVideoIds.has(v._id.toString()),
                })),
                materials: tMaterials,
                assignments: tAssignments,
                progress,
            };
        });

        return NextResponse.json({
            enrolledTracks: enrichedTracks,
            availableTracks: allTracks,
            announcements,
        });
    } catch (error) {
        console.error('Student tracks GET error:', error);
        return NextResponse.json({ error: 'Failed to load student tracks' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { trackId } = await req.json();
        if (!trackId) return NextResponse.json({ error: 'trackId is required' }, { status: 400 });

        await connectDB();
        const track = await LMSTrack.findOne({ _id: trackId, status: 'active' });
        if (!track) return NextResponse.json({ error: 'Track not found or inactive' }, { status: 404 });

        const enrollment = await TrackEnrollment.findOneAndUpdate(
            { userId: user.userId, trackId },
            {
                userId: user.userId,
                trackId,
                status: 'active',
                enrollmentDate: new Date(),
            },
            { upsert: true, new: true }
        );

        // Also update primary LMSEnrollment for /learn compatibility
        await LMSEnrollment.findOneAndUpdate(
            { userId: user.userId },
            {
                userId: user.userId,
                trackId,
                enrollmentDate: new Date(),
                status: 'active',
            },
            { upsert: true }
        );

        return NextResponse.json({ enrollment, message: 'تم الانضمام للمسار بنجاح.' }, { status: 201 });
    } catch (error) {
        console.error('Student tracks POST error:', error);
        return NextResponse.json({ error: 'Failed to enroll in track' }, { status: 500 });
    }
}
