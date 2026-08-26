import mongoose, { Document, Schema, Types } from 'mongoose';
import './LMSQuiz';
import './User';

export interface IQuizAttempt extends Document {
    userId: Types.ObjectId;
    quizId: Types.ObjectId;
    answers: { questionIndex: number; answer: string }[];
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    attemptNumber: number;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const QuizAttemptSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        quizId: { type: Schema.Types.ObjectId, ref: 'LMSQuiz', required: true },
        answers: [
            {
                questionIndex: { type: Number, required: true },
                answer: { type: String, required: true },
            },
        ],
        score: { type: Number, default: 0 },
        maxScore: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
        passed: { type: Boolean, default: false },
        attemptNumber: { type: Number, default: 1 },
        submittedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

QuizAttemptSchema.index({ userId: 1, quizId: 1 });

export default mongoose.models.QuizAttempt ||
    mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
