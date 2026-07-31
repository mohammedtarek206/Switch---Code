import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import EventQuestion from '@/models/EventQuestion';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const {
            name,
            email,
            phone,
            university,
            faculty,
            academicYear,
            department,
            governorate,
            gender,
            age,
            linkedin,
            github,
            portfolio,
            cv,
            answers,
            userId,
        } = body;

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

        // Fetch all active questions for validation and answer mapping
        const allQuestions = await EventQuestion.find({ eventId: params.id, active: true }).sort({ order: 1 });

        let mappedAnswers: any[] = [];
        if (answers && typeof answers === 'object') {
            for (const key of Object.keys(answers)) {
                const q = allQuestions.find((qDoc) => qDoc._id.toString() === key);
                if (q) {
                    let val = answers[key];
                    if (val !== undefined && val !== null) {
                        if (q.type === 'checkbox') {
                            val = Array.isArray(val) ? val : (val ? [String(val)] : []);
                        } else if (q.type === 'number') {
                            val = isNaN(Number(val)) ? val : Number(val);
                        }
                        mappedAnswers.push({
                            questionId: q._id,
                            question: q.question,
                            type: q.type,
                            answer: val,
                        });
                    }
                }
            }
        }

        // Validate required questions
        const requiredQuestions = allQuestions.filter((q) => q.required);
        for (const rq of requiredQuestions) {
            const ansObj = mappedAnswers.find((a) => a.questionId.toString() === rq._id.toString());
            if (
                !ansObj ||
                ansObj.answer === undefined ||
                ansObj.answer === null ||
                ansObj.answer === '' ||
                (Array.isArray(ansObj.answer) && ansObj.answer.length === 0)
            ) {
                return NextResponse.json({ error: `Question '${rq.question}' is required` }, { status: 400 });
            }
        }

        // Capacity check
        const currentRegs = await EventRegistration.countDocuments({ eventId: params.id, status: { $ne: 'rejected' } });
        let status: 'registered' | 'waitlist' = 'registered';

        if (event.seats && currentRegs >= event.seats) {
            if (event.hasWaitingList) {
                status = 'waitlist';
            } else {
                return NextResponse.json({ error: 'Event is fully booked' }, { status: 400 });
            }
        }

        // Check duplicate registration
        const existing = await EventRegistration.findOne({ eventId: params.id, email: email.toLowerCase() });
        if (existing) {
            return NextResponse.json(
                {
                    message: 'You are already registered! Here is your entry barcode.',
                    registration: existing,
                },
                { status: 200 }
            );
        }

        const registration = await EventRegistration.create({
            eventId: params.id,
            userId: userId || undefined,
            name,
            email: email.toLowerCase(),
            phone: phone || '',
            university: university || '',
            faculty: faculty || '',
            academicYear: academicYear || '',
            department: department || '',
            governorate: governorate || '',
            gender: gender || '',
            age: age || undefined,
            linkedin: linkedin || '',
            github: github || '',
            portfolio: portfolio || '',
            cv: cv || '',
            status,
            answers: mappedAnswers,
            attended: false,
        });

        return NextResponse.json(
            {
                message: status === 'waitlist' ? 'Added to waiting list' : 'Registration completed successfully!',
                registration,
            },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Event Registration Error:', error);
        return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
    }
}
