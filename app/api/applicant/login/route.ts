import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Application from '@/models/Application';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { applicationCode, password } = body;

        if (!applicationCode || !password) {
            return NextResponse.json(
                { error: 'Application Code and Password are required' },
                { status: 400 }
            );
        }

        const cleanCode = String(applicationCode).trim().toUpperCase();
        const cleanPassword = String(password).trim();

        const application = await Application.findOne({ applicationCode: cleanCode })
            .populate('committeeId', 'name color type')
            .populate('recruitmentId', 'name') as any;

        if (!application) {
            return NextResponse.json(
                { error: 'Invalid Application Code or Password' },
                { status: 401 }
            );
        }

        if (!application.applicantPassword) {
            return NextResponse.json(
                { error: 'Account not configured. Please contact admin.' },
                { status: 401 }
            );
        }

        const isMatch = await bcrypt.compare(cleanPassword, application.applicantPassword);
        if (!isMatch) {
            return NextResponse.json(
                { error: 'Invalid Application Code or Password' },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            {
                applicationId: application._id.toString(),
                applicationCode: application.applicationCode,
                name: application.name,
                email: application.email,
                type: 'applicant',
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        return NextResponse.json({
            message: 'Login successful',
            token,
            application: {
                _id: application._id,
                applicationCode: application.applicationCode,
                name: application.name,
                email: application.email,
                phone: application.phone,
                university: application.university,
                faculty: application.faculty,
                status: application.status,
                adminNote: application.adminNote,
                committeeId: application.committeeId,
                recruitmentId: application.recruitmentId,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            },
        });
    } catch (err) {
        console.error('Applicant login error:', err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
