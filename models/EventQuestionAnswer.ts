import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEventQuestionAnswer extends Document {
    applicationId: Types.ObjectId;
    questionId: Types.ObjectId;
    selectedAnswer: string;
    createdAt: Date;
    updatedAt: Date;
}

const EventQuestionAnswerSchema: Schema = new Schema(
    {
        applicationId: { type: Schema.Types.ObjectId, ref: 'EventRegistration', required: true, index: true },
        questionId: { type: Schema.Types.ObjectId, ref: 'EventQuestion', required: true },
        selectedAnswer: { type: String, required: true },
    },
    {
        timestamps: true,
        collection: 'event_question_answers'
    }
);

if (mongoose.models.EventQuestionAnswer) {
    delete (mongoose.models as any).EventQuestionAnswer;
}

export default mongoose.models.EventQuestionAnswer ||
    mongoose.model<IEventQuestionAnswer>('EventQuestionAnswer', EventQuestionAnswerSchema);
