import connectDB from './mongodb';
import Notification from '@/models/Notification';
import User from '@/models/User';
import { sendEmailSafe } from './mailer';

export interface CreateNotificationInput {
    userId: string;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    emailTo?: string;
    sendEmail?: boolean;
}

export async function createNotification(input: CreateNotificationInput): Promise<void> {
    try {
        await connectDB();
        await Notification.create({
            userId: input.userId,
            title: input.title,
            message: input.message,
            type: input.type || 'info',
            link: input.link,
            read: false,
        });

        if (input.sendEmail && input.emailTo) {
            await sendEmailSafe({
                to: input.emailTo,
                subject: `[Switch Code] ${input.title}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; background: #07111F; color: #FFFFFF; border-radius: 12px;">
                        <h2 style="color: #FACC15; margin-top: 0;">${input.title}</h2>
                        <p style="color: #E2E8F0; line-height: 1.6;">${input.message}</p>
                        ${input.link ? `<p style="margin-top: 16px;"><a href="${process.env.NEXT_PUBLIC_BASE_URL || ''}${input.link}" style="background: #2563EB; color: #FFFFFF; padding: 10px 18px; border-radius: 8px; text-decoration: none; display: inline-block;">Open in Switch Code</a></p>` : ''}
                    </div>
                `,
            });
        }
    } catch (err) {
        console.error('[Notification] Failed to create notification:', err);
    }
}

export async function notifyManyUsers(
    userIds: string[],
    payload: Omit<CreateNotificationInput, 'userId' | 'emailTo' | 'sendEmail'>
): Promise<void> {
    try {
        if (!userIds.length) return;
        await connectDB();
        const uniqueIds = Array.from(new Set(userIds.filter(Boolean)));
        await Notification.insertMany(
            uniqueIds.map((userId) => ({
                userId,
                title: payload.title,
                message: payload.message,
                type: payload.type || 'info',
                link: payload.link,
                read: false,
            }))
        );
    } catch (err) {
        console.error('[Notification] Failed to notify users:', err);
    }
}

export async function notifyAdmins(
    payload: Omit<CreateNotificationInput, 'userId' | 'emailTo' | 'sendEmail'>
): Promise<void> {
    try {
        await connectDB();
        const admins = await User.find({
            role: { $in: ['super_admin', 'admin', 'president'] },
            isActive: true,
        })
            .select('_id')
            .lean<Array<{ _id: { toString(): string } }>>();
        const adminIds = admins.map((a) => a._id.toString());
        await notifyManyUsers(adminIds, payload);
    } catch (err) {
        console.error('[Notification] Failed to notify admins:', err);
    }
}
