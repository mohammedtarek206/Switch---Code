import mongoose, { Document, Schema, Types } from 'mongoose';
import './LMSTrack';
import './User';

export interface IMaterialVersion {
    version: number;
    title: string;
    description?: string;
    materialType: string;
    fileUrl: string;
    notes?: string;
    uploadedAt: Date;
}

export interface ILMSMaterial extends Document {
    title: string;
    description: string;
    thumbnail?: string;
    trackId: Types.ObjectId;
    lectureTitle?: string;
    materialType:
        | 'pdf'
        | 'word'
        | 'powerpoint'
        | 'excel'
        | 'image'
        | 'video'
        | 'drive_link'
        | 'youtube'
        | 'zip'
        | 'document'
        | 'presentation'
        | 'link'
        | 'other';
    fileUrl: string;
    notes?: string;
    order: number;
    published: boolean;
    approvalStatus: 'draft' | 'pending_review' | 'pending_approval' | 'approved' | 'rejected' | 'changes_requested';
    reviewFeedback?: string;
    reviewedBy?: Types.ObjectId;
    reviewedAt?: Date;
    versions: IMaterialVersion[];
    allowDownload: boolean;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MaterialVersionSchema = new Schema(
    {
        version: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String },
        materialType: { type: String, required: true },
        fileUrl: { type: String, required: true },
        notes: { type: String },
        uploadedAt: { type: Date, default: Date.now },
    },
    { _id: true }
);

const LMSMaterialSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        thumbnail: { type: String },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        lectureTitle: { type: String },
        materialType: {
            type: String,
            enum: [
                'pdf',
                'word',
                'powerpoint',
                'excel',
                'image',
                'video',
                'drive_link',
                'youtube',
                'zip',
                'document',
                'presentation',
                'link',
                'other',
            ],
            default: 'pdf',
        },
        fileUrl: { type: String, required: true },
        notes: { type: String },
        order: { type: Number, default: 0 },
        published: { type: Boolean, default: true },
        approvalStatus: {
            type: String,
            enum: ['draft', 'pending_review', 'pending_approval', 'approved', 'rejected', 'changes_requested'],
            default: 'approved',
        },
        reviewFeedback: { type: String },
        reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        reviewedAt: { type: Date },
        versions: [MaterialVersionSchema],
        allowDownload: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

LMSMaterialSchema.index({ trackId: 1, order: 1 });
LMSMaterialSchema.index({ published: 1, approvalStatus: 1 });
LMSMaterialSchema.index({ createdBy: 1, createdAt: -1 });

if (mongoose.models.LMSMaterial && !mongoose.models.LMSMaterial.schema.paths.versions) {
    delete (mongoose.models as Record<string, unknown>).LMSMaterial;
}

export default mongoose.models.LMSMaterial ||
    mongoose.model<ILMSMaterial>('LMSMaterial', LMSMaterialSchema);
