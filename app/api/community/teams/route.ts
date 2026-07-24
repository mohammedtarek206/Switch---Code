import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommunityTeam from '@/models/CommunityTeam';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const url = new URL(req.url);
        const committeeId = url.searchParams.get('committeeId');

        const filter: any = {};
        if (committeeId) {
            filter.committeeId = committeeId;
        }

        const teams = await CommunityTeam.find(filter)
            .populate('committeeId', 'name type color')
            .populate('leaderId', 'name username email avatar')
            .populate('viceLeaderId', 'name username email avatar')
            .sort({ createdAt: -1 });

        return NextResponse.json(teams);
    } catch (error: any) {
        console.error('Fetch teams error:', error);
        return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { name, description, committeeId, color, icon, leaderId, viceLeaderId } = body;

        if (!name || !committeeId) {
            return NextResponse.json({ error: 'Team name and Committee are required' }, { status: 400 });
        }

        const newTeam = await CommunityTeam.create({
            name: name.trim(),
            description: description?.trim() || '',
            committeeId,
            color: color || '#00FF88',
            icon: icon || 'FiUsers',
            leaderId: leaderId || undefined,
            viceLeaderId: viceLeaderId || undefined,
            isActive: true,
        });

        const populatedTeam = await CommunityTeam.findById(newTeam._id)
            .populate('committeeId', 'name')
            .populate('leaderId', 'name username')
            .populate('viceLeaderId', 'name username');

        return NextResponse.json(populatedTeam, { status: 201 });
    } catch (error: any) {
        console.error('Create team error:', error);
        return NextResponse.json({ error: 'Failed to create team' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const body = await req.json();
        const { id, name, description, committeeId, color, icon, leaderId, viceLeaderId, isActive } = body;

        if (!id) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
        }

        const updatedTeam = await CommunityTeam.findByIdAndUpdate(
            id,
            {
                ...(name && { name: name.trim() }),
                ...(description !== undefined && { description: description.trim() }),
                ...(committeeId && { committeeId }),
                ...(color && { color }),
                ...(icon && { icon }),
                leaderId: leaderId || undefined,
                viceLeaderId: viceLeaderId || undefined,
                ...(isActive !== undefined && { isActive }),
            },
            { new: true }
        )
            .populate('committeeId', 'name')
            .populate('leaderId', 'name username')
            .populate('viceLeaderId', 'name username');

        if (!updatedTeam) {
            return NextResponse.json({ error: 'Team not found' }, { status: 404 });
        }

        return NextResponse.json(updatedTeam);
    } catch (error: any) {
        console.error('Update team error:', error);
        return NextResponse.json({ error: 'Failed to update team' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const url = new URL(req.url);
        const id = url.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Team ID required' }, { status: 400 });
        }

        await CommunityTeam.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Team deleted successfully' });
    } catch (error: any) {
        console.error('Delete team error:', error);
        return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 });
    }
}
