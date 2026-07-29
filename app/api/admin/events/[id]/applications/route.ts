import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';
import EventRegistration from '@/models/EventRegistration';
import EventQuestion from '@/models/EventQuestion';
import EventQuestionAnswer from '@/models/EventQuestionAnswer';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();

        const event = await Event.findById(params.id);
        if (!event) {
            return NextResponse.json({ error: 'Event not found' }, { status: 404 });
        }

        const applications = await EventRegistration.find({ eventId: params.id }).sort({ createdAt: -1 }).lean();

        // Fetch all questions for this event to map the answers easily
        const questions = await EventQuestion.find({ eventId: params.id }).lean();

        // Fetch all answers for these applications
        const appIds = applications.map((a: any) => a._id);
        const allAnswers = await EventQuestionAnswer.find({ applicationId: { $in: appIds } }).lean();

        // Attach answers to applications
        const mappedApplications = applications.map((app: any) => {
            const answersForApp = allAnswers.filter((ans: any) => ans.applicationId.toString() === app._id.toString());
            const answersMapping = answersForApp.map((ans: any) => {
                const question = questions.find((q: any) => q._id.toString() === ans.questionId.toString());
                return {
                    questionId: ans.questionId,
                    question: question ? question.question : 'Unknown Question',
                    answer: ans.selectedAnswer,
                };
            });
            return {
                ...app,
                answers: answersMapping,
            };
        });

        const stats = {
            total: applications.length,
            accepted: applications.filter(a => a.status === 'accepted').length,
            rejected: applications.filter(a => a.status === 'rejected').length,
            waitlist: applications.filter(a => a.status === 'waitlist').length,
            registered: applications.filter(a => a.status === 'registered').length,
            attended: applications.filter(a => a.attended).length,
            checkedIn: applications.filter(a => a.checkIn).length,
            checkedOut: applications.filter(a => a.checkOut).length,
        };

        return NextResponse.json({ event, applications: mappedApplications, stats });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !['admin', 'super_admin', 'president', 'vice_president', 'hr', 'pr'].includes(user.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { registrationId, status, action } = await req.json();

        const reg = await EventRegistration.findById(registrationId);
        if (!reg) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        if (status) {
            reg.status = status;
        }

        if (action === 'checkin') {
            reg.checkIn = new Date();
            reg.attended = true;
        } else if (action === 'checkout') {
            reg.checkOut = new Date();
        }

        await reg.save();
        return NextResponse.json({ message: 'Updated successfully', registration: reg });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
