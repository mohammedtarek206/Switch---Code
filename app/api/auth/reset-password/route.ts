import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { logActivity } from '@/lib/activityLog';

export async function POST(req: NextRequest) {
    try {
        const { token, password, confirmPassword } = await req.json();

        if (!token || !password) {
            return NextResponse.json({ error: 'الرمز وكلمة المرور الجديدة مطلوبان.' }, { status: 400 });
        }

        if (password.length < 8) {
            return NextResponse.json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' }, { status: 400 });
        }

        if (confirmPassword !== undefined && password !== confirmPassword) {
            return NextResponse.json({ error: 'كلمتا المرور غير متطابقتين.' }, { status: 400 });
        }

        const hashedToken = crypto.createHash('sha256').update(String(token).trim()).digest('hex');

        await connectDB();
        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: new Date() },
        });

        if (!user) {
            return NextResponse.json(
                { error: 'رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية.' },
                { status: 400 }
            );
        }

        user.password = await bcrypt.hash(password, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.mustChangePassword = false;
        user.tempPassword = undefined;
        await user.save();

        await logActivity(user._id.toString(), 'PASSWORD_RESET', 'User', user._id.toString());

        return NextResponse.json({ message: 'تم تحديث كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'فشل إعادة تعيين كلمة المرور.' }, { status: 500 });
    }
}
