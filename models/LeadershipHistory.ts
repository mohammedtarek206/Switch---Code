import mongoose, { Document, Schema, Types } from 'mongoose';
import './User';
import './Committee';

export interface ILeadershipHistory extends Document {
    committeeId: Types.ObjectId;
    userId: Types.ObjectId;
    previousRole?: string;
    newRole: string;
    action:
        | 'assign_head'
        | 'assign_vice_head'
        | 'change_head'
        | 'change_vice_head'
        | 'add_member'
        | 'remove_member'
        | 'transfer_member';
    changedBy: Types.ObjectId;
    targetCommitteeId?: Types.ObjectId;
    reason?: string;
    createdAt: Date;
}

const LeadershipHistorySchema: Schema = new Schema(
    {
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        previousRole: { type: String },
        newRole: { type: String, required: true },
        action: {
            type: String,
            enum: [
                'assign_head',
                'assign_vice_head',
                'change_head',
                'change_vice_head',
                'add_member',
                'remove_member',
                'transfer_member',
            ],
            required: true,
        },
        changedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        targetCommitteeId: { type: Schema.Types.ObjectId, ref: 'Committee' },
        reason: { type: String },
    },
    { timestamps: true }
);

LeadershipHistorySchema.index({ committeeId: 1, createdAt: -1 });
LeadershipHistorySchema.index({ userId: 1, createdAt: -1 });

export default mongoose.models.LeadershipHistory ||
    mongoose.model<ILeadershipHistory>('LeadershipHistory', LeadershipHistorySchema);
