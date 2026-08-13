import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IApplication extends Document {
    applicationCode: string;
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
    // Applicant login credentials (hashed)
    applicantPassword?: string;
    status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected' | 'waiting';
    adminNote?: string;
    interview?: {
        date?: Date;
        interviewerId?: Types.ObjectId;
        interviewerName?: string;
        interviewerEmail?: string;
        assignedAt?: Date;
        assignedBy?: Types.ObjectId;
        interviewStatus?: 'Not Assigned' | 'Assigned' | 'Scheduled' | 'Completed' | 'Passed' | 'Failed' | 'Cancelled';
        recommendation?: string;
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
        applicationCode: { type: String, unique: true, required: true },
        recruitmentId: { type: Schema.Types.ObjectId, ref: 'Recruitment', required: true },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        formData: { type: Schema.Types.Mixed, default: {} },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        university: { type: String },
        faculty: { type: String },
        applicantPassword: { type: String }, // bcrypt hashed
        status: {
            type: String,
            enum: ['pending', 'reviewing', 'interview', 'accepted', 'rejected', 'waiting'],
            default: 'pending',
        },
        adminNote: { type: String },
        interview: {
            date: { type: Date },
            interviewerId: { type: Schema.Types.ObjectId, ref: 'User' },
            interviewerName: { type: String },
            interviewerEmail: { type: String },
            assignedAt: { type: Date },
            assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            interviewStatus: {
                type: String,
                enum: ['Not Assigned', 'Assigned', 'Scheduled', 'Completed', 'Passed', 'Failed', 'Cancelled'],
                default: 'Not Assigned'
            },
            recommendation: { type: String },
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

// Performance indexes
ApplicationSchema.index({ createdAt: -1 });
ApplicationSchema.index({ committeeId: 1, status: 1 });
ApplicationSchema.index({ status: 1 });
ApplicationSchema.index({ email: 1, committeeId: 1 });
ApplicationSchema.index({ phone: 1, committeeId: 1 });
ApplicationSchema.index({ recruitmentId: 1 });

// Clear cached model to apply schema changes
if (mongoose.models.Application) {
    delete (mongoose.models as Record<string, unknown>).Application;
}

export default mongoose.model<IApplication>('Application', ApplicationSchema);
