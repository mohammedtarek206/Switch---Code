import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { createNotification } from '@/lib/notifications';
import { logActivity } from '@/lib/activityLog';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const { token } = await req.json();
        if (!token || typeof token !== 'string') {
            return NextResponse.json({ error: 'Verification token is required' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(token.trim()).digest('hex');

        await connectDB();
        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'رابط التحقق غير صالح أو منتهي الصلاحية.' },
                { status: 400 }
            );
        }

        user.emailVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        if (user.accountType === 'student' && user.accountStatus === 'pending_verification') {
            user.accountStatus = 'active';
            user.isActive = true;
        } else if (user.accountStatus === 'pending_verification') {
            user.accountStatus = 'pending_review';
        }

        await user.save();

        await createNotification({
            userId: user._id.toString(),
            title: 'تم تأكيد البريد الإلكتروني',
            message:
                user.accountStatus === 'active'
                    ? 'تم تفعيل حسابك بنجاح! يمكنك الآن الدخول إلى لوحة التحكم.'
                    : 'تم تأكيد بريدك الإلكتروني. طلبك قيد المراجعة من الإدارة.',
            type: 'success',
            link: '/login',
        });

        await logActivity(user._id.toString(), 'EMAIL_VERIFIED', 'User', user._id.toString());

        return NextResponse.json({
            message: 'تم تأكيد البريد الإلكتروني بنجاح.',
            accountStatus: user.accountStatus,
        });
    } catch (error) {
        console.error('Verify email error:', error);
        return NextResponse.json({ error: 'Failed to verify email' }, { status: 500 });
    }
}
