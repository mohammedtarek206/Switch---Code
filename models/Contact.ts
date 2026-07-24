import mongoose, { Document, Schema } from 'mongoose';

export interface IContact extends Document {
  name: string;
  email: string;
  message: string;
  subject?: string;
  phone?: string;
  responded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    subject: { type: String },
    phone: { type: String },
    responded: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Contact || mongoose.model<IContact>('Contact', ContactSchema);
