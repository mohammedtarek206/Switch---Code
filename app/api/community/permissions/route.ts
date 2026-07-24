import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const url = new URL(req.url);
        const userId = url.searchParams.get('userId');

        await connectDB();

        if (userId) {
            const user = await User.findById(userId).select('-password');
            if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            return NextResponse.json(user);
        }

        return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { userId, role, permissions } = body;

        const updated = await User.findByIdAndUpdate(userId, { role, permissions }, { new: true });

        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
