import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';
import { validateGoogleDrivePhoto } from '@/lib/googleDrive';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(authUser.userId)
            .select('-password -tempPassword -emailVerificationToken -passwordResetToken')
            .populate('committeeId', 'name slug type color')
            .populate('interestedTracks', 'name category level')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Profile GET error:', error);
        return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        await connectDB();

        const user = await User.findById(authUser.userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (typeof body.name === 'string' && body.name.trim().length >= 3) {
            user.name = body.name.trim();
        }
        if (typeof body.phone === 'string' && body.phone.trim()) {
            const duplicatePhone = await User.findOne({
                phone: body.phone.trim(),
                _id: { $ne: user._id },
            }).select('_id').lean();
            if (duplicatePhone) {
                return NextResponse.json({ error: 'رقم الهاتف مستخدم بالفعل.' }, { status: 409 });
            }
            user.phone = body.phone.trim();
        }
        if (typeof body.governorate === 'string') user.governorate = body.governorate.trim();
        if (typeof body.university === 'string') user.university = body.university.trim();
        if (typeof body.academicYear === 'string') user.academicYear = body.academicYear.trim();
        if (typeof body.graduationYear === 'string') user.graduationYear = body.graduationYear.trim();
        if (typeof body.bio === 'string') user.bio = body.bio.trim();
        if (typeof body.goals === 'string') user.goals = body.goals.trim();

        if (Array.isArray(body.skills)) {
            user.skills = body.skills.map((s: unknown) => String(s).trim()).filter(Boolean);
        }

        if (body.social && typeof body.social === 'object') {
            user.social = {
                linkedin: typeof body.social.linkedin === 'string' ? body.social.linkedin.trim() : user.social?.linkedin,
                github: typeof body.social.github === 'string' ? body.social.github.trim() : user.social?.github,
                portfolio: typeof body.social.portfolio === 'string' ? body.social.portfolio.trim() : user.social?.portfolio,
            };
        }

        if (typeof body.drivePhotoUrl === 'string' && body.drivePhotoUrl.trim()) {
            const photoResult = await validateGoogleDrivePhoto(body.drivePhotoUrl.trim());
            if (!photoResult.valid) {
                return NextResponse.json({ error: photoResult.error }, { status: 400 });
            }
            user.avatar = photoResult.displayUrl;
            user.avatarDriveFileId = photoResult.fileId;
            user.avatarSource = 'google_drive';
        }

        user.profileCompleted = Boolean(user.name && user.avatar && user.governorate && user.university);
        await user.save();

        await logActivity(authUser.userId, 'UPDATE_PROFILE', 'User', authUser.userId);

        return NextResponse.json({
            message: 'تم تحديث الملف الشخصي بنجاح.',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                avatar: user.avatar,
                governorate: user.governorate,
                university: user.university,
                academicYear: user.academicYear,
                bio: user.bio,
                skills: user.skills,
                social: user.social,
                profileCompleted: user.profileCompleted,
            },
        });
    } catch (error) {
        console.error('Profile PUT error:', error);
        return NextResponse.json({ error: 'فشل تحديث الملف الشخصي.' }, { status: 500 });
    }
}
