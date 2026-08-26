import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSQuiz from '@/models/LMSQuiz';
import QuizAttempt from '@/models/QuizAttempt';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST - Submit quiz answers and compute score
export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { quizId, answers } = await request.json();
        if (!quizId || !answers) {
            return NextResponse.json({ error: 'quizId and answers are required' }, { status: 400 });
        }

        await connectDB();

        const quiz = await LMSQuiz.findById(quizId);
        if (!quiz) return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });

        // Check attempt limit
        const existingAttempts = await QuizAttempt.countDocuments({ userId: user.userId, quizId });
        if (existingAttempts >= quiz.attemptsAllowed) {
            return NextResponse.json({ error: 'Maximum attempts reached' }, { status: 403 });
        }

        // Auto-grade multiple choice and true/false
        let score = 0;
        let maxScore = 0;
        const gradedAnswers: { questionIndex: number; answer: string }[] = [];

        quiz.questions.forEach((question: any, index: number) => {
            maxScore += question.points;
            const submitted = answers[index] || '';
            gradedAnswers.push({ questionIndex: index, answer: submitted });

            if (question.type === 'multiple_choice' || question.type === 'true_false') {
                if (submitted.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
                    score += question.points;
                }
            }
            // short_answer: requires manual grading, leave score as 0 for now
        });

        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        const passed = percentage >= quiz.passingScore;

        const attempt = new QuizAttempt({
            userId: user.userId,
            quizId,
            answers: gradedAnswers,
            score,
            maxScore,
            percentage,
            passed,
            attemptNumber: existingAttempts + 1,
            submittedAt: new Date(),
        });
        await attempt.save();

        return NextResponse.json({
            attempt: {
                score,
                maxScore,
                percentage,
                passed,
                attemptNumber: existingAttempts + 1,
            },
            message: passed ? 'Congratulations! You passed!' : 'You did not pass. Try again.',
        });
    } catch (error: any) {
        console.error('Quiz submit error:', error);
        return NextResponse.json({ error: 'Failed to submit quiz' }, { status: 500 });
    }
}
