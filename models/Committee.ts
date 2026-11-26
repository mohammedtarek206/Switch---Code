import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommittee extends Document {
    name: string;
    slug: string;
    description: string;
    image?: string;
    type: 'technical' | 'non_technical';
    dashboardType: 'hr' | 'pr_marketing' | 'operations' | 'technical' | 'education' | 'custom';
    icon?: string;
    color?: string;
    leaderId?: Types.ObjectId;
    viceLeaderId?: Types.ObjectId;
    viceLeaderIds?: Types.ObjectId[];
    actingHeadId?: Types.ObjectId;
    viceHeadPermissions: string[];
    monthlyObjectives: {
        title: string;
        progress: number;
        targetDate?: Date;
        status: 'pending' | 'in_progress' | 'completed';
    }[];
    managementNotes: {
        authorId: Types.ObjectId;
        content: string;
        targetMemberId?: Types.ObjectId;
        createdAt: Date;
    }[];
    isActive: boolean;
    registrationOpen: boolean;
    availableForRegistration: boolean;
    maxMembers?: number;
    currentMemberCount: number;
    displayOrder: number;
    createdAt: Date;
    updatedAt: Date;
}

const CommitteeSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        slug: { type: String, unique: true, required: true },
        description: { type: String, required: true },
        image: { type: String },
        type: { type: String, enum: ['technical', 'non_technical'], required: true },
        dashboardType: {
            type: String,
            enum: ['hr', 'pr_marketing', 'operations', 'technical', 'education', 'custom'],
            default: 'custom',
        },
        icon: { type: String, default: 'FiGrid' },
        color: { type: String, default: '#0066FF' },
        leaderId: { type: Schema.Types.ObjectId, ref: 'User' },
        viceLeaderId: { type: Schema.Types.ObjectId, ref: 'User' },
        viceLeaderIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        actingHeadId: { type: Schema.Types.ObjectId, ref: 'User' },
        viceHeadPermissions: {
            type: [String],
            default: ['create_tasks', 'assign_tasks', 'review_tasks', 'manage_attendance'],
        },
        monthlyObjectives: [
            {
                title: { type: String, required: true },
                progress: { type: Number, min: 0, max: 100, default: 0 },
                targetDate: { type: Date },
                status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'in_progress' },
            },
        ],
        managementNotes: [
            {
                authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
                content: { type: String, required: true },
                targetMemberId: { type: Schema.Types.ObjectId, ref: 'User' },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        isActive: { type: Boolean, default: true },
        registrationOpen: { type: Boolean, default: true },
        availableForRegistration: { type: Boolean, default: true },
        maxMembers: { type: Number, min: 1 },
        currentMemberCount: { type: Number, default: 0 },
        displayOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

CommitteeSchema.pre('validate', function (next) {
    const doc = this as any;
    if (doc.name && !doc.slug) {
        doc.slug = doc.name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9\u0600-\u06FF\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-');
    }
    next();
});

if (mongoose.models.Committee) {
    delete (mongoose.models as Record<string, unknown>).Committee;
}

export default mongoose.models.Committee ||
    mongoose.model<ICommittee>('Committee', CommitteeSchema);
