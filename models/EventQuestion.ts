import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEventQuestion extends Document {
    eventId: Types.ObjectId;
    question: string;
    type: 'multiple_choice';
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
        type: { type: String, enum: ['multiple_choice'], default: 'multiple_choice' },
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
