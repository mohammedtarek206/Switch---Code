import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEventRegistrationAnswer {
    questionId?: Types.ObjectId | string;
    question: string;
    type: string;
    answer: any;
}

export interface IEventRegistration extends Document {
    eventId: Types.ObjectId;
    userId?: Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    university?: string;
    faculty?: string;
    academicYear?: string;
    department?: string;
    governorate?: string;
    gender?: string;
    age?: number | string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
    cv?: string;
    status: 'registered' | 'accepted' | 'rejected' | 'waitlist' | 'pending';
    adminNotes?: string;
    formData?: Record<string, unknown>;
    answers: IEventRegistrationAnswer[];
    qrCode?: string;
    checkIn?: Date;
    checkOut?: Date;
    attended: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const AnswerSubSchema = new Schema(
    {
        questionId: {
            type: Schema.Types.Mixed,
            ref: 'EventQuestion',
        },
        question: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            required: true,
        },
        answer: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
    { _id: false }
);

const EventRegistrationSchema: Schema = new Schema(
    {
        eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
        userId: { type: Schema.Types.ObjectId, ref: 'User' },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String },
        university: { type: String },
        faculty: { type: String },
        academicYear: { type: String },
        department: { type: String },
        governorate: { type: String },
        gender: { type: String },
        age: { type: Schema.Types.Mixed },
        linkedin: { type: String },
        github: { type: String },
        portfolio: { type: String },
        cv: { type: String },
        status: {
            type: String,
            enum: ['registered', 'accepted', 'rejected', 'waitlist', 'pending'],
            default: 'registered',
        },
        adminNotes: { type: String, default: '' },
        formData: { type: Schema.Types.Mixed, default: {} },
        answers: [AnswerSubSchema],
        qrCode: { type: String },
        checkIn: { type: Date },
        checkOut: { type: Date },
        attended: { type: Boolean, default: false },
    },
    { timestamps: true }
);

delete (mongoose.models as any).EventRegistration;

export default mongoose.models.EventRegistration ||
    mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);
