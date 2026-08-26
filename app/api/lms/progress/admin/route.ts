import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LMSEnrollment from '@/models/LMSEnrollment';
import LMSVideo from '@/models/LMSVideo';
import LMSMaterial from '@/models/LMSMaterial';
import LMSQuiz from '@/models/LMSQuiz';
import LMSAssignment from '@/models/LMSAssignment';
import VideoProgress from '@/models/VideoProgress';
import MaterialProgress from '@/models/MaterialProgress';
import QuizAttempt from '@/models/QuizAttempt';
import AssignmentSubmission from '@/models/AssignmentSubmission';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Admin: view all students' progress or specific student
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (studentId) {
            // Get specific student progress
            const student = await User.findById(studentId).select('name email role');
            if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

            const enrollment = await LMSEnrollment.findOne({ userId: studentId }).populate('trackId');

            if (!enrollment) {
                return NextResponse.json({ student, enrolled: false });
            }

            const trackId = (enrollment.trackId as any)._id;

            const [totalVideos, totalMaterials, totalQuizzes, totalAssignments,
                completedVideos, completedMaterials, quizAttempts, submissions] = await Promise.all([
                    LMSVideo.countDocuments({ trackId, published: true }),
                    LMSMaterial.countDocuments({ trackId, published: true }),
                    LMSQuiz.countDocuments({ trackId, status: 'published' }),
                    LMSAssignment.countDocuments({ trackId, published: true }),
                    VideoProgress.countDocuments({ userId: studentId, completed: true }),
                    MaterialProgress.countDocuments({ userId: studentId, completed: true }),
                    QuizAttempt.find({ userId: studentId }),
                    AssignmentSubmission.countDocuments({ userId: studentId }),
                ]);

            const passedQuizzes = new Set(quizAttempts.filter((a) => a.passed).map((a) => a.quizId.toString())).size;
            const avgScore = quizAttempts.length > 0
                ? Math.round(quizAttempts.reduce((acc, a) => acc + a.percentage, 0) / quizAttempts.length) : 0;

            const totalItems = totalVideos + totalMaterials + totalQuizzes + totalAssignments;
            const completedItems = completedVideos + completedMaterials + passedQuizzes + submissions;
            const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

            return NextResponse.json({
                student,
                enrolled: true,
                track: enrollment.trackId,
                progress: {
                    overall: overallProgress,
                    videos: { completed: completedVideos, total: totalVideos },
                    materials: { completed: completedMaterials, total: totalMaterials },
                    quizzes: { completed: passedQuizzes, total: totalQuizzes },
                    assignments: { completed: submissions, total: totalAssignments },
                    avgQuizScore: avgScore,
                },
            });
        }

        // Get all enrolled students
        const enrollments = await LMSEnrollment.find({}).populate('userId', 'name email').populate('trackId', 'name');
        return NextResponse.json({ enrollments });
    } catch (error: any) {
        console.error('Admin progress error:', error);
        return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }
}
