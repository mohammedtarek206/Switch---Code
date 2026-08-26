import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import LMSMaterial from '@/models/LMSMaterial';
import { authenticateRequest, isLMSAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const data = await request.json();
        await connectDB();
        const material = await LMSMaterial.findByIdAndUpdate(params.id, data, { new: true });
        if (!material) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ material, message: 'Updated' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(request);
        if (!user || !isLMSAdmin(user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        await connectDB();
        await LMSMaterial.findByIdAndDelete(params.id);
        return NextResponse.json({ message: 'Deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
