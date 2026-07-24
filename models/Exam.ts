import mongoose, { Document, Schema } from 'mongoose';

export interface IQuestion {
    text: string;
    options: string[];
    correctOption: number; // Index of the correct option (0, 1, 2, 3)
}

export interface IExam extends Document {
    title: string;
    description: string;
    trackId: mongoose.Types.ObjectId;
    duration: number; // in minutes
    passScore: number;
    questions: IQuestion[];
    createdAt: Date;
    updatedAt: Date;
}

const ExamSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        trackId: { type: Schema.Types.ObjectId, ref: 'Track', required: true },
        duration: { type: Number, required: true, default: 30 },
        passScore: { type: Number, required: true, default: 50 },
        questions: [
            {
                text: { type: String, required: true },
                options: [{ type: String, required: true }],
                correctOption: { type: Number, required: true },
            },
        ],
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.Exam || mongoose.model<IExam>('Exam', ExamSchema);
