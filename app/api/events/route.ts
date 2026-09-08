import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Event from '@/models/Event';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        const events = await Event.find({ status: { $ne: 'draft' } }).sort({ date: -1 });
        return NextResponse.json(events);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
