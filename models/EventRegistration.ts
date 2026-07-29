import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEventRegistration extends Document {
    eventId: Types.ObjectId;
    userId?: Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    university?: string;
    faculty?: string;
    status: 'registered' | 'accepted' | 'rejected' | 'waitlist';
    formData: Record<string, unknown>;
    answers: Array<{
        questionId: string;
        question: string;
        type: string;
        answer: any;
    }>;
    qrCode?: string;
    checkIn?: Date;
    checkOut?: Date;
    attended: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const EventRegistrationSchema: Schema = new Schema(
    {
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        university: { type: String },
        faculty: { type: String },
        status: {
            type: String,
            enum: ['registered', 'accepted', 'rejected', 'waitlist'],
            default: 'registered',
        },
        formData: { type: Schema.Types.Mixed, default: {} },
        answers: [{
            questionId: String,
            question: String,
            type: String,
            answer: Schema.Types.Mixed
        }],
        qrCode: { type: String },
        checkIn: { type: Date },
        checkOut: { type: Date },
        attended: { type: Boolean, default: false },
    },
    { timestamps: true }
);

if (mongoose.models.EventRegistration) {
    delete (mongoose.models as any).EventRegistration;
}

export default mongoose.models.EventRegistration ||
    mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);
