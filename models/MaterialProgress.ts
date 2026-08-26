import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMaterialProgress extends Document {
    userId: Types.ObjectId;
    materialId: Types.ObjectId;
    openedAt: Date;
    completed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const MaterialProgressSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        materialId: { type: Schema.Types.ObjectId, ref: 'LMSMaterial', required: true },
        openedAt: { type: Date, default: Date.now },
        completed: { type: Boolean, default: true }, // Opening = completed for materials
    },
    { timestamps: true }
);

MaterialProgressSchema.index({ userId: 1, materialId: 1 }, { unique: true });

export default mongoose.models.MaterialProgress ||
    mongoose.model<IMaterialProgress>('MaterialProgress', MaterialProgressSchema);
