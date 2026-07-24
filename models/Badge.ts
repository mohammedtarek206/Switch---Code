import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IBadge extends Document {
    name: string;
    description: string;
    icon: string;
    color: string;
    isAuto: boolean;
    autoCondition?: string;
    createdAt: Date;
}

const BadgeSchema: Schema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        description: { type: String, required: true },
        icon: { type: String, default: '🏅' },
        color: { type: String, default: '#FFD700' },
        isAuto: { type: Boolean, default: false },
        autoCondition: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Badge ||
    mongoose.model<IBadge>('Badge', BadgeSchema);
