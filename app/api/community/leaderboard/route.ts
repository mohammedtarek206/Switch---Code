import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        // Both members and admins can view leaderboard
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const committeeId = searchParams.get('committeeId');
        const role = searchParams.get('role');

        const filter: Record<string, unknown> = {
            role: {
                $in: [
                    'super_admin', 'admin', 'president', 'vice_president',
                    'hr', 'pr', 'marketing', 'media', 'technical',
                    'instructor', 'mentor', 'committee_leader',
                    'vice_committee_leader', 'member'
                ]
            }
        };

        if (committeeId) filter.committeeId = committeeId;
        if (role) filter.role = role;

        // Leaderboard displays members sorted by performanceScore descending
        const leaderboard = await User.find(filter)
            .select('name avatar role performanceScore committeeId position')
            .populate('committeeId', 'name color icon')
            .sort({ performanceScore: -1 })
            .limit(100);

        return NextResponse.json(leaderboard);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
