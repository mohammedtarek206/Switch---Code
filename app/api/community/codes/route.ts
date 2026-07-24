import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommunityCode from '@/models/CommunityCode';
import { authenticateRequest } from '@/lib/auth';
import { hasPermission, PERMISSIONS } from '@/lib/permissions';
import { logActivity } from '@/lib/activityLog';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || user.role !== 'admin' && user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const codes = await CommunityCode.find().populate('committeeId', 'name').populate('createdBy', 'name').sort({ createdAt: -1 });
        return NextResponse.json(codes);
    } catch (err) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || user.role !== 'admin' && user.role !== 'super_admin') { // Only global admins can create codes
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { code, role, committeeId, committeeName, position, expirationDate, maxUses, notes, permissions } = body;

        if (!code || !role) {
            return NextResponse.json({ error: 'Code and Role are required' }, { status: 400 });
        }

        const newCode = await CommunityCode.create({
            code,
            role,
            committeeId: committeeId || undefined,
            committeeName,
            position,
            expirationDate,
            maxUses: maxUses || 1,
            notes,
            permissions: permissions || [],
            createdBy: user.userId,
        });

        await logActivity(user.userId, 'SYSTEM_UPDATE', 'CommunityCode', newCode._id.toString(), { code, role });

        return NextResponse.json(newCode, { status: 201 });
    } catch (err: any) {
        if (err.code === 11000) {
            return NextResponse.json({ error: 'Code already exists' }, { status: 409 });
        }
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user || user.role !== 'admin' && user.role !== 'super_admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { id, status } = body;

        const updated = await CommunityCode.findByIdAndUpdate(id, { status }, { new: true });
        return NextResponse.json(updated);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
