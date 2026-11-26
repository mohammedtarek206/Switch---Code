import mongoose, { Document, Schema, Types } from 'mongoose';
import './User';
import './LMSTrack';

export interface IInstructorAssignment extends Document {
    userId: Types.ObjectId;
    trackId: Types.ObjectId;
    status: 'pending' | 'approved' | 'rejected' | 'suspended';
    canPublishDirectly: boolean;
    assignedBy?: Types.ObjectId;
    assignedAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const InstructorAssignmentSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'suspended'],
            default: 'pending',
        },
        canPublishDirectly: { type: Boolean, default: false },
        assignedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        assignedAt: { type: Date },
        notes: { type: String },
    },
    { timestamps: true }
);

InstructorAssignmentSchema.index({ userId: 1, trackId: 1 }, { unique: true });
InstructorAssignmentSchema.index({ trackId: 1, status: 1 });
InstructorAssignmentSchema.index({ userId: 1, status: 1 });

export default mongoose.models.InstructorAssignment ||
    mongoose.model<IInstructorAssignment>('InstructorAssignment', InstructorAssignmentSchema);
