import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISpeaker {
    name: string;
    title?: string;
    avatar?: string;
}

export interface IAgendaItem {
    time: string;
    title: string;
    description?: string;
}

export interface IEvent extends Document {
    title: string;
    description: string;
    banner?: string;
    location?: string;
    googleMapsUrl?: string;
    date: Date;
    time?: string;
    endDate?: Date;
    seats?: number;
    registrationDeadline?: Date;
    registrationOpen: boolean;
    hasWaitingList?: boolean;
    speakerName?: string;
    organizer?: string;
    agenda: IAgendaItem[];
    speakers: ISpeaker[];
    sponsors: string[];
    requirements: string[];
    certificatesEnabled: boolean;
    pinned?: boolean;
    pointsAwarded?: number;
    committeeId?: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AgendaItemSchema = new Schema({
    time: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
}, { _id: false });

const SpeakerSchema = new Schema({
    name: { type: String, required: true },
    title: { type: String },
    avatar: { type: String },
}, { _id: false });

const EventSchema: Schema = new Schema(
    {
        title: { type: String, required: true },
        description: { type: String, required: true },
        banner: { type: String },
        location: { type: String },
        googleMapsUrl: { type: String },
        date: { type: Date, required: true },
        time: { type: String },
        endDate: { type: Date },
        seats: { type: Number, default: 50 },
        registrationDeadline: { type: Date },
        registrationOpen: { type: Boolean, default: true },
        hasWaitingList: { type: Boolean, default: true },
        speakerName: { type: String },
        organizer: { type: String, default: 'Witch Code Platform' },
        agenda: [AgendaItemSchema],
        speakers: [SpeakerSchema],
        sponsors: [{ type: String }],
        requirements: [{ type: String }],
        certificatesEnabled: { type: Boolean, default: true },
        pinned: { type: Boolean, default: false },
        pointsAwarded: { type: Number, default: 0 },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

// Performance indexes
EventSchema.index({ date: -1 });
EventSchema.index({ committeeId: 1 });
EventSchema.index({ isActive: 1, date: -1 });

if (mongoose.models.Event) {
    delete (mongoose.models as any).Event;
}

export default mongoose.models.Event ||
    mongoose.model<IEvent>('Event', EventSchema);
