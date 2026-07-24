import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Award from '@/models/Award';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const filter: Record<string, unknown> = {};
        const month = searchParams.get('month');
        const year = searchParams.get('year');

        if (month) filter.month = parseInt(month);
        if (year) filter.year = parseInt(year);

        const awards = await Award.find(filter)
            .populate('winnerId', 'name avatar email')
            .populate('approvedBy', 'name')
            .sort({ year: -1, month: -1 });

        return NextResponse.json(awards);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_AWARDS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { type, label, winnerId, month, year, isAuto } = await req.json();
        if (!type || !label || !month || !year) {
            return NextResponse.json({ error: 'type, label, month, year required' }, { status: 400 });
        }

        const award = await Award.findOneAndUpdate(
            { type, month, year },
            { label, winnerId, isAuto: isAuto || false, approvedBy: user.userId },
            { upsert: true, new: true }
        );

        await logActivity(user.userId, 'MANAGE_AWARD', 'Award', award._id.toString(), { type, month, year, winnerId });
        return NextResponse.json(award, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.MANAGE_AWARDS)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const { id, ...update } = await req.json();
        update.approvedBy = user.userId;
        const award = await Award.findByIdAndUpdate(id, update, { new: true })
            .populate('winnerId', 'name avatar');
        if (!award) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        return NextResponse.json(award);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
