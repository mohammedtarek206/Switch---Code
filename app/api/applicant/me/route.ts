import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

function getLegacyApplicantFromRequest(req: NextRequest): { applicationId: string; type: string } | null {
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

// GET: applicant views their own application (without internal HR notes)
export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const legacyApplicant = getLegacyApplicantFromRequest(req);
        let application: unknown = null;

        if (legacyApplicant) {
            application = await Application.findById(legacyApplicant.applicationId)
                .select('-applicantPassword -internalHrNotes -adminNote -interview.notes')
                .populate('committeeId', 'name color type')
                .populate('recruitmentId', 'name formFields')
                .lean();
        } else {
            const authUser = await authenticateRequest(req);
            if (!authUser) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
            }
            application = await Application.findOne({ userId: authUser.userId })
                .select('-applicantPassword -internalHrNotes -adminNote -interview.notes')
                .populate('committeeId', 'name color type')
                .populate('recruitmentId', 'name formFields')
                .sort({ createdAt: -1 })
                .lean();
        }

        if (!application) {
            return NextResponse.json({ error: 'Application not found' }, { status: 404 });
        }

        return NextResponse.json(application);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
