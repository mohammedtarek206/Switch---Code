import mongoose, { Document, Schema, Types } from 'mongoose';
import './Committee';
import './User';

export interface ICommunityTeam extends Document {
    name: string;
    description?: string;
    committeeId: Types.ObjectId;
    color?: string;
    icon?: string;
    leaderId?: Types.ObjectId;
    viceLeaderId?: Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityTeamSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        color: { type: String, default: '#00FF88' },
        icon: { type: String, default: 'FiUsers' },
        leaderId: { type: Schema.Types.ObjectId, ref: 'User' },
        viceLeaderId: { type: Schema.Types.ObjectId, ref: 'User' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

if (
    mongoose.models.CommunityTeam &&
    (!mongoose.models.CommunityTeam.schema.paths.leaderId || !mongoose.models.CommunityTeam.schema.paths.committeeId)
) {
    delete (mongoose.models as any).CommunityTeam;
}

export default mongoose.models.CommunityTeam ||
    mongoose.model<ICommunityTeam>('CommunityTeam', CommunityTeamSchema);
