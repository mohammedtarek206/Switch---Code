import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { authenticateRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const [notifications, unreadCount] = await Promise.all([
            Notification.find({ userId: user.userId })
                .sort({ createdAt: -1 })
                .limit(30)
                .lean(),
            Notification.countDocuments({ userId: user.userId, read: false }),
        ]);

        return NextResponse.json({ notifications, unreadCount });
    } catch (error) {
        console.error('Notifications GET error:', error);
        return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await authenticateRequest(req);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        await connectDB();

        if (body.markAll) {
            await Notification.updateMany({ userId: user.userId, read: false }, { read: true });
        } else if (body.notificationId) {
            await Notification.updateOne(
                { _id: body.notificationId, userId: user.userId },
                { read: true }
            );
        }

        const unreadCount = await Notification.countDocuments({ userId: user.userId, read: false });
        return NextResponse.json({ unreadCount });
    } catch (error) {
        console.error('Notifications PATCH error:', error);
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }
}
