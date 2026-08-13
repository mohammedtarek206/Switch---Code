import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

/** Generate unique Application Code: APP-YYYY-XXXXXXXX */
function generateApplicationCode(): string {
    const year = new Date().getFullYear();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 8; i++) {
        rand += chars[Math.floor(Math.random() * chars.length)];
    }
    return `APP-${year}-${rand}`;
}

// GET all applications — Admin only
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

        // Pagination
        const page = parseInt(searchParams.get('page') || '1', 10);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const skip = (page - 1) * limit;

        if (committeeId) filter.committeeId = committeeId;
        if (status) filter.status = status;
        if (recruitmentId) filter.recruitmentId = recruitmentId;
        if (university) filter.university = { $regex: university, $options: 'i' };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { applicationCode: { $regex: search, $options: 'i' } },
            ];
        }
        if (from || to) {
            filter.createdAt = {};
            if (from) (filter.createdAt as Record<string, unknown>).$gte = new Date(from);
            if (to) (filter.createdAt as Record<string, unknown>).$lte = new Date(to);
        }

        const [applications, total] = await Promise.all([
            Application.find(filter)
                .select('-applicantPassword')
                .populate('committeeId', 'name type color')
                .populate('recruitmentId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Application.countDocuments(filter),
        ]);

        return NextResponse.json({
            applications,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// POST — Public: Submit application
export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { recruitmentId, committeeId, formData, name, email, phone, university, faculty } = body;

        if (!recruitmentId || !committeeId || !name || !email) {
            return NextResponse.json(
                { error: 'recruitmentId, committeeId, name, and email are required' },
                { status: 400 }
            );
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const cleanPhone = phone ? String(phone).trim() : undefined;

        // Check duplicate: same person, same committee
        const existing = await Application.findOne({
            committeeId,
            $or: [
                { email: cleanEmail },
                ...(cleanPhone ? [{ phone: cleanPhone }] : []),
            ],
        }).select('status applicationCode');

        if (existing) {
            return NextResponse.json(
                {
                    error: 'لقد تقدمت بالفعل لهذه اللجنة.',
                    existingStatus: existing.status,
                    applicationCode: existing.applicationCode,
                },
                { status: 409 }
            );
        }

        // Generate unique code (retry if collision)
        let applicationCode = generateApplicationCode();
        let attempts = 0;
        while (attempts < 5) {
            const exists = await Application.exists({ applicationCode });
            if (!exists) break;
            applicationCode = generateApplicationCode();
            attempts++;
        }

        // Generate a simple password for applicant login: first 4 chars of code + phone last 4
        const rawPassword =
            applicationCode.split('-')[2].substring(0, 4) +
            (cleanPhone ? cleanPhone.slice(-4) : '0000');
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const application = await Application.create({
            applicationCode,
            recruitmentId,
            committeeId,
            formData: formData || {},
            name: String(name).trim(),
            email: cleanEmail,
            phone: cleanPhone,
            university: university ? String(university).trim() : undefined,
            faculty: faculty ? String(faculty).trim() : undefined,
            applicantPassword: hashedPassword,
            status: 'pending',
        });

        return NextResponse.json(
            {
                message: 'تم تسجيل طلبك بنجاح',
                applicationCode,
                temporaryPassword: rawPassword,
                id: application._id,
            },
            { status: 201 }
        );
    } catch (err: unknown) {
        console.error('Application creation error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
