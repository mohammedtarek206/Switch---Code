import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const user = await User.findById(authUser.userId)
            .select('-password -tempPassword -emailVerificationToken -passwordResetToken')
            .populate('committeeId', 'name slug type color')
            .populate('teamId', 'name color')
            .lean();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Auth me error:', error);
        return NextResponse.json({ error: 'Failed to load user' }, { status: 500 });
    }
}
