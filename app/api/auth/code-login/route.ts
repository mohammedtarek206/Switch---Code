import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import AccessCode from '@/models/AccessCode';

export async function POST(request: NextRequest) {
    try {
        const { code, name } = await request.json();

        if (!code) {
            return NextResponse.json({ error: 'Code is required' }, { status: 400 });
        }

        await connectDB();

        // 1. Check if a user with this code already exists (re-login)
        let user = await User.findOne({ accessCode: code });

        if (user) {
            const token = jwt.sign(
                { userId: user._id, role: 'student', code: code },
                process.env.JWT_SECRET || 'fallback-secret',
                { expiresIn: '30d' }
            );

            return NextResponse.json(
                {
                    message: 'Login successful',
                    token,
                    user: { name: user.name, role: user.role }
                },
                { status: 200 }
            );
        }

        // 2. If no user, check if the code is valid and unused
        const accessCode = await AccessCode.findOne({ code, isUsed: false });

        if (!accessCode) {
            return NextResponse.json(
                { error: 'Invalid or already used code' },
                { status: 401 }
            );
        }

        if (accessCode.expiresAt && new Date() > accessCode.expiresAt) {
            return NextResponse.json({ error: 'Code has expired' }, { status: 401 });
        }

        // 3. Create new user
        user = await User.create({
            name: name || `Student-${code.substring(0, 4)}`,
            role: 'student',
            accessCode: code,
        });

        accessCode.isUsed = true;
        accessCode.studentId = user._id;
        await accessCode.save();

        const token = jwt.sign(
            { userId: user._id, role: 'student', code: code },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '30d' } // Students get longer sessions
        );

        return NextResponse.json(
            {
                message: 'Login successful',
                token,
                user: { name: user.name, role: user.role }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Code login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}
