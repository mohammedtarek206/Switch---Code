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

// GET - Fetch videos for the student's enrolled track
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // 1. Check user account active status
        const dbUser = await User.findById(user.userId).select('name email isActive');
        if (!dbUser || dbUser.isActive === false) {
            return NextResponse.json({ error: 'Account suspended or inactive' }, { status: 403 });
        }

        // 2. Get user's active enrollment
        const enrollment = await LMSEnrollment.findOne({ userId: user.userId, status: 'active' });
        if (!enrollment) {
            return NextResponse.json({ videos: [], noTrack: true });
        }

        // 3. Verify track status is active
        const track = await LMSTrack.findById(enrollment.trackId);
        if (!track || track.status !== 'active') {
            return NextResponse.json({ videos: [], trackInactive: true });
        }

        // 4. Fetch published videos for track, ordered
        const videos = await LMSVideo.find({
            trackId: enrollment.trackId,
            published: true,
        }).sort({ order: 1, createdAt: 1 });

        // 5. Fetch user's progress for these videos
        const videoIds = videos.map((v) => v._id);
        const progressList = await VideoProgress.find({
            userId: user.userId,
            videoId: { $in: videoIds },
        });

        const progressMap = new Map(progressList.map((p) => [p.videoId.toString(), p]));

        const sanitizedVideos = videos.map((video) => {
            const progress = progressMap.get(video._id.toString());
            const youtubeId = extractYouTubeId(video.videoUrl);
            const thumbnail = video.thumbnail || getYouTubeThumbnail(video.videoUrl);

            return {
                _id: video._id,
                title: video.title,
                description: video.description,
                thumbnail,
                youtubeId,
                instructor: video.instructor || 'Switch Code',
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
            };
        });

        return NextResponse.json({
            videos: sanitizedVideos,
            trackId: enrollment.trackId,
            student: {
                name: dbUser.name,
                email: dbUser.email || `ST-${String(dbUser._id).substring(18)}`,
            },
        });
    } catch (error: any) {
        console.error('Videos GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }
}

// POST - Admin creates video
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: Token expired or missing. Please log in again.' }, { status: 401 });
        }
        if (!isLMSAdmin(user.role)) {
            return NextResponse.json({ error: `Unauthorized: Role '${user.role}' is not allowed to manage videos.` }, { status: 403 });
        }

        const data = await request.json();
        await connectDB();

        // Standardize YouTube URL or Video ID
        if (data.videoUrl) {
            const ytId = extractYouTubeId(data.videoUrl);
            if (ytId) data.videoUrl = ytId;
        }

        const video = new LMSVideo({ ...data, createdBy: user.userId });
        await video.save();

        return NextResponse.json({ video, message: 'Video created successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Videos POST error:', error);
        return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
    }
}
