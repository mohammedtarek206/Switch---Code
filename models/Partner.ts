import mongoose, { Document, Schema } from 'mongoose';

export interface IPartner extends Document {
  name: string;
  logoUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const PartnerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    logoUrl: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Partner || mongoose.model<IPartner>('Partner', PartnerSchema);
