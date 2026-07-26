import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
    return handleSeed();
}

export async function POST() {
    return handleSeed();
}

async function handleSeed() {
    try {
        await connectDB();

        const adminEmail = 'admin@switchcode.tech';
        const adminUsername = 'admin';
        const hashedPassword = await bcrypt.hash('admin123', 10);

        let admin = await User.findOne({
            $or: [
                { email: adminEmail },
                { username: adminUsername }
            ]
        });

        if (admin) {
            admin.password = hashedPassword;
            admin.role = 'super_admin';
            admin.isActive = true;
            admin.profileCompleted = true;
            admin.mustChangePassword = false;
            admin.firstLogin = false;
            await admin.save();

            return NextResponse.json({
                message: 'Admin account updated successfully',
                credentials: {
                    email: adminEmail,
                    username: adminUsername,
                    password: 'admin123',
                    role: 'super_admin'
                }
            });
        }

        admin = await User.create({
            name: 'Platform Super Admin',
            username: adminUsername,
            email: adminEmail,
            password: hashedPassword,
            role: 'super_admin',
            isActive: true,
            profileCompleted: true,
            mustChangePassword: false,
            firstLogin: false
        });

        return NextResponse.json({
            message: 'Super Admin created successfully',
            credentials: {
                email: adminEmail,
                username: adminUsername,
                password: 'admin123',
                role: 'super_admin'
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
