import mongoose, { Document, Schema, Types } from 'mongoose';
import './User';
import './LMSTrack';

export interface ITrackEnrollment extends Document {
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    status: 'pending' | 'active' | 'completed' | 'rejected' | 'dropped';
    enrollmentDate: Date;
    approvedBy?: Types.ObjectId;
    approvedAt?: Date;
    progressPercentage: number;
    createdAt: Date;
    updatedAt: Date;
}

const TrackEnrollmentSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        status: {
            type: String,
            enum: ['pending', 'active', 'completed', 'rejected', 'dropped'],
            default: 'active',
        },
        enrollmentDate: { type: Date, default: Date.now },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        approvedAt: { type: Date },
        progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    },
    { timestamps: true }
);

TrackEnrollmentSchema.index({ userId: 1, trackId: 1 }, { unique: true });
TrackEnrollmentSchema.index({ trackId: 1, status: 1 });
TrackEnrollmentSchema.index({ userId: 1, status: 1 });

export default mongoose.models.TrackEnrollment ||
    mongoose.model<ITrackEnrollment>('TrackEnrollment', TrackEnrollmentSchema);
