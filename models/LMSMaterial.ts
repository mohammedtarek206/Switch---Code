import mongoose, { Document, Schema, Types } from 'mongoose';
import './LMSTrack';
import './User';

export interface ILMSMaterial extends Document {
    title: string;
    description: string;
    thumbnail?: string;
    trackId: Types.ObjectId;
    materialType: 'pdf' | 'document' | 'presentation' | 'link' | 'other';
    fileUrl: string;
    order: number;
    published: boolean;
    allowDownload: boolean;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LMSMaterialSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        thumbnail: { type: String },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        materialType: {
            type: String,
            enum: ['pdf', 'document', 'presentation', 'link', 'other'],
            default: 'pdf',
        },
        fileUrl: { type: String, required: true },
        order: { type: Number, default: 0 },
        published: { type: Boolean, default: true },
        allowDownload: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

LMSMaterialSchema.index({ trackId: 1, order: 1 });
LMSMaterialSchema.index({ published: 1 });

export default mongoose.models.LMSMaterial ||
    mongoose.model<ILMSMaterial>('LMSMaterial', LMSMaterialSchema);
