import mongoose, { Document, Schema, Types } from 'mongoose';
import './Committee';
import './User';

export interface ITechnicalProject extends Document {
    committeeId: Types.ObjectId;
    name: string;
    description?: string;
    githubUrl?: string;
    docsUrl?: string;
    teamMembers: Types.ObjectId[];
    status: 'planning' | 'in_development' | 'code_review' | 'testing' | 'deployed';
    progress: number;
    bugs: {
        title: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        status: 'open' | 'in_progress' | 'resolved';
        reportedBy: Types.ObjectId;
        createdAt: Date;
    }[];
    codeReviews: {
        title: string;
        prUrl: string;
        reviewerName?: string;
        status: 'pending' | 'approved' | 'changes_requested';
        createdAt: Date;
    }[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TechnicalProjectSchema: Schema = new Schema(
    {
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        name: { type: String, required: true },
        description: { type: String },
        githubUrl: { type: String },
        docsUrl: { type: String },
        teamMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        status: {
            type: String,
            enum: ['planning', 'in_development', 'code_review', 'testing', 'deployed'],
            default: 'in_development',
        },
        progress: { type: Number, min: 0, max: 100, default: 0 },
        bugs: [
            {
                title: { type: String, required: true },
                severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
                status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' },
                reportedBy: { type: Schema.Types.ObjectId, ref: 'User' },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        codeReviews: [
            {
                title: { type: String, required: true },
                prUrl: { type: String, required: true },
                reviewerName: { type: String },
                status: { type: String, enum: ['pending', 'approved', 'changes_requested'], default: 'pending' },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

TechnicalProjectSchema.index({ committeeId: 1, createdAt: -1 });

export default mongoose.models.TechnicalProject ||
    mongoose.model<ITechnicalProject>('TechnicalProject', TechnicalProjectSchema);
