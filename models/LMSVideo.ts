import mongoose, { Document, Schema, Types } from 'mongoose';
import './LMSTrack';
import './User';

export interface ILMSVideo extends Document {
    title: string;
    description: string;
    thumbnail?: string;
    videoUrl: string; // YouTube / Google Drive / Direct URL
    trackId: Types.ObjectId;
    instructor: string;
    duration: string; // e.g. "45 min"
    order: number;
    published: boolean;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LMSVideoSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        thumbnail: { type: String },
        videoUrl: { type: String, required: true },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        instructor: { type: String, default: 'Switch Code' },
        duration: { type: String },
        order: { type: Number, default: 0 },
        published: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

LMSVideoSchema.index({ trackId: 1, order: 1 });
LMSVideoSchema.index({ published: 1 });

export default mongoose.models.LMSVideo || mongoose.model<ILMSVideo>('LMSVideo', LMSVideoSchema);
