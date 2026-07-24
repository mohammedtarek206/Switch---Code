import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommitteeMember extends Document {
    userId: Types.ObjectId;
    committeeId: Types.ObjectId;
    position: string;
    status: 'active' | 'inactive' | 'pending' | 'rejected';
    joinedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommitteeMemberSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        position: { type: String, default: 'Member' },
        status: {
            type: String,
            enum: ['active', 'inactive', 'pending', 'rejected'],
            default: 'active',
        },
        joinedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

CommitteeMemberSchema.index({ userId: 1, committeeId: 1 }, { unique: true });

export default mongoose.models.CommitteeMember ||
    mongoose.model<ICommitteeMember>('CommitteeMember', CommitteeMemberSchema);
