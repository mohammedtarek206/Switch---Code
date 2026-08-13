import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInterviewer extends Document {
    userId: Types.ObjectId;
    committees: Types.ObjectId[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InterviewerSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        committees: [{ type: Schema.Types.ObjectId, ref: 'Committee' }],
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default (mongoose.models.Interviewer as mongoose.Model<IInterviewer>) ||
    mongoose.model<IInterviewer>('Interviewer', InterviewerSchema);

