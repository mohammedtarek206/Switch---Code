import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Recruitment from '@/models/Recruitment';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET() {
    try {
        await connectDB();
        const recruitments = await Recruitment.find()
            .populate('committees', 'name type color icon')
            .sort({ createdAt: -1 });
        return NextResponse.json(recruitments);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_RECRUITMENTS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { name, description, startDate, endDate, status, committees, formFields } = body;

        if (!name || !startDate || !endDate) {
            return NextResponse.json({ error: 'name, startDate, endDate are required' }, { status: 400 });
        }

        const recruitment = await Recruitment.create({
            name, description, startDate, endDate,
            status: status || 'draft',
            committees: committees || [],
            formFields: formFields || [],
            createdBy: user.userId,
        });

        await logActivity(user.userId, 'CREATE_RECRUITMENT', 'Recruitment', recruitment._id.toString(), { name });

        return NextResponse.json(recruitment, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
