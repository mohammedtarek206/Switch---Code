import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import Committee from '@/models/Committee';
import CommitteeMember from '@/models/CommitteeMember';
import LMSTrack from '@/models/LMSTrack';
import TrackEnrollment from '@/models/TrackEnrollment';
import LMSEnrollment from '@/models/LMSEnrollment';
import InstructorAssignment from '@/models/InstructorAssignment';
import { validateGoogleDrivePhoto } from '@/lib/googleDrive';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';
import { isMailerConfigured, sendEmailSafe } from '@/lib/mailer';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';
import { generateToken, setAuthCookie } from '@/lib/auth';
import { getDashboardRouteForRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

const ALLOWED_PRIMARY_TYPES = ['student', 'instructor', 'committee_member'] as const;
const ALLOWED_EXTRA_ROLES = new Set<UserRole>(['student', 'instructor', 'member']);

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const rl = checkRateLimit(`self-register:${ip}`, 15, 15 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'تم تجاوز الحد المسموح لمحاولات التسجيل. يرجى الانتظار 15 دقيقة.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const {
            accountType: rawAccountType,
            additionalRoles,
            fullName,
            email,
            phone,
            password,
            confirmPassword,
            governorate,
            university,
            academicYear,
            graduationYear,
            drivePhotoUrl,
            bio,
            termsAccepted,
            // Student fields
            interestedTrackIds,
            goals,
            // Instructor fields
            skills,
            experienceYears,
            previousExperience,
            linkedin,
            github,
            portfolio,
            teachingTrackIds,
            // Committee Member fields
            committeeId,
        } = body;

        const accountType = rawAccountType === 'committee_applicant' ? 'committee_member' : rawAccountType;

        // 1. Validate accountType (NEVER allow admin/super_admin/head/vice_head)
        if (!ALLOWED_PRIMARY_TYPES.includes(accountType)) {
            return NextResponse.json(
                { error: 'نوع الحساب غير صالح. الأنواع المتاحة: طالب، محاضر، عضو لجنة.' },
                { status: 400 }
            );
        }

        // 2. Basic field validation
        const cleanName = typeof fullName === 'string' ? fullName.trim() : '';
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        const cleanPhone = typeof phone === 'string' ? phone.trim() : '';

        if (!cleanName || cleanName.length < 3) {
            return NextResponse.json({ error: 'الاسم الكامل مطلوب (3 أحرف على الأقل).' }, { status: 400 });
        }
        if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
            return NextResponse.json({ error: 'البريد الإلكتروني غير صالح.' }, { status: 400 });
        }
        if (!cleanPhone || cleanPhone.length < 8) {
            return NextResponse.json({ error: 'رقم الهاتف غير صالح.' }, { status: 400 });
        }
        if (!password || typeof password !== 'string' || password.length < 8) {
            return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }, { status: 400 });
        }
        if (password !== confirmPassword) {
            return NextResponse.json({ error: 'كلمتا المرور غير متطابقتين.' }, { status: 400 });
        }
        if (!governorate || typeof governorate !== 'string' || !governorate.trim()) {
            return NextResponse.json({ error: 'المحافظة مطلوبة.' }, { status: 400 });
        }
        if (!university || typeof university !== 'string' || !university.trim()) {
            return NextResponse.json({ error: 'الجامعة أو المدرسة مطلوبة.' }, { status: 400 });
        }
        if (termsAccepted !== true) {
            return NextResponse.json(
                { error: 'يجب الموافقة على الشروط والأحكام وسياسة الخصوصية.' },
                { status: 400 }
            );
        }

        // 3. Google Drive Photo validation (optional — never blocks account creation if omitted)
        let avatarUrl = '';
        let avatarDriveFileId = '';
        let avatarSource: 'google_drive' | undefined;

        if (drivePhotoUrl && typeof drivePhotoUrl === 'string' && drivePhotoUrl.trim()) {
            const photoResult = await validateGoogleDrivePhoto(drivePhotoUrl.trim());
            if (!photoResult.valid) {
                return NextResponse.json(
                    { error: photoResult.error || 'رابط صورة Google Drive غير صالح. يمكنك مسح الحقل وإضافة الصورة لاحقاً.' },
                    { status: 400 }
                );
            }
            avatarUrl = photoResult.displayUrl || '';
            avatarDriveFileId = photoResult.fileId || '';
            avatarSource = 'google_drive';
        }

        await connectDB();

        // 4. Duplicate account protection
        const existingUser = await User.findOne({
            $or: [{ email: cleanEmail }, { phone: cleanPhone }],
        })
            .select('email phone')
            .lean() as { email?: string; phone?: string } | null;

        if (existingUser) {
            if (existingUser.email === cleanEmail) {
                return NextResponse.json(
                    { error: 'هذا البريد الإلكتروني مسجل بالفعل. يمكنك تسجيل الدخول مباشرة.' },
                    { status: 409 }
                );
            }
            return NextResponse.json(
                { error: 'رقم الهاتف هذا مسجل بالفعل بحساب آخر.' },
                { status: 409 }
            );
        }

        // 5. Build allowed roles array (supports multi-role like Student + Committee Member)
        const primaryRole: UserRole =
            accountType === 'student'
                ? 'student'
                : accountType === 'instructor'
                    ? 'instructor'
                    : 'member';

        const roleSet = new Set<UserRole>([primaryRole]);
        if (Array.isArray(additionalRoles)) {
            for (const r of additionalRoles) {
                if (ALLOWED_EXTRA_ROLES.has(r as UserRole)) {
                    roleSet.add(r as UserRole);
                }
            }
        }
        const roles = Array.from(roleSet);
        const wantsCommittee = roles.includes('member');

        // 6. Atomic Committee Capacity & Open-Registration Check
        let joinedCommittee: { _id: { toString(): string }; name: string } | null = null;
        if (wantsCommittee) {
            if (!committeeId) {
                return NextResponse.json({ error: 'يرجى اختيار اللجنة التي تريد الانضمام إليها.' }, { status: 400 });
            }

            // Sync currentMemberCount if needed and atomically reserve a seat
            const existingCommittee = await Committee.findById(committeeId)
                .select('isActive registrationOpen availableForRegistration maxMembers currentMemberCount name')
                .lean() as {
                    _id: unknown;
                    name: string;
                    isActive?: boolean;
                    registrationOpen?: boolean;
                    availableForRegistration?: boolean;
                    maxMembers?: number;
                    currentMemberCount?: number;
                } | null;

            if (!existingCommittee || existingCommittee.isActive === false) {
                return NextResponse.json({ error: 'اللجنة المختارة غير متاحة.' }, { status: 404 });
            }
            if (existingCommittee.registrationOpen === false || existingCommittee.availableForRegistration === false) {
                return NextResponse.json(
                    { error: `التسجيل في لجنة "${existingCommittee.name}" مغلق حالياً.` },
                    { status: 403 }
                );
            }

            // Atomic conditional increment to prevent race conditions exceeding maxMembers
            const atomicFilter: Record<string, unknown> = {
                _id: committeeId,
                isActive: true,
                registrationOpen: { $ne: false },
                availableForRegistration: { $ne: false },
            };
            if (typeof existingCommittee.maxMembers === 'number') {
                atomicFilter.$or = [
                    { currentMemberCount: { $lt: existingCommittee.maxMembers } },
                    { currentMemberCount: { $exists: false } },
                ];
            }

            const reserved = await Committee.findOneAndUpdate(
                atomicFilter,
                { $inc: { currentMemberCount: 1 } },
                { new: true }
            ).select('_id name');

            if (!reserved) {
                return NextResponse.json(
                    { error: 'عذراً، اكتمل الحد الأقصى لأعضاء هذه اللجنة أو تم إغلاق التسجيل.' },
                    { status: 409 }
                );
            }
            joinedCommittee = reserved;
        }

        // 7. Validate Tracks (Student & Instructor)
        const studentTrackIds: string[] = Array.isArray(interestedTrackIds) ? interestedTrackIds.filter(Boolean) : [];
        const instructorTrackIds: string[] = Array.isArray(teachingTrackIds) ? teachingTrackIds.filter(Boolean) : [];

        const [validStudentTracks, validInstructorTracks] = await Promise.all([
            studentTrackIds.length
                ? LMSTrack.find({ _id: { $in: studentTrackIds }, status: 'active' }).select('_id name').lean()
                : Promise.resolve([]),
            instructorTrackIds.length
                ? LMSTrack.find({ _id: { $in: instructorTrackIds }, status: 'active' }).select('_id name').lean()
                : Promise.resolve([]),
        ]);

        const parsedSkills = Array.isArray(skills)
            ? skills.map((s: unknown) => String(s).trim()).filter(Boolean)
            : typeof skills === 'string'
                ? skills.split(',').map((s) => s.trim()).filter(Boolean)
                : [];

        // 8. Hash password & create active User immediately
        const hashedPassword = await bcrypt.hash(password, 10);
        const mailerReady = isMailerConfigured();
        const rawVerifyToken = mailerReady ? crypto.randomBytes(32).toString('hex') : '';
        const hashedVerifyToken = mailerReady
            ? crypto.createHash('sha256').update(rawVerifyToken).digest('hex')
            : undefined;

        const newUser = await User.create({
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone,
            password: hashedPassword,
            role: primaryRole,
            roles,
            accountType: accountType === 'committee_member' ? 'member' : accountType,
            accountStatus: 'active',
            emailVerified: !mailerReady,
            emailVerificationToken: hashedVerifyToken,
            emailVerificationExpires: mailerReady ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
            isActive: true,
            mustChangePassword: false,
            firstLogin: false,
            profileCompleted: Boolean(avatarUrl && bio),
            governorate: governorate.trim(),
            university: university.trim(),
            academicYear: academicYear ? String(academicYear).trim() : undefined,
            graduationYear: graduationYear ? String(graduationYear).trim() : undefined,
            avatar: avatarUrl || undefined,
            avatarDriveFileId: avatarDriveFileId || undefined,
            avatarSource,
            bio: typeof bio === 'string' ? bio.trim() : undefined,
            goals: typeof goals === 'string' ? goals.trim() : undefined,
            interestedTracks: validStudentTracks.map((t: { _id: unknown }) => t._id),
            skills: parsedSkills,
            experienceYears: Number(experienceYears) || 0,
            previousExperience: typeof previousExperience === 'string' ? previousExperience.trim() : undefined,
            social: {
                linkedin: typeof linkedin === 'string' ? linkedin.trim() : undefined,
                github: typeof github === 'string' ? github.trim() : undefined,
                portfolio: typeof portfolio === 'string' ? portfolio.trim() : undefined,
            },
            committeeId: joinedCommittee ? joinedCommittee._id : undefined,
            position: joinedCommittee ? 'Member' : undefined,
            canPublishDirectly: roles.includes('instructor'),
            termsAcceptedAt: new Date(),
            lastLoginAt: new Date(),
        });

        // 9. Create linked enrollments / memberships immediately
        if (roles.includes('student') && validStudentTracks.length > 0) {
            await TrackEnrollment.insertMany(
                validStudentTracks.map((t: { _id: unknown }) => ({
                    userId: newUser._id,
                    trackId: t._id,
                    status: 'active',
                    enrollmentDate: new Date(),
                }))
            );
            await LMSEnrollment.findOneAndUpdate(
                { userId: newUser._id },
                {
                    userId: newUser._id,
                    trackId: validStudentTracks[0]._id,
                    enrollmentDate: new Date(),
                    status: 'active',
                },
                { upsert: true }
            );
        }

        if (roles.includes('instructor') && validInstructorTracks.length > 0) {
            await InstructorAssignment.insertMany(
                validInstructorTracks.map((t: { _id: unknown }) => ({
                    userId: newUser._id,
                    trackId: t._id,
                    status: 'approved',
                    canPublishDirectly: true,
                    assignedAt: new Date(),
                }))
            );
        }

        if (joinedCommittee) {
            await CommitteeMember.findOneAndUpdate(
                { userId: newUser._id, committeeId: joinedCommittee._id },
                {
                    userId: newUser._id,
                    committeeId: joinedCommittee._id,
                    position: 'Member',
                    status: 'active',
                    joinedAt: new Date(),
                },
                { upsert: true }
            );
        }

        // 10. Optional non-blocking verification email
        if (mailerReady && rawVerifyToken) {
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
            const verifyUrl = `${baseUrl}/verify-email?token=${rawVerifyToken}`;
            void sendEmailSafe({
                to: cleanEmail,
                subject: 'مرحباً بك في Switch Code Community',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 24px; background: #07111F; color: #FFFFFF; border-radius: 12px;">
                        <h2 style="color: #FACC15;">مرحباً بك في Switch Code!</h2>
                        <p>أهلاً ${cleanName}، تم تفعيل حسابك بنجاح ويمكنك استخدام المنصة مباشرة.</p>
                        <p>لتأكيد بريدك الإلكتروني:</p>
                        <p><a href="${verifyUrl}" style="background: #2563EB; color: #FFFFFF; padding: 10px 20px; border-radius: 8px; text-decoration: none;">تأكيد البريد الإلكتروني</a></p>
                    </div>
                `,
            });
        }

        await createNotification({
            userId: newUser._id.toString(),
            title: 'مرحباً بك في Switch Code Community!',
            message: joinedCommittee
                ? `تم إنشاء حسابك وانضمامك إلى ${joinedCommittee.name} بنجاح.`
                : 'تم إنشاء حسابك وتفعيله بنجاح. يمكنك البدء الآن!',
            type: 'success',
            link: getDashboardRouteForRole(primaryRole, roles),
        });

        await logActivity(newUser._id.toString(), 'INSTANT_SELF_REGISTER', 'User', newUser._id.toString(), {
            primaryRole,
            roles,
            committeeId: joinedCommittee?._id?.toString(),
        }, ip);

        // 11. Auto-Login: Issue JWT & HTTPOnly Cookie
        const token = generateToken({
            userId: newUser._id.toString(),
            email: newUser.email,
            role: primaryRole,
            roles,
            committeeId: joinedCommittee?._id?.toString(),
            position: newUser.position,
            permissions: [],
            accountStatus: 'active',
            canPublishDirectly: Boolean(newUser.canPublishDirectly),
        });

        const dashboardRoute = getDashboardRouteForRole(primaryRole, roles);

        const response = NextResponse.json(
            {
                message: 'تم إنشاء حسابك وتسجيل دخولك بنجاح!',
                token,
                dashboardRoute,
                user: {
                    _id: newUser._id,
                    name: newUser.name,
                    email: newUser.email,
                    phone: newUser.phone,
                    role: primaryRole,
                    roles,
                    accountStatus: 'active',
                    committeeId: joinedCommittee
                        ? { _id: joinedCommittee._id, name: joinedCommittee.name }
                        : undefined,
                    position: newUser.position,
                    avatar: newUser.avatar,
                    canPublishDirectly: Boolean(newUser.canPublishDirectly),
                },
            },
            { status: 201 }
        );

        setAuthCookie(response, token);
        return response;
    } catch (error: unknown) {
        console.error('Instant self-registration error:', error);
        const message = error instanceof Error ? error.message : 'Server error';
        return NextResponse.json({ error: message || 'فشل إنشاء الحساب.' }, { status: 500 });
    }
}
