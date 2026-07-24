import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AccessCode from '@/models/AccessCode';
import { authenticateRequest } from '@/lib/auth';

// Helper to generate a random code
function generateRandomCode(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const codes = await AccessCode.find()
            .populate('studentId', 'name')
            .populate('trackId', 'title')
            .sort({ createdAt: -1 });
        return NextResponse.json(codes, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to fetch codes' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { count = 1, trackId, expiresAt } = await request.json();
        await connectDB();

        const createdCodes = [];
        for (let i = 0; i < count; i++) {
            const codeStr = generateRandomCode(8);
            const accessCode = await AccessCode.create({
                code: codeStr,
                trackId: trackId || null,
                expiresAt: expiresAt || null,
            });
            createdCodes.push(accessCode);
        }

        return NextResponse.json(
            { message: `${count} codes generated successfully`, codes: createdCodes },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Code generation error:', error);
        return NextResponse.json({ error: 'Failed to generate codes' }, { status: 500 });
    }
}
