import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IActivityLog extends Document {
    userId: Types.ObjectId;
    action: string;
    target?: string;
    targetId?: string;
    metadata?: Record<string, unknown>;
    ip?: string;
    createdAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        action: { type: String, required: true },
        target: { type: String },
        targetId: { type: String },
        metadata: { type: Schema.Types.Mixed },
        ip: { type: String },
    },
    { timestamps: true }
);

ActivityLogSchema.index({ createdAt: -1 });

export default mongoose.models.ActivityLog ||
    mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
