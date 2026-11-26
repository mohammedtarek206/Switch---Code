import mongoose, { Document, Schema, Types } from 'mongoose';
import './Committee';
import './User';

export interface IMarketingCampaign extends Document {
    committeeId: Types.ObjectId;
    title: string;
    platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'all' | 'other';
    contentType: 'post' | 'reel' | 'story' | 'article' | 'campaign';
    caption?: string;
    mediaUrl?: string;
    scheduledDate?: Date;
    status: 'draft' | 'pending_approval' | 'approved' | 'scheduled' | 'published';
    reach?: number;
    engagement?: number;
    approvedBy?: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const MarketingCampaignSchema: Schema = new Schema(
    {
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        title: { type: String, required: true },
        platform: {
            type: String,
            enum: ['facebook', 'instagram', 'linkedin', 'tiktok', 'youtube', 'all', 'other'],
            default: 'facebook',
        },
        contentType: {
            type: String,
            enum: ['post', 'reel', 'story', 'article', 'campaign'],
            default: 'post',
        },
        caption: { type: String },
        mediaUrl: { type: String },
        scheduledDate: { type: Date },
        status: {
            type: String,
            enum: ['draft', 'pending_approval', 'approved', 'scheduled', 'published'],
            default: 'draft',
        },
        reach: { type: Number, default: 0 },
        engagement: { type: Number, default: 0 },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

MarketingCampaignSchema.index({ committeeId: 1, scheduledDate: 1 });

export default mongoose.models.MarketingCampaign ||
    mongoose.model<IMarketingCampaign>('MarketingCampaign', MarketingCampaignSchema);
