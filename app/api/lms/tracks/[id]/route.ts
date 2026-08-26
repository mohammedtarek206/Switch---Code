import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSTrack from '@/models/LMSTrack';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PATCH - Update track
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const data = await request.json();
        await connectDB();

        const track = await LMSTrack.findByIdAndUpdate(params.id, data, { new: true });
        if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });

        return NextResponse.json({ track, message: 'Track updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update track' }, { status: 500 });
    }
}

// DELETE - Delete track
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await connectDB();

        const track = await LMSTrack.findByIdAndDelete(params.id);
        if (!track) return NextResponse.json({ error: 'Track not found' }, { status: 404 });

        return NextResponse.json({ message: 'Track deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
    }
}
