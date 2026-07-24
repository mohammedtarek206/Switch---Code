import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
    committeeId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    title: string;
    agenda?: string;
    date: Date;
    time: string;
    location: string;        // "Online" or place
    meetLink?: string;       // Google Meet URL
    files: string[];
    attendees: mongoose.Types.ObjectId[];
    confirmedAttendance: mongoose.Types.ObjectId[];
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>({
    committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    agenda: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    location: { type: String, default: 'Online' },
    meetLink: { type: String },
    files: [{ type: String }],
    attendees: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    confirmedAttendance: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' },
    notes: { type: String },
}, { timestamps: true });

export default mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);
