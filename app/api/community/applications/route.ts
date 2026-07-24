import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

// GET all applications with filters
export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_APPLICATIONS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { searchParams } = new URL(req.url);
        const filter: Record<string, unknown> = {};

        const committeeId = searchParams.get('committeeId');
        const status = searchParams.get('status');
        const recruitmentId = searchParams.get('recruitmentId');
        const search = searchParams.get('search');
        const university = searchParams.get('university');
        const from = searchParams.get('from');
        const to = searchParams.get('to');

        if (committeeId) filter.committeeId = committeeId;
        if (status) filter.status = status;
        if (recruitmentId) filter.recruitmentId = recruitmentId;
        if (university) filter.university = { $regex: university, $options: 'i' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (from || to) {
            filter.createdAt = {};
            if (from) (filter.createdAt as Record<string, unknown>).$gte = new Date(from);
            if (to) (filter.createdAt as Record<string, unknown>).$lte = new Date(to);
        }

        const applications = await Application.find(filter)
            .populate('committeeId', 'name type color')
            .populate('recruitmentId', 'name')
            .sort({ createdAt: -1 });

        return NextResponse.json(applications);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST (public) - submit an application
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { recruitmentId, committeeId, formData, name, email, phone, university, faculty } = body;

        if (!recruitmentId || !committeeId || !name || !email) {
            return NextResponse.json({ error: 'recruitmentId, committeeId, name, email are required' }, { status: 400 });
        }

        const application = await Application.create({
            recruitmentId,
            committeeId,
            formData: formData || {},
            name,
            email,
            phone,
            university,
            faculty,
        });

        return NextResponse.json({ message: 'Application submitted', id: application._id }, { status: 201 });
    } catch (err: unknown) {
        const error = err as { code?: number };
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Already applied' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
