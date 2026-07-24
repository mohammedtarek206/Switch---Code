import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';
import ExamResult from '@/models/ExamResult';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { examId, answers } = await request.json();
        await connectDB();

        const exam = await Exam.findById(examId);
        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        if (!Array.isArray(answers) || answers.length !== exam.questions.length) {
            return NextResponse.json({ error: 'Invalid answers' }, { status: 400 });
        }

        // Calculate score
        let correctCount = 0;
        exam.questions.forEach((q: any, idx: number) => {
            if (answers[idx] === q.correctOption) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / exam.questions.length) * 100);
        const status = score >= exam.passScore ? 'Pass' : 'Fail';

        const result = await ExamResult.create({
            studentId: user.userId,
            examId: exam._id,
            score,
            answers,
            status,
        });

        return NextResponse.json(result, { status: 201 });
    } catch (error: any) {
        console.error('Submission error:', error);
        return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
    }
}
