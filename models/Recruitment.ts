import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRecruitment extends Document {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    status: 'open' | 'closed' | 'draft';
    committees: Types.ObjectId[];
    formFields: IFormField[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFormField {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'email' | 'phone' | 'dropdown' | 'checkbox' | 'radio' | 'date' | 'file' | 'cv' | 'linkedin' | 'github' | 'portfolio';
    placeholder?: string;
    required: boolean;
    options?: string[];
    order: number;
}

const FormFieldSchema = new Schema({
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'textarea', 'email', 'phone', 'dropdown', 'checkbox', 'radio', 'date', 'file', 'cv', 'linkedin', 'github', 'portfolio'],
        required: true,
    },
    placeholder: { type: String },
    required: { type: Boolean, default: false },
    options: [{ type: String }],
    order: { type: Number, default: 0 },
}, { _id: false });

const RecruitmentSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: {
            type: String,
            enum: ['open', 'closed', 'draft'],
            default: 'draft',
        },
        committees: [{ type: Schema.Types.ObjectId, ref: 'Committee' }],
        formFields: [FormFieldSchema],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

export default mongoose.models.Recruitment ||
    mongoose.model<IRecruitment>('Recruitment', RecruitmentSchema);
