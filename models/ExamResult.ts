import mongoose, { Document, Schema } from 'mongoose';

export interface IExamResult extends Document {
    studentId: mongoose.Types.ObjectId;
    examId: mongoose.Types.ObjectId;
    score: number;
    answers: number[]; // Index of selected options
    status: 'Pass' | 'Fail';
    completedAt: Date;
}

const ExamResultSchema: Schema = new Schema(
    {
        studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
        score: { type: Number, required: true },
        answers: [{ type: Number, required: true }],
        status: {
            type: String,
            enum: ['Pass', 'Fail'],
            required: true,
        },
        completedAt: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

export default mongoose.models.ExamResult || mongoose.model<IExamResult>('ExamResult', ExamResultSchema);
