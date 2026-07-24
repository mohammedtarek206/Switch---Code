import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICommittee extends Document {
    name: string;
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

export default mongoose.models.Committee ||
    mongoose.model<ICommittee>('Committee', CommitteeSchema);
