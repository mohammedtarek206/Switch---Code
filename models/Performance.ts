import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformance extends Document {
    memberId: mongoose.Types.ObjectId;
    evaluatorId: mongoose.Types.ObjectId;
    committeeId: mongoose.Types.ObjectId;
    period: 'weekly' | 'monthly';
    month?: number;
    year: number;
    // 10-criteria scoring (1-10 each)
    commitment: number;
    attendance: number;
    workQuality: number;
    executionSpeed: number;
    cooperation: number;
    communication: number;
    creativity: number;
    responsibility: number;
    punctuality: number;
    teamwork: number;
    // auto-calculated
    totalScore: number;    // average * 10 → out of 100
    strengthNotes?: string;
    improvementNotes?: string;
    leaderComment?: string;
    hrComment?: string;
    presidentComment?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PerformanceSchema = new Schema<IPerformance>({
    memberId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    evaluatorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
    period: { type: String, enum: ['weekly', 'monthly'], default: 'monthly' },
    month: { type: Number },
    year: { type: Number, required: true },
    commitment: { type: Number, min: 1, max: 10, default: 5 },
    attendance: { type: Number, min: 1, max: 10, default: 5 },
    workQuality: { type: Number, min: 1, max: 10, default: 5 },
    executionSpeed: { type: Number, min: 1, max: 10, default: 5 },
    cooperation: { type: Number, min: 1, max: 10, default: 5 },
    communication: { type: Number, min: 1, max: 10, default: 5 },
    creativity: { type: Number, min: 1, max: 10, default: 5 },
    responsibility: { type: Number, min: 1, max: 10, default: 5 },
    punctuality: { type: Number, min: 1, max: 10, default: 5 },
    teamwork: { type: Number, min: 1, max: 10, default: 5 },
    totalScore: { type: Number, default: 50 },
    strengthNotes: { type: String },
    improvementNotes: { type: String },
    leaderComment: { type: String },
    hrComment: { type: String },
    presidentComment: { type: String },
    notes: { type: String },
}, { timestamps: true });

// Auto-calculate totalScore before save
PerformanceSchema.pre('save', function (next) {
    const scores = [
        this.commitment, this.attendance, this.workQuality, this.executionSpeed,
        this.cooperation, this.communication, this.creativity, this.responsibility,
        this.punctuality, this.teamwork,
    ];
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    this.totalScore = Math.round(avg * 10);
    next();
});

if (mongoose.models.Performance && !mongoose.models.Performance.schema.paths.commitment) {
    delete (mongoose.models as any).Performance;
}

export default mongoose.models.Performance || mongoose.model<IPerformance>('Performance', PerformanceSchema);
