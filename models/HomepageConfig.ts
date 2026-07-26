import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IHomepageConfig extends Document {
    hero: {
        title: string;
        subtitle: string;
        ctaPrimaryText: string;
        ctaPrimaryLink: string;
        ctaSecondaryText: string;
        ctaSecondaryLink: string;
        bannerImage?: string;
    };
    sectionsVisibility: {
        hero: boolean;
        stats: boolean;
        activeRecruitment: boolean;
        upcomingEvents: boolean;
        pastEvents: boolean;
        highlights: boolean;
        announcements: boolean;
        featuredCommittees: boolean;
        successStories: boolean;
        gallery: boolean;
        sponsors: boolean;
    };
    sectionOrder: string[];
    pinnedEventId?: Types.ObjectId;
    pinnedRecruitmentId?: Types.ObjectId;
    pinnedAnnouncementId?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const HomepageConfigSchema: Schema = new Schema(
    {
        hero: {
            title: { type: String, default: 'Building The Future Of Tech Leaders' },
            subtitle: { type: String, default: 'Empowering software engineers, developers, and creators through hands-on practice, committees, and real-world projects.' },
            ctaPrimaryText: { type: String, default: 'Explore Committees' },
            ctaPrimaryLink: { type: String, default: '/community/committees' },
            ctaSecondaryText: { type: String, default: 'Join Community' },
            ctaSecondaryLink: { type: String, default: '/join' },
            bannerImage: { type: String, default: '' },
        },
        sectionsVisibility: {
            hero: { type: Boolean, default: true },
            stats: { type: Boolean, default: true },
            activeRecruitment: { type: Boolean, default: true },
            upcomingEvents: { type: Boolean, default: true },
            pastEvents: { type: Boolean, default: true },
            highlights: { type: Boolean, default: true },
            announcements: { type: Boolean, default: true },
            featuredCommittees: { type: Boolean, default: true },
            successStories: { type: Boolean, default: true },
            gallery: { type: Boolean, default: true },
            sponsors: { type: Boolean, default: true },
        },
        sectionOrder: {
            type: [String],
            default: [
                'hero',
                'stats',
                'activeRecruitment',
                'upcomingEvents',
                'highlights',
                'featuredCommittees',
                'announcements',
                'successStories',
                'gallery',
                'sponsors',
                'pastEvents'
            ],
        },
        pinnedEventId: { type: Schema.Types.ObjectId, ref: 'Event' },
        pinnedRecruitmentId: { type: Schema.Types.ObjectId, ref: 'Recruitment' },
        pinnedAnnouncementId: { type: Schema.Types.ObjectId, ref: 'Announcement' },
    },
    { timestamps: true }
);

if (mongoose.models.HomepageConfig) {
    delete (mongoose.models as any).HomepageConfig;
}

export default mongoose.models.HomepageConfig ||
    mongoose.model<IHomepageConfig>('HomepageConfig', HomepageConfigSchema);
