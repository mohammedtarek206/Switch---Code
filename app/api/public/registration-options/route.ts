import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSTrack from '@/models/LMSTrack';
import Committee from '@/models/Committee';
import { ensureDefaultsSeeded } from '@/lib/seedDefaults';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await connectDB();
        await ensureDefaultsSeeded();

        const [tracks, allCommittees] = await Promise.all([
            LMSTrack.find({ status: 'active' })
                .select('_id name category level duration description')
                .sort({ sortOrder: 1, name: 1 })
                .lean(),
            Committee.find({ isActive: true })
                .select('_id name slug description type icon color registrationOpen availableForRegistration maxMembers currentMemberCount displayOrder')
                .sort({ displayOrder: 1, name: 1 })
                .lean<Array<{
                    _id: unknown;
                    name: string;
                    slug: string;
                    description: string;
                    type: string;
                    registrationOpen?: boolean;
                    availableForRegistration?: boolean;
                    maxMembers?: number;
                    currentMemberCount?: number;
                }>>(),
        ]);

        const openCommittees = allCommittees.filter((c) => {
            if (c.registrationOpen === false || c.availableForRegistration === false) return false;
            if (typeof c.maxMembers === 'number' && (c.currentMemberCount || 0) >= c.maxMembers) return false;
            return true;
        });

        const closedCommittees = allCommittees.filter((c) => !openCommittees.includes(c));

        return NextResponse.json({
            tracks,
            committees: openCommittees,
            closedCommittees,
        });
    } catch (error) {
        console.error('Registration options error:', error);
        return NextResponse.json(
            { error: 'Failed to load registration options' },
            { status: 500 }
        );
    }
}
