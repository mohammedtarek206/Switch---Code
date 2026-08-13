import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Committee from '@/models/Committee';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const activeOnly = searchParams.get('active') === 'true';

        const filter: any = {};
        if (activeOnly) {
            filter.isActive = true;
        }

        const committees = await Committee.find(filter)
            .sort({ name: 1 })
            .lean();

        return NextResponse.json(committees, {
            headers: {
                'Cache-Control': 'no-store, max-age=0, must-revalidate',
            },
        });
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
        const { name, description, image, type, icon, color, isActive } = body;

        if (!name || !description || !type) {
            return NextResponse.json({ error: 'name, description, type are required' }, { status: 400 });
        }

        const slug = name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');

        const committee = await Committee.create({
            name,
            slug,
            description,
            image,
            type,
            icon,
            color,
            isActive: isActive !== false,
        });

        await logActivity(user.userId, 'CREATE_COMMITTEE', 'Committee', committee._id.toString(), { name });

        try {
            revalidatePath('/join');
        } catch (e) {
            console.error('Error revalidating path:', e);
        }

        return NextResponse.json(committee, { status: 201 });
    } catch (err: unknown) {
        const error = err as { code?: number; message?: string };
        if (error.code === 11000) {
            return NextResponse.json({ error: 'Committee name already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
