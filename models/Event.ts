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
    endDate?: Date;
    seats?: number;
    registrationDeadline?: Date;
    registrationOpen: boolean;
    agenda: IAgendaItem[];
    speakers: ISpeaker[];
    sponsors: string[];
    requirements: string[];
    certificatesEnabled: boolean;
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
        endDate: { type: Date },
        seats: { type: Number },
        registrationDeadline: { type: Date },
        registrationOpen: { type: Boolean, default: true },
        agenda: [AgendaItemSchema],
        speakers: [SpeakerSchema],
        sponsors: [{ type: String }],
        requirements: [{ type: String }],
        certificatesEnabled: { type: Boolean, default: false },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.models.Event ||
    mongoose.model<IEvent>('Event', EventSchema);
