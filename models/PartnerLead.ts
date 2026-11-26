import mongoose, { Document, Schema, Types } from 'mongoose';
import './User';

export interface IPartnerLead extends Document {
    organizationName: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    type: 'company' | 'university' | 'community' | 'sponsor' | 'media' | 'other';
    status: 'new' | 'contacted' | 'meeting_scheduled' | 'negotiating' | 'partnered' | 'declined';
    notes?: string;
    meetings: {
        date: Date;
        summary: string;
        recordedBy: Types.ObjectId;
    }[];
    assignedTo?: Types.ObjectId;
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PartnerLeadSchema: Schema = new Schema(
    {
        organizationName: { type: String, required: true, trim: true },
        contactPerson: { type: String, trim: true },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
        type: {
            type: String,
            enum: ['company', 'university', 'community', 'sponsor', 'media', 'other'],
            default: 'company',
        },
        status: {
            type: String,
            enum: ['new', 'contacted', 'meeting_scheduled', 'negotiating', 'partnered', 'declined'],
            default: 'new',
        },
        notes: { type: String },
        meetings: [
            {
                date: { type: Date, required: true },
                summary: { type: String, required: true },
                recordedBy: { type: Schema.Types.ObjectId, ref: 'User' },
            },
        ],
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

PartnerLeadSchema.index({ status: 1, createdAt: -1 });

export default mongoose.models.PartnerLead ||
    mongoose.model<IPartnerLead>('PartnerLead', PartnerLeadSchema);
