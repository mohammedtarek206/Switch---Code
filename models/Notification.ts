import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
    userId: Types.ObjectId;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    read: boolean;
    createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        type: {
            type: String,
            enum: ['info', 'success', 'warning', 'error'],
            default: 'info',
        },
        link: { type: String },
        read: { type: Boolean, default: false },
    },
    { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export default mongoose.models.Notification ||
    mongoose.model<INotification>('Notification', NotificationSchema);
