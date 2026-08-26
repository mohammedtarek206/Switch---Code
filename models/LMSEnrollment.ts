import mongoose, { Document, Schema, Types } from 'mongoose';
import './LMSTrack';
import './User';

export interface ILMSEnrollment extends Document {
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    enrollmentDate: Date;
    status: 'active' | 'completed' | 'dropped';
    createdAt: Date;
    updatedAt: Date;
}

const LMSEnrollmentSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        enrollmentDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['active', 'completed', 'dropped'],
            default: 'active',
        },
    },
    { timestamps: true }
);

// Each user can only enroll in one track at a time (unique)
LMSEnrollmentSchema.index({ userId: 1 }, { unique: true });
LMSEnrollmentSchema.index({ trackId: 1 });

export default mongoose.models.LMSEnrollment ||
    mongoose.model<ILMSEnrollment>('LMSEnrollment', LMSEnrollmentSchema);
