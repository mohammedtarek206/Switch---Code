import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

export const dynamic = 'force-dynamic';

function getApplicantFromRequest(req: NextRequest): { applicationId: string; type: string } | null {
    const auth = req.headers.get('authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    try {
        const payload = jwt.verify(
            auth.substring(7),
            process.env.JWT_SECRET || 'fallback-secret'
        ) as { applicationId: string; type: string };
        if (payload.type !== 'applicant') return null;
        return payload;
    } catch {
        return null;
    }
}

// GET: applicant views their own application
export async function GET(req: NextRequest) {
    try {
        const applicant = getApplicantFromRequest(req);
        if (!applicant) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const application = await Application.findById(applicant.applicationId)
            .select('-applicantPassword')
            .populate('committeeId', 'name color type')
            .populate('recruitmentId', 'name formFields')
            .lean();

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json(application);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
