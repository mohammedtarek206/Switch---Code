import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventQuestion from '@/models/EventQuestion';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        // Fetch only active questions, and we don't need any auth because this is for the registration form
        const questions = await EventQuestion.find({ eventId: params.id, active: true }).sort({ order: 1 });

        return NextResponse.json(questions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
