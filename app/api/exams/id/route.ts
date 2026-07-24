import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Exam from '@/models/Exam';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await connectDB();
        // Hide correctOption from students
        const exam = await Exam.findById(params.id).select('-questions.correctOption');

        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        return NextResponse.json(exam, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 });
    }
}
