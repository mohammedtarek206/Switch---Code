import mongoose, { Document, Schema } from 'mongoose';

export interface IAccessCode extends Document {
    code: string;
    isUsed: boolean;
    studentId?: mongoose.Types.ObjectId;
    trackId?: mongoose.Types.ObjectId; // Optional: specify which track this code gives access to
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const AccessCodeSchema: Schema = new Schema(
    {
        code: { type: String, required: true, unique: true },
        isUsed: { type: Boolean, default: false },
        studentId: { type: Schema.Types.ObjectId, ref: 'User' },
        trackId: { type: Schema.Types.ObjectId, ref: 'Track' },
        expiresAt: { type: Date },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.AccessCode || mongoose.model<IAccessCode>('AccessCode', AccessCodeSchema);
