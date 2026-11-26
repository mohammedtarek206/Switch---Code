import mongoose, { Document, Schema, Types } from 'mongoose';
import './User';
import './Committee';

export interface IAttendanceRecord extends Document {
    userId: Types.ObjectId;
    committeeId: Types.ObjectId;
    date: Date;
    status: 'present' | 'absent' | 'late' | 'excused';
    checkInTime?: string;
    isLeaveRequest?: boolean;
    leaveReason?: string;
    leaveStatus?: 'pending' | 'approved' | 'rejected';
    notes?: string;
    recordedBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceRecordSchema: Schema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        date: { type: Date, required: true },
        status: {
            type: String,
            enum: ['present', 'absent', 'late', 'excused'],
            default: 'present',
        },
        checkInTime: { type: String },
        isLeaveRequest: { type: Boolean, default: false },
        leaveReason: { type: String },
        leaveStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
        },
        notes: { type: String },
        recordedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

AttendanceRecordSchema.index({ committeeId: 1, date: -1 });
AttendanceRecordSchema.index({ userId: 1, date: -1 });

export default mongoose.models.AttendanceRecord ||
    mongoose.model<IAttendanceRecord>('AttendanceRecord', AttendanceRecordSchema);
