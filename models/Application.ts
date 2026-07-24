import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IApplication extends Document {
    recruitmentId: Types.ObjectId;
    committeeId: Types.ObjectId;
    userId?: Types.ObjectId;
    formData: Record<string, unknown>;
    // Basic info cached
    name: string;
    email: string;
    phone?: string;
    university?: string;
    faculty?: string;
    status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'waiting';
    interview?: {
        date?: Date;
        interviewerId?: Types.ObjectId;
        technicalScore?: number;
        hrScore?: number;
        communication?: number;
        problemSolving?: number;
        notes?: string;
        decision?: 'accepted' | 'rejected' | 'waiting';
    };
    createdAt: Date;
    updatedAt: Date;
}

const ApplicationSchema: Schema = new Schema(
    {
        recruitmentId: { type: Schema.Types.ObjectId, ref: 'Recruitment', required: true },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        formData: { type: Schema.Types.Mixed, default: {} },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        university: { type: String },
        faculty: { type: String },
        status: {
            type: String,
            enum: ['pending', 'reviewing', 'interview', 'accepted', 'rejected', 'waiting'],
            default: 'pending',
        },
        interview: {
            date: { type: Date },
            interviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
            technicalScore: { type: Number, min: 0, max: 10 },
            hrScore: { type: Number, min: 0, max: 10 },
            communication: { type: Number, min: 0, max: 10 },
            problemSolving: { type: Number, min: 0, max: 10 },
            notes: { type: String },
            decision: { type: String, enum: ['accepted', 'rejected', 'waiting'] },
        },
    },
    { timestamps: true }
);

export default mongoose.models.Application ||
    mongoose.model<IApplication>('Application', ApplicationSchema);
