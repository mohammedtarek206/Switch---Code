import mongoose, { Document, Schema, Types } from 'mongoose';

export type AwardType =
    | 'member_of_month'
    | 'most_active'
    | 'best_technical'
    | 'best_hr'
    | 'best_pr'
    | 'best_marketing'
    | 'best_media'
    | 'best_instructor'
    | 'best_mentor'
    | 'best_committee_leader'
    | 'best_vice_leader'
    | 'best_volunteer'
    | 'rising_star'
    | 'best_team_player'
    | 'best_problem_solver'
    | 'innovation_award'
    | 'community_hero';

export interface IAward extends Document {
    type: AwardType;
    label: string;
    winnerId?: Types.ObjectId;
    month: number;
    year: number;
    isAuto: boolean;
    approvedBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AwardSchema: Schema = new Schema(
    {
        type: { type: String, required: true },
        label: { type: String, required: true },
        winnerId: { type: Schema.Types.ObjectId, ref: 'User' },
        month: { type: Number, required: true, min: 1, max: 12 },
        year: { type: Number, required: true },
        isAuto: { type: Boolean, default: false },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

AwardSchema.index({ type: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.Award ||
    mongoose.model<IAward>('Award', AwardSchema);
