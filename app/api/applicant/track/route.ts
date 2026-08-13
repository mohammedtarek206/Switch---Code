import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { applicationCode, identifier } = body; // identifier = email or phone

        if (!applicationCode || !identifier) {
            return NextResponse.json(
                { error: 'Application Code and Email/Phone are required' },
                { status: 400 }
            );
        }

        const cleanCode = String(applicationCode).trim().toUpperCase();
        const cleanIdentifier = String(identifier).trim().toLowerCase();

        const application = await Application.findOne({
            applicationCode: cleanCode,
            $or: [
                { email: cleanIdentifier },
                { phone: cleanIdentifier },
                { phone: identifier.trim() }, // phone without lowercasing
            ],
        })
            .select('applicationCode name status adminNote committeeId createdAt updatedAt')
            .populate('committeeId', 'name color')
            .lean();

        if (!application) {
            return NextResponse.json(
                { error: 'لم يتم العثور على الطلب. تحقق من الكود والبيانات المُدخلة.' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            applicationCode: application.applicationCode,
            name: (application as { name: string }).name,
            status: (application as { status: string }).status,
            adminNote: (application as { adminNote?: string }).adminNote || null,
            committee: (application as { committeeId: { name: string; color: string } }).committeeId,
            appliedAt: (application as { createdAt: Date }).createdAt,
            lastUpdated: (application as { updatedAt: Date }).updatedAt,
        });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
