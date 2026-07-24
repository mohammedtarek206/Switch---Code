import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Recruitment from '@/models/Recruitment';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    try {
        await connectDB();
        const recruitment = await Recruitment.findById(params.id)
            .populate('committees', 'name type color icon');
        if (!recruitment) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(recruitment);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_RECRUITMENTS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const recruitment = await Recruitment.findByIdAndUpdate(params.id, body, { new: true });
        if (!recruitment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'EDIT_RECRUITMENT', 'Recruitment', params.id, body);
        return NextResponse.json(recruitment);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_RECRUITMENTS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const recruitment = await Recruitment.findByIdAndDelete(params.id);
        if (!recruitment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        await logActivity(user.userId, 'DELETE_RECRUITMENT', 'Recruitment', params.id);
        return NextResponse.json({ message: 'Deleted' });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
