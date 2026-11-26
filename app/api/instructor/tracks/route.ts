import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import InstructorAssignment from '@/models/InstructorAssignment';
import LMSTrack from '@/models/LMSTrack';
import { authenticateRequest } from '@/lib/auth';
import { isAdminRole, userHasAnyRole } from '@/lib/permissions';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const authUser = await authenticateRequest(req);
        if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (!isAdminRole(authUser.role, authUser.roles) && !userHasAnyRole(authUser, ['instructor', 'mentor'])) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { trackIds } = await req.json();
        if (!Array.isArray(trackIds) || trackIds.length === 0) {
            return NextResponse.json({ error: 'اختر مساراً واحداً على الأقل.' }, { status: 400 });
        }

        await connectDB();
        const validTracks = await LMSTrack.find({ _id: { $in: trackIds }, status: 'active' }).select('_id').lean();

        for (const tr of validTracks as Array<{ _id: unknown }>) {
            await InstructorAssignment.findOneAndUpdate(
                { userId: authUser.userId, trackId: tr._id },
                {
                    userId: authUser.userId,
                    trackId: tr._id,
                    status: 'approved',
                    canPublishDirectly: true,
                    assignedAt: new Date(),
                },
                { upsert: true }
            );
        }

        return NextResponse.json({ message: 'تم ربطك بالمسارات المختارة بنجاح.' }, { status: 201 });
    } catch (error) {
        console.error('Instructor tracks POST error:', error);
        return NextResponse.json({ error: 'Failed to assign tracks' }, { status: 500 });
    }
}
