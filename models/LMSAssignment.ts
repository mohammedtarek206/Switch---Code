import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILMSAssignment extends Document {
    title: string;
    description: string;
    instructions: string;
    trackId: Types.ObjectId;
    deadline?: Date;
    attachmentUrl?: string;
    maxScore: number;
    published: boolean;
    order: number;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LMSAssignmentSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        instructions: { type: String },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        deadline: { type: Date },
        attachmentUrl: { type: String },
        maxScore: { type: Number, default: 100 },
        published: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

LMSAssignmentSchema.index({ trackId: 1, order: 1 });
LMSAssignmentSchema.index({ published: 1 });

export default mongoose.models.LMSAssignment ||
    mongoose.model<ILMSAssignment>('LMSAssignment', LMSAssignmentSchema);
