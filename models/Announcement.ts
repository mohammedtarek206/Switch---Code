import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    body: string;
    targetType: 'all' | 'committee' | 'role';
    targetId?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        targetType: {
            type: String,
            enum: ['all', 'committee', 'role'],
            default: 'all',
        },
        targetId: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.models.Announcement ||
    mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
