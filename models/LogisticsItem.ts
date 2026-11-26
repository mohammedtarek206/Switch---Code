import mongoose, { Document, Schema, Types } from 'mongoose';
import './Committee';
import './Event';
import './User';

export interface ILogisticsItem extends Document {
    committeeId: Types.ObjectId;
    eventId?: Types.ObjectId;
    title: string;
    category: 'equipment' | 'transportation' | 'hospitality' | 'venue' | 'checklist' | 'other';
    quantity: number;
    estimatedCost: number;
    actualCost: number;
    status: 'planned' | 'in_progress' | 'ready' | 'completed';
    assignedTo?: Types.ObjectId;
    notes?: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const LogisticsItemSchema: Schema = new Schema(
    {
        committeeId: { type: Schema.Types.ObjectId, ref: 'Committee', required: true },
        eventId: { type: Schema.Types.ObjectId, ref: 'Event' },
        title: { type: String, required: true },
        category: {
            type: String,
            enum: ['equipment', 'transportation', 'hospitality', 'venue', 'checklist', 'other'],
            default: 'equipment',
        },
        quantity: { type: Number, default: 1 },
        estimatedCost: { type: Number, default: 0 },
        actualCost: { type: Number, default: 0 },
        status: {
            type: String,
            enum: ['planned', 'in_progress', 'ready', 'completed'],
            default: 'planned',
        },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

LogisticsItemSchema.index({ committeeId: 1, createdAt: -1 });

export default mongoose.models.LogisticsItem ||
    mongoose.model<ILogisticsItem>('LogisticsItem', LogisticsItemSchema);
