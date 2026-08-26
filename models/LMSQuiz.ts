import mongoose, { Document, Schema, Types } from 'mongoose';
import './LMSTrack';
import './User';

export interface IQuizQuestion {
    question: string;
    type: 'multiple_choice' | 'true_false' | 'short_answer';
    options?: string[];
    correctAnswer: string;
    points: number;
}

export interface ILMSQuiz extends Document {
    title: string;
    description: string;
    trackId: Types.ObjectId;
    duration: number; // in minutes
    passingScore: number; // percentage 0-100
    attemptsAllowed: number;
    status: 'draft' | 'published';
    questions: IQuizQuestion[];
    order: number;
    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const QuizQuestionSchema = new Schema({
    question: { type: String, required: true },
    type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer'],
        required: true,
    },
    options: [{ type: String }],
    correctAnswer: { type: String, required: true },
    points: { type: Number, default: 1 },
});

const LMSQuizSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String },
        trackId: { type: Schema.Types.ObjectId, ref: 'LMSTrack', required: true },
        duration: { type: Number, default: 30 },
        passingScore: { type: Number, default: 60 },
        attemptsAllowed: { type: Number, default: 3 },
        status: { type: String, enum: ['draft', 'published'], default: 'published' },
        questions: [QuizQuestionSchema],
        order: { type: Number, default: 0 },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

LMSQuizSchema.index({ trackId: 1, order: 1 });
LMSQuizSchema.index({ status: 1 });

export default mongoose.models.LMSQuiz || mongoose.model<ILMSQuiz>('LMSQuiz', LMSQuizSchema);
