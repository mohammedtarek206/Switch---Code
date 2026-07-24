import mongoose, { Document, Schema } from 'mongoose';

export interface IPublicTeamMember extends Document {
    name: string;
    role: string;
    category: 'leadership' | 'technical' | 'hr' | 'media' | 'pr' | 'other';
    bio?: string;
    avatar?: string;
    committee?: string;
    team?: string;
    order?: number;
    isVisible: boolean;
    socials?: {
        linkedin?: string;
        github?: string;
        twitter?: string;
        email?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const PublicTeamMemberSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        role: { type: String, required: true },
        category: {
            type: String,
            enum: ['leadership', 'technical', 'hr', 'media', 'pr', 'other'],
            default: 'leadership',
        },
        bio: { type: String, default: '' },
        avatar: { type: String, default: '' },
        committee: { type: String, default: '' },
        team: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isVisible: { type: Boolean, default: true },
        socials: {
            linkedin: { type: String, default: '' },
            github: { type: String, default: '' },
            twitter: { type: String, default: '' },
            email: { type: String, default: '' },
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.PublicTeamMember || mongoose.model<IPublicTeamMember>('PublicTeamMember', PublicTeamMemberSchema);
