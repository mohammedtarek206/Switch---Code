import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import PublicTeamMember from '@/models/PublicTeamMember';
import { authenticateRequest } from '@/lib/auth';
import { formatGoogleDriveImageUrl } from '@/lib/googleDrive';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const adminMode = searchParams.get('adminMode') === 'true';

        const filter: any = {};
        if (!adminMode) {
            filter.isVisible = true;
        }

        const members = await PublicTeamMember.find(filter).sort({ order: 1, createdAt: -1 });

        // Format all avatar links with Google Drive helper
        const formatted = members.map(m => {
            const obj = m.toObject();
            obj.avatar = formatGoogleDriveImageUrl(obj.avatar);
            return obj;
        });

        return NextResponse.json(formatted, { status: 200 });
    } catch (error: any) {
        console.error('Public Team API GET error:', error);
        return NextResponse.json({ error: 'Failed to fetch public team members' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        const adminRoles = ['admin', 'super_admin', 'president', 'vice_president', 'hr'];
        if (!user || !adminRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const data = await request.json();
        if (!data.name || !data.role) {
            return NextResponse.json({ error: 'Name and Role are required' }, { status: 400 });
        }

        await connectDB();

        if (data.avatar) {
            data.avatar = formatGoogleDriveImageUrl(data.avatar);
        }

        const newMember = new PublicTeamMember(data);
        await newMember.save();

        return NextResponse.json(newMember, { status: 201 });
    } catch (error: any) {
        console.error('Public Team API POST error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create team member' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        const adminRoles = ['admin', 'super_admin', 'president', 'vice_president', 'hr'];
        if (!user || !adminRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const data = await request.json();
        const { id, ...updateFields } = data;
        if (!id) {
            return NextResponse.json({ error: 'Member ID is required for update' }, { status: 400 });
        }

        await connectDB();

        if (updateFields.avatar) {
            updateFields.avatar = formatGoogleDriveImageUrl(updateFields.avatar);
        }

        const updated = await PublicTeamMember.findByIdAndUpdate(id, updateFields, { new: true });
        if (!updated) {
            return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
        }

        return NextResponse.json(updated, { status: 200 });
    } catch (error: any) {
        console.error('Public Team API PUT error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update team member' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const user = await authenticateRequest(request);
        const adminRoles = ['admin', 'super_admin', 'president', 'vice_president', 'hr'];
        if (!user || !adminRoles.includes(user.role)) {
            return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) {
            return NextResponse.json({ error: 'Member ID is required for deletion' }, { status: 400 });
        }

        await connectDB();
        await PublicTeamMember.findByIdAndDelete(id);

        return NextResponse.json({ message: 'Team member deleted successfully' }, { status: 200 });
    } catch (error: any) {
        console.error('Public Team API DELETE error:', error);
        return NextResponse.json({ error: error.message || 'Failed to delete team member' }, { status: 500 });
    }
}
