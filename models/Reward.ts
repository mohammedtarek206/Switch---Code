import mongoose, { Schema, Document } from 'mongoose';

export const REWARD_TYPES = [
    'excellent_performance', 'best_member', 'fastest_delivery',
    'best_team_player', 'outstanding_contribution', 'innovation_award',
    'consistency_award', 'leadership_excellence', 'most_improved'
] as const;

export type RewardType = typeof REWARD_TYPES[number];

export interface IReward extends Document {
    memberId: mongoose.Types.ObjectId;
    committeeId: mongoose.Types.ObjectId;
    grantedBy: mongoose.Types.ObjectId;
    rewardType: RewardType;
    title: string;
    notes?: string;
    createdAt: Date;
}

const RewardSchema = new Schema<IReward>({
    memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
    grantedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rewardType: { type: String, enum: REWARD_TYPES, required: true },
    title: { type: String, required: true },
    notes: { type: String },
}, { timestamps: true });

export default mongoose.models.Reward || mongoose.model<IReward>('Reward', RewardSchema);
