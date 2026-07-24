import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPerformanceScore extends Document {
    userId: Types.ObjectId;
    month: number;
    year: number;
    attendanceScore: number;
    tasksScore: number;
    eventsScore: number;
    coursesScore: number;
    projectsScore: number;
    committeeScore: number;
    leaderEvaluation: number;
    adminEvaluation: number;
    manualOverride?: number;
    total: number;
    updatedAt: Date;
    createdAt: Date;
}

const PerformanceScoreSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        month: { type: Number, required: true, min: 1, max: 12 },
        year: { type: Number, required: true },
        attendanceScore: { type: Number, default: 0 },
        tasksScore: { type: Number, default: 0 },
        eventsScore: { type: Number, default: 0 },
        coursesScore: { type: Number, default: 0 },
        projectsScore: { type: Number, default: 0 },
        committeeScore: { type: Number, default: 0 },
        leaderEvaluation: { type: Number, default: 0 },
        adminEvaluation: { type: Number, default: 0 },
        manualOverride: { type: Number },
        total: { type: Number, default: 0 },
    },
    { timestamps: true }
);

PerformanceScoreSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
PerformanceScoreSchema.index({ total: -1 });

export default mongoose.models.PerformanceScore ||
    mongoose.model<IPerformanceScore>('PerformanceScore', PerformanceScoreSchema);
