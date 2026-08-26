import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSEnrollment from '@/models/LMSEnrollment';
import LMSVideo from '@/models/LMSVideo';
import LMSMaterial from '@/models/LMSMaterial';
import LMSQuiz from '@/models/LMSQuiz';
import LMSAssignment from '@/models/LMSAssignment';
import VideoProgress from '@/models/VideoProgress';
import MaterialProgress from '@/models/MaterialProgress';
import QuizAttempt from '@/models/QuizAttempt';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Student's real progress from DB
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        // Get enrollment
        const enrollment = await LMSEnrollment.findOne({ userId: user.userId, status: 'active' }).populate('trackId');

        if (!enrollment) {
            return NextResponse.json({ enrolled: false, progress: null });
        }

        const trackId = enrollment.trackId._id || enrollment.trackId;

        // Parallel data fetching for performance
        const [
            totalVideos,
            totalMaterials,
            totalQuizzes,
            totalAssignments,
            completedVideos,
            completedMaterials,
            passedQuizzes,
            submittedAssignments,
            quizAttempts,
            upcomingAssignments,
        ] = await Promise.all([
            LMSVideo.countDocuments({ trackId, published: true }),
            LMSMaterial.countDocuments({ trackId, published: true }),
            LMSQuiz.countDocuments({ trackId, status: 'published' }),
            LMSAssignment.countDocuments({ trackId, published: true }),
            VideoProgress.countDocuments({ userId: user.userId, completed: true }),
            MaterialProgress.countDocuments({ userId: user.userId, completed: true }),
            QuizAttempt.distinct('quizId', { userId: user.userId, passed: true }),
            AssignmentSubmission.countDocuments({ userId: user.userId }),
            QuizAttempt.find({ userId: user.userId }).sort({ submittedAt: -1 }),
            LMSAssignment.find({
                trackId,
                published: true,
                deadline: { $gte: new Date() },
            })
                .sort({ deadline: 1 })
                .limit(3),
        ]);

        // Average quiz score
        const avgScore =
            quizAttempts.length > 0
                ? Math.round(quizAttempts.reduce((acc: number, a: any) => acc + a.percentage, 0) / quizAttempts.length)
                : 0;

        // Overall progress percentage
        const totalItems = totalVideos + totalMaterials + totalQuizzes + totalAssignments;
        const completedItems =
            completedVideos + completedMaterials + passedQuizzes.length + submittedAssignments;
        const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return NextResponse.json({
            enrolled: true,
            track: enrollment.trackId,
            progress: {
                overall: overallProgress,
                videos: { completed: completedVideos, total: totalVideos },
                materials: { completed: completedMaterials, total: totalMaterials },
                quizzes: { completed: passedQuizzes.length, total: totalQuizzes },
                assignments: { completed: submittedAssignments, total: totalAssignments },
                avgQuizScore: avgScore,
                upcomingAssignments: upcomingAssignments.map((a) => ({
                    _id: a._id,
                    title: a.title,
                    deadline: a.deadline,
                })),
            },
        });
    } catch (error: any) {
        console.error('LMS Progress error:', error);
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}
