import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authenticateRequest } from '@/lib/auth';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const notifications = await Notification.find({ userId: user.userId })
            .sort({ createdAt: -1 })
            .limit(30);

        return NextResponse.json(notifications);
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

// Mark notifications as read
export async function PUT(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await connectDB();
        const { notificationId, all } = await req.json();

        if (all) {
            await Notification.updateMany({ userId: user.userId }, { read: true });
        } else if (notificationId) {
            await Notification.findOneAndUpdate({ _id: notificationId, userId: user.userId }, { read: true });
        } else {
            return NextResponse.json({ error: 'Missing parameter' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
