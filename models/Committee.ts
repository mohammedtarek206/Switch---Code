import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommittee extends Document {
    name: string;
    slug: string;
    description: string;
    image?: string;
    type: 'technical' | 'non_technical';
    icon?: string;
    color?: string;
    leaderId?: Types.ObjectId;
    viceLeaderId?: Types.ObjectId;
    isActive: boolean;
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
        icon: { type: String, default: 'FiGrid' },
        color: { type: String, default: '#0066FF' },
        leaderId: { type: Schema.Types.ObjectId, ref: 'User' },
        viceLeaderId: { type: Schema.Types.ObjectId, ref: 'User' },
        isActive: { type: Boolean, default: true },
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
