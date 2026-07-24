import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Committee from '@/models/Committee';
import CommunityTeam from '@/models/CommunityTeam';
import bcrypt from 'bcryptjs';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        // Touch models to ensure Mongoose registers schemas
        const _c = Committee;
        const _t = CommunityTeam;

        const users = await User.find()
            .populate('committeeId', 'name type color')
            .populate('teamId', 'name color icon')
            .populate('createdBy', 'name username')
            .sort({ createdAt: -1 });

        return NextResponse.json(users);
    } catch (error: any) {
        console.error('Fetch accounts error:', error);
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const _c = Committee;
        const _t = CommunityTeam;

        const body = await req.json();
        let { name, username, email, phone, tempPassword, role, committeeId, teamId, position, permissions, isActive, notes, avatar } = body;

        name = name?.trim();
        username = username?.trim();
        email = email?.trim().toLowerCase();
        phone = phone?.trim();
        tempPassword = tempPassword?.trim();

        if (!name) {
            return NextResponse.json({ error: 'Full Name is required' }, { status: 400 });
        }
        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }
        if (!tempPassword) {
            return NextResponse.json({ error: 'Temporary Password is required' }, { status: 400 });
        }
        if (!role) {
            return NextResponse.json({ error: 'Role is required' }, { status: 400 });
        }

        // 1. Check duplicate username
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return NextResponse.json({ error: `Username "${username}" is already taken` }, { status: 400 });
        }

        // 2. Check duplicate email if provided
        const cleanEmail = email && email.length > 0 ? email : undefined;
        if (cleanEmail) {
            const existingEmail = await User.findOne({ email: cleanEmail });
            if (existingEmail) {
                return NextResponse.json({ error: `Email "${cleanEmail}" is already registered` }, { status: 400 });
            }
        }

        // 3. Check duplicate phone if provided
        const cleanPhone = phone && phone.length > 0 ? phone : undefined;
        if (cleanPhone) {
            const existingPhone = await User.findOne({ phone: cleanPhone });
            if (existingPhone) {
                return NextResponse.json({ error: `Phone "${cleanPhone}" is already registered` }, { status: 400 });
            }
        }

        // Hash the temporary password
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        const newUser = await User.create({
            name,
            username,
            email: cleanEmail,
            phone: cleanPhone,
            password: hashedPassword,
            tempPassword,
            mustChangePassword: true,
            role,
            committeeId: committeeId && committeeId.length > 0 ? committeeId : undefined,
            teamId: teamId && teamId.length > 0 ? teamId : undefined,
            position: position?.trim() || '',
            permissions: Array.isArray(permissions) ? permissions : [],
            isActive: isActive !== undefined ? isActive : true,
            notes: notes?.trim() || '',
            avatar: avatar?.trim() || '',
            createdBy: admin.userId,
        });

        const populatedUser = await User.findById(newUser._id)
            .populate('committeeId', 'name')
            .populate('teamId', 'name')
            .populate('createdBy', 'name');

        return NextResponse.json(populatedUser, { status: 201 });
    } catch (err: any) {
        console.error('Account creation error:', err);
        if (err.code === 11000) {
            const field = Object.keys(err.keyPattern || {})[0] || 'field';
            return NextResponse.json({ error: `Duplicate error: ${field} already exists.` }, { status: 400 });
        }
        return NextResponse.json({ error: err.message || 'Server error during account creation' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const admin = await authenticateRequest(req);
        if (!admin || (admin.role !== 'admin' && admin.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const _c = Committee;
        const _t = CommunityTeam;

        const body = await req.json();
        const { id, action, payload } = body;

        const targetId = id || body.userId || payload?._id;
        if (!targetId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const user = await User.findById(targetId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'TOGGLE_ACTIVE') {
            user.isActive = !user.isActive;
            await user.save();
            return NextResponse.json(user);
        }

        if (action === 'RESET_PASSWORD' || action === 'RESET_TEMP_PASSWORD') {
            const newTempPassword = body.tempPassword?.trim() || Math.random().toString(36).slice(-8);
            user.password = await bcrypt.hash(newTempPassword, 10);
            user.tempPassword = newTempPassword;
            user.mustChangePassword = true;
            await user.save();
            return NextResponse.json({
                message: 'Password reset successfully',
                tempPassword: newTempPassword,
                username: user.username
            });
        }

        // Full update / edit
        const updateData = payload || body;
        let { name, username, email, phone, role, committeeId, teamId, position, permissions, isActive, notes } = updateData;

        if (name) user.name = name.trim();

        if (username && username.trim() !== user.username) {
            const cleanUsername = username.trim();
            const existingUser = await User.findOne({ username: cleanUsername, _id: { $ne: user._id } });
            if (existingUser) {
                return NextResponse.json({ error: `Username "${cleanUsername}" is already taken` }, { status: 400 });
            }
            user.username = cleanUsername;
        }

        if (email !== undefined) {
            const cleanEmail = email?.trim().toLowerCase() || undefined;
            if (cleanEmail && cleanEmail !== user.email) {
                const existingEmail = await User.findOne({ email: cleanEmail, _id: { $ne: user._id } });
                if (existingEmail) {
                    return NextResponse.json({ error: `Email "${cleanEmail}" is already registered` }, { status: 400 });
                }
            }
            user.email = cleanEmail;
        }

        if (phone !== undefined) {
            const cleanPhone = phone?.trim() || undefined;
            if (cleanPhone && cleanPhone !== user.phone) {
                const existingPhone = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
                if (existingPhone) {
                    return NextResponse.json({ error: `Phone "${cleanPhone}" is already registered` }, { status: 400 });
                }
            }
            user.phone = cleanPhone;
        }

        if (role) user.role = role;
        user.committeeId = committeeId && committeeId.length > 0 ? committeeId : undefined;
        user.teamId = teamId && teamId.length > 0 ? teamId : undefined;
        if (position !== undefined) user.position = position.trim();
        if (Array.isArray(permissions)) user.permissions = permissions;
        if (isActive !== undefined) user.isActive = isActive;
        if (notes !== undefined) user.notes = notes.trim();

        await user.save();

        const populatedUser = await User.findById(user._id)
            .populate('committeeId', 'name')
            .populate('teamId', 'name')
            .populate('createdBy', 'name');

        return NextResponse.json(populatedUser);
    } catch (error: any) {
        console.error('Update account error:', error);
        return NextResponse.json({ error: error.message || 'Server error during update' }, { status: 500 });
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
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await User.findByIdAndDelete(id);
        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error: any) {
        console.error('Delete account error:', error);
        return NextResponse.json({ error: 'Server error during deletion' }, { status: 500 });
    }
}
