import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { newPassword, phone, avatarUrl } = await request.json();
        if (!newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        await connectDB();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.findByIdAndUpdate(user.userId, {
            password: hashedPassword,
            mustChangePassword: false,
            tempPassword: '',
            activationCode: '',
            phone: phone || undefined,
            avatar: avatarUrl || undefined
        });

        return NextResponse.json({ message: 'Profile updated & Secured successfully' }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
    }
}
