import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

const CACHE_HEADERS = {
    'Cache-Control': 'private, max-age=0, stale-while-revalidate=60',
};

export async function GET() {
    try {
        await connectDB();
        // For list/dropdowns we only need _id, name, color, type
        const committees = await Committee.find()
            .select('_id name color type icon')
            .sort({ createdAt: -1 })
            .lean();
        return NextResponse.json(committees, { headers: CACHE_HEADERS });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const userPerms = (user as { permissions?: string[] }).permissions || [];
        if (!hasPermission(user.role, userPerms, PERMISSIONS.CREATE_COMMITTEE)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await connectDB();
        const body = await req.json();
        const { name, description, image, type, icon, color } = body;

        if (!name || !description || !type) {
            return NextResponse.json({ error: 'name, description, type are required' }, { status: 400 });
        }

        const committee = await Committee.create({ name, description, image, type, icon, color });
        await logActivity(user.userId, 'CREATE_COMMITTEE', 'Committee', committee._id.toString(), { name });

        return NextResponse.json(committee, { status: 201 });
    } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Committee name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
