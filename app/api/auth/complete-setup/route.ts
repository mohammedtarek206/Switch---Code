import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Committee from '@/models/Committee';
import CommunityTeam from '@/models/CommunityTeam';
import { authenticateRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        console.log('[API Complete-Setup] Initiating account setup finalization...');

        const authUser = await authenticateRequest(request);
        if (!authUser) {
            console.error('[API Complete-Setup] Authentication failed or token missing/expired.');
            return NextResponse.json({ error: 'JWT token expired or unauthorized. Please log in again.' }, { status: 401 });
        }

        const body = await request.json();
        const { newPassword, phone, avatarUrl } = body;

        if (!newPassword || newPassword.trim().length < 6) {
            console.warn('[API Complete-Setup] Validation failed: Password shorter than 6 chars.');
            return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 });
        }

        await connectDB();
        const _c = Committee;
        const _t = CommunityTeam;

        const user = await User.findById(authUser.userId);
        if (!user) {
            console.error('[API Complete-Setup] User not found in MongoDB for ID:', authUser.userId);
            return NextResponse.json({ error: 'User account not found in database' }, { status: 404 });
        }

        // Validate phone uniqueness if provided
        const cleanPhone = phone?.trim();
        if (cleanPhone && cleanPhone.length > 0) {
            const existingPhone = await User.findOne({ phone: cleanPhone, _id: { $ne: user._id } });
            if (existingPhone) {
                console.warn('[API Complete-Setup] Duplicate phone number:', cleanPhone);
                return NextResponse.json({ error: `Phone number "${cleanPhone}" is already registered to another account` }, { status: 400 });
            }
            user.phone = cleanPhone;
        }

        // Validate avatar if provided
        const cleanAvatar = avatarUrl?.trim();
        if (cleanAvatar && cleanAvatar.length > 0) {
            user.avatar = cleanAvatar;
        }

        // Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword.trim(), 10);
        user.password = hashedPassword;
        user.mustChangePassword = false;
        user.firstLogin = false;
        user.profileCompleted = true;
        user.tempPassword = undefined;
        user.activationCode = undefined;

        await user.save();
        console.log('[API Complete-Setup] Account updated successfully in MongoDB for user:', user.username);

        // Populate committee and team
        const populatedUser = await User.findById(user._id)
            .populate('committeeId', 'name')
            .populate('teamId', 'name');

        // Generate fresh JWT Session Token
        const newToken = jwt.sign(
            {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                committeeId: user.committeeId?._id?.toString() || user.committeeId?.toString(),
                teamId: user.teamId?._id?.toString() || user.teamId?.toString(),
                position: user.position,
                mustChangePassword: false,
            },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        return NextResponse.json(
            {
                message: 'Account integration completed successfully',
                token: newToken,
                mustChangePassword: false,
                user: {
                    _id: populatedUser._id,
                    name: populatedUser.name,
                    username: populatedUser.username,
                    email: populatedUser.email,
                    role: populatedUser.role,
                    committeeId: populatedUser.committeeId,
                    teamId: populatedUser.teamId,
                    position: populatedUser.position,
                    avatar: populatedUser.avatar,
                    phone: populatedUser.phone,
                    mustChangePassword: false,
                    firstLogin: false,
                    profileCompleted: true,
                }
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('[API Complete-Setup] Internal Server Error:', error);
        return NextResponse.json(
            { error: error.message || 'Server error occurred during account setup' },
            { status: 500 }
        );
    }
}
