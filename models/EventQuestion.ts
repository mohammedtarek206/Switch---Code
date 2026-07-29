import mongoose, { Document, Schema, Types } from 'mongoose';

export type QuestionType = 'text' | 'multiple_choice' | 'checkbox' | 'dropdown' | 'yes_no' | 'number' | 'email' | 'phone' | 'date';

export interface IEventQuestion extends Document {
    eventId: Types.ObjectId;
    question: string;
    description?: string;
    placeholder?: string;
    type: QuestionType;
    options: string[];
    required: boolean;
    order: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EventQuestionSchema: Schema = new Schema(
    {
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
        question: { type: String, required: true },
        description: { type: String },
        placeholder: { type: String },
        type: {
            type: String,
            enum: ['text', 'multiple_choice', 'checkbox', 'dropdown', 'yes_no', 'number', 'email', 'phone', 'date'],
            default: 'text'
        },
        options: [{ type: String }],
        required: { type: Boolean, default: true },
        order: { type: Number, default: 0 },
        active: { type: Boolean, default: true },
    },
    {
        timestamps: true,
        collection: 'event_questions'
    }
);

if (mongoose.models.EventQuestion) {
    delete (mongoose.models as any).EventQuestion;
}

export default mongoose.models.EventQuestion ||
    mongoose.model<IEventQuestion>('EventQuestion', EventQuestionSchema);
