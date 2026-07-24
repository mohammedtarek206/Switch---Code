import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const users = await User.find().sort({ createdAt: -1 });

        return NextResponse.json(users, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}
