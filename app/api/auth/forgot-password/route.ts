import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { sendEmailSafe } from '@/lib/mailer';
import { checkRateLimit, getClientIp } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const ip = getClientIp(req);
        const rl = checkRateLimit(`forgot-pwd:${ip}`, 5, 15 * 60 * 1000);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'عدد محاولات كبير. يرجى الانتظار 15 دقيقة.' },
                { status: 429 }
            );
        }

        const { email } = await req.json();
        const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
        if (!cleanEmail) {
            return NextResponse.json({ error: 'البريد الإلكتروني مطلوب.' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ email: cleanEmail });

        if (user && user.accountStatus !== 'suspended' && user.accountStatus !== 'rejected') {
            const rawToken = crypto.randomBytes(32).toString('hex');
            const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

            user.passwordResetToken = hashedToken;
            user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            await user.save();

            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || req.nextUrl.origin;
            const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

            await sendEmailSafe({
                to: cleanEmail,
                subject: 'إعادة تعيين كلمة المرور - Switch Code',
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 24px; background: #07111F; color: #FFFFFF; border-radius: 12px;">
                        <h2 style="color: #FACC15;">إعادة تعيين كلمة المرور</h2>
                        <p>مرحباً ${user.name}،</p>
                        <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في Switch Code.</p>
                        <p style="margin: 20px 0;">
                            <a href="${resetUrl}" style="background: #2563EB; color: #FFFFFF; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">إعادة تعيين كلمة المرور</a>
                        </p>
                        <p style="color: #94A3B8; font-size: 12px;">الرابط صالح لمدة ساعة واحدة فقط. إذا لم تطلب ذلك، يمكنك تجاهل هذه الرسالة.</p>
                    </div>
                `,
            });
        }

        return NextResponse.json({
            message: 'إذا كان البريد الإلكتروني مسجلاً لدينا، فسيتم إرسال رابط إعادة تعيين كلمة المرور إليه.',
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'حدث خطأ أثناء معالجة الطلب.' }, { status: 500 });
    }
}
