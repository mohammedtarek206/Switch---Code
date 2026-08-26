import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILMSTrack extends Document {
    name: string;
    description: string;
    thumbnail?: string;
    category: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    duration: string; // e.g. "12 weeks"
    status: 'active' | 'inactive';
    sortOrder: number;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LMSTrackSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String, required: true },
        thumbnail: { type: String },
        category: { type: String, required: true },
        level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner',
        },
        duration: { type: String },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        sortOrder: { type: Number, default: 0 },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

LMSTrackSchema.index({ status: 1, sortOrder: 1 });

export default mongoose.models.LMSTrack || mongoose.model<ILMSTrack>('LMSTrack', LMSTrackSchema);
