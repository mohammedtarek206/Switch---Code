import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IEventRegistration extends Document {
    eventId: Types.ObjectId;
    userId?: Types.ObjectId;
    name: string;
    email: string;
    phone?: string;
    formData: Record<string, unknown>;
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
        formData: { type: Schema.Types.Mixed, default: {} },
        qrCode: { type: String },
        checkIn: { type: Date },
        checkOut: { type: Date },
        attended: { type: Boolean, default: false },
    },
    { timestamps: true }
);

EventRegistrationSchema.index({ eventId: 1, email: 1 }, { unique: true });

export default mongoose.models.EventRegistration ||
    mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);
