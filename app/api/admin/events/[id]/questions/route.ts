import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventQuestion from '@/models/EventQuestion';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const questions = await EventQuestion.find({ eventId: params.id }).sort({ order: 1 });

        return NextResponse.json(questions);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { question, type, options, required, active, order } = await req.json();

        if (!question || !options || options.length === 0) {
            return NextResponse.json({ error: 'Question title and options are required' }, { status: 400 });
        }

        const newQuestion = await EventQuestion.create({
            eventId: params.id,
            question,
            type: type || 'multiple_choice',
            options,
            required: required !== undefined ? required : true,
            active: active !== undefined ? active : true,
            order: order !== undefined ? order : 0,
        });

        return NextResponse.json(newQuestion, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const body = await req.json();

        // Handle array for bulk re-ordering
        if (Array.isArray(body)) {
            // Bulk update for order
            const updates = body.map((item: any) =>
                EventQuestion.findByIdAndUpdate(item._id, { order: item.order })
            );
            await Promise.all(updates);
            return NextResponse.json({ message: 'Order updated' });
        }

        const { questionId, question, type, options, required, active } = body;

        if (!questionId) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        const updated = await EventQuestion.findByIdAndUpdate(
            questionId,
            { question, type, options, required, active },
            { new: true }
        );

        if (!updated) {
            return NextResponse.json({ error: 'Question not found' }, { status: 404 });
        }

        return NextResponse.json(updated);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const url = new URL(req.url);
        const questionId = url.searchParams.get('questionId');

        if (!questionId) {
            return NextResponse.json({ error: 'Question ID is required' }, { status: 400 });
        }

        await EventQuestion.findByIdAndDelete(questionId);

        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
