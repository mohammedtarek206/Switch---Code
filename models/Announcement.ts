import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnnouncement extends Document {
    title: string;
    body: string;
    section: string;
    targetCommittee?: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AnnouncementSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        section: { type: String, default: 'general' },
        targetCommittee: { type: Schema.Types.ObjectId, ref: 'Committee' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

export default mongoose.models.Announcement ||
    mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
