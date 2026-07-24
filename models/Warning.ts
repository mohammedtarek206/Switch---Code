import mongoose, { Schema, Document } from 'mongoose';

export interface IWarning extends Document {
    memberId: mongoose.Types.ObjectId;
    committeeId: mongoose.Types.ObjectId;
    issuedBy: mongoose.Types.ObjectId;
    reason: string;
    level: 'low' | 'medium' | 'high' | 'critical';
    notes?: string;
    createdAt: Date;
}

const WarningSchema = new Schema<IWarning>({
    memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, required: true },
    level: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
    notes: { type: String },
}, { timestamps: true });

if (mongoose.models.Warning && !mongoose.models.Warning.schema.paths.committeeId) {
    delete (mongoose.models as any).Warning;
}

export default mongoose.models.Warning || mongoose.model<IWarning>('Warning', WarningSchema);
