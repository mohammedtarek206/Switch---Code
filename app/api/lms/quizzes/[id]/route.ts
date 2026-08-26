import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSQuiz from '@/models/LMSQuiz';
import QuizAttempt from '@/models/QuizAttempt';
import LMSEnrollment from '@/models/LMSEnrollment';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get quiz with correct answers for taking (check enrollment)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();

        const quiz = await LMSQuiz.findById(params.id);
        if (!quiz || quiz.status !== 'published') {
            return NextResponse.json({ error: 'Quiz not found' }, { status: 404 });
        }

        // Verify student is enrolled in the track with this quiz
        const enrollment = await LMSEnrollment.findOne({ userId: user.userId, trackId: quiz.trackId });
        if (!enrollment && !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Not enrolled in this track' }, { status: 403 });
        }

        // Check attempts allowed
        const attemptCount = await QuizAttempt.countDocuments({ userId: user.userId, quizId: params.id });
        if (attemptCount >= quiz.attemptsAllowed && !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'No more attempts allowed', attemptsExhausted: true }, { status: 403 });
        }

        // Return quiz WITH correct answers (needed during quiz taking)
        return NextResponse.json({ quiz, attemptNumber: attemptCount + 1 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch quiz' }, { status: 500 });
    }
}

// PATCH - Admin updates quiz
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const data = await request.json();
        await connectDB();
        const quiz = await LMSQuiz.findByIdAndUpdate(params.id, data, { new: true });
        if (!quiz) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ quiz });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

// DELETE - Admin deletes quiz
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        await connectDB();
        await LMSQuiz.findByIdAndDelete(params.id);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
