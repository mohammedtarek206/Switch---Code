import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import CommitteeMember from '@/models/CommitteeMember';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { searchParams } = new URL(req.url);
        const filter: Record<string, unknown> = {};

        // Only show community roles (not pure students)
        filter.role = {
            $in: [
                'super_admin', 'admin', 'president', 'vice_president',
                'hr', 'pr', 'marketing', 'media', 'technical',
                'instructor', 'mentor', 'committee_leader',
                'vice_committee_leader', 'member'
            ]
        };

        const search = searchParams.get('search');
        const role = searchParams.get('role');
        const committeeId = searchParams.get('committeeId');

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        if (role) filter.role = role;
        if (committeeId) filter.committeeId = committeeId;

        const members = await User.find(filter)
            .select('-password -accessCode')
            .populate('committeeId', 'name color')
            .populate('badges', 'name icon color')
            .sort({ performanceScore: -1 });

        return NextResponse.json(members);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
