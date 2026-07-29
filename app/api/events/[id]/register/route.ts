import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import EventQuestion from '@/models/EventQuestion';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const { name, email, phone, university, faculty, answers } = await req.json();

        if (!name || !email) {
            return NextResponse.json({ error: 'Name and Email are required' }, { status: 400 });
        }

        await connectDB();

        const event = await Event.findById(params.id);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        if (!event.registrationOpen) {
            return NextResponse.json({ error: 'Registration for this event is closed' }, { status: 400 });
        }

        if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
            return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
        }

        // Fetch all active questions to build embedded answers and validate
        const allQuestions = await EventQuestion.find({ eventId: params.id, active: true });

        let mappedAnswers: any[] = [];
        if (answers && typeof answers === 'object') {
            for (const key of Object.keys(answers)) {
                const q = allQuestions.find((qDoc) => qDoc._id.toString() === key);
                if (q) {
                    mappedAnswers.push({
                        questionId: q._id.toString(),
                        question: q.question,
                        type: q.type,
                        answer: answers[key]
                    });
                }
            }
        }

        // Validate required questions
        const requiredQuestions = allQuestions.filter(q => q.required);
        if (requiredQuestions.length > 0) {
            for (const rq of requiredQuestions) {
                const ansObj = mappedAnswers.find(a => a.questionId === rq._id.toString());
                if (!ansObj || ansObj.answer === undefined || ansObj.answer === null || ansObj.answer === '' || (Array.isArray(ansObj.answer) && ansObj.answer.length === 0)) {
                    return NextResponse.json({ error: `Question '${rq.question}' is required` }, { status: 400 });
                }
            }
        }

        // Check capacity
        const currentRegs = await EventRegistration.countDocuments({ eventId: params.id, status: { $ne: 'rejected' } });
        let status: 'registered' | 'waitlist' = 'registered';

        if (event.seats && currentRegs >= event.seats) {
            if (event.hasWaitingList) {
                status = 'waitlist';
            } else {
                return NextResponse.json({ error: 'Event is fully booked' }, { status: 400 });
            }
        }

        // Check duplicate
        const existing = await EventRegistration.findOne({ eventId: params.id, email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json({
                message: 'You are already registered! Here is your barcode again.',
                registration: existing
            }, { status: 200 });
        }

        const registration = await EventRegistration.create({
            eventId: params.id,
            name,
            email: email.toLowerCase(),
            phone,
            university,
            faculty,
            status,
            answers: mappedAnswers,
            attended: false,
        });

        return NextResponse.json({
            message: status === 'waitlist' ? 'Added to waiting list' : 'Successfully registered!',
            registration
        }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
    }
}
