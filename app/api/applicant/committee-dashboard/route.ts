import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';
import Committee from '@/models/Committee';
import Announcement from '@/models/Announcement';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { applicationCode, identifier } = body;

        if (!applicationCode || !identifier) {
            return NextResponse.json(
                { error: 'Application Code and Email/Phone are required' },
                { status: 400 }
            );
        }

        const cleanCode = String(applicationCode).trim().toUpperCase();
        const cleanIdentifier = String(identifier).trim().toLowerCase();
        const rawIdentifier = String(identifier).trim();

        // Find the application with match on code + email or phone
        const application = await Application.findOne({
            applicationCode: cleanCode,
            $or: [
                { email: cleanIdentifier },
                { phone: cleanIdentifier },
                { phone: rawIdentifier },
            ],
        })
            .populate('committeeId', 'name color description type')
            .lean() as any;

        if (!application) {
            return NextResponse.json(
                { error: 'لم يتم العثور على الطلب. تحقق من الكود والبيانات المُدخلة.' },
                { status: 404 }
            );
        }

        // SECURITY: Only accepted applicants can access the committee dashboard
        if (application.status !== 'accepted') {
            return NextResponse.json(
                {
                    error: `لا يمكنك الدخول إلى لوحة اللجنة. حالة طلبك الحالية: "${application.status}". يجب أن يكون الطلب مقبولاً.`,
                    status: application.status,
                },
                { status: 403 }
            );
        }

        if (!application.committeeId) {
            return NextResponse.json(
                { error: 'لم يتم ربط طلبك بأي لجنة. يرجى التواصل مع الإدارة.' },
                { status: 400 }
            );
        }

        const committee = application.committeeId as any;

        // Get committee members count
        const User = (await import('@/models/User')).default;
        const [membersCount, committeeMembersList] = await Promise.all([
            User.countDocuments({ committeeId: committee._id, isActive: true }),
            User.find({ committeeId: committee._id, isActive: true })
                .select('name role position avatar username')
                .limit(20)
                .lean(),
        ]);

        // Get recent announcements (public ones)
        const announcements = await Announcement.find({
            targetType: 'all',
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('title body createdAt')
            .lean();

        return NextResponse.json({
            applicant: {
                name: application.name,
                applicationCode: application.applicationCode,
                email: application.email,
                phone: application.phone,
                university: application.university,
                faculty: application.faculty,
                status: application.status,
                adminNote: application.adminNote,
                appliedAt: application.createdAt,
                acceptedAt: application.updatedAt,
                interview: application.interview || null,
            },
            committee: {
                _id: committee._id,
                name: committee.name,
                color: committee.color,
                description: committee.description,
                type: committee.type,
                membersCount,
                members: committeeMembersList,
            },
            announcements,
        });
    } catch (err: any) {
        console.error('Applicant committee dashboard error:', err);
        return NextResponse.json(
            { error: 'حدث خطأ في الخادم: ' + (err?.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
