import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSQuiz from '@/models/LMSQuiz';
import LMSEnrollment from '@/models/LMSEnrollment';
import QuizAttempt from '@/models/QuizAttempt';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Fetch quizzes for student's track
export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const enrollment = await LMSEnrollment.findOne({ userId: user.userId, status: 'active' });
        if (!enrollment) {
            return NextResponse.json({ quizzes: [], noTrack: true });
        }

        const quizzesRaw = await LMSQuiz.find({
            trackId: enrollment.trackId,
            status: 'published',
        }).sort({ order: 1, createdAt: 1 });

        // Strip correct answers before sending to client
        const quizzes = quizzesRaw.map((q: any) => {
            const obj = q.toObject();
            obj.questions = (obj.questions || []).map((question: any) => {
                const { correctAnswer, ...rest } = question;
                return rest;
            });
            return obj;
        });

        // Get attempt counts
        const quizIds = quizzes.map((q) => q._id);
        const attempts = await QuizAttempt.find({
            userId: user.userId,
            quizId: { $in: quizIds },
        }).sort({ attemptNumber: -1 });

        const attemptsMap = new Map<string, { count: number; best: any }>();
        attempts.forEach((a) => {
            const key = a.quizId.toString();
            if (!attemptsMap.has(key)) {
                attemptsMap.set(key, { count: 0, best: null });
            }
            const curr = attemptsMap.get(key)!;
            curr.count++;
            if (!curr.best || a.percentage > curr.best.percentage) {
                curr.best = {
                    score: a.score,
                    percentage: a.percentage,
                    passed: a.passed,
                    submittedAt: a.submittedAt,
                    attemptNumber: a.attemptNumber,
                };
            }
        });

        const quizzesWithAttempts = quizzes.map((quiz) => {
            const attemptInfo = attemptsMap.get(quiz._id.toString());
            return {
                ...quiz,
                totalAttempts: attemptInfo?.count || 0,
                bestAttempt: attemptInfo?.best || null,
                canAttempt: !attemptInfo || attemptInfo.count < quiz.attemptsAllowed,
            };
        });

        return NextResponse.json({ quizzes: quizzesWithAttempts, trackId: enrollment.trackId });
    } catch (error: any) {
        console.error('Quizzes GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 });
    }
}

// POST - Admin creates quiz
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized: Token expired or missing. Please log in again.' }, { status: 401 });
        }
        if (!isLMSAdmin(user.role)) {
            return NextResponse.json({ error: `Unauthorized: Role '${user.role}' is not allowed to manage quizzes.` }, { status: 403 });
        }

        const data = await request.json();
        await connectDB();

        const quiz = new LMSQuiz({ ...data, createdBy: user.userId });
        await quiz.save();

        return NextResponse.json({ quiz, message: 'Quiz created successfully' }, { status: 201 });
    } catch (error: any) {
        console.error('Quizzes POST error:', error);
        return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 });
    }
}
