import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSQuiz from '@/models/LMSQuiz';
import QuizAttempt from '@/models/QuizAttempt';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - All quizzes for admin
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        const quizzes = await LMSQuiz.find({}).populate('trackId', 'name').sort({ createdAt: -1 });

        // Get submission counts
        const quizIds = quizzes.map((q) => q._id);
        const submissionCounts = await QuizAttempt.aggregate([
            { $match: { quizId: { $in: quizIds } } },
            { $group: { _id: '$quizId', count: { $sum: 1 }, avgPercentage: { $avg: '$percentage' } } },
        ]);

        const countsMap = new Map(submissionCounts.map((c) => [c._id.toString(), c]));

        const quizzesWithStats = quizzes.map((quiz) => {
            const stats = countsMap.get(quiz._id.toString());
            return {
                ...quiz.toObject(),
                submissionCount: stats?.count || 0,
                avgPercentage: stats ? Math.round(stats.avgPercentage) : 0,
            };
        });

        return NextResponse.json({ quizzes: quizzesWithStats });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }
}
