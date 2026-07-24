import connectDB from './mongodb';
import ActivityLog from '../models/ActivityLog';

export async function logActivity(
    userId: string,
    action: string,
    target?: string,
    targetId?: string,
    metadata?: Record<string, unknown>,
    ip?: string
): Promise<void> {
    try {
        await connectDB();
        await ActivityLog.create({ userId, action, target, targetId, metadata, ip });
    } catch (err) {
        // Never let log failures break the main flow
        console.error('ActivityLog error:', err);
    }
}
