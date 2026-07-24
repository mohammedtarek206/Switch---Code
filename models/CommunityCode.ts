import mongoose, { Schema, Document } from 'mongoose';

export interface ICommunityCode extends Document {
    code: string;
    role: string;
    committeeId?: mongoose.Types.ObjectId;
    committeeName?: string;
    position?: string;
    expirationDate?: Date;
    maxUses: number;
    usedCount: number;
    status: 'active' | 'inactive';
    notes?: string;
    permissions?: string[];
    createdBy: mongoose.Types.ObjectId;
}

const CommunityCodeSchema = new Schema<ICommunityCode>({
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    role: { type: String, required: true },
    committeeId: { type: Schema.Types.ObjectId, ref: 'Committee' },
    committeeName: { type: String },
    position: { type: String },
    expirationDate: { type: Date },
    maxUses: { type: Number, default: 1 },
    usedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    notes: { type: String },
    permissions: [{ type: String }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.models.CommunityCode || mongoose.model<ICommunityCode>('CommunityCode', CommunityCodeSchema);
