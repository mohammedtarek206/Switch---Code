import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import EventRegistration from '@/models/EventRegistration';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        await connectDB();

        const updatedRegistration = await EventRegistration.findByIdAndUpdate(params.id, body, { new: true, runValidators: true });

        if (!updatedRegistration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRegistration, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
