import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    try {
        await connectDB();

        const adminEmail = 'admin@switchcode.tech';
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            return NextResponse.json({ message: 'Admin already exists' });
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
            name: 'Platform Admin',
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
        });

        return NextResponse.json({ message: 'Admin created successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
