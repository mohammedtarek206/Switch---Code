import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSVideo from '@/models/LMSVideo';
import LMSTrack from '@/models/LMSTrack';
import LMSEnrollment from '@/models/LMSEnrollment';
import VideoProgress from '@/models/VideoProgress';
import User from '@/models/User';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';
import { extractYouTubeId, getYouTubeThumbnail } from '@/lib/youtube';

export const dynamic = 'force-dynamic';

// GET - Single video details for student (protected)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // Check account active
        const dbUser = await User.findById(user.userId).select('isActive name email');
        if (!dbUser || dbUser.isActive === false) {
            return NextResponse.json({ error: 'Account suspended or inactive' }, { status: 403 });
        }

        const video = await LMSVideo.findById(params.id);
        if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

        const isAdmin = isLMSAdmin(user.role);

        if (!isAdmin) {
            if (!video.published) {
                return NextResponse.json({ error: 'Video not available' }, { status: 404 });
            }

            // Verify enrollment in track
            const enrollment = await LMSEnrollment.findOne({
                userId: user.userId,
                trackId: video.trackId,
                status: 'active',
            });
            if (!enrollment) {
                return NextResponse.json({ error: 'Access Denied: You are not enrolled in this track' }, { status: 403 });
            }

            // Verify track active
            const track = await LMSTrack.findById(video.trackId);
            if (!track || track.status !== 'active') {
                return NextResponse.json({ error: 'Track is currently inactive' }, { status: 403 });
            }
        }

        const progress = await VideoProgress.findOne({ userId: user.userId, videoId: video._id });

        const youtubeId = extractYouTubeId(video.videoUrl);
        const thumbnail = video.thumbnail || getYouTubeThumbnail(video.videoUrl);

        return NextResponse.json({
            video: {
                _id: video._id,
                title: video.title,
                description: video.description,
                thumbnail,
                youtubeId,
                instructor: video.instructor,
                duration: video.duration,
                order: video.order,
                trackId: video.trackId,
                progress: progress
                    ? {
                        completed: progress.completed,
                        watchedDuration: progress.watchedDuration,
                        lastWatchedAt: progress.lastWatchedAt,
                    }
                    : null,
            },
            student: {
                name: dbUser.name,
                email: dbUser.email || `ST-${String(dbUser._id).substring(18)}`,
            },
        });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.json();
        await connectDB();

        // Standardize YouTube URL/ID if videoUrl is updated
        if (data.videoUrl) {
            const ytId = extractYouTubeId(data.videoUrl);
            if (ytId) {
                data.videoUrl = ytId;
            }
        }

        const video = await LMSVideo.findByIdAndUpdate(params.id, data, { new: true });
        if (!video) return NextResponse.json({ error: 'Video not found' }, { status: 404 });

        return NextResponse.json({ video, message: 'Video updated' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();
        await LMSVideo.findByIdAndDelete(params.id);
        return NextResponse.json({ message: 'Video deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }
}
