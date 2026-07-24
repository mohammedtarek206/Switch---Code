import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Recruitment from '@/models/Recruitment';

// GET the active public recruitment cycle + fields configuration
export async function GET() {
    try {
        await connectDB();
        const recruitment = await Recruitment.findOne({ status: 'open' })
            .populate('committees', 'name description color icon type')
            .sort({ endDate: 1 });

        if (!recruitment) {
            return NextResponse.json({ message: 'No open cycles at the moment.' }, { status: 404 });
        }

        return NextResponse.json(recruitment);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
